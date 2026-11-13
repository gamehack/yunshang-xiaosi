"""Mesh authoring helpers for the original Blender architecture studies."""

from collections import defaultdict
from math import cos, pi, sin
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def palette(prefix, colors, roughness):
    materials = []
    for index, rgb in enumerate(colors, 1):
        material = bpy.data.materials.new(f"{prefix}_{index}")
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (*(channel ** 2.2 for channel in rgb), 1)
        shader.inputs["Roughness"].default_value = roughness
        materials.append(material)
    return materials


class MeshParts:
    def __init__(self):
        self.geometry = defaultdict(lambda: ([], [], []))

    def add(self, part, vertices, faces, material):
        points, polygons, surfaces = self.geometry[part]
        polygons.extend(tuple(len(points) + index for index in face) for face in faces)
        points.extend(vertices)
        surfaces.extend([material] * len(faces))

    def box(self, part, center, size, material):
        x, y, z = center
        w, d, h = (value / 2 for value in size)
        points = [(x+a*w, y+b*d, z+c*h) for a,b,c in (
            (-1,-1,-1), (1,-1,-1), (1,1,-1), (-1,1,-1),
            (-1,-1,1), (1,-1,1), (1,1,1), (-1,1,1),
        )]
        self.add(part, points, [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)], material)

    def tube(self, part, centers, radius, material, sides=8):
        centers = [Vector(center) for center in centers]
        vertices = []
        for index, center in enumerate(centers):
            tangent = (centers[min(index + 1, len(centers) - 1)] - centers[max(index - 1, 0)]).normalized()
            reference = Vector((0, 0, 1)) if abs(tangent.z) < .92 else Vector((1, 0, 0))
            first = tangent.cross(reference).normalized()
            second = tangent.cross(first)
            vertices.extend(center + radius * (first*cos(a*2*pi/sides) + second*sin(a*2*pi/sides))
                            for a in range(sides))
        faces = [tuple(reversed(range(sides)))]
        for ring in range(len(centers) - 1):
            for a in range(sides):
                i, j = ring*sides + a, ring*sides + (a+1) % sides
                faces.append((i, j, j+sides, i+sides))
        faces.append(tuple(range(len(vertices)-sides, len(vertices))))
        self.add(part, vertices, faces, material)

    def build(self):
        for name, (vertices, faces, surfaces) in self.geometry.items():
            mesh = bpy.data.meshes.new(name)
            mesh.from_pydata(vertices, [], faces)
            if mesh.validate():
                raise RuntimeError(f"Invalid source mesh: {name}")
            mesh.update()
            obj = bpy.data.objects.new(name, mesh)
            bpy.context.collection.objects.link(obj)
            slots = {material: index for index, material in enumerate(dict.fromkeys(surfaces))}
            for material in slots:
                mesh.materials.append(material)
            for polygon, material in zip(mesh.polygons, surfaces):
                polygon.material_index = slots[material]
            yield obj


def start_source(scene_name):
    if bpy.app.version[:2] != (5, 2):
        raise RuntimeError(f"Use Blender 5.2 LTS. Found {bpy.app.version_string}.")
    output, = sys.argv[sys.argv.index("--") + 1:]
    output = Path(output).resolve()
    if output.suffix.lower() != ".blend" or output.exists():
        raise ValueError("Choose a new .blend path for the generated asset.")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = scene_name
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1
    return output


def save_source(output):
    output.parent.mkdir(parents=True, exist_ok=True)
    if bpy.ops.wm.save_as_mainfile(filepath=str(output), compress=True) != {"FINISHED"}:
        raise RuntimeError(f"Could not save {output}")
