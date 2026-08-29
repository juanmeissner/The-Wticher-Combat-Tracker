"""Cruza os equipamentos do aplicativo com os pesos da aba Items."""

from __future__ import annotations

import importlib.util
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path


def load_reader(script_path: Path):
    spec = importlib.util.spec_from_file_location("xlsx_reader", script_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def normalize(value: object) -> str:
    text = unicodedata.normalize("NFD", str(value or "")).casefold()
    text = "".join(character for character in text if not unicodedata.combining(character))
    return re.sub(r"[^a-z0-9]+", "", text)


def parse_weight(value: object) -> float | None:
    try:
        return float(str(value).replace(",", "."))
    except ValueError:
        return None


def app_equipment_names(items_path: Path) -> list[tuple[str, str]]:
    source = items_path.read_text(encoding="utf-8")
    blocks = re.findall(r"\{[^{}]*?\n\s*\},", source, re.DOTALL)
    names: list[tuple[str, str]] = []
    for block in blocks:
        if "category: 'equipment'" not in block:
            continue
        name_match = re.search(r"name:\s*'([^']+)'", block)
        id_match = re.search(r"id:\s*'([^']+)'", block)
        if name_match and id_match:
            names.append((id_match.group(1), name_match.group(1)))
    return names


def sheet_equipment(rows: list[list[object]]) -> list[tuple[str, float]]:
    result: list[tuple[str, float]] = []
    for row in rows[1:]:
        for name_index, weight_index in ((0, 10), (13, 23)):
            name = str(row[name_index] if len(row) > name_index else "").strip()
            weight = parse_weight(row[weight_index] if len(row) > weight_index else "")
            if name and name.casefold() != "desequipado" and weight is not None:
                result.append((name, weight))
    return result


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Uso: audit-equipment-weights.py <arquivo.xlsx> <items.js>")

    root = Path(__file__).resolve().parent
    reader = load_reader(root / "extract-xlsx-sheet.py")
    rows = reader.read_sheet(Path(sys.argv[1]), "Items")
    sheet_items = sheet_equipment(rows)

    for app_id, app_name in app_equipment_names(Path(sys.argv[2])):
        normalized_name = normalize(app_name)
        exact = next((entry for entry in sheet_items if normalize(entry[0]) == normalized_name), None)
        if exact:
            print(f"{app_id}\t{app_name}\t{exact[1]:g}\texato\t{exact[0]}")
            continue

        ranked = sorted(
            sheet_items,
            key=lambda entry: SequenceMatcher(None, normalized_name, normalize(entry[0])).ratio(),
            reverse=True,
        )
        candidate = ranked[0] if ranked else ("", 0)
        confidence = SequenceMatcher(None, normalized_name, normalize(candidate[0])).ratio()
        status = "aproximado" if confidence >= 0.72 else "ausente"
        print(f"{app_id}\t{app_name}\t{candidate[1]:g}\t{status}:{confidence:.2f}\t{candidate[0]}")


if __name__ == "__main__":
    main()
