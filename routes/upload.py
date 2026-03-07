import os
import io
import sys
import zipfile
import uuid
import shutil
import subprocess
from flask import Blueprint, request, jsonify, current_app, session
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import numpy as np
import SimpleITK as sitk
from PIL import Image
import urllib.request
from pathlib import Path
import json

api_bp = Blueprint('api', __name__)

def _serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='auth-token')

def get_uid_from_request():
    # Prefer session
    uid = session.get('user_id')
    if uid:
        return uid
    # Try Bearer token
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1].strip()
        try:
            data = _serializer().loads(token, max_age=60 * 60 * 24 * 7)  # 7 days
            return data.get('uid')
        except (BadSignature, SignatureExpired):
            return None
    return None

def secure_extract_zip(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for member in zf.infolist():
            member_path = os.path.join(extract_to, member.filename)
            abs_common = os.path.commonpath([extract_to])
            abs_member = os.path.commonpath([os.path.abspath(member_path), extract_to])
            if abs_common != abs_member:
                raise Exception("Unsafe zip file (path traversal)")
        zf.extractall(extract_to)


def save_uploads_to_folder(files, target_dir):
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        filename = f.filename
        # Support folder upload via webkitRelativePath passed as filename
        rel_path = filename.replace("..", "")
        dest_path = os.path.join(target_dir, rel_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        f.save(dest_path)


def collect_dicom_root(upload_root):
    # Return a directory that contains dicom files; if root is a single file, wrap it in a folder
    if os.path.isdir(upload_root):
        return upload_root
    # If a single file got to this point (shouldn't), make a dir
    parent = os.path.dirname(upload_root)
    only_dir = os.path.join(parent, 'dicom_single')
    os.makedirs(only_dir, exist_ok=True)
    shutil.move(upload_root, os.path.join(only_dir, os.path.basename(upload_root)))
    return only_dir


@api_bp.route('/upload', methods=['POST'])
def upload():
    if not get_uid_from_request():
        return jsonify({"error": "unauthenticated"}), 401
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = current_app.static_folder
    session_id = str(uuid.uuid4())

    uploads_root = os.path.join(static_dir, 'uploads', session_id)
    processed_root = os.path.join(static_dir, 'processed', session_id)
    slices_dir = os.path.join(processed_root, 'slices')
    model_dir = os.path.join(processed_root, 'model')
    volume_dir = os.path.join(processed_root, 'volume')
    snapshot_dir = os.path.join(processed_root, 'snapshot')

    os.makedirs(uploads_root, exist_ok=True)
    os.makedirs(slices_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(volume_dir, exist_ok=True)
    os.makedirs(snapshot_dir, exist_ok=True)

    files = request.files.getlist('files')
    if not files:
        # Support single file field named 'file'
        single = request.files.get('file')
        if single:
            files = [single]

    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    # Detect ZIP upload convenience: one file and .zip extension
    if len(files) == 1 and files[0].filename.lower().endswith('.zip'):
        zip_path = os.path.join(uploads_root, 'upload.zip')
        files[0].save(zip_path)
        extract_dir = os.path.join(uploads_root, 'extracted')
        os.makedirs(extract_dir, exist_ok=True)
        try:
            secure_extract_zip(zip_path, extract_dir)
        except Exception as e:
            return jsonify({"error": f"Invalid ZIP: {str(e)}"}), 400
        dicom_root = extract_dir
    else:
        # Save all uploads preserving relative paths if provided
        save_uploads_to_folder(files, uploads_root)
        dicom_root = uploads_root

    # Call view_volume.py to generate slices and GLB
    script_path = os.path.join(base_dir, 'CHEST', 'view_volume.py')
    model_path = os.path.join(model_dir, 'model.glb')
    vti_path = os.path.join(volume_dir, 'volume.vti')
    snapshot_path = os.path.join(snapshot_dir, 'preview.png')

    cmd = [sys.executable, script_path,
           '--input', dicom_root,
           '--out_slices', slices_dir,
           '--out_model', model_path,
           '--out_vti', vti_path,
           '--snapshot_png', snapshot_path,
           '--iso', 'auto',
           '--vti_max_dim', '192']

    try:
        completed = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        proc_stdout = (completed.stdout or '')
        proc_stderr = (completed.stderr or '')
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "Processing failed",
            "details": (e.stderr or '')[-4000:],
            "stdout": (e.stdout or '')[-4000:],
            "stderr": (e.stderr or '')[-4000:]
        }), 500

    # Build URLs
    slice_files = []
    for root, _, files_in in os.walk(slices_dir):
        for name in sorted(files_in):
            if name.lower().endswith('.png'):
                rel = os.path.relpath(os.path.join(root, name), static_dir)
                slice_files.append('/' + '/'.join(['static'] + rel.split(os.sep)))

    model_rel = os.path.relpath(model_path, static_dir)
    model_url = '/' + '/'.join(['static'] + model_rel.split(os.sep))
    vti_rel = os.path.relpath(vti_path, static_dir)
    volume_url = '/' + '/'.join(['static'] + vti_rel.split(os.sep))
    snap_rel = os.path.relpath(snapshot_path, static_dir)
    snapshot_url = '/' + '/'.join(['static'] + snap_rel.split(os.sep))

    return jsonify({
        "slice_urls": slice_files,
        "model_url": model_url,
        "volume_url": volume_url,
        "snapshot_url": snapshot_url,
        "session_id": session_id,
        "stdout": proc_stdout[-4000:],
        "stderr": proc_stderr[-4000:]
    })


@api_bp.route('/open_interactive', methods=['POST'])
def open_interactive():
    if not get_uid_from_request():
        return jsonify({"error": "unauthenticated"}), 401
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = current_app.static_folder
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    uploads_root = os.path.join(static_dir, 'uploads', session_id)
    if not os.path.isdir(uploads_root):
        return jsonify({"error": "Unknown session_id or uploads missing"}), 404

    dicom_root = os.path.join(uploads_root, 'extracted')
    if not os.path.isdir(dicom_root):
        dicom_root = uploads_root

    script_path = os.path.join(base_dir, 'CHEST', 'view_volume.py')
    cmd = [sys.executable, script_path,
           '--input', dicom_root,
           '--interactive',
           '--ww', '350', '--wc', '40']

    try:
        # Launch non-blocking; the VTK window will open separately on the host
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return jsonify({"status": "started", "pid": p.pid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/evaluate', methods=['POST'])
def evaluate():
    if not get_uid_from_request():
        return jsonify({"error": "unauthenticated"}), 401
    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    static_dir = current_app.static_folder
    processed_root = os.path.join(static_dir, 'processed', session_id)
    slices_dir = os.path.join(processed_root, 'slices')
    volume_dir = os.path.join(processed_root, 'volume')
    snapshot_path = os.path.join(processed_root, 'snapshot', 'preview.png')

    dep = {"torch": None, "torchvision": None}
    torch = None
    tv = None
    try:
        import torch as _t
        import torchvision as _tv
        torch, tv = _t, _tv
        dep["torch"] = getattr(_t, '__version__', 'unknown')
        dep["torchvision"] = getattr(_tv, '__version__', 'unknown')
    except Exception:
        pass

    result_2d = None
    result_3d = None
    comparison = None

    # 2D evaluation with ResNet50 (ImageNet) on a subset of slices
    try:
        if torch and tv and os.path.isdir(slices_dir):
            # Collect pngs
            imgs = [os.path.join(slices_dir, f) for f in sorted(os.listdir(slices_dir)) if f.lower().endswith('.png')]
            if imgs:
                # sample up to 8 evenly spaced
                idxs = np.linspace(0, len(imgs) - 1, num=min(8, len(imgs)), dtype=int)
                sel = [imgs[i] for i in idxs]
                weights = None
                weights_meta = None
                try:
                    if hasattr(tv.models, 'ResNet50_Weights'):
                        weights = tv.models.ResNet50_Weights.IMAGENET1K_V2
                        # Attempt to instantiate with weights (may download)
                        _ = weights.value  # access may trigger resolution in some versions
                        model = tv.models.resnet50(weights=weights)
                        weights_meta = getattr(weights, 'meta', {})
                    else:
                        model = tv.models.resnet50(pretrained=True)  # older API
                except Exception:
                    # Fallback: no-pretrain to avoid SSL/download issues
                    weights = None
                    model = tv.models.resnet50(weights=None) if hasattr(tv.models, 'resnet50') else tv.models.resnet50(pretrained=False)
                model.eval()
                preprocess = (weights.transforms() if weights else tv.transforms.Compose([
                    tv.transforms.Resize(256), tv.transforms.CenterCrop(224), tv.transforms.ToTensor(),
                    tv.transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]),
                ]))
                probs = []
                entropies = []
                top1 = []
                labels = (weights_meta.get('categories') if weights_meta else None)
                slice_scores = []
                with torch.no_grad():
                    for p in sel:
                        im = Image.open(p).convert('RGB')
                        x = preprocess(im).unsqueeze(0)
                        y = model(x)
                        sm = torch.nn.functional.softmax(y, dim=1)
                        pr, idx = torch.max(sm, dim=1)
                        entropy = -(sm * (sm + 1e-9).log()).sum(dim=1)
                        probs.append(float(pr.item()))
                        entropies.append(float(entropy.item()))
                        top1.append({"index": int(idx.item()), "label": (labels[int(idx.item())] if labels else None)})
                        slice_scores.append({
                            "file": os.path.basename(p),
                            "confidence": float(pr.item()),
                            "entropy": float(entropy.item()),
                        })
                result_2d = {
                    "num_samples": len(sel),
                    "mean_top1_confidence": float(np.mean(probs)),
                    "mean_entropy": float(np.mean(entropies)),
                    "top1_samples": top1[:3],
                    "slice_scores": slice_scores,
                    "pretrained": bool(weights is not None),
                    "notes": ("ResNet50 pretrained on ImageNet" if weights is not None else "ResNet50 without pretrained weights (offline fallback)")
                }
    except Exception as e:
        result_2d = {"error": str(e)}

    # 3D evaluation using MedicalNet (ResNet18) pretrained weights
    try:
        if torch and tv and os.path.isdir(slices_dir):
            imgs = [os.path.join(slices_dir, f) for f in sorted(os.listdir(slices_dir)) if f.lower().endswith('.png')]
            if len(imgs) >= 4:
                idxs = np.linspace(0, len(imgs) - 1, num=min(16, len(imgs)), dtype=int)
                sel = [imgs[i] for i in idxs]

                # Build MedicalNet model and load weights
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                weights_dir = Path(base_dir) / 'ml' / 'weights'
                weights_dir.mkdir(parents=True, exist_ok=True)
                weights_path = weights_dir / 'medicalnet_resnet18.pth'
                if not weights_path.exists():
                    # Public pretrained weights from Tencent/MedicalNet
                    url = 'https://github.com/Tencent/MedicalNet/raw/master/pretrain/resnet_18_23dataset.pth'
                    try:
                        urllib.request.urlretrieve(url, str(weights_path))
                    except Exception as de:
                        # Fall back to torchvision r3d_18 if download fails
                        weights_path = None

                from ml.medicalnet import medicalnet_resnet18
                if weights_path and weights_path.exists():
                    # MedicalNet weights commonly expect 1 input channel
                    mnet = medicalnet_resnet18(num_classes=400, in_channels=1)
                    state = torch.load(str(weights_path), map_location='cpu')
                    # Some weight files store under 'state_dict'
                    if isinstance(state, dict) and 'state_dict' in state:
                        state = state['state_dict']
                        # strip possible 'module.' prefixes
                        new_state = {k.replace('module.', ''): v for k, v in state.items()}
                        state = new_state
                    missing, unexpected = mnet.load_state_dict(state, strict=False)
                    vmodel = mnet
                    pretrained3d = True
                else:
                    # Fallback to torchvision r3d_18 pretrained
                    try:
                        vweights = tv.models.video.R3D_18_Weights.KINETICS400_V1
                        vmodel = tv.models.video.r3d_18(weights=vweights)
                        pretrained3d = True
                    except Exception:
                        vmodel = tv.models.video.r3d_18(weights=None) if hasattr(tv.models.video, 'r3d_18') else tv.models.video.r3d_18(pretrained=False)
                        pretrained3d = False

                vmodel.eval()
                # Select center and informative slices to avoid empty air frames
                # Rank by mean intensity and take middle window of top K
                means = []
                for p in sel:
                    try:
                        im = Image.open(p).convert('L')
                        means.append(np.array(im).mean())
                    except Exception:
                        means.append(0.0)
                order = np.argsort(means)[::-1]
                top = [sel[i] for i in order]
                # keep up to 24 then take the central 16 to preserve temporal coherence
                if len(top) > 24:
                    top = top[:24]
                # ensure chronological by re-sorting indices within selected range
                top_sorted = sorted(top, key=lambda x: x)
                # center crop to 16 frames if possible
                if len(top_sorted) >= 16:
                    start = max(0, (len(top_sorted) // 2) - 8)
                    top_sorted = top_sorted[start:start+16]
                sel = top_sorted

                # Compute a union ROI across frames using a simple threshold
                gray_arrays = []
                for p in sel:
                    im = Image.open(p).convert('L')
                    arr = np.array(im, dtype=np.uint8)
                    gray_arrays.append(arr)
                if gray_arrays:
                    H, W = gray_arrays[0].shape
                    union = np.zeros((H, W), dtype=np.uint8)
                    for a in gray_arrays:
                        union = np.maximum(union, (a > 8).astype(np.uint8))
                    ys, xs = np.where(union > 0)
                    if ys.size > 0 and xs.size > 0:
                        y0, y1 = max(0, ys.min()-8), min(H, ys.max()+8)
                        x0, x1 = max(0, xs.min()-8), min(W, xs.max()+8)
                    else:
                        y0, y1, x0, x1 = 0, H, 0, W
                else:
                    y0 = x0 = 0
                    y1 = gray_arrays[0].shape[0] if gray_arrays else 112
                    x1 = gray_arrays[0].shape[1] if gray_arrays else 112

                frames = []
                if weights_path and weights_path.exists():
                    # 1-channel pipeline for MedicalNet
                    for a in gray_arrays:
                        crop = a[y0:y1, x0:x1]
                        pim = Image.fromarray(crop)
                        pim = pim.resize((112,112), Image.BILINEAR)
                        tens = torch.from_numpy(np.array(pim, dtype=np.float32)/255.0)
                        tens = (tens - 0.5)/0.5  # normalize
                        frames.append(tens.unsqueeze(0))  # [1,H,W]
                    if not frames:
                        raise RuntimeError('No frames to evaluate')
                    vid = torch.stack(frames, dim=1).unsqueeze(0)  # [1,1,T,H,W]
                else:
                    # 3-channel pipeline for r3d_18 fallback
                    vpre = tv.transforms.Compose([
                        tv.transforms.Resize((112,112)), tv.transforms.ToTensor(),
                        tv.transforms.Normalize(mean=[0.5,0.5,0.5], std=[0.5,0.5,0.5])
                    ])
                    for p in sel:
                        im = Image.open(p).convert('RGB')
                        frames.append(vpre(im))
                    if not frames:
                        raise RuntimeError('No frames to evaluate')
                    vid = torch.stack(frames, dim=1).unsqueeze(0)  # [1,3,T,H,W]
                with torch.no_grad():
                    y = vmodel(vid)
                    sm = torch.nn.functional.softmax(y, dim=1)
                    pr, idx = torch.max(sm, dim=1)
                result_3d = {
                    "num_frames": int(vid.shape[2]),
                    "top1_confidence": float(pr.item()),
                    "top1_class": int(idx.item()),
                    "pretrained": bool(pretrained3d),
                    "notes": ("MedicalNet ResNet18 pretrained" if pretrained3d and weights_path else ("R3D-18 pretrained fallback" if pretrained3d else "3D model without pretrained;"))
                }
    except Exception as e:
        result_3d = {"error": str(e)}

    # Build comparison if both available
    try:
        two_d_top1_idx = None
        two_d_conf = None
        if result_2d and isinstance(result_2d, dict) and 'slice_scores' in result_2d:
            # majority vote by predicted index from top1_samples or recompute from slice_scores is not enough; reuse earlier top1 list not stored.
            # Approximate: use confidence per slice to produce pseudo-label by threshold 0.5; else set None.
            # Better: if labels existed we would compute accuracy; here we compute agreement with 3D using class index if available.
            pass
        # Instead recompute 2D aggregated via stored 'top1_samples' if present
        if result_2d and 'top1_samples' in result_2d and result_2d['top1_samples']:
            # Not reliable for all slices; fallback to confidence mean
            two_d_conf = result_2d.get('mean_top1_confidence')
        if result_3d and isinstance(result_3d, dict) and 'top1_class' in result_3d:
            three_d_idx = int(result_3d['top1_class'])
            three_d_conf = float(result_3d.get('top1_confidence', 0.0))
            comparison = {
                "two_d_confidence": float(two_d_conf) if isinstance(two_d_conf, (int,float)) else None,
                "three_d_confidence": three_d_conf,
                "agreement": None,
                "confidence_gap": (three_d_conf - float(two_d_conf)) if isinstance(two_d_conf, (int,float)) else None,
                "notes": "Agreement requires matching class vocabularies; showing confidence comparison only."
            }
    except Exception:
        comparison = None

    return jsonify({
        "two_d": result_2d or {"available": False, "notes": "torch/torchvision not installed or no slices"},
        "three_d": result_3d or {"available": False, "notes": "torch/torchvision not installed or insufficient slices"},
        "dependencies": dep,
        "comparison": comparison,
        "session_id": session_id
    })
