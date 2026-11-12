"""Build the original M2.2 teahouse study in metres, centred on its floor."""

from collections import defaultdict
from math import cos, pi, sin, sqrt
from pathlib import Path
from random import Random
import sys

import bpy
from mathutils import Vector


random = Random(813)
geometry = defaultdict(lambda: ([], [], []))


def palette(prefix, colors, roughness):
    result = []
    for index, rgb in enumerate(colors):
        material = bpy.data.materials.new(f"{prefix}_{index + 1}")
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (*(c ** 2.2 for c in rgb), 1)
        shader.inputs["Roughness"].default_value = roughness
        result.append(material)
    return result


def add(part, vertices, faces, material):
    points, polygons, surfaces = geometry[part]
    polygons.extend(tuple(len(points) + index for index in face) for face in faces)
    points.extend(vertices)
    surfaces.extend([material] * len(faces))


def box(part, center, size, material):
    x, y, z = center
    w, d, h = (value / 2 for value in size)
    points = [(x+a*w, y+b*d, z+c*h) for a,b,c in (
        (-1,-1,-1), (1,-1,-1), (1,1,-1), (-1,1,-1),
        (-1,-1,1), (1,-1,1), (1,1,1), (-1,1,1),
    )]
    add(part, points, [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)], material)


def tube(part, centers, radius, material, sides=8):
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
    add(part, vertices, faces, material)


def elevation(distance, x):
    t = distance / 2.94
    return 4.20 - 1.25*t + .30*t*t + .20*(abs(x)/4.34)**8


def make_roof(tile, ridge, timber):
    width = 4.34
    for sign in (-1, 1):
        samples = (-4.34, -4.1, -3.7, -3, -2, 0, 2, 3, 3.7, 4.1, 4.34)
        deck = [(x, sign*y, elevation(y, x)-.079) for y in (0,.5,1,1.5,2,2.5,2.94) for x in samples]
        stride = len(samples)
        faces = [(i, i+stride, i+stride+1, i+1) for row in range(6)
                 for i in range(row*stride, row*stride+stride-1)]
        add("RoofDeck", deck, faces if sign > 0 else [tuple(reversed(face)) for face in faces], timber[0])
        for column in range(60):
            x = -width + (column + .5) * 2 * width / 60
            for row in range(10):
                start = row * .29
                end = min(2.94, start + .33)
                vertices = []
                for distance in (start, end):
                    for u in (-1, -.55, 0, .55, 1):
                        xx = x + u*.079
                        height = elevation(distance, xx) + .052*sqrt(1-u*u) + (.008 if distance == end else 0)
                        vertices.append((xx, distance*sign, height))
                faces = [(k, k+1, k+6, k+5) for k in range(4)]
                if sign < 0:
                    faces = [tuple(reversed(face)) for face in faces]
                add("TiledRoof", vertices, faces, random.choice(tile))
            if column % 3 == 0:
                distance = 2.80
                box("TimberFrame", (x, sign*distance, elevation(distance, x)-.065),
                    (.063, .35, .12), timber[0])
        eave = [(x, sign*2.92, elevation(2.92, x)-.06) for x in
                (-4.34, -4.1, -3.7, -3, -2, 0, 2, 3, 3.7, 4.1, 4.34)]
        tube("Eaves", eave, .075, ridge[0])
        for x in (-4.31, 4.31):
            tube("Eaves", [(x, sign*y, elevation(y, x)-.01) for y in
                          (0, .45, .9, 1.35, 1.8, 2.25, 2.65, 2.94)], .07, ridge[0])
    tube("Eaves", [(x, 0, elevation(0, x)+.085+(.1 if abs(x)>4.3 else 0))
                  for x in (-4.40, -4.25, -3.8, -2, 0, 2, 3.8, 4.25, 4.40)], .097, ridge[0])


def make_hall(stone, timber, plaster, ceramic):
    for x in (-3.7, 3.7):
        for y in (-2.2, 2.2):
            box("Masonry", (x, y, .32), (.37, .37, .15), stone[1])
            tube("TimberFrame", [(x, y, .395), (x, y, 3.09)], .137, timber[0], 12)
            box("TimberFrame", (x, y, 2.97), (.4, .38, .17), timber[1])
            for direction in (-1, 1):
                box("TimberFrame", (x+direction*.15,y,3.11), (.26,.21,.14), timber[0])
    for y in (-2.2, 2.2):
        box("TimberFrame", (0,y,3.16), (8,.23,.24), timber[0])
        box("TimberFrame", (0,y,2.91), (7.5,.095,.095), timber[1])
        for x in (-2.45,-1.22,0,1.22,2.45):
            box("TimberFrame", (x,y,3.03), (.11,.11,.14), timber[0])
    for x in (-3.7,3.7):
        box("TimberFrame", (x,0,3.15), (.23,4.7,.24), timber[0])
    # Closed rear panel matches the collision rectangle. The south and east approaches stay open.
    box("Plaster", (0,2.50,1.45), (5,.2,2.4), plaster[0])
    box("Masonry", (0,2.39,.56), (5,.09,.63), stone[0])
    for x in (-1.62,0,1.62):
        box("Lattice", (x,2.375,1.77), (1.42,.065,1.15), timber[0])
        box("Lattice", (x,2.329,1.77), (1.28,.033,1.01), timber[2])
        for j in range(-4,5):
            box("Lattice", (x+j*.134,2.30,1.77), (.027,.031,.95), timber[1])
        for z in (1.35,1.57,1.97,2.19):
            box("Lattice", (x,2.292,z), (1.24,.033,.029), timber[1])
    for i in range(10):
        for j in range(8):
            x = -3.6 + i*.8
            y = -2.18 + j*.62
            box("Paving", (x,y,.246), (.789,.608,.015), random.choice(stone))
    box("Furniture", (0,0,.93), (1.2,1.2,.084), timber[1])
    for x in (-.47,.47):
        for y in (-.47,.47):
            box("Furniture", (x,y,.60), (.085,.085,.66), timber[0])
    for x,y,r in ((-.16,.14,.115),(.16,-.13,.046),(.15,.22,.046)):
        tube("TeaWare", [(x,y,.973),(x,y,1.035)], r, ceramic[0], 16)


def make_rockery(rock, foliage):
    for index, (cx, cy, width, height) in enumerate([
        (-7.8,-5.2,1.30,2.35), (-6.6,-5.9,1.11,1.75), (-7.6,-7.1,1.08,1.28),
        (-8.6,-7.7,.85,1.60), (-6.2,-4.8,.81,1.06), (-8.7,-4.8,.68,1.10),
    ]):
        sides = 22
        rings = 13
        points = []
        for ring in range(rings):
            t = ring / (rings - 1)
            profile = .09 + .88*sin(pi*t)**.63
            for side in range(sides):
                angle = side * 2*pi / sides
                erosion = .13*sin(3*angle+7*t+index) + .09*sin(7*angle-5*t)
                erosion += .10*sin(32*t+2*angle) + random.uniform(-.09,.09)
                radius = profile * (1+erosion) * width
                points.append((cx+radius*cos(angle)+.24*t, cy+radius*.70*sin(angle),
                               height*t-.06+.08*sin(3*angle+index)*sin(pi*t)))
        faces = [tuple(reversed(range(sides)))]
        for ring in range(rings - 1):
            for side in range(sides):
                a = ring*sides+side
                b = ring*sides+(side+1)%sides
                faces.append((a,b,b+sides,a+sides))
        faces.append(tuple(range(len(points)-sides,len(points))))
        add("Rockery", points, faces, rock[0])
        materials = geometry["Rockery"][2]
        for face_index in range(len(materials)-len(faces), len(materials)):
            if random.random() < .22:
                materials[face_index] = random.choice(rock[1:])

    for _ in range(105):
        x = random.uniform(-9.1, -6.0)
        y = random.uniform(-7.8, -4.2)
        for _ in range(random.randint(3, 8)):
            angle = random.uniform(0, 2*pi)
            height = random.uniform(.09,.40)
            spread = random.uniform(.06,.23)
            dx, dy = cos(angle)*spread, sin(angle)*spread
            w = random.uniform(.012,.023)
            points = [(x-w,y,.012),(x+w,y,.012),(x+dx*.4+w,y+dy*.4,height*.65),
                      (x+dx,y+dy,height),(x+dx*.4-w,y+dy*.4,height*.65)]
            add("Sedge", points, [(0,1,2,4),(4,2,3)], random.choice(foliage))


def make_pond_leaves(foliage):
    # Local coordinates place these inside the existing, non-walkable north pond.
    for cx, cy in ((13.0,-4.8), (13.8,-4.4), (15.4,-4.5), (16.2,-4.9)):
        for _ in range(9):
            x = cx + random.uniform(-.37, .37)
            y = cy + random.uniform(-.33, .33)
            radius = random.uniform(.09, .24)
            angle = random.uniform(0, 2*pi)
            height = random.uniform(.057,.079)
            points = [(x,y,height+.012)]
            for j in range(13):
                a = angle + .20 + j*(2*pi-.40)/12
                points.append((x+radius*cos(a), y+.88*radius*sin(a), height+.014*cos(2*a)))
            add("PondLeaves", points, [(0,j,j+1) for j in range(1,13)], random.choice(foliage))


def finish_scene(output):
    for part, (vertices, faces, surfaces) in geometry.items():
        mesh = bpy.data.meshes.new(part)
        mesh.from_pydata(vertices, [], faces)
        if mesh.validate():
            raise RuntimeError(f"Invalid source mesh: {part}")
        mesh.update()
        obj = bpy.data.objects.new(part, mesh)
        bpy.context.collection.objects.link(obj)
        slots = {material: index for index, material in enumerate(dict.fromkeys(surfaces))}
        for material in slots:
            mesh.materials.append(material)
        for polygon, material in zip(mesh.polygons, surfaces):
            polygon.material_index = slots[material]
            polygon.use_smooth = part in {"Eaves", "TeaWare", "Rockery"}
        if part in {"Masonry", "TimberFrame", "Furniture", "Lattice"}:
            bevel = obj.modifiers.new("Worn edges", "BEVEL")
            bevel.width = .016
            bevel.segments = 2
    output.parent.mkdir(parents=True, exist_ok=True)
    if bpy.ops.wm.save_as_mainfile(filepath=str(output), compress=True) != {"FINISHED"}:
        raise RuntimeError(f"Could not save {output}")


output, = sys.argv[sys.argv.index("--") + 1:]
output = Path(output).resolve()
if output.suffix.lower() != ".blend" or output.exists():
    raise ValueError("Choose a new .blend path for the generated teahouse.")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "M2.2_Teahouse"
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1
tile = palette("GreyClay", [(.27,.29,.29),(.32,.34,.33),(.30,.31,.31),(.35,.36,.35)], .87)
ridge = palette("RidgeClay", [(.24,.265,.265)], .85)
timber = palette("AgedTimber", [(.30,.19,.13),(.39,.255,.175),(.19,.145,.115)], .73)
stone = palette("Granite", [(.51,.51,.46),(.55,.55,.50),(.48,.49,.46),(.58,.56,.51)], .93)
plaster = palette("LimePlaster", [(.82,.79,.71)], .93)
ceramic = palette("Celadon", [(.41,.55,.49)], .36)
rock = palette("WeatheredLimestone", [(.47,.48,.43),(.43,.45,.40),(.53,.52,.46),(.43,.48,.38)], .97)
foliage = palette("SedgeGreen", [(.30,.38,.20),(.39,.44,.24),(.32,.42,.24)], .92)
for material in foliage:
    material.use_backface_culling = False
make_roof(tile, ridge, timber)
make_hall(stone, timber, plaster, ceramic)
make_rockery(rock, foliage)
make_pond_leaves(foliage)
finish_scene(output)
