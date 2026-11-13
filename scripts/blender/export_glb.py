"""Export the active Blender scene using the project's uncompressed GLB profile."""

from pathlib import Path
import sys

import bpy


if bpy.app.version[:2] != (5, 2):
    raise RuntimeError(f"Use Blender 5.2 LTS for this export. Found {bpy.app.version_string}.")

output, = sys.argv[sys.argv.index("--") + 1:]
result = bpy.ops.export_scene.gltf(
    filepath=str(Path(output).resolve()),
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_animations=True,
    export_cameras=False,
    export_lights=False,
    use_active_scene=True,
)
if result != {"FINISHED"}:
    raise RuntimeError(f"glTF export failed: {result}")
