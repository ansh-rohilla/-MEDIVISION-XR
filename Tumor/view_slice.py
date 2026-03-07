import SimpleITK as sitk
import matplotlib.pyplot as plt
import os

# Set the folder path to one series
dicom_folder = "/Users/aayushbatri/Desktop/project_data/Tumor"

# Check folder exists
if not os.path.isdir(dicom_folder):
    raise FileNotFoundError(f"Folder not found: {dicom_folder}")

# Read DICOM series
reader = sitk.ImageSeriesReader()
series_IDs = reader.GetGDCMSeriesIDs(dicom_folder)

if not series_IDs:
    raise ValueError(f"No DICOM series found in {dicom_folder}. Check folder contents.")

print("Found Series IDs:", series_IDs)

# Use the first series
series_file_names = reader.GetGDCMSeriesFileNames(dicom_folder, series_IDs[0])
reader.SetFileNames(series_file_names)
image = reader.Execute()

# Convert to NumPy array
array = sitk.GetArrayFromImage(image)
print(f"Image loaded: shape={array.shape}")

# Visualize middle slice
slice_idx = array.shape[0] // 2
plt.imshow(array[slice_idx], cmap='gray')
plt.axis('off')
plt.show()

