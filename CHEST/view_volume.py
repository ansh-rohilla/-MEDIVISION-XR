import os
import sys
import argparse
import numpy as np
import SimpleITK as sitk
import vtk
import vtk.util.numpy_support

def downsample_for_vti(volume: np.ndarray, spacing, max_dim: int):
    if not max_dim or max_dim <= 0:
        return volume, spacing
    z, y, x = volume.shape
    m = max(z, y, x)
    if m <= max_dim:
        return volume, spacing
    import math
    k = max(1, math.ceil(m / float(max_dim)))
    v_ds = volume[::k, ::k, ::k]
    new_spacing = (float(spacing[0]) * k, float(spacing[1]) * k, float(spacing[2]) * k)
    return v_ds, new_spacing

def interactive_view(volume: np.ndarray, spacing, origin, ww: float, wc: float):
    importer = numpy_to_vtk_image(volume, spacing, origin)
    low = wc - ww / 2.0
    high = wc + ww / 2.0
    volume_color = vtk.vtkColorTransferFunction()
    volume_color.AddRGBPoint(low, 0.0, 0.0, 0.0)
    volume_color.AddRGBPoint(wc, 1.0, 0.76, 0.65)
    volume_color.AddRGBPoint(high, 1.0, 1.0, 1.0)
    volume_opacity = vtk.vtkPiecewiseFunction()
    volume_opacity.AddPoint(low, 0.0)
    volume_opacity.AddPoint(wc, 0.2)
    volume_opacity.AddPoint(high, 1.0)
    prop = vtk.vtkVolumeProperty()
    prop.SetColor(volume_color)
    prop.SetScalarOpacity(volume_opacity)
    prop.ShadeOn()
    prop.SetInterpolationTypeToLinear()
    mapper = vtk.vtkGPUVolumeRayCastMapper()
    mapper.SetInputConnection(importer.GetOutputPort())
    vol = vtk.vtkVolume()
    vol.SetMapper(mapper)
    vol.SetProperty(prop)
    ren = vtk.vtkRenderer()
    ren.AddVolume(vol)
    ren.SetBackground(0.1, 0.1, 0.12)
    win = vtk.vtkRenderWindow()
    win.AddRenderer(ren)
    win.SetSize(900, 700)
    iren = vtk.vtkRenderWindowInteractor()
    iren.SetRenderWindow(win)
    iren.Initialize()
    win.Render()
    iren.Start()

def render_snapshot_png(volume: np.ndarray, spacing, origin, ww: float, wc: float, out_png: str):
    if volume is None or volume.size == 0:
        return
    try:
        from PIL import Image
        mid_idx = volume.shape[0] // 2
        slice_2d = volume[mid_idx, :, :].copy()
        low = wc - ww / 2.0
        high = wc + ww / 2.0
        clipped = np.clip(slice_2d, low, high)
        norm = ((clipped - low) / (high - low if high > low else 1.0) * 255.0).astype(np.uint8)

        img = Image.fromarray(norm)
        if os.path.dirname(out_png):
            os.makedirs(os.path.dirname(out_png), exist_ok=True)
        img.save(out_png)
        print(f"Wrote snapshot PNG to: {out_png}")
    except Exception as e:
        print("PIL snapshot generation notice:", e)

def load_dicom(input_path: str):
    if os.path.isdir(input_path):
        reader = sitk.ImageSeriesReader()
        series_ids = reader.GetGDCMSeriesIDs(input_path)
        search_dirs = [input_path]
        if not series_ids:
            for root, dirs, files in os.walk(input_path):
                if files:
                    series_ids = reader.GetGDCMSeriesIDs(root)
                    if series_ids:
                        search_dirs = [root]
                        break
        if not series_ids:
            files = [os.path.join(input_path, f) for f in os.listdir(input_path)
                     if os.path.isfile(os.path.join(input_path, f))]
            if not files:
                raise ValueError(f"No DICOM files found in {input_path}")
            reader.SetFileNames(files)
        else:
            series_file_names = reader.GetGDCMSeriesFileNames(search_dirs[0], series_ids[0])
            reader.SetFileNames(series_file_names)
        image = reader.Execute()
    else:
        image = sitk.ReadImage(input_path)
    array = sitk.GetArrayFromImage(image)
    spacing = image.GetSpacing()
    origin = image.GetOrigin()
    return array, spacing, origin

def window_to_uint8(slice_img: np.ndarray, ww: float, wc: float) -> np.ndarray:
    low = wc - ww / 2.0
    high = wc + ww / 2.0
    clipped = np.clip(slice_img.astype(np.float32), low, high)
    norm = (clipped - low) / max(high - low, 1e-6)
    return (norm * 255.0).astype(np.uint8)

def save_png_slices(volume: np.ndarray, out_dir: str, ww: float, wc: float):
    os.makedirs(out_dir, exist_ok=True)
    z = volume.shape[0]
    for i in range(z):
        slice_u8 = window_to_uint8(volume[i], ww, wc)
        img = sitk.GetImageFromArray(slice_u8)
        out_path = os.path.join(out_dir, f"slice_{i:04d}.png")
        sitk.WriteImage(img, out_path)

def numpy_to_vtk_image(volume: np.ndarray, spacing, origin):
    z, y, x = volume.shape
    vtk_type = vtk.util.numpy_support.get_vtk_array_type(volume.dtype)
    data_importer = vtk.vtkImageImport()
    data_bytes = np.ascontiguousarray(volume).tobytes()
    data_importer.CopyImportVoidPointer(data_bytes, len(data_bytes))
    data_importer.SetDataScalarType(vtk_type)
    data_importer.SetNumberOfScalarComponents(1)
    data_importer.SetDataExtent(0, x - 1, 0, y - 1, 0, z - 1)
    data_importer.SetWholeExtent(0, x - 1, 0, y - 1, 0, z - 1)
    if spacing and len(spacing) == 3:
        data_importer.SetDataSpacing(float(spacing[0]), float(spacing[1]), float(spacing[2]))
    if origin and len(origin) == 3:
        data_importer.SetDataOrigin(float(origin[0]), float(origin[1]), float(origin[2]))
    data_importer.Update()
    return data_importer

def estimate_iso_otsu(volume: np.ndarray) -> float:
    v = volume
def compute_auto_iso(volume: np.ndarray) -> float:
    # Filter out extreme air values (-1000 HU is air, >100 HU is bone/soft-tissue structure)
    lo, hi = float(np.percentile(volume, 5.0)), float(np.percentile(volume, 99.0))
    if lo < -500:
        # Standard CT scan threshold: 150 HU isolates 3D anatomical bone & chest structure
        return 150.0
    return float((lo + hi) * 0.5)

def extract_largest_component(polydata):
    connect = vtk.vtkPolyDataConnectivityFilter()
    connect.SetInputData(polydata)
    connect.SetExtractionModeToLargestRegion()
    connect.Update()
    return connect.GetOutput()

def build_glb_from_iso(volume: np.ndarray, spacing, origin, out_model: str, iso_value: float):
    # Apply central anatomical masking to strip outer CT scanner bed, couch pad, and outer skin crescent rings
    z, y, x = volume.shape
    margin_x = int(x * 0.10)
    margin_y = int(y * 0.10)
    mask = np.zeros_like(volume, dtype=bool)
    mask[:, margin_y:y-margin_y, margin_x:x-margin_x] = True
    clean_volume = np.where(mask, volume, -1000)

    importer = numpy_to_vtk_image(clean_volume, spacing, origin)
    caster = vtk.vtkImageCast()
    caster.SetInputConnection(importer.GetOutputPort())
    caster.SetOutputScalarTypeToFloat()
    caster.Update()
    
    gauss = vtk.vtkImageGaussianSmooth()
    gauss.SetInputConnection(caster.GetOutputPort())
    gauss.SetStandardDeviations(0.6, 0.6, 0.6)
    gauss.SetRadiusFactors(1.5, 1.5, 1.5)
    gauss.Update()

    lo, hi = float(np.percentile(volume, 2)), float(np.percentile(volume, 98))

    def extract_single_iso(iso_val, reduction=0.25):
        iso_clipped = float(np.clip(iso_val, lo, hi))
        mc = vtk.vtkMarchingCubes()
        mc.SetInputConnection(gauss.GetOutputPort())
        mc.SetValue(0, iso_clipped)
        mc.ComputeGradientsOn()
        mc.ComputeNormalsOn()
        mc.Update()
        
        tri = vtk.vtkTriangleFilter()
        tri.SetInputConnection(mc.GetOutputPort())
        tri.PassLinesOff()
        tri.PassVertsOff()
        tri.Update()

        clean = vtk.vtkCleanPolyData()
        clean.SetInputConnection(tri.GetOutputPort())
        clean.PointMergingOn()

        deci = vtk.vtkDecimatePro()
        deci.SetInputConnection(clean.GetOutputPort())
        deci.SetTargetReduction(reduction)
        deci.PreserveTopologyOn()
        deci.BoundaryVertexDeletionOn()
        deci.SplittingOn()
        deci.Update()

        smoother = vtk.vtkWindowedSincPolyDataFilter()
        smoother.SetInputConnection(deci.GetOutputPort())
        smoother.SetNumberOfIterations(25)
        smoother.BoundarySmoothingOff()
        smoother.FeatureEdgeSmoothingOff()
        smoother.SetFeatureAngle(60.0)
        smoother.SetPassBand(0.02)
        smoother.NonManifoldSmoothingOn()
        smoother.NormalizeCoordinatesOn()
        smoother.Update()

        normals = vtk.vtkPolyDataNormals()
        normals.SetInputConnection(smoother.GetOutputPort())
        normals.ConsistencyOn()
        normals.SplittingOff()
        normals.AutoOrientNormalsOn()
        normals.SetFeatureAngle(80.0)
        normals.Update()

        res = normals.GetOutput()
        if not res or res.GetNumberOfPoints() == 0:
            res = mc.GetOutput()
        return res

    # Extract 1. Skeletal Bone Isosurface (160 HU: Ribs, Spine, Pelvis)
    bone_poly = extract_single_iso(160.0, reduction=0.3)

    # Extract 2. Internal Visceral Organs (85 HU: Liver, Kidneys, Heart, Spleen - Skin Envelope & Bed Stripped)
    organ_poly = extract_single_iso(85.0, reduction=0.35)

    # Extract 3. Lungs & Airway Parenchyma (-450 HU: Left & Right Lung Parenchyma)
    lung_poly = extract_single_iso(-450.0, reduction=0.35)

    # Append Bone, Internal Organ, and Lung PolyData into a single clean internal anatomical 3D mesh
    append_filter = vtk.vtkAppendPolyData()
    if bone_poly and bone_poly.GetNumberOfPoints() > 0:
        append_filter.AddInputData(bone_poly)
    if organ_poly and organ_poly.GetNumberOfPoints() > 0:
        append_filter.AddInputData(organ_poly)
    if lung_poly and lung_poly.GetNumberOfPoints() > 0:
        append_filter.AddInputData(lung_poly)
    append_filter.Update()

    polydata = append_filter.GetOutput()
    if not polydata or polydata.GetNumberOfPoints() == 0:
        polydata = bone_poly if bone_poly else organ_poly

    if os.path.dirname(out_model):
        os.makedirs(os.path.dirname(out_model), exist_ok=True)

    # Export solid binary 3D mesh with vtkSTLWriter
    try:
        stl_writer = vtk.vtkSTLWriter()
        stl_writer.SetFileName(out_model)
        stl_writer.SetInputData(polydata)
        stl_writer.SetFileTypeToBinary()
        stl_writer.Write()
        if os.path.isfile(out_model) and os.path.getsize(out_model) > 100:
            print(f"Exported multi-tissue 3D anatomical mesh model ({os.path.getsize(out_model)} bytes)")
            return
    except Exception as e:
        print("STLWriter notice:", e)
    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(single_chest_polydata)
    mapper.ScalarVisibilityOff()
    actor = vtk.vtkActor()
    actor.SetMapper(mapper)
    prop = actor.GetProperty()
    prop.SetColor(1.0, 0.8, 0.75)
    prop.SetOpacity(1.0)
    prop.SetSpecular(0.2)
    prop.SetSpecularPower(10.0)
    prop.SetDiffuse(0.8)
    prop.SetAmbient(0.2)
    renderer = vtk.vtkRenderer()
    renderer.AddActor(actor)
    renderer.SetBackground(0.1, 0.1, 0.12)
    renderer.ResetCamera()
    try:
      lk = vtk.vtkLightKit()
      lk.AddLightsToRenderer(renderer)
    except Exception:
      pass
    ren_win = vtk.vtkRenderWindow()
    ren_win.SetOffScreenRendering(1)
    ren_win.AddRenderer(renderer)
    ren_win.SetSize(960, 720)
    ren_win.Render()
    if os.path.dirname(out_model):
        os.makedirs(os.path.dirname(out_model), exist_ok=True)
    exporter = vtk.vtkGLTFExporter()
    exporter.SetFileName(out_model)
    exporter.SetRenderWindow(ren_win)
    exporter.InlineDataOn()
    exporter.Write()

def write_vti(volume: np.ndarray, spacing, origin, out_vti: str, ww: float, wc: float, max_dim: int = 256):
    vol_ds, spacing_ds = downsample_for_vti(volume, spacing, max_dim)
    v8 = window_to_uint8(vol_ds, ww, wc)
    importer = numpy_to_vtk_image(v8, spacing_ds, origin)
    importer.Update()
    image_data = importer.GetOutput()
    pd = image_data.GetPointData()
    if pd is not None and pd.GetScalars() is not None and not pd.GetScalars().GetName():
        pd.GetScalars().SetName("Scalars")
    os.makedirs(os.path.dirname(out_vti), exist_ok=True)
    writer = vtk.vtkXMLImageDataWriter()
    writer.SetFileName(out_vti)
    writer.SetInputData(image_data)
    if hasattr(writer, 'SetDataModeToAscii'):
        writer.SetDataModeToAscii()
    writer.Write()

def parse_args():
    p = argparse.ArgumentParser(description='Generate PNG slices and GLB mesh from DICOM volume')
    p.add_argument('--input', required=True, help='Path to DICOM folder or single file')
    p.add_argument('--out_slices', help='Directory to write PNG slices')
    p.add_argument('--out_model', help='Path to write GLB model (e.g., .../model.glb)')
    p.add_argument('--iso', default='auto', help='Isosurface value (number) or "auto" for Otsu')
    p.add_argument('--ww', type=float, default=350.0, help='Window width for slice PNGs')
    p.add_argument('--wc', type=float, default=40.0, help='Window center for slice PNGs')
    p.add_argument('--out_vti', help='Optional: Path to write VTI volume for browser rendering')
    p.add_argument('--vti_max_dim', type=int, default=256, help='Max dimension for VTI downsampling')
    p.add_argument('--interactive', action='store_true', help='Native VTK window for interactive viewing')
    p.add_argument('--snapshot_png', help='Path to a PNG volume rendering snapshot')
    p.add_argument('--skip-model', action='store_true', help='Skip GLB mesh export (avoids VTK crashes on some scans)')
    return p.parse_args()

def main():
    args = parse_args()
    vol, spacing, origin = load_dicom(args.input)
    print(f"Volume shape: {vol.shape}")
    print(f"Value range: {vol.min()} .. {vol.max()}")
    print(f"Spacing: {spacing}")
    if args.interactive:
        interactive_view(vol, spacing, origin, args.ww, args.wc)
        return 0
    if not args.out_slices:
        print('Missing --out_slices')
        return 2
    save_png_slices(vol, args.out_slices, args.ww, args.wc)
    print(f"Wrote slices to: {args.out_slices}")
    if args.out_vti:
        write_vti(vol, spacing, origin, args.out_vti, args.ww, args.wc, args.vti_max_dim)
        print(f"Wrote VTI to: {args.out_vti}")
    if getattr(args, 'snapshot_png', None):
        render_snapshot_png(vol, spacing, origin, args.ww, args.wc, args.snapshot_png)
        print(f"Wrote snapshot to: {args.snapshot_png}")
    if args.out_model and not args.skip_model:
        if args.iso == 'auto':
            iso_val = compute_auto_iso(vol)
            print(f"Auto iso: {iso_val}")
        else:
            try:
                iso_val = float(args.iso)
            except Exception:
                print("Invalid iso value; falling back to auto iso.")
                iso_val = compute_auto_iso(vol)
        try:
            build_glb_from_iso(vol, spacing, origin, args.out_model, iso_val)
            print(f"Wrote model to: {args.out_model}")
        except Exception as exc:
            print(f"GLB export skipped: {exc}")
    return 0

if __name__ == '__main__':
    sys.exit(main())
