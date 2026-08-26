const CRAFTING_ITEM_ALIASES = Object.freeze({
    alcoolanao: 'espiritoanaoalcool',
    espiritoanao: 'espiritoanaoalcool',
    frutabalisa: 'frutadebalisa',
    heleboro: 'heleboropetalas',
    sanguecarnical: 'sanguedecarnical'
});

const CRAFTING_CATEGORY_LABELS = Object.freeze({
    all: 'Todas',
    weapons: 'Armas',
    armor: 'Armaduras',
    alchemy: 'Alquimia',
    materials: 'Materiais'
});

let craftingSearch = '';
let craftingOnlyAvailable = false;
let craftingCategoryFilter = 'all';
let craftingCategoryMenuOpen = false;
let pendingCraftingRecipe = null;
let pendingTransferItemId = null;

function normalizeCraftingName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
        .replace(/[^a-z0-9]+/g, '');
}

function escapeCraftingHtml(value) {
    if (typeof window.escapeEquipmentHtml === 'function') {
        return window.escapeEquipmentHtml(value);
    }

    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getCraftingCatalogIndex() {
    return new Map(predefinedItems.map(item => [normalizeCraftingName(item.name), item]));
}

function resolveCraftingIngredient(name) {
    const catalog = getCraftingCatalogIndex();
    const normalized = normalizeCraftingName(name);
    const canonical = CRAFTING_ITEM_ALIASES[normalized] || normalized;
    return catalog.get(canonical) || null;
}

function parseCraftingRecipeLine(rawLine) {
    const original = String(rawLine || '').trim();
    if (!original || original === '?') {
        return { unknown: Boolean(original), original };
    }

    const difficultyMatch = original.match(/\b(?:ND|CD)\s*:?\s*(\d+)/i);
    const difficulty = difficultyMatch ? Math.max(0, Number(difficultyMatch[1]) || 0) : 0;
    const cleanLine = original
        .replace(/\s*[([]?\s*(?:ND|CD)\s*:?\s*\d+\s*[)\]]?/ig, '')
        .replace(/[.]$/, '')
        .trim();
    const [ingredientText, outputText = ''] = cleanLine.split(/\s+cria\s+/i);
    const quantityMatch = ingredientText.match(/^(\d+)\s*x\s+(.+)$/i);
    const ingredientQuantity = quantityMatch ? Math.max(1, Number(quantityMatch[1]) || 1) : 1;
    const ingredientName = (quantityMatch?.[2] || ingredientText).trim();
    const outputMatch = outputText.match(/^(\d+)\s*x?\s*(.+)$/i);

    return {
        unknown: false,
        original,
        difficulty,
        ingredientName,
        ingredientQuantity,
        outputQuantity: outputMatch ? Math.max(1, Number(outputMatch[1]) || 1) : 1,
        outputName: outputMatch?.[2]?.trim() || ''
    };
}

function buildCraftingRecipe(product) {
    const rawLines = (Array.isArray(product?.recipe) ? product.recipe : [])
        .map(line => String(line || '').trim())
        .filter(Boolean);
    if (!rawLines.length) return null;

    const parsedLines = rawLines.map(parseCraftingRecipeLine);
    const unknownLines = parsedLines.filter(line => line.unknown);
    const missingIngredients = [];
    const ingredientsById = new Map();
    let outputQuantity = Math.max(1, Number(product.craftYield) || 1);
    let difficulty = Math.max(0, Number(product.craftingDifficulty ?? product.craftDifficulty) || 0);

    parsedLines.filter(line => !line.unknown).forEach(line => {
        outputQuantity = Math.max(outputQuantity, line.outputQuantity || 1);
        difficulty = Math.max(difficulty, line.difficulty || 0);

        const item = resolveCraftingIngredient(line.ingredientName);
        if (!item) {
            missingIngredients.push(line.ingredientName);
            return;
        }

        const existing = ingredientsById.get(item.id);
        if (existing) {
            existing.quantity += line.ingredientQuantity;
        } else {
            ingredientsById.set(item.id, {
                item,
                quantity: line.ingredientQuantity,
                recipeName: line.ingredientName
            });
        }
    });

    return {
        product,
        ingredients: [...ingredientsById.values()],
        outputQuantity,
        difficulty,
        unknownLines: unknownLines.map(line => line.original),
        missingIngredients: [...new Set(missingIngredients)],
        complete: unknownLines.length === 0 && missingIngredients.length === 0
    };
}

function getCraftingRecipes() {
    return predefinedItems
        .map(buildCraftingRecipe)
        .filter(Boolean)
        .sort((a, b) => a.product.name.localeCompare(b.product.name, 'pt-BR'));
}

function getCraftingRecipeCategory(recipeOrProduct) {
    const product = recipeOrProduct?.product || recipeOrProduct || {};
    const explicitCategory = String(product.craftingCategory || '').toLowerCase();

    if (Object.hasOwn(CRAFTING_CATEGORY_LABELS, explicitCategory) && explicitCategory !== 'all') {
        return explicitCategory;
    }

    if (product.type === 'weapon') return 'weapons';
    if (product.type === 'armor' || product.equipmentSlot) return 'armor';
    if (product.craftingMaterial === true || product.category === 'misc') return 'materials';
    return 'alchemy';
}

function getInventoryStackQuantity(item) {
    if (!item) return 0;
    return item.id === 'coroa'
        ? Math.max(0, Number(item.moneyValue) || 0)
        : Math.max(0, Number(item.quantity) || 0);
}

function getCraftingConsumableQuantity(itemId) {
    const item = inventory.find(entry => String(entry.id) === String(itemId));
    const total = getInventoryStackQuantity(item);
    const reserved = window.isItemEquippedForCurrentOwner?.(itemId) ? 1 : 0;
    return Math.max(0, total - reserved);
}

function getRecipeCraftingState(recipe) {
    const ingredientState = recipe.ingredients.map(ingredient => {
        const owned = getInventoryStackQuantity(
            inventory.find(entry => String(entry.id) === String(ingredient.item.id))
        );
        const available = getCraftingConsumableQuantity(ingredient.item.id);
        return { ...ingredient, owned, available };
    });
    const maxBatches = recipe.complete && ingredientState.length
        ? Math.max(0, Math.min(...ingredientState.map(ingredient =>
            Math.floor(ingredient.available / ingredient.quantity)
        )))
        : 0;

    return { ...recipe, ingredients: ingredientState, maxBatches };
}

function updateCraftingSearch(value) {
    craftingSearch = String(value || '');
    renderCraftingRecipeList();
}

function toggleCraftingAvailableFilter() {
    craftingOnlyAvailable = !craftingOnlyAvailable;
    const button = document.getElementById('craftingAvailableFilter');
    if (button) {
        button.classList.toggle('is-active', craftingOnlyAvailable);
        button.textContent = craftingOnlyAvailable ? '✓ Posso criar' : 'Todos';
    }
    renderCraftingRecipeList();
}

function syncCraftingCategoryMenu() {
    const menu = document.getElementById('craftingCategoryMenu');
    const button = document.getElementById('craftingRecipeCountButton');

    if (menu) menu.hidden = !craftingCategoryMenuOpen;
    if (button) button.setAttribute('aria-expanded', String(craftingCategoryMenuOpen));

    document.querySelectorAll('[data-crafting-category]').forEach(categoryButton => {
        const active = categoryButton.dataset.craftingCategory === craftingCategoryFilter;
        categoryButton.classList.toggle('is-active', active);
        categoryButton.setAttribute('aria-pressed', String(active));
    });
}

function toggleCraftingCategoryMenu(event) {
    event?.stopPropagation();
    craftingCategoryMenuOpen = !craftingCategoryMenuOpen;
    syncCraftingCategoryMenu();
}

function setCraftingCategoryFilter(category) {
    craftingCategoryFilter = Object.hasOwn(CRAFTING_CATEGORY_LABELS, category) ? category : 'all';
    craftingCategoryMenuOpen = false;
    syncCraftingCategoryMenu();
    renderCraftingRecipeList();
}

function renderCraftingScreen(container) {
    if (!container) return;

    const owner = window.getCharacterCollectionOwner?.();
    const ownerName = window.getCharacterCollectionContextInfo?.().name || 'personagem selecionado';

    if (!owner) {
        container.innerHTML = `
            <section class="crafting-screen" aria-label="Criação e alquimia">
                <div class="crafting-heading">
                    <div>
                        <span>⚒️ OFICINA</span>
                        <strong>Criação e Alquimia</strong>
                    </div>
                </div>
                <div class="crafting-empty">
                    <strong>Selecione um personagem.</strong>
                    <span>Adicione um participante ao combate ou abra uma ficha salva para consultar suas receitas.</span>
                </div>
            </section>
        `;
        return;
    }

    container.innerHTML = `
        <section class="crafting-screen" aria-label="Criação e alquimia de ${escapeCraftingHtml(ownerName)}">
            <div class="crafting-heading">
                <div>
                    <span>⚒️ OFICINA</span>
                    <strong>Criação e Alquimia</strong>
                    <small>Inventário de ${escapeCraftingHtml(ownerName)}</small>
                </div>
                <div class="crafting-filter-anchor">
                    <button id="craftingRecipeCountButton" type="button" class="crafting-count" aria-haspopup="true" aria-expanded="false" onclick="toggleCraftingCategoryMenu(event)">
                        <span id="craftingRecipeCount"></span>
                        <span aria-hidden="true">⌄</span>
                    </button>
                    <div id="craftingCategoryMenu" class="crafting-category-menu" role="group" aria-label="Filtrar receitas por categoria" hidden>
                        ${Object.entries(CRAFTING_CATEGORY_LABELS).map(([category, label]) => `
                            <button type="button" data-crafting-category="${category}" aria-pressed="${category === craftingCategoryFilter}" class="${category === craftingCategoryFilter ? 'is-active' : ''}" onclick="setCraftingCategoryFilter('${category}')">${label}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="crafting-toolbar">
                <input id="craftingSearchInput" value="${escapeCraftingHtml(craftingSearch)}" oninput="updateCraftingSearch(this.value)" placeholder="Buscar receita..." aria-label="Buscar receita">
                <button id="craftingAvailableFilter" type="button" class="${craftingOnlyAvailable ? 'is-active' : ''}" onclick="toggleCraftingAvailableFilter()">
                    ${craftingOnlyAvailable ? '✓ Posso criar' : 'Todos'}
                </button>
            </div>
            <div id="craftingRecipeList" class="crafting-recipe-list"></div>
        </section>
    `;
    syncCraftingCategoryMenu();
    renderCraftingRecipeList();
}

function renderCraftingRecipeList() {
    const list = document.getElementById('craftingRecipeList');
    if (!list) return;

    const search = normalizeCraftingName(craftingSearch);
    const recipes = getCraftingRecipes()
        .map(getRecipeCraftingState)
        .filter(recipe => !search || normalizeCraftingName(recipe.product.name).includes(search))
        .filter(recipe => craftingCategoryFilter === 'all' || getCraftingRecipeCategory(recipe) === craftingCategoryFilter)
        .filter(recipe => !craftingOnlyAvailable || recipe.maxBatches > 0);
    const count = document.getElementById('craftingRecipeCount');
    if (count) {
        const categoryLabel = craftingCategoryFilter === 'all'
            ? `receita${recipes.length === 1 ? '' : 's'}`
            : CRAFTING_CATEGORY_LABELS[craftingCategoryFilter];
        count.textContent = `${recipes.length} ${categoryLabel}`;
    }

    if (!recipes.length) {
        const emptyMessage = craftingOnlyAvailable
            ? 'Transfira ou adicione ingredientes ao inventário.'
            : craftingCategoryFilter !== 'all' && !search
                ? `${CRAFTING_CATEGORY_LABELS[craftingCategoryFilter]} ainda não possui receitas cadastradas.`
                : 'Altere a busca para consultar outras receitas.';
        list.innerHTML = `
            <div class="crafting-empty">
                <strong>Nenhuma receita encontrada.</strong>
                <span>${emptyMessage}</span>
            </div>
        `;
        return;
    }

    list.innerHTML = recipes.map(recipe => {
        const blockedReason = recipe.unknownLines.length
            ? 'Receita ainda desconhecida'
            : recipe.missingIngredients.length
                ? 'Ingredientes não cadastrados'
                : 'Ingredientes insuficientes';
        return `
            <article class="crafting-recipe-card ${recipe.maxBatches > 0 ? 'can-craft' : ''}">
                <header>
                    ${renderIcon(recipe.product.icon, 'crafting-product-icon')}
                    <div>
                        <strong>${escapeCraftingHtml(recipe.product.name)}</strong>
                        <small>Produz ${recipe.outputQuantity} por lote${recipe.difficulty ? ` · ND ${recipe.difficulty}` : ''}</small>
                    </div>
                    <span class="crafting-capacity">${recipe.maxBatches > 0 ? `${recipe.maxBatches} lote${recipe.maxBatches === 1 ? '' : 's'}` : 'Indisponível'}</span>
                </header>
                <div class="crafting-ingredients">
                    ${recipe.ingredients.map(ingredient => `
                        <div class="${ingredient.available >= ingredient.quantity ? 'has-ingredient' : 'missing-ingredient'}">
                            <span>${ingredient.available >= ingredient.quantity ? '✓' : '○'} ${escapeCraftingHtml(ingredient.item.name)}</span>
                            <strong>${ingredient.available}/${ingredient.quantity}</strong>
                        </div>
                    `).join('')}
                    ${recipe.unknownLines.length ? '<div class="unknown-ingredient"><span>?</span><strong>Ingredientes desconhecidos</strong></div>' : ''}
                    ${recipe.missingIngredients.map(name => `<div class="unknown-ingredient"><span>!</span><strong>${escapeCraftingHtml(name)}</strong></div>`).join('')}
                </div>
                <button type="button" ${recipe.maxBatches > 0 ? '' : 'disabled'} onclick="openCraftingModal('${escapeCraftingHtml(recipe.product.id)}')">
                    ${recipe.maxBatches > 0 ? 'Criar' : blockedReason}
                </button>
            </article>
        `;
    }).join('');
}

function getCraftingRollMode() {
    if (typeof appPreferences !== 'undefined') {
        return appPreferences.rollModes?.crafting || 'manual';
    }

    try {
        return JSON.parse(localStorage.getItem('dnd_app_preferences') || '{}').rollModes?.crafting || 'manual';
    } catch {
        return 'manual';
    }
}

function openCraftingModal(productId) {
    if (!window.getCharacterCollectionOwner?.()) {
        showToast('Selecione um personagem antes de criar um item.');
        return;
    }

    const recipe = getCraftingRecipes().find(entry => String(entry.product.id) === String(productId));
    const state = recipe ? getRecipeCraftingState(recipe) : null;
    if (!state || state.maxBatches <= 0) {
        showToast('Ingredientes insuficientes para esta receita.');
        return;
    }

    pendingCraftingRecipe = state;
    document.getElementById('craftingModalTitle').textContent = state.product.name;
    document.getElementById('craftingModalContext').textContent =
        `Até ${state.maxBatches} lote${state.maxBatches === 1 ? '' : 's'} · ${state.outputQuantity} unidade${state.outputQuantity === 1 ? '' : 's'} por lote`;
    const quantityInput = document.getElementById('craftingQuantityInput');
    quantityInput.value = 1;
    quantityInput.max = state.maxBatches;

    const testArea = document.getElementById('craftingTestArea');
    const manualField = document.getElementById('craftingManualResultField');
    const autoField = document.getElementById('craftingAutoBonusField');
    const difficulty = document.getElementById('craftingDifficultyLabel');
    const mode = getCraftingRollMode();
    testArea.style.display = state.difficulty > 0 ? 'grid' : 'none';
    difficulty.textContent = state.difficulty > 0 ? `Teste de criação · ND ${state.difficulty}` : '';
    manualField.style.display = state.difficulty > 0 && mode === 'manual' ? 'grid' : 'none';
    autoField.style.display = state.difficulty > 0 && mode === 'auto' ? 'grid' : 'none';
    document.getElementById('craftingManualResultInput').value = '';
    document.getElementById('craftingAutoBonusInput').value = 0;
    updateCraftingModalSummary();
    document.getElementById('craftingModal').style.display = 'flex';
}

function updateCraftingModalSummary() {
    if (!pendingCraftingRecipe) return;
    const batches = Math.min(
        pendingCraftingRecipe.maxBatches,
        Math.max(1, Number(document.getElementById('craftingQuantityInput')?.value) || 1)
    );
    document.getElementById('craftingOutputPreview').textContent =
        `Resultado: ${batches * pendingCraftingRecipe.outputQuantity}x ${pendingCraftingRecipe.product.name}`;
}

function closeCraftingModal() {
    pendingCraftingRecipe = null;
    const modal = document.getElementById('craftingModal');
    if (modal) modal.style.display = 'none';
}

function consumeCraftingIngredient(itemId, quantity) {
    const item = inventory.find(entry => String(entry.id) === String(itemId));
    if (!item) return;

    item.quantity = Math.max(0, Number(item.quantity) || 0) - quantity;
    if (item.quantity <= 0) inventory = inventory.filter(entry => String(entry.id) !== String(itemId));
}

function addCraftingProduct(product, quantity) {
    const existing = inventory.find(entry => String(entry.id) === String(product.id));
    if (existing) {
        existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
        return;
    }

    inventory.push({ ...JSON.parse(JSON.stringify(product)), quantity });
}

function registerCraftingFailure(owner, recipe, batches, rollDetail) {
    window.addCombatHistoryEntry?.(
        `${owner.name}: Falhou ao criar ${recipe.product.name}`,
        `${rollDetail}\nLotes tentados: ${batches}\nIngredientes preservados.`,
        {
            type: 'crafting',
            source: { id: owner.id, name: owner.name },
            participants: [{ id: owner.id, name: owner.name }]
        }
    );
}

function confirmCrafting() {
    const owner = window.getCharacterCollectionOwner?.();
    if (!owner || !pendingCraftingRecipe) {
        closeCraftingModal();
        showToast('O personagem da criação não está mais disponível.');
        return;
    }

    const refreshed = getCraftingRecipes().find(
        recipe => String(recipe.product.id) === String(pendingCraftingRecipe.product.id)
    );
    const recipe = refreshed ? getRecipeCraftingState(refreshed) : null;
    const batches = Math.min(
        recipe?.maxBatches || 0,
        Math.max(1, Number(document.getElementById('craftingQuantityInput')?.value) || 1)
    );
    if (!recipe || batches <= 0) {
        closeCraftingModal();
        showToast('Os ingredientes mudaram e a receita não pode mais ser produzida.');
        renderInventory();
        return;
    }

    let rollDetail = 'Sem teste necessário.';
    if (recipe.difficulty > 0) {
        if (getCraftingRollMode() === 'auto') {
            const bonus = Number(document.getElementById('craftingAutoBonusInput')?.value) || 0;
            const die = Math.floor(Math.random() * 10) + 1;
            const total = die + bonus;
            rollDetail = `Teste automático: 1d10 (${die}) ${bonus >= 0 ? '+' : '−'} ${Math.abs(bonus)} = ${total} contra ND ${recipe.difficulty}`;
            if (total < recipe.difficulty) {
                registerCraftingFailure(owner, recipe, batches, rollDetail);
                closeCraftingModal();
                showToast(`❌ Falha na criação: ${total} contra ND ${recipe.difficulty}.`);
                return;
            }
        } else {
            const resultInput = document.getElementById('craftingManualResultInput');
            const total = Number(resultInput?.value);
            if (!Number.isFinite(total) || String(resultInput?.value).trim() === '') {
                showToast('Informe o resultado total do teste de criação.');
                resultInput?.focus();
                return;
            }
            rollDetail = `Teste manual: ${total} contra ND ${recipe.difficulty}`;
            if (total < recipe.difficulty) {
                registerCraftingFailure(owner, recipe, batches, rollDetail);
                closeCraftingModal();
                showToast(`❌ Falha na criação: ${total} contra ND ${recipe.difficulty}.`);
                return;
            }
        }
    }

    const outputQuantity = batches * recipe.outputQuantity;
    const ingredientDetail = recipe.ingredients
        .map(ingredient => `${batches * ingredient.quantity}x ${ingredient.item.name}`)
        .join(', ');
    const mutate = () => {
        recipe.ingredients.forEach(ingredient => {
            consumeCraftingIngredient(ingredient.item.id, batches * ingredient.quantity);
        });
        addCraftingProduct(recipe.product, outputQuantity);
        saveInventory();
    };
    const label = `${owner.name}: Criou ${outputQuantity}x ${recipe.product.name}`;
    const detail = `Ingredientes: ${ingredientDetail}\n${rollDetail}`;
    const metadata = {
        type: 'crafting',
        source: { id: owner.id, name: owner.name },
        participants: [{ id: owner.id, name: owner.name }]
    };

    if (typeof window.trackEquipmentAction === 'function') {
        window.trackEquipmentAction(label, mutate, detail, metadata);
    } else {
        mutate();
        window.addCombatHistoryEntry?.(label, detail, metadata);
    }

    closeCraftingModal();
    selectedInventoryItemId = recipe.product.id;
    renderInventory();
    showToast(`⚒️ ${outputQuantity}x ${recipe.product.name} criado com sucesso.`);
}

function getInventoryTransferTargets(owner) {
    const combatTargets = Array.isArray(combatants) ? combatants : [];
    const sheetTargets = typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)
        ? characterSheets
        : [];
    const candidates = combatTargets.length ? combatTargets : sheetTargets;

    return candidates
        .filter(target => target && target !== owner && String(target.id) !== String(owner?.id));
}

function getTransferableItemQuantity(item) {
    const total = getInventoryStackQuantity(item);
    if (item?.id === 'coroa') return total;
    return Math.max(0, total - (window.isItemEquippedForCurrentOwner?.(item.id) ? 1 : 0));
}

function openTransferItemModal() {
    const owner = window.getCharacterCollectionOwner?.();
    const item = inventory.find(entry => String(entry.id) === String(selectedInventoryItemId));
    if (!owner || !item) {
        showToast('Selecione um item para transferir.');
        return;
    }

    const targets = getInventoryTransferTargets(owner);
    if (!targets.length) {
        showToast('Adicione outro participante ao combate para realizar a transferência.');
        return;
    }

    const transferable = getTransferableItemQuantity(item);
    if (transferable <= 0) {
        showToast('Desequipe o item antes de transferir a última unidade.');
        return;
    }

    pendingTransferItemId = item.id;
    document.getElementById('transferItemName').textContent = item.name;
    document.getElementById('transferItemContext').textContent =
        `${owner.name} pode transferir até ${transferable} unidade${transferable === 1 ? '' : 's'}.`;
    const quantity = document.getElementById('transferQuantityInput');
    quantity.value = 1;
    quantity.max = transferable;
    const select = document.getElementById('transferTargetSelect');
    select.replaceChildren();
    targets.forEach(target => {
        const option = document.createElement('option');
        option.value = String(target.id);
        option.textContent = target.name;
        select.append(option);
    });
    document.getElementById('transferItemModal').style.display = 'flex';
}

function closeTransferItemModal() {
    pendingTransferItemId = null;
    const modal = document.getElementById('transferItemModal');
    if (modal) modal.style.display = 'none';
}

function confirmItemTransfer() {
    const owner = window.getCharacterCollectionOwner?.();
    const item = inventory.find(entry => String(entry.id) === String(pendingTransferItemId));
    const targetId = document.getElementById('transferTargetSelect')?.value;
    const target = combatants.find(entry => String(entry.id) === String(targetId));
    const requested = Math.max(1, Number(document.getElementById('transferQuantityInput')?.value) || 1);
    const transferable = getTransferableItemQuantity(item);
    const quantity = Math.min(requested, transferable);
    if (!owner || !item || !target || quantity <= 0) {
        closeTransferItemModal();
        showToast('Não foi possível concluir a transferência.');
        return;
    }

    target.inventory ||= [];
    const sourceName = owner.name;
    const itemName = item.name;
    const mutate = () => {
        const targetItem = target.inventory.find(entry => String(entry.id) === String(item.id));

        if (item.id === 'coroa') {
            item.moneyValue = Math.max(0, Number(item.moneyValue) || 0) - quantity;
            if (targetItem) targetItem.moneyValue = Math.max(0, Number(targetItem.moneyValue) || 0) + quantity;
            else target.inventory.push({ ...JSON.parse(JSON.stringify(item)), moneyValue: quantity });
        } else {
            item.quantity = Math.max(0, Number(item.quantity) || 0) - quantity;
            if (targetItem) targetItem.quantity = Math.max(0, Number(targetItem.quantity) || 0) + quantity;
            else target.inventory.push({ ...JSON.parse(JSON.stringify(item)), quantity });
            if (item.quantity <= 0) inventory = inventory.filter(entry => String(entry.id) !== String(item.id));
        }

        saveInventory();
        window.savePlayersToStorage?.();
        if (!combatants.includes(target) && typeof persistCharacterSheets === 'function') {
            persistCharacterSheets();
        }
    };
    const label = `${sourceName} → ${target.name}: Transferiu ${quantity}x ${itemName}`;
    const detail = `${sourceName}: -${quantity}\n${target.name}: +${quantity}`;
    const metadata = {
        type: 'transfer',
        source: { id: owner.id, name: sourceName },
        target: { id: target.id, name: target.name },
        participants: [
            { id: owner.id, name: sourceName },
            { id: target.id, name: target.name }
        ]
    };

    if (combatants.includes(owner) && combatants.includes(target) && typeof window.trackEquipmentAction === 'function') {
        window.trackEquipmentAction(label, mutate, detail, metadata);
    } else {
        mutate();
        window.addCombatHistoryEntry?.(label, detail, metadata);
    }

    closeTransferItemModal();
    if (!inventory.some(entry => String(entry.id) === String(selectedInventoryItemId))) {
        selectedInventoryItemId = null;
    }
    renderInventory();
    showToast(`🔄 ${quantity}x ${itemName} transferido para ${target.name}.`);
}

window.normalizeCraftingName = normalizeCraftingName;
window.parseCraftingRecipeLine = parseCraftingRecipeLine;
window.buildCraftingRecipe = buildCraftingRecipe;
window.getCraftingRecipes = getCraftingRecipes;
window.getCraftingRecipeCategory = getCraftingRecipeCategory;
window.getRecipeCraftingState = getRecipeCraftingState;
window.renderCraftingScreen = renderCraftingScreen;
window.renderCraftingRecipeList = renderCraftingRecipeList;
window.updateCraftingSearch = updateCraftingSearch;
window.toggleCraftingAvailableFilter = toggleCraftingAvailableFilter;
window.toggleCraftingCategoryMenu = toggleCraftingCategoryMenu;
window.setCraftingCategoryFilter = setCraftingCategoryFilter;
window.openCraftingModal = openCraftingModal;
window.updateCraftingModalSummary = updateCraftingModalSummary;
window.closeCraftingModal = closeCraftingModal;
window.confirmCrafting = confirmCrafting;
window.openTransferItemModal = openTransferItemModal;
window.closeTransferItemModal = closeTransferItemModal;
window.confirmItemTransfer = confirmItemTransfer;

document.addEventListener('click', event => {
    if (!craftingCategoryMenuOpen || event.target.closest('.crafting-filter-anchor')) return;
    craftingCategoryMenuOpen = false;
    syncCraftingCategoryMenu();
});
