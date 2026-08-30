#!/usr/bin/env python3
"""Turn the raw shoot folders into web media + the gallery manifest.

Source lives in `vivid folders/` (HEIC stills, HDR .MOV clips) and never ships.
Run this again whenever a folder gains files: python3 tools/build-gallery.py
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vivid folders"

# Three files in the Durango folder are actually the Mustang — same coupe door
# card, same dual-screen dash, and the numbers carry straight on from 6444-6448.
MOVED = {"IMG_6449", "IMG_6450", "IMG_6452"}

CARS = [
    ("mustang-600", "2025 Mustang 600 stars",    "Mustang, 2025",              "600 stars · full ambient · underglow"),
    ("durango",    "2025 dodge durango hornet ", "Dodge Durango Hornet, 2025", "600 stars · full ambient · footwells"),
    ("mustang-gt", "2025 Mustang gt",            "Mustang GT, 2025",           "Full ambient kit · footwells"),
    ("king-ranch", "King ranch truck",           "Ford F-150 King Ranch",      "800 stars · full ambient · footwells · panoramic roof"),
    ("audi-a4",    "2019 audi a4",               "Audi A4, 2019",              "600 stars · full ambient · footwells"),
    ("rx7",        "500 stars",                  "Mazda RX-7",                 "Rainbow underglow, wheel to wheel"),
    ("sierra",     "2023 GMC sierra ",           "GMC Sierra, 2023",           "8-strip ambient · sunroof · footwells"),
]

STILL = {".heic", ".jpg", ".jpeg", ".png"}
CLIP = {".mov", ".mp4"}


def run(*args):
    subprocess.run(args, check=True, capture_output=True)


def probe(path):
    """Video stream facts, with width/height already swapped for a sideways phone clip."""
    raw = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_streams",
         "-of", "json", str(path)], check=True, capture_output=True, text=True).stdout)
    st = raw["streams"][0]
    w, h = st["width"], st["height"]
    rot = next((abs(int(sd.get("rotation", 0))) for sd in st.get("side_data_list", [])
                if "rotation" in sd), 0)
    if rot in (90, 270):
        w, h = h, w
    return w, h, st.get("color_transfer", "")


def display_size(path):
    """Stored size, swapped when EXIF says the browser will turn it upright.

    sips keeps the orientation flag rather than baking the rotation into the
    pixels, so 1400x1050 on disk can be 1050x1400 on screen — and a wrong
    width/height pair makes the masonry reflow as each shot loads.
    """
    import struct
    w, h = (int(v) for v in subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        check=True, capture_output=True, text=True).stdout.split()[-3::2])
    d = path.read_bytes()
    i, tag = 2, 1
    while i < len(d) - 1 and d[i] == 0xFF and d[i + 1] != 0xDA:
        ln = struct.unpack(">H", d[i + 2:i + 4])[0]
        seg = d[i + 4:i + 2 + ln]
        if d[i + 1] == 0xE1 and seg[:6] == b"Exif\x00\x00":
            e = seg[6:]
            bo = "<" if e[:2] == b"II" else ">"
            off = struct.unpack(bo + "I", e[4:8])[0]
            for k in range(struct.unpack(bo + "H", e[off:off + 2])[0]):
                q = off + 2 + k * 12
                if struct.unpack(bo + "H", e[q:q + 2])[0] == 0x0112:
                    tag = struct.unpack(bo + "H", e[q + 8:q + 10])[0]
            break
        i += 2 + ln
    return (h, w) if tag in (5, 6, 7, 8) else (w, h)


def sources(folder):
    """Every file for one car, with the misfiled Mustang shots routed away."""
    stills, clips = [], []
    for f in sorted((SRC / folder).iterdir()):
        if f.name.startswith("."):
            continue
        ext = f.suffix.lower()
        moved = f.stem in MOVED
        if folder.startswith("2025 dodge") and moved:
            continue
        if ext in STILL:
            stills.append(f)
        elif ext in CLIP:
            clips.append(f)
    if folder == "2025 Mustang gt":
        stills += sorted(f for f in (SRC / "2025 dodge durango hornet ").iterdir() if f.stem in MOVED)
    return stills, clips


def build_still(src, dest):
    run("sips", "-s", "format", "jpeg", "-s", "formatOptions", "68", "-Z", "1400",
        str(src), "--out", str(dest))
    w, h = display_size(dest)
    return [dest.name, w, h]


def build_clip(src, dest):
    w, h, transfer = probe(src)
    cap = min(720 if h >= w else 1280, w)
    chain = [f"scale={cap}:-2"]
    if transfer == "arib-std-b67":  # iPhone HLG — tonemap rather than relabel
        chain = ["zscale=t=linear:npl=100", "tonemap=hable:desat=0",
                 "zscale=p=bt709:t=bt709:m=bt709:r=limited"] + chain
    chain += ["format=yuv420p", "fps=30"]

    run("ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", str(src), "-an",
        "-vf", ",".join(chain), "-c:v", "libx264", "-profile:v", "high", "-level", "4.0",
        "-pix_fmt", "yuv420p", "-color_range", "tv", "-colorspace", "bt709",
        "-color_primaries", "bt709", "-color_trc", "bt709",
        "-crf", "32", "-preset", "slow", "-movflags", "+faststart", str(dest))
    # Poster: let ffmpeg pick a representative frame from the back half, but stop
    # short of the end — several clips finish on the shop's Instagram card.
    poster = dest.with_suffix(".jpg")
    dur = float(json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(dest)],
        check=True, capture_output=True, text=True).stdout)["format"]["duration"])
    run("ffmpeg", "-nostdin", "-y", "-loglevel", "error",
        "-ss", f"{dur * 0.55:.2f}", "-t", f"{dur * 0.35:.2f}", "-i", str(dest),
        "-vf", "fps=2,thumbnail=120", "-frames:v", "1", "-q:v", "4", str(poster))

    ow, oh, _ = probe(dest)
    return [dest.name, ow, oh]


def main():
    manifest = {}
    for slug, folder, name, spec in CARS:
        stills, clips = sources(folder)
        img_dir = ROOT / "images" / "gallery" / slug
        vid_dir = ROOT / "video" / "gallery" / slug
        for d in (img_dir, vid_dir):
            d.mkdir(parents=True, exist_ok=True)
            for old in d.iterdir():
                old.unlink()

        shots = [build_still(f, img_dir / f"{i:02d}.jpg") for i, f in enumerate(stills, 1)]
        films = [build_clip(f, vid_dir / f"{i:02d}.mp4") for i, f in enumerate(clips, 1)]
        manifest[slug] = {"name": name, "spec": spec, "clips": films, "shots": shots}
        print(f"{slug:11} {len(shots):2} photos  {len(films)} clips")

    out = ROOT / "gallery-data.js"
    out.write_text("/* Generated by tools/build-gallery.py — do not hand-edit. */\n"
                   "const GALLERY = " + json.dumps(manifest, indent=1, ensure_ascii=False) + ";\n")
    print("wrote", out.name)


if __name__ == "__main__":
    sys.exit(main())
