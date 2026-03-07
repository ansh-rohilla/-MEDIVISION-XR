
import vtk
import SimpleITK as sitk
import numpy as np
import os
import vtk.util.numpy_support

dicom_folder = "/Users/aayushbatri/Desktop/project_data/Abdomen"  # Update!

if not os.path.isdir(dicom_folder):
    raise FileNotFoundError(f"Folder not found: {dicom_folder}")

reader = sitk.ImageSeriesReader()
series_ids = reader.GetGDCMSeriesIDs(dicom_folder)
if not series_ids:
    raise ValueError(f"No DICOM series found in {dicom_folder}")

series_file_names = reader.GetGDCMSeriesFileNames(dicom_folder, series_ids[0])
reader.SetFileNames(series_file_names)
image = reader.Execute()
array = sitk.GetArrayFromImage(image)
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
sx, sy, sz = image.GetSpacing()
data_importer.SetDataSpacing(float(sx), float(sy), float(sz))
data_importer.SetDataOrigin(0.0, 0.0, 0.0)

# -------- Realistic, auto-adaptive transfer functions --------
min_val = float(array.min())
max_val = float(array.max())
p02 = np.percentile(array, 2)       # Auto-hide air/rim
p995 = np.percentile(array, 99.5)   # Upper soft-tissue/bone
mid = (p02 + p995)/2

volume_color = vtk.vtkColorTransferFunction()
volume_color.AddRGBPoint(min_val, 0.0, 0.0, 0.0)        # Strictly hide negative intensity
volume_color.AddRGBPoint(p02,   0.0, 0.0, 0.0)           # Hide background/air
volume_color.AddRGBPoint(mid,   1.0, 0.78, 0.65)         # Flesh/light orange (soft tissue)
volume_color.AddRGBPoint(p995,  1.0, 1.0, 1.0)           # Bone/contrast = white
volume_color.AddRGBPoint(max_val, 1.0, 1.0, 1.0)

volume_opacity = vtk.vtkPiecewiseFunction()
volume_opacity.AddPoint(min_val, 0.0)
volume_opacity.AddPoint(p02,   0.0)
volume_opacity.AddPoint(mid,   0.23)
volume_opacity.AddPoint(p995,  0.88)
volume_opacity.AddPoint(max_val, 1.0)

# Sharpen tissue boundaries and reduce fog
grad = vtk.vtkPiecewiseFunction()
grad.AddPoint(0, 0.0)
grad.AddPoint(90, 0.15)
grad.AddPoint(200, 1.0)

volume_property = vtk.vtkVolumeProperty()
volume_property.SetColor(volume_color)
volume_property.SetScalarOpacity(volume_opacity)
volume_property.SetGradientOpacity(grad)
volume_property.ShadeOn()
volume_property.SetInterpolationTypeToLinear()
volume_property.SetAmbient(0.18)
volume_property.SetDiffuse(0.92)
volume_property.SetSpecular(0.25)
volume_property.SetSpecularPower(18)

volume_mapper = vtk.vtkGPUVolumeRayCastMapper()
volume_mapper.SetInputConnection(data_importer.GetOutputPort())
try:
    volume_mapper.SetAutoAdjustSampleDistances(False)
    volume_mapper.SetSampleDistance(0.22)
except Exception:
    pass
if hasattr(volume_mapper, "SetUseJittering"):
    volume_mapper.SetUseJittering(True)

volume = vtk.vtkVolume()
volume.SetMapper(volume_mapper)
volume.SetProperty(volume_property)

renderer = vtk.vtkRenderer()
renderer.AddVolume(volume)
renderer.SetBackground(0.09, 0.09, 0.09)
headlight = vtk.vtkLight()
headlight.SetLightTypeToHeadlight()
headlight.SetIntensity(0.95)
renderer.AddLight(headlight)
fill = vtk.vtkLight()
fill.SetPosition(1.2, -0.8, 1.1)
fill.SetIntensity(0.38)
renderer.AddLight(fill)

render_window = vtk.vtkRenderWindow()
render_window.AddRenderer(renderer)
render_window.SetSize(1200, 1000)
render_window.SetMultiSamples(8)

interactor = vtk.vtkRenderWindowInteractor()
interactor.SetRenderWindow(render_window)
style = vtk.vtkInteractorStyleTrackballCamera()
interactor.SetInteractorStyle(style)

print("Rendering cinematic, high-detail abdomen CT... (rotate to explore anatomy)")
render_window.Render()
renderer.ResetCamera()
render_window.Render()
interactor.Start()
