"""Gera o catálogo local de descrições das habilidades profissionais.

Uso:
    python scripts/import-professional-skills.py caminho/para/regras.xlsx
    python scripts/import-professional-skills.py caminho/para/regras.xlsx --stdout

A planilha é somente uma fonte de manutenção. O aplicativo continua totalmente
local e carrega o JavaScript gerado, sem depender do Google Sheets em execução.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from openpyxl import load_workbook


TREE_DESCRIPTION_COLUMNS = {
    "noble": "C",
    "artisan": "E",
    "brawler": "G",
    "doctor": "I",
    "mage": "K",
    "man_at_arms": "M",
    "merchant": "O",
    "melitele": "Q",
    "raven_school": "S",
    "lynx_school": "U",
    "wolf_school": "W",
    "griffin_school": "Y",
    "viper_school": "AA",
    "manticore_school": "AC",
    "bear_school": "AE",
    "cat_school": "AG",
    "grey_roads_minstrel": "AI",
    "battlefield_herald": "AK",
    "golden_court_tongue": "AM",
    "professional_assassin": "AO",
    "professional_thief": "AQ",
    "duelist": "AS",
    "swordsman": "AU",
    "archer": "AW",
    "vanguard": "AY",
    "druid": "BA",
    "freya": "BC",
    "eternal_fire": "BE",
}


def normalize_description(value: object) -> str:
    return " ".join(str(value or "").split())


def render_javascript(descriptions: dict[str, list[str]]) -> str:
    lines = [
        "(function initializeProfessionalSkillDescriptions(global) {",
        "    'use strict';",
        "",
        "    const descriptions = Object.freeze({",
    ]

    for tree_id, entries in descriptions.items():
        lines.append(f"        {tree_id}: Object.freeze([")
        for description in entries:
            encoded = json.dumps(description, ensure_ascii=False)
            lines.append(f"            {encoded},")
        lines.append("        ]),")

    lines.extend([
        "    });",
        "",
        "    global.characterProfessionalSkillDescriptions = descriptions;",
        "})(typeof window !== 'undefined' ? window : globalThis);",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    if len(sys.argv) not in {2, 3}:
        raise SystemExit("Informe o caminho do arquivo .xlsx e, opcionalmente, --stdout.")

    print_to_stdout = len(sys.argv) == 3 and sys.argv[2] == "--stdout"
    if len(sys.argv) == 3 and not print_to_stdout:
        raise SystemExit("A única opção aceita é --stdout.")

    workbook_path = Path(sys.argv[1]).resolve()
    project_root = Path(__file__).resolve().parents[1]
    output_path = project_root / "professional-skills-descriptions.js"
    worksheet = load_workbook(workbook_path, read_only=True, data_only=False)["Professions"]

    descriptions = {
        tree_id: [
            normalize_description(worksheet[f"{column}{row}"].value)
            for row in range(2, 12)
        ]
        for tree_id, column in TREE_DESCRIPTION_COLUMNS.items()
    }

    empty_entries = [
        f"{tree_id}[{index}]"
        for tree_id, entries in descriptions.items()
        for index, description in enumerate(entries)
        if not description
    ]
    if empty_entries:
        raise SystemExit(f"Descrições vazias encontradas: {', '.join(empty_entries)}")

    javascript = render_javascript(descriptions)
    if print_to_stdout:
        sys.stdout.reconfigure(encoding="utf-8", newline="\n")
        print(javascript, end="")
        return

    output_path.write_text(javascript, encoding="utf-8", newline="\n")
    print(f"Geradas {sum(map(len, descriptions.values()))} descrições em {output_path}")


if __name__ == "__main__":
    main()
