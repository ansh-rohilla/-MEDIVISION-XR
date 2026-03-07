
# import os
# import SimpleITK as sitk
# import vtk
# import numpy as np
# import vtk.util.numpy_support

# # --- Setup and Load DICOM ---
# dicom_folder = "/Users/aayushbatri/Desktop/project_data/Tumor"

# if not os.path.isdir(dicom_folder):
#     raise FileNotFoundError(f"❌ Folder not found: {dicom_folder}")

# reader = sitk.ImageSeriesReader()
# series_ids = reader.GetGDCMSeriesIDs(dicom_folder)
# if not series_ids:
#     raise ValueError(f"No DICOM series found in {dicom_folder}")
# series_file_names = reader.GetGDCMSeriesFileNames(dicom_folder, series_ids[0])
# reader.SetFileNames(series_file_names)
# image = reader.Execute()
# array = sitk.GetArrayFromImage(image)
# spacing = image.GetSpacing()
# origin = image.GetOrigin()

# # Convert to VTK Image Data
# vtk_type = vtk.util.numpy_support.get_vtk_array_type(array.dtype)
# vtk_data_array = vtk.util.numpy_support.numpy_to_vtk(
#     num_array=np.ascontiguousarray(array).flatten(), deep=True, array_type=vtk_type
# )
# vtk_image = vtk.vtkImageData()
# vtk_image.SetDimensions(array.shape[2], array.shape[1], array.shape[0])
# vtk_image.SetSpacing(spacing[0], spacing[1], spacing[2])
# vtk_image.SetOrigin(origin)
# vtk_image.GetPointData().SetScalars(vtk_data_array)

# # ----------- KEY CORRECTIONS: TWO VOLUMES WITH CLIPPING AND SEPARATE TRANSFER FUNCTIONS -----------

# min_val = float(array.min())
# max_val = float(array.max())

# # Hounsfield Unit (HU) ranges
# # These are still estimates, fine-tune based on your data's actual values
# background_end = -100
# csf_start = 0
# white_matter_peak = 25
# grey_matter_peak = 45
# bone_start = 400

# # --- 1. Properties for the SKULL (Opaque) ---
# skull_color_func = vtk.vtkColorTransferFunction()
# skull_color_func.AddRGBPoint(min_val, 0, 0, 0)
# skull_color_func.AddRGBPoint(bone_start - 1, 0, 0, 0) # Hide everything below bone
# skull_color_func.AddRGBPoint(bone_start, 1.0, 0.95, 0.9) # Bone color (light, slightly yellowish)
# skull_color_func.AddRGBPoint(max_val, 1.0, 1.0, 1.0)

# skull_opacity_func = vtk.vtkPiecewiseFunction()
# skull_opacity_func.AddPoint(min_val, 0.0)
# skull_opacity_func.AddPoint(bone_start - 1, 0.0)
# skull_opacity_func.AddPoint(bone_start, 0.9) # Opaque bone
# skull_opacity_func.AddPoint(max_val, 1.0)

# skull_volume_property = vtk.vtkVolumeProperty()
# skull_volume_property.SetColor(skull_color_func)
# skull_volume_property.SetScalarOpacity(skull_opacity_func)
# skull_volume_property.SetInterpolationTypeToLinear()
# skull_volume_property.ShadeOn()
# skull_volume_property.SetAmbient(0.1)
# skull_volume_property.SetDiffuse(0.9)
# skull_volume_property.SetSpecular(0.2)
# skull_volume_property.SetScalarOpacityUnitDistance(0.8) # Adjust for better visibility

# skull_mapper = vtk.vtkGPUVolumeRayCastMapper()
# skull_mapper.SetInputData(vtk_image)

# # Define the clipping plane for the SKULL:
# # Let's assume we want to cut along the Y-axis to show half.
# # You might need to adjust the origin and normal based on your data's orientation.
# # This plane will cut AWAY the 'positive Y' side, showing the 'negative Y' side.
# clip_plane_skull = vtk.vtkPlane()
# # Get center of the volume along the Y-axis
# center_y = (array.shape[1] * spacing[1] / 2) + origin[1]
# clip_plane_skull.SetOrigin(origin[0], center_y, origin[2])
# clip_plane_skull.SetNormal(0, 1, 0) # Normal points in positive Y direction (cuts that part away)
# skull_mapper.AddClippingPlane(clip_plane_skull)

# # Add an additional clipping plane to remove the "trapezium-like thing" on the left
# # This is an estimation; you'll need to fine-tune the origin and normal.
# # Assuming it's on the 'left' (negative X or Y side) and close to the edge.
# clip_plane_trim_left = vtk.vtkPlane()
# # Example: If trapezium is on negative X side, normal points positive X
# trim_x_position = origin[0] + (array.shape[2] * spacing[0] * 0.1) # 10% from the start
# clip_plane_trim_left.SetOrigin(trim_x_position, origin[1], origin[2])
# clip_plane_trim_left.SetNormal(1, 0, 0) # Normal points positive X, cuts negative X away
# skull_mapper.AddClippingPlane(clip_plane_trim_left)
# # Also apply to brain to remove it consistently
# # brain_mapper.AddClippingPlane(clip_plane_trim_left) # Add this to brain_mapper below if needed


# skull_volume = vtk.vtkVolume()
# skull_volume.SetMapper(skull_mapper)
# skull_volume.SetProperty(skull_volume_property)


# # --- 2. Properties for the BRAIN (Semi-transparent with detail) ---
# brain_color_func = vtk.vtkColorTransferFunction()
# brain_color_func.AddRGBPoint(min_val, 0, 0, 0)
# brain_color_func.AddRGBPoint(background_end, 0, 0, 0)
# brain_color_func.AddRGBPoint(csf_start, 0.5, 0.5, 0.5)        # Light grey for CSF/low density
# brain_color_func.AddRGBPoint(white_matter_peak, 0.9, 0.8, 0.7) # Light tan/white for White Matter
# brain_color_func.AddRGBPoint(grey_matter_peak, 0.6, 0.4, 0.3)  # Darker brown for Grey Matter
# brain_color_func.AddRGBPoint(bone_start - 1, 0.6, 0.4, 0.3)   # Ensure brain color up to bone
# brain_color_func.AddRGBPoint(bone_start, 0, 0, 0) # Hide bone in brain volume
# brain_color_func.AddRGBPoint(max_val, 0, 0, 0)

# brain_opacity_func = vtk.vtkPiecewiseFunction()
# brain_opacity_func.AddPoint(min_val, 0.0)
# brain_opacity_func.AddPoint(background_end, 0.0)    # Fully Transparent
# brain_opacity_func.AddPoint(csf_start, 0.01)       # Very low opacity for CSF
# brain_opacity_func.AddPoint(white_matter_peak, 0.15) # Moderate opacity for White Matter
# brain_opacity_func.AddPoint(grey_matter_peak, 0.25)  # Slightly higher opacity for Grey Matter
# brain_opacity_func.AddPoint(bone_start - 1, 0.25)   # Ensure brain opacity up to bone
# brain_opacity_func.AddPoint(bone_start, 0.0)        # Make bone fully transparent in brain volume
# brain_opacity_func.AddPoint(max_val, 0.0)

# brain_volume_property = vtk.vtkVolumeProperty()
# brain_volume_property.SetColor(brain_color_func)
# brain_volume_property.SetScalarOpacity(brain_opacity_func)
# brain_volume_property.SetInterpolationTypeToLinear()
# brain_volume_property.ShadeOn()
# brain_volume_property.SetAmbient(0.1)
# brain_volume_property.SetDiffuse(0.9)
# brain_volume_property.SetSpecular(0.2)
# brain_volume_property.SetScalarOpacityUnitDistance(0.8) # Adjust for better visibility

# brain_mapper = vtk.vtkGPUVolumeRayCastMapper()
# brain_mapper.SetInputData(vtk_image)

# # Define the clipping plane for the BRAIN:
# # This plane will cut AWAY the 'negative Y' side, showing the 'positive Y' side.
# clip_plane_brain = vtk.vtkPlane()
# clip_plane_brain.SetOrigin(origin[0], center_y, origin[2])
# clip_plane_brain.SetNormal(0, -1, 0) # Normal points in negative Y direction (cuts that part away)
# brain_mapper.AddClippingPlane(clip_plane_brain)

# # Apply the same "trim left" plane to the brain as well
# brain_mapper.AddClippingPlane(clip_plane_trim_left)


# brain_volume = vtk.vtkVolume()
# brain_volume.SetMapper(brain_mapper)
# brain_volume.SetProperty(brain_volume_property)


# # --- Renderer and Interactor Setup ---
# renderer = vtk.vtkRenderer()
# renderer.AddVolume(skull_volume) # Add both volumes to the renderer
# renderer.AddVolume(brain_volume)
# renderer.SetBackground(0.07, 0.07, 0.07)

# render_window = vtk.vtkRenderWindow()
# render_window.AddRenderer(renderer)
# render_window.SetSize(900, 900)
# render_window.SetWindowName("3D Half Skull Half Brain Model")

# interactor = vtk.vtkRenderWindowInteractor()
# interactor.SetRenderWindow(render_window)

# print("🎥 Rendering half skull, half brain model. Adjust clipping planes for precise cut.")
# render_window.Render()
# renderer.ResetCamera()
# render_window.Render()
# interactor.Start()




import os
import SimpleITK as sitk
import vtk
import numpy as np
import vtk.util.numpy_support

# -- DICOM loading --
dicom_folder = "/Users/aayushbatri/Desktop/project_data/Tumor"

if not os.path.isdir(dicom_folder):
    raise FileNotFoundError(f"❌ Folder not found: {dicom_folder}")

reader = sitk.ImageSeriesReader()
series_ids = reader.GetGDCMSeriesIDs(dicom_folder)
if not series_ids:
    raise ValueError(f"No DICOM series found in {dicom_folder}")
series_file_names = reader.GetGDCMSeriesFileNames(dicom_folder, series_ids[0])
reader.SetFileNames(series_file_names)
image = reader.Execute()
array = sitk.GetArrayFromImage(image)
spacing = image.GetSpacing()
origin = image.GetOrigin()

vtk_type = vtk.util.numpy_support.get_vtk_array_type(array.dtype)
vtk_data_array = vtk.util.numpy_support.numpy_to_vtk(
    num_array=np.ascontiguousarray(array).flatten(), deep=True, array_type=vtk_type
)
vtk_image = vtk.vtkImageData()
vtk_image.SetDimensions(array.shape[2], array.shape[1], array.shape[0])
vtk_image.SetSpacing(spacing[0], spacing[1], spacing[2])
vtk_image.SetOrigin(origin)
vtk_image.GetPointData().SetScalars(vtk_data_array)

min_val = float(array.min())
max_val = float(array.max())
bone_start = 400
background_end = -100
csf_start = 0
white_matter_peak = 25
grey_matter_peak = 45

# -- Skull properties --
skull_color_func = vtk.vtkColorTransferFunction()
skull_color_func.AddRGBPoint(min_val, 0, 0, 0)
skull_color_func.AddRGBPoint(bone_start - 1, 0, 0, 0)
skull_color_func.AddRGBPoint(bone_start, 1.0, 0.96, 0.85)
skull_color_func.AddRGBPoint(max_val, 1, 1, 1)
skull_opacity_func = vtk.vtkPiecewiseFunction()
skull_opacity_func.AddPoint(min_val, 0.0)
skull_opacity_func.AddPoint(bone_start - 1, 0.0)
skull_opacity_func.AddPoint(bone_start, 1.0)
skull_opacity_func.AddPoint(max_val, 1.0)
skull_volume_property = vtk.vtkVolumeProperty()
skull_volume_property.SetColor(skull_color_func)
skull_volume_property.SetScalarOpacity(skull_opacity_func)
skull_volume_property.ShadeOn()
skull_volume_property.SetInterpolationTypeToLinear()
skull_volume_property.SetAmbient(0.12)
skull_volume_property.SetDiffuse(0.9)
skull_volume_property.SetSpecular(0.2)
skull_volume_property.SetScalarOpacityUnitDistance(0.85)
skull_mapper = vtk.vtkGPUVolumeRayCastMapper()
skull_mapper.SetInputData(vtk_image)

# -- Brain properties --
brain_color_func = vtk.vtkColorTransferFunction()
brain_color_func.AddRGBPoint(min_val, 0, 0, 0)
brain_color_func.AddRGBPoint(background_end, 0, 0, 0)
brain_color_func.AddRGBPoint(csf_start, 0.50, 0.48, 0.52)
brain_color_func.AddRGBPoint(white_matter_peak, 0.90, 0.81, 0.70)
brain_color_func.AddRGBPoint(grey_matter_peak, 0.65, 0.40, 0.34)
brain_color_func.AddRGBPoint(bone_start-1, 0.62, 0.41, 0.32)
brain_color_func.AddRGBPoint(bone_start, 0, 0, 0)
brain_color_func.AddRGBPoint(max_val, 0, 0, 0)
brain_opacity_func = vtk.vtkPiecewiseFunction()
brain_opacity_func.AddPoint(min_val, 0.0)
brain_opacity_func.AddPoint(background_end, 0.0)
brain_opacity_func.AddPoint(csf_start, 0.02)
brain_opacity_func.AddPoint(white_matter_peak, 0.13)
brain_opacity_func.AddPoint(grey_matter_peak, 0.22)
brain_opacity_func.AddPoint(bone_start-1, 0.20)
brain_opacity_func.AddPoint(bone_start, 0.0)
brain_opacity_func.AddPoint(max_val, 0.0)
brain_volume_property = vtk.vtkVolumeProperty()
brain_volume_property.SetColor(brain_color_func)
brain_volume_property.SetScalarOpacity(brain_opacity_func)
brain_volume_property.ShadeOn()
brain_volume_property.SetInterpolationTypeToLinear()
brain_volume_property.SetAmbient(0.09)
brain_volume_property.SetDiffuse(0.88)
brain_volume_property.SetSpecular(0.2)
brain_volume_property.SetScalarOpacityUnitDistance(0.95)
brain_mapper = vtk.vtkGPUVolumeRayCastMapper()
brain_mapper.SetInputData(vtk_image)

# --- Clipping planes for horizontal effect (jaw in lower, brain in upper) ---
center_y = origin[1] + spacing[1] * array.shape[1] * 0.44  # 44% leaves more jaw

clip_plane_skull = vtk.vtkPlane()
clip_plane_skull.SetOrigin(origin[0], center_y, origin[2])
clip_plane_skull.SetNormal(0, 1, 0)  # lower half (y < center), jaw/skull visible

clip_plane_brain = vtk.vtkPlane()
clip_plane_brain.SetOrigin(origin[0], center_y, origin[2])
clip_plane_brain.SetNormal(0, -1, 0)  # upper half (y > center), brain exposed

skull_mapper.AddClippingPlane(clip_plane_skull)
brain_mapper.AddClippingPlane(clip_plane_brain)

skull_volume = vtk.vtkVolume()
skull_volume.SetMapper(skull_mapper)
skull_volume.SetProperty(skull_volume_property)

brain_volume = vtk.vtkVolume()
brain_volume.SetMapper(brain_mapper)
brain_volume.SetProperty(brain_volume_property)

renderer = vtk.vtkRenderer()
renderer.AddVolume(skull_volume)
renderer.AddVolume(brain_volume)
renderer.SetBackground(0.11, 0.11, 0.11)

render_window = vtk.vtkRenderWindow()
render_window.SetWindowName("Half Brain / Half Skull - Horizontal Cut")
render_window.SetSize(950, 950)
render_window.AddRenderer(renderer)

interactor = vtk.vtkRenderWindowInteractor()
interactor.SetRenderWindow(render_window)

print("Rendering: lower section with skull/jaw, upper section with cutaway brain.")
render_window.Render()
renderer.ResetCamera()
render_window.Render()
interactor.Start()
