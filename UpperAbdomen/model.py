import os
import numpy as np
import SimpleITK as sitk
from skimage import measure

# -------------------------------
# Step 1: Set DICOM folder (Mac path)
# -------------------------------
dicom_folder = "/Users/aayushbatri/Desktop/project_data/Upper_Abdomen"  # update path

if not os.path.isdir(dicom_folder):
    raise FileNotFoundError(f"DICOM folder not found: {dicom_folder}")

# -------------------------------
# Step 2: Read DICOM series
# -------------------------------
reader = sitk.ImageSeriesReader()
series_ids = reader.GetGDCMSeriesIDs(dicom_folder)

if not series_ids:
    raise ValueError(f"No DICOM series found in: {dicom_folder}")

# Pick the first series in this folder
series_files = reader.GetGDCMSeriesFileNames(dicom_folder, series_ids[0])
reader.SetFileNames(series_files)
image = reader.Execute()

# Convert to NumPy volume [slices, height, width]
volume = sitk.GetArrayFromImage(image)

# -------------------------------
# Step 3: Normalize to [0,1] float
# -------------------------------
volume = (volume - np.min(volume)) / (np.max(volume) - np.min(volume))
volume = volume.astype(np.float32)

# -------------------------------
# Step 4: Transpose to (H, W, Z)
# -------------------------------
volume = np.transpose(volume, (1, 2, 0))

# -------------------------------
# Step 5: Marching Cubes surface
# -------------------------------
verts, faces, normals, values = measure.marching_cubes(volume, level=0.5)

# -------------------------------
# Step 6: Save as OBJ file
# -------------------------------
output_path = "/Users/aayushbatri/Desktop/output_model.obj"  # save path
with open(output_path, 'w') as f:
    for v in verts:
        f.write(f"v {v[0]} {v[1]} {v[2]}\n")
    for face in faces:
        # OBJ is 1-indexed
        f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")

print(f"✅ OBJ model saved to: {output_path}")
