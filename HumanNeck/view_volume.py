import vtk
import SimpleITK as sitk
import numpy as np
import os
import vtk.util.numpy_support

dicom_folder = "/Users/aayushbatri/Desktop/project_data/Human_Neck"  # Update!

if not os.path.isdir(dicom_folder):
    raise FileNotFoundError(f"Folder not found: {dicom_folder}")

reader = sitk.ImageSeriesReader()
series_ids = reader.GetGDCMSeriesIDs(dicom_folder)
if not series_ids:
    raise ValueError(f"No DICOM series found in {dicom_folder}")

series_file_names = reader.GetGDCMSeriesFileNames(dicom_folder, series_ids[0])
reader.SetFileNames(series_file_names)
image = reader.Execute()

array = sitk.GetArrayFromImage(image)  # no type change
print("Shape:", array.shape)
print("Range:", array.min(), array.max())
x, y, z = array.shape[2], array.shape[1], array.shape[0]
vtk_type = vtk.util.numpy_support.get_vtk_array_type(array.dtype)

data_importer = vtk.vtkImageImport()
data_importer.CopyImportVoidPointer(array.tobytes(), len(array.tobytes()))
data_importer.SetDataScalarType(vtk_type)
data_importer.SetNumberOfScalarComponents(1)
data_importer.SetDataExtent(0, x-1, 0, y-1, 0, z-1)
data_importer.SetWholeExtent(0, x-1, 0, y-1, 0, z-1)

# ---- MEDICAL CT WINDOW/LEVEL PRESET: soft-tissue ----
# Typical CT values: Air = -1000, Water = 0, Bone = 300-2000
# Window width/center for "CT-Soft-Tissue": width=350, center=40
ww, wc = 350, 40
low = wc - ww/2       # -135
high = wc + ww/2      # 215

volume_color = vtk.vtkColorTransferFunction()
volume_color.AddRGBPoint(low,   0.0, 0.0, 0.0)   # Black below window
volume_color.AddRGBPoint(wc,    1.0, 0.76, 0.65) # Light skin at center (soft tissue, flesh tone)
volume_color.AddRGBPoint(high,  1.0, 1.0, 1.0)   # White above window

volume_opacity = vtk.vtkPiecewiseFunction()
volume_opacity.AddPoint(low, 0.0)
volume_opacity.AddPoint(wc,  0.2)
volume_opacity.AddPoint(high, 1.0)

# ----- Uncomment for "Bone Window" preset -----
# # Bone: width=2800, center=600
# #ww, wc = 2800, 600
# #low = wc - ww/2
# #high = wc + ww/2
# #volume_color.AddRGBPoint(low,   0.0, 0.0, 0.0)
# #volume_color.AddRGBPoint(wc,    0.85, 0.85, 0.85)
# #volume_color.AddRGBPoint(high,  1.0, 1.0, 1.0)
# #volume_opacity.AddPoint(low, 0)
# #volume_opacity.AddPoint(wc, 0.4)
# #volume_opacity.AddPoint(high, 1.0)

volume_property = vtk.vtkVolumeProperty()
volume_property.SetColor(volume_color)
volume_property.SetScalarOpacity(volume_opacity)
volume_property.ShadeOn()
volume_property.SetInterpolationTypeToLinear()

volume_mapper = vtk.vtkGPUVolumeRayCastMapper()
volume_mapper.SetInputConnection(data_importer.GetOutputPort())

volume = vtk.vtkVolume()
volume.SetMapper(volume_mapper)
volume.SetProperty(volume_property)

renderer = vtk.vtkRenderer()
renderer.AddVolume(volume)
renderer.SetBackground(0.15, 0.15, 0.15)

render_window = vtk.vtkRenderWindow()
render_window.AddRenderer(renderer)
render_window.SetSize(900, 900)

interactor = vtk.vtkRenderWindowInteractor()
interactor.SetRenderWindow(render_window)

render_window.Render()
interactor.Start()
