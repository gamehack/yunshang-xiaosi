"""Generate the original Blender smoke-test fixture at an explicit output path."""

from pathlib import Path
import sys

import bpy


def material(name, color, roughness, metallic):
    result = bpy.data.materials.new(name)
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return result


def block(name, center, size, surface):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(surface)
    bevel = obj.modifiers.new("Rounded edges", "BEVEL")
    bevel.width = 0.035
    bevel.segments = 3
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")


output, = sys.argv[sys.argv.index("--") + 1:]
output = Path(output).resolve()
if output.suffix.lower() != ".blend" or output.exists():
    raise ValueError("Choose a new .blend file for the test fixture.")
output.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "PIPELINE_TEST_ONLY"
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1

matte = material("TestMatte", (0.035, 0.32, 0.31), 0.78, 0)
metal = material("TestMetal", (0.82, 0.32, 0.045), 0.32, 0.65)
block("TestBody", (0, 0, 0.75), (2, 0.8, 1.5), matte)
block("TestFrontMarker", (0.6, -0.25, 1.65), (0.42, 0.28, 0.3), metal)

if bpy.ops.wm.save_as_mainfile(filepath=str(output)) != {"FINISHED"}:
    raise RuntimeError(f"Could not save {output}")
