const XLSX_LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';
let xlsxLibraryPromise = null;

function ensureXlsxLibrary() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxLibraryPromise) return xlsxLibraryPromise;

    xlsxLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = XLSX_LIBRARY_URL;
        script.async = true;
        script.onload = () => window.XLSX
            ? resolve(window.XLSX)
            : reject(new Error('A biblioteca de planilhas não foi inicializada.'));
        script.onerror = () => reject(new Error('Não foi possível carregar a biblioteca de planilhas.'));
        document.head.appendChild(script);
    }).catch(error => {
        xlsxLibraryPromise = null;
        throw error;
    });

    return xlsxLibraryPromise;
}

async function exportAbilitiesToExcel() {
    let spreadsheet;
    try {
        window.showToast?.('Preparando a exportação das habilidades...');
        spreadsheet = await ensureXlsxLibrary();
    } catch (error) {
        window.showToast?.(error?.message || 'Não foi possível preparar a planilha.');
        return false;
    }

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


    const worksheet = spreadsheet.utils.json_to_sheet(rows, {

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


    const workbook = spreadsheet.utils.book_new();

    spreadsheet.utils.book_append_sheet(
        workbook,
        worksheet,
        "Abilities"
    );

    spreadsheet.writeFile(
        workbook,
        "Abilities.xlsx"
    );

    return true;

}

window.exportAbilitiesToExcel = exportAbilitiesToExcel;
window.ensureXlsxLibrary = ensureXlsxLibrary;



function showExportButton() {

    const btn = document.getElementById("exportAbilitiesBtn");

    if (!btn) return;

    btn.style.display =
        window.innerWidth >= 1024
            ? "flex"
            : "none";
}

window.showExportButton = showExportButton;
