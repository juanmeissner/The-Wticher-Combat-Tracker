function exportAbilitiesToExcel() {

    const rows = predefinedAbilities.map(a => ({

        name: a.name || "",

        category: a.category || "",

        type: a.type || "",

        profession: a.profession || "",

        description: a.description || "",

        duration: a.duration || "",

        defense: a.defense || "",

        damage: a.damage || "",

        cost: a.cost || "",

        range: a.range || "",

        action: a.action || "",

        unlockCost: a.unlockCost ?? ""

    }));


    const worksheet = XLSX.utils.json_to_sheet(rows, {

        header: [

            "name",
            "category",
            "type",
            "profession",
            "description",
            "duration",
            "defense",
            "damage",
            "cost",
            "range",
            "action",
            "unlockCost"

        ]

    });


    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Abilities"
    );

    XLSX.writeFile(
        workbook,
        "Abilities.xlsx"
    );

}

window.exportAbilitiesToExcel = exportAbilitiesToExcel;



function showExportButton() {

    const btn = document.getElementById("exportAbilitiesBtn");

    if (!btn) return;

    btn.style.display =
        window.innerWidth >= 1024
            ? "flex"
            : "none";
}

window.showExportButton = showExportButton;