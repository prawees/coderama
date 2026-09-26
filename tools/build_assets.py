"""
Code Rama asset pipeline.

Turns the project's existing hand-authored art into game-ready assets:
  - doctor_sprite.png (5 x 4 walk sheet)  -> public/assets/sprites/doctor.png
  - nurse_sprite.png  (3 x 4 walk sheet)  -> public/assets/sprites/nurse.png
  - tileset.jpg props                      -> public/assets/props/*.png (for the 3D suite)
  - er_bg.jpg                              -> public/assets/maps/er_main.png (ER overworld)

Every frame is cropped to its alpha bounding box, aligned on a shared
baseline, scaled to one game size, alpha-hardened and colour-reduced so
edges stay crisp. Run from the project root:

    python3 tools/build_assets.py
"""
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "assets")
OUT_SPR = os.path.join(SRC, "sprites")
OUT_PROPS = os.path.join(SRC, "props")
OUT_MAPS = os.path.join(SRC, "maps")
for d in (OUT_SPR, OUT_PROPS, OUT_MAPS):
    os.makedirs(d, exist_ok=True)

FRAME_W, FRAME_H = 64, 112  # on-screen size of a standing character


def harden(im: Image.Image, colors: int = 48) -> Image.Image:
    """Binary alpha + reduced palette: removes the soft halo from resampling."""
    im = im.convert("RGBA")
    alpha = im.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = im.convert("RGB").quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def slice_sheet(path: str, cols: int, rows: int):
    im = Image.open(path).convert("RGBA")
    cw, ch = im.width / cols, im.height / rows
    frames = []
    for r in range(rows):
        row = []
        for c in range(cols):
            cell = im.crop((int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)))
            bb = cell.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
            row.append(cell.crop(bb))
        frames.append(row)
    return frames


def facing(frame: Image.Image) -> str:
    """Side views: the face (skin tones in the upper third) sits on the side the character faces."""
    px = frame.load()
    w, h = frame.size
    xs = [x for y in range(int(h * 0.08), int(h * 0.32)) for x in range(w)
          if px[x, y][3] > 0 and px[x, y][0] > 190 and 120 < px[x, y][1] < 205 and px[x, y][2] < 170]
    return "right" if xs and sum(xs) / len(xs) > w / 2 else "left"


def build_character(name: str, path: str, cols: int, rows_dirs: dict):
    frames = slice_sheet(path, cols, 4)
    max_h = max(f.height for row in frames for f in row)
    scale = (FRAME_H - 4) / max_h
    sheet = Image.new("RGBA", (FRAME_W * cols, FRAME_H * 4), (0, 0, 0, 0))
    order = ["down", "left", "right", "up"]
    for out_row, d in enumerate(order):
        src_row, mirror = rows_dirs[d]
        for c in range(cols):
            f = frames[src_row][c]
            if mirror:
                f = f.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            nw, nh = max(1, round(f.width * scale)), max(1, round(f.height * scale))
            f = harden(f.resize((nw, nh), Image.Resampling.BOX))
            x = c * FRAME_W + (FRAME_W - nw) // 2
            y = out_row * FRAME_H + (FRAME_H - 2 - nh)  # shared baseline 2 px above the cell bottom
            sheet.alpha_composite(f, (x, y))
    sheet.save(os.path.join(OUT_SPR, f"{name}.png"))
    return {"frameW": FRAME_W, "frameH": FRAME_H, "cols": cols, "rows": order}


meta = {}
# Doctor: row 0 down, row 1 side, row 3 up. Row 2 is re-derived by mirroring row 1 so left/right are guaranteed opposite.
doc_frames = slice_sheet(os.path.join(SRC, "doctor_sprite.png"), 5, 4)
doc_side = facing(doc_frames[1][2])
meta["doctor"] = build_character("doctor", os.path.join(SRC, "doctor_sprite.png"), 5, {
    "down": (0, False),
    "left": (1, doc_side != "left"),
    "right": (1, doc_side == "left"),
    "up": (3, False),
})
nur_frames = slice_sheet(os.path.join(SRC, "nurse_sprite.png"), 3, 4)
nur_side = facing(nur_frames[1][0])
meta["nurse"] = build_character("nurse", os.path.join(SRC, "nurse_sprite.png"), 3, {
    "down": (0, False),
    "left": (1, nur_side != "left"),
    "right": (1, nur_side == "left"),
    "up": (3, False),
})
meta["walk"] = {"doctor": {"down": [0, 1, 2, 3, 4], "left": [0, 1, 2, 3, 4], "right": [0, 1, 2, 3, 4], "up": [0, 1, 2, 3, 4]},
                "nurse": {"down": [0, 1, 2], "left": [0, 1, 2], "right": [0, 1, 2], "up": [0, 2]}}
meta["idle"] = {"doctor": 2, "nurse": 0}

# ER overworld map: kept at native resolution, PNG so nearest-neighbour scaling stays clean.
Image.open(os.path.join(SRC, "er_bg.jpg")).convert("RGB").save(os.path.join(OUT_MAPS, "er_main.png"))

# Props from tileset.jpg for the 3D suite. Boxes are (x0, y0, x1, y1) in source pixels.
# The tileset background is a flat dark grey; it is keyed out to transparency.
PROPS = {
    "floor_tile": (0, 0, 100, 100),
    "wall_window": (718, 8, 975, 104),
    "monitor_cart": (725, 335, 815, 500),
    "vitals_monitor_cart": (930, 335, 1010, 500),
    "iv_pole": (930, 640, 1012, 752),
    "crash_cart": (825, 775, 915, 890),
    "supply_cart": (925, 775, 1015, 890),
    "bin_biohazard": (720, 740, 765, 810),
    "bin_recycle": (772, 740, 815, 810),
    "sanitizer": (775, 825, 815, 890),
    "chairs_blue": (705, 925, 830, 1020),
    "water_cooler": (965, 895, 1020, 1020),
    "bedside_table": (455, 710, 510, 815),
    "door_emergency": (218, 335, 365, 510),
    "blanket_blue": (18, 614, 90, 668),
}
tileset = Image.open(os.path.join(SRC, "tileset.jpg")).convert("RGB")
# Background = most common dark, unsaturated colour in the prop area.
from collections import Counter
_c = Counter()
for y in range(320, 1024, 3):
    for x in range(0, 1024, 3):
        r, g, b = tileset.getpixel((x, y))
        if max(r, g, b) < 110 and max(r, g, b) - min(r, g, b) < 10:
            _c[(r // 4 * 4, g // 4 * 4, b // 4 * 4)] += 1
bg = _c.most_common(1)[0][0]


def key_out(im: Image.Image, key, tol=26) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            if abs(r - key[0]) + abs(g - key[1]) + abs(b - key[2]) < tol * 3 and max(r, g, b) - min(r, g, b) < 12:
                px[x, y] = (0, 0, 0, 0)
    bb = im.getbbox()
    return im.crop(bb) if bb else im


for name, box in PROPS.items():
    crop = tileset.crop(box)
    if name in ("floor_tile", "wall_window", "blanket_blue"):
        crop.convert("RGB").save(os.path.join(OUT_PROPS, f"{name}.png"))
    else:
        key_out(crop, bg).save(os.path.join(OUT_PROPS, f"{name}.png"))
meta["props"] = sorted(PROPS.keys())

with open(os.path.join(OUT_SPR, "sheets.json"), "w") as fh:
    json.dump(meta, fh, indent=2)
print(json.dumps({k: v for k, v in meta.items() if k != "props"}, indent=2))
print("facing: doctor row1 =", doc_side, "| nurse row1 =", nur_side, "| tileset bg =", bg)


# ── Title screen: logo and isometric ward cut out of their flat backgrounds ──
OUT_UI = os.path.join(SRC, "ui")
os.makedirs(OUT_UI, exist_ok=True)


def key_flat(path: str, out: str, sample=(4, 4), tol=40):
    im = Image.open(path).convert("RGBA")
    key = im.getpixel(sample)[:3]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            if abs(r - key[0]) + abs(g - key[1]) + abs(b - key[2]) < tol:
                px[x, y] = (0, 0, 0, 0)
    im = im.crop(im.getbbox())
    im.save(os.path.join(OUT_UI, out))
    return im.size


print("logo", key_flat(os.path.join(SRC, "logo_new.jpg"), "logo.png", tol=60))
print("ward", key_flat(os.path.join(SRC, "hospital_bg_new.jpg"), "ward_iso.png", tol=36))
