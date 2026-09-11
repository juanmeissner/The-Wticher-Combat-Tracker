"""Gera a pirâmide de blocos do mapa do Continente.

Uso:
    python scripts/generate-map-tiles.py

A imagem original permanece intacta. O diretório de saída é substituído somente
depois que todos os níveis e o manifesto forem gerados com sucesso.
"""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = PROJECT_ROOT / "img" / "maps" / "continent.png"
DEFAULT_OUTPUT = PROJECT_ROOT / "img" / "maps" / "continent"
TILE_SIZE = 256
MIN_NATIVE_ZOOM = -4
MAX_NATIVE_ZOOM = 0
WEBP_QUALITY = 90


def directory_for_zoom(zoom: int) -> str:
    return str(zoom) if zoom >= 0 else f"m{abs(zoom)}"


def generate_level(source: Image.Image, zoom: int, output: Path) -> dict[str, int | str]:
    scale = 2**zoom
    width = max(1, round(source.width * scale))
    height = max(1, round(source.height * scale))
    resized = source if zoom == 0 else source.resize((width, height), Image.Resampling.LANCZOS)
    columns = (width + TILE_SIZE - 1) // TILE_SIZE
    rows = (height + TILE_SIZE - 1) // TILE_SIZE
    level_directory = directory_for_zoom(zoom)

    for tile_x in range(columns):
        column_directory = output / "tiles" / level_directory / str(tile_x)
        column_directory.mkdir(parents=True, exist_ok=True)
        for tile_y in range(rows):
            left = tile_x * TILE_SIZE
            top = tile_y * TILE_SIZE
            right = min(left + TILE_SIZE, width)
            bottom = min(top + TILE_SIZE, height)
            crop = resized.crop((left, top, right, bottom)).convert("RGB")

            if crop.size != (TILE_SIZE, TILE_SIZE):
                padded = Image.new("RGB", (TILE_SIZE, TILE_SIZE), (2, 6, 23))
                padded.paste(crop, (0, 0))
                crop = padded

            crop.save(
                column_directory / f"{tile_y}.webp",
                "WEBP",
                quality=WEBP_QUALITY,
                method=6,
            )

    if resized is not source:
        resized.close()

    return {
        "zoom": zoom,
        "directory": level_directory,
        "width": width,
        "height": height,
        "columns": columns,
        "rows": rows,
        "tileCount": columns * rows,
    }


def generate_pyramid(source_path: Path, output_path: Path) -> dict[str, object]:
    source_path = source_path.resolve()
    output_path = output_path.resolve()
    if not source_path.is_file():
        raise FileNotFoundError(f"Mapa de origem não encontrado: {source_path}")
    if output_path == PROJECT_ROOT.resolve() or PROJECT_ROOT.resolve() not in output_path.parents:
        raise ValueError("A saída precisa permanecer dentro da pasta do projeto.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_root = Path(tempfile.mkdtemp(prefix="continent-tiles-", dir=output_path.parent))
    temporary_output = temporary_root / output_path.name
    temporary_output.mkdir(parents=True)

    try:
        with Image.open(source_path) as opened:
            source = opened.convert("RGB")
            levels = [
                generate_level(source, zoom, temporary_output)
                for zoom in range(MIN_NATIVE_ZOOM, MAX_NATIVE_ZOOM + 1)
            ]
            source.close()

        manifest = {
            "schemaVersion": 1,
            "id": "nolan-kotulan-the-continent",
            "source": "../continent.png",
            "format": "webp",
            "quality": WEBP_QUALITY,
            "tileSize": TILE_SIZE,
            "originalWidth": levels[-1]["width"],
            "originalHeight": levels[-1]["height"],
            "minNativeZoom": MIN_NATIVE_ZOOM,
            "maxNativeZoom": MAX_NATIVE_ZOOM,
            "urlTemplate": "img/maps/continent/tiles/{z}/{x}/{y}.webp",
            "levels": levels,
        }
        (temporary_output / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        if output_path.exists():
            shutil.rmtree(output_path)
        temporary_output.replace(output_path)
        return manifest
    finally:
        shutil.rmtree(temporary_root, ignore_errors=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera blocos WebP para o mapa visual do Continente.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    arguments = parser.parse_args()
    manifest = generate_pyramid(arguments.source, arguments.output)
    tile_count = sum(int(level["tileCount"]) for level in manifest["levels"])
    print(
        f"Mapa dividido em {tile_count} blocos, "
        f"de zoom {manifest['minNativeZoom']} a {manifest['maxNativeZoom']}."
    )


if __name__ == "__main__":
    main()
