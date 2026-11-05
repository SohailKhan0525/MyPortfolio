"""Offline PBR poster/QA renderer. Input meshes are exported from the live rig.

Blender 4.x: blender -b --factory-startup --python this_file -- frames.json
No files from the user's scene are read or modified; each frame uses a fresh scene.
"""
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

manifest = json.loads(Path(sys.argv[sys.argv.index("--") + 1]).read_text())


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, location, target, power, size, color):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    aim(obj, target)


for frame in manifest["frames"]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=frame["glb"])
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = frame["samples"]
    # Keep the exporter portable to CPU-only Blender builds without OIDN.
    # The high-resolution poster is supersampled when shown in the page.
    scene.cycles.use_denoising = False
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transparent_max_bounces = 8
    scene.render.resolution_x = frame["width"]
    scene.render.resolution_y = frame["height"]
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = frame["png"]
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world = bpy.data.worlds.new("Soft studio")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.75, 0.84, 0.81, 1)
    background.inputs["Strength"].default_value = 0.32
    # glTF's Y-up basis becomes Blender's Z-up basis: (x, y, z) -> (x, -z, y).
    camera_data = bpy.data.cameras.new("Runtime orthographic camera")
    camera = bpy.data.objects.new("Runtime orthographic camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -11, 3.1)
    aim(camera, (0, 0, 1.15))
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 6.2
    camera_data.clip_start = 0.1
    camera_data.clip_end = 40
    scene.camera = camera
    area("Large warm key", (-3.5, -4, 6), (0, 0, 1.2), 480, 4.5, (1, 0.94, 0.84))
    area("Cool soft fill", (4, -2, 3), (0, 0, 1.2), 220, 3.8, (0.76, 0.92, 1))
    area("Soft rim", (1.5, 3, 4.5), (0, 0, 1.4), 600, 3.5, (0.86, 1, 0.96))
    # Tiny screen details are emissive/unlit in the runtime and remain the actual
    # exported meshes. Avoid adding hand-painted highlights or a different face.
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {frame['id']}: {frame['png']}", flush=True)
