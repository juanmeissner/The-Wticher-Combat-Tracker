"""Leitura mínima de planilhas XLSX para auditorias de dados do projeto."""

from __future__ import annotations

import json
import argparse
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    return [
        "".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t"))
        for item in root.findall(f"{{{MAIN_NS}}}si")
    ]


def resolve_sheet_path(archive: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships.findall(f"{{{PACKAGE_REL_NS}}}Relationship")
    }

    for sheet in workbook.find(f"{{{MAIN_NS}}}sheets") or []:
        if sheet.attrib.get("name") == sheet_name:
            relationship_id = sheet.attrib[f"{{{REL_NS}}}id"]
            target = targets[relationship_id].lstrip("/")
            return target if target.startswith("xl/") else f"xl/{target}"

    raise KeyError(f"Aba não encontrada: {sheet_name}")


def column_index(reference: str) -> int:
    letters = "".join(character for character in reference if character.isalpha())
    index = 0
    for letter in letters:
        index = index * 26 + ord(letter.upper()) - ord("A") + 1
    return max(0, index - 1)


def read_sheet(workbook_path: Path, sheet_name: str) -> list[list[object]]:
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet = ET.fromstring(archive.read(resolve_sheet_path(archive, sheet_name)))
        rows: list[list[object]] = []

        for row in sheet.findall(f".//{{{MAIN_NS}}}row"):
            values: list[object] = []
            for cell in row.findall(f"{{{MAIN_NS}}}c"):
                index = column_index(cell.attrib.get("r", "A1"))
                while len(values) <= index:
                    values.append("")

                cell_type = cell.attrib.get("t")
                value_node = cell.find(f"{{{MAIN_NS}}}v")
                if cell_type == "inlineStr":
                    value = "".join(
                        node.text or "" for node in cell.iter(f"{{{MAIN_NS}}}t")
                    )
                elif value_node is None:
                    value = ""
                elif cell_type == "s":
                    value = shared_strings[int(value_node.text or 0)]
                else:
                    raw_value = value_node.text or ""
                    try:
                        numeric = float(raw_value)
                        value = int(numeric) if numeric.is_integer() else numeric
                    except ValueError:
                        value = raw_value

                values[index] = value

            rows.append(values)

        return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    parser.add_argument("sheet")
    parser.add_argument("--start", type=int, default=1, help="Primeira linha (base 1)")
    parser.add_argument("--end", type=int, help="Última linha (base 1)")
    parser.add_argument("--search", help="Mantém somente linhas que contenham o texto")
    args = parser.parse_args()

    rows = read_sheet(args.workbook, args.sheet)
    start = max(1, args.start)
    end = min(len(rows), args.end or len(rows))
    selected = rows[start - 1:end]
    if args.search:
        search = args.search.casefold()
        selected = [
            row for row in selected
            if any(search in str(value).casefold() for value in row)
        ]

    print(
        json.dumps(
            selected,
            ensure_ascii=False,
            indent=2,
        )
    )
