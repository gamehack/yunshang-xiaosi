"""Build the original four-post pond pavilion in metres at the deck centre."""

from math import sqrt
from pathlib import Path
from random import Random
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from architecture_geometry import MeshParts, palette, save_source, start_source


parts = MeshParts()
random = Random(112)
corners = [(-2.65, -2.5), (2.65, -2.5), (2.65, 2.5), (-2.65, 2.5)]
ridge_ends = [(-.82, 0), (.82, 0), (.82, 0), (-.82, 0)]


def roof_point(side, u, slope, offset=0):
    following = (side + 1) % 4
    edge = [a + (b-a)*u for a, b in zip(corners[side], corners[following])]
    ridge = [a + (b-a)*u for a, b in zip(ridge_ends[side], ridge_ends[following])]
    x, y = (a + (b-a)*slope for a, b in zip(edge, ridge))
    corner_lift = .23 * abs(2*u-1)**5 * (1-slope)**2
    return x, y, 2.97 + .91*slope + .32*slope**2 + corner_lift + offset


def make_roof(clay, trim, wood):
    for side in range(4):
        for row in range(6):
            start, stop = .993*row/6, .993*(row+1)/6
            for column in range(10):
                u, v = column/10, (column+1)/10
                points = [roof_point(side, t, s, -.055) for s in (start, stop) for t in (u, v)]
                parts.add("PavilionSoffit", points, [(2,3,1,0)], wood)
        columns = 22 if side % 2 == 0 else 20
        for column in range(columns):
            centre = (column + .5)/columns
            for row in range(8):
                start = row/8
                end = min(.993, start + .147)
                vertices = []
                for slope in (start, end):
                    for profile in (-1, 0, 1):
                        u = centre + profile*.5/columns
                        lift = .028*sqrt(1-profile**2) + (.009 if slope == end else 0)
                        vertices.append(roof_point(side, u, slope, lift))
                parts.add("PavilionRoof", vertices, [(0,1,4,3), (1,2,5,4)], random.choice(clay))
        parts.tube("PavilionTrim", [roof_point(side, i/12, 0, -.021) for i in range(13)], .061, trim)
        parts.tube("PavilionTrim", [roof_point(side, 0, i/9, .034) for i in range(10)], .062, trim)
    parts.tube("PavilionTrim", [(-.87, 0, 4.265), (-.67, 0, 4.255), (.67, 0, 4.255), (.87, 0, 4.265)],
               .087, trim)


def make_frame(wood, granite):
    parts.box("PavilionStone", (0, 0, .055), (4.18, 4.18, .11), granite[1])
    for row in range(5):
        for column in range(5):
            x, y = (column-2)*.813, (row-2)*.813
            color = granite[0] if row == 0 else granite[2 + (row + column) % 2]
            parts.box("PavilionStone", (x, y, .124), (.805,.805,.029), color)
    parts.box("PavilionStone", (0,-2.21,.042), (2.35,.43,.084), granite[0])
    for x in (-1.8, 1.8):
        for y in (-1.8, 1.8):
            parts.box("PavilionStone", (x,y,.211), (.39,.39,.153), granite[0])
            parts.tube("PavilionTimber", [(x,y,.287), (x,y,2.90)], .133, wood[0], 12)
            parts.box("PavilionTimber", (x,y,2.84), (.36,.36,.16), wood[1])
            for dx, dy in ((-.59 if x > 0 else .59, 0), (0, -.59 if y > 0 else .59)):
                parts.tube("PavilionTimber", [(x,y,2.46), (x+dx,y+dy,2.78)], .072, wood[1], 4)
    for side in (-1, 1):
        parts.box("PavilionTimber", (0,side*1.8,2.91), (4.16,.25,.23), wood[0])
        parts.box("PavilionTimber", (side*1.8,0,2.91), (.25,4.16,.23), wood[0])
        parts.box("PavilionTimber", (0,side*1.8,2.735), (3.54,.105,.092), wood[1])
        parts.box("PavilionTimber", (side*1.8,0,2.735), (.105,3.54,.092), wood[1])
        for x in (-1.48, -.74, 0, .74, 1.48):
            parts.box("PavilionTimber", (x,side*1.8,2.81), (.095,.108,.12), wood[1])
            parts.box("PavilionTimber", (side*1.8,x,2.81), (.108,.095,.12), wood[1])


output = start_source("M2.2_Pond_Pavilion")
tile = palette("PavilionGreyClay", [(.28,.305,.30),(.32,.335,.33),(.30,.32,.32),(.34,.35,.34)], .88)
trim, = palette("PavilionRidgeClay", [(.245,.27,.265)], .86)
wood = palette("PavilionAgedTimber", [(.40,.23,.16),(.48,.30,.20),(.43,.325,.25)], .8)
granite = palette("PavilionGranite", [(.54,.54,.49),(.58,.57,.51),(.475,.48,.45),(.50,.50,.46)], .94)
make_roof(tile, trim, wood[2])
make_frame(wood, granite)
for obj in parts.build():
    if obj.name == "PavilionTrim":
        for face in obj.data.polygons:
            face.use_smooth = True
save_source(output)
