(function initializeWorldCommerce(root) {
    'use strict';

    const CATEGORY_LABELS = Object.freeze({
        blacksmith: 'Ferreiro',
        tailor: 'Alfaiate',
        leatherworker: 'Coureiro',
        herbalist: 'Herbalista',
        farmer: 'Fazendeiro',
        food_vendor: 'Comida e bebida',
        alchemist: 'Alquimista',
        artisan: 'Artesão',
        miner: 'Minerador',
        stablemaster: 'Tratador de montarias',
        innkeeper: 'Estalajadeiro',
        general: 'Mercador geral',
        other: 'Outro'
    });
    const RESTOCK_LABELS = Object.freeze({
        manual: 'Somente manual',
        daily: 'Diária',
        weekly: 'Semanal',
        custom: 'Intervalo personalizado'
    });

    let editorNpcId = '';
    let editorDraft = null;
    let activeShop = null;

    function clone(value, fallback = null) {
        try { return JSON.parse(JSON.stringify(value ?? fallback)); } catch { return fallback; }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function getCatalog() {
        return typeof predefinedItems !== 'undefined' && Array.isArray(predefinedItems) ? predefinedItems : [];
    }

    function getCatalogItem(itemId) {
        return getCatalog().find(item => String(item.id) === String(itemId)) || null;
    }

    function getWorldNpc(npcId) {
        return root.worldModel?.getNpc?.(root.worldStore?.getWorld?.(), npcId) || null;
    }

    function getCurrentCampaignMinute() {
        return Number(root.campaignClock?.getSnapshot?.()?.currentMinute) || 0;
    }

    function getRestockIntervalMinutes(merchant) {
        if (merchant?.restockMode === 'daily') return 1440;
        if (merchant?.restockMode === 'weekly') return 10080;
        if (merchant?.restockMode === 'custom') return Math.max(60, Math.floor(Number(merchant.customIntervalMinutes) || 1440));
        return null;
    }

    function calculateDiscountedPrice(price, discountPercent = 0) {
        const basePrice = Math.max(0, Math.round(Number(price) || 0));
        const discount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
        return Math.max(0, Math.round(basePrice * (1 - discount / 100)));
    }

    function calculateBuybackPrice(price, buybackPercent = 50, negotiationPercent = 0) {
        const basePrice = Math.max(0, Math.round(Number(price) || 0));
        const buyback = Math.min(100, Math.max(0, Number(buybackPercent) || 0));
        const negotiation = Math.min(100, Math.max(0, Number(negotiationPercent) || 0));
        return Math.max(0, Math.round(basePrice * (buyback / 100) * (1 + negotiation / 100)));
    }

    function resolveBusinessNegotiation(options = {}) {
        const naturalRoll = Number(options.naturalRoll);
        const skillTotal = Number(options.skillTotal);
        const difficulty = Number(options.difficulty);
        const discountPercent = Math.min(100, Math.max(0, Number(options.discountPercent) || 0));
        if (!Number.isInteger(naturalRoll) || naturalRoll < 1 || naturalRoll > 20) return { valid: false, reason: 'invalid-roll' };
        if (!Number.isFinite(skillTotal) || !Number.isFinite(difficulty) || difficulty < 0) return { valid: false, reason: 'invalid-values' };
        const finalResult = naturalRoll + skillTotal;
        const success = finalResult >= difficulty;
        return {
            valid: true,
            naturalRoll,
            skillTotal,
            difficulty,
            finalResult,
            margin: finalResult - difficulty,
            success,
            critical: naturalRoll === 20,
            luckDiceGained: naturalRoll === 20 ? 1 : 0,
            discountPercent: success ? discountPercent : 0
        };
    }

    function restockMerchant(merchantValue, context = {}) {
        const merchant = root.worldModel?.normalizeMerchant?.(merchantValue) || clone(merchantValue, {});
        if (!merchant) return { merchant: null, changed: false, cycles: 0, itemsAdded: 0, servicesAdded: 0 };
        const force = context.force === true;
        const interval = getRestockIntervalMinutes(merchant);
        const beforeMinute = Number(context.beforeMinute) || 0;
        const afterMinute = Number(context.afterMinute) || beforeMinute;
        const baseline = Number.isFinite(Number(merchant.lastRestockMinute)) ? Number(merchant.lastRestockMinute) : beforeMinute;
        const cycles = force ? 1 : (interval ? Math.max(0, Math.floor((afterMinute - baseline) / interval)) : 0);
        if (!cycles) return { merchant, changed: false, cycles: 0, itemsAdded: 0, servicesAdded: 0 };

        let itemsAdded = 0;
        let servicesAdded = 0;
        merchant.catalog = merchant.catalog.map(entry => {
            const addition = force
                ? Math.max(0, entry.maximumStock - entry.stock)
                : Math.min(Math.max(0, entry.maximumStock - entry.stock), Math.max(0, entry.restockQuantity) * cycles);
            itemsAdded += addition;
            return { ...entry, stock: entry.stock + addition };
        });
        merchant.services = merchant.services.map(service => {
            if (service.unlimited) return service;
            const addition = force
                ? Math.max(0, service.maximumStock - service.stock)
                : Math.min(Math.max(0, service.maximumStock - service.stock), Math.max(0, service.restockQuantity) * cycles);
            servicesAdded += addition;
            return { ...service, stock: service.stock + addition };
        });
        if (!force && interval) merchant.lastRestockMinute = baseline + cycles * interval;
        if (force) merchant.lastRestockMinute = Number(context.afterMinute ?? context.beforeMinute ?? baseline) || baseline;
        merchant.updatedAt = new Date().toISOString();
        return { merchant, changed: itemsAdded > 0 || servicesAdded > 0 || !force, cycles, itemsAdded, servicesAdded };
    }

    function consumeMerchantEntry(merchantValue, kind, entryId, quantity = 1) {
        const merchant = root.worldModel?.normalizeMerchant?.(merchantValue);
        if (!merchant) return { merchant: null, consumed: false, reason: 'merchant-not-found' };
        const listKey = kind === 'service' ? 'services' : 'catalog';
        const index = merchant[listKey].findIndex(entry => String(entry.id) === String(entryId));
        if (index < 0) return { merchant, consumed: false, reason: 'entry-not-found' };
        const entry = merchant[listKey][index];
        const amount = Math.max(1, Math.floor(Number(quantity) || 1));
        if (kind === 'service' && entry.unlimited) return { merchant, consumed: true, entry, quantity: amount };
        if (entry.stock < amount) return { merchant, consumed: false, reason: 'insufficient-stock', available: entry.stock };
        merchant[listKey][index] = { ...entry, stock: entry.stock - amount, updatedAt: new Date().toISOString() };
        merchant.updatedAt = new Date().toISOString();
        return { merchant, consumed: true, entry: merchant[listKey][index], quantity: amount };
    }

    function receiveMerchantItem(merchantValue, itemId, acquisitionUnits = 1, defaultPrice = 0) {
        const merchant = root.worldModel?.normalizeMerchant?.(merchantValue);
        if (!merchant) return { merchant: null, received: false, reason: 'merchant-not-found' };
        const units = Math.max(1, Math.floor(Number(acquisitionUnits) || 1));
        const index = merchant.catalog.findIndex(entry => String(entry.itemId) === String(itemId));
        if (index >= 0) {
            const entry = merchant.catalog[index];
            const stock = entry.stock + units;
            merchant.catalog[index] = { ...entry, stock, maximumStock: Math.max(entry.maximumStock, stock), updatedAt: new Date().toISOString() };
        } else {
            merchant.catalog.push(root.worldModel.normalizeMerchantCatalogEntry({
                id: root.worldModel.makeMerchantEntryId('stock'),
                itemId,
                stock: units,
                maximumStock: units,
                price: Math.max(0, Math.round(Number(defaultPrice) || 0)),
                restockQuantity: 0,
                enabled: true
            }));
        }
        merchant.updatedAt = new Date().toISOString();
        return { merchant, received: true, entry: merchant.catalog.find(entry => String(entry.itemId) === String(itemId)), acquisitionUnits: units };
    }

    function getCampaignChronology() {
        const snapshot = root.campaignClock?.getSnapshot?.();
        if (!snapshot || !Number.isFinite(Number(snapshot.currentMinute))) return null;
        const parts = root.campaignClock?.getDateParts?.(snapshot.currentMinute);
        return parts ? { ...parts, campaignMinute: Number(snapshot.currentMinute) } : null;
    }

    function appendMerchantTransaction(merchantValue, transactionValue) {
        const merchant = root.worldModel?.normalizeMerchant?.(merchantValue);
        if (!merchant) return { merchant: null, transaction: null };
        const transaction = root.worldModel.normalizeMerchantTransaction({
            ...transactionValue,
            id: root.worldModel.makeMerchantTransactionId(),
            chronology: transactionValue?.chronology || getCampaignChronology(),
            occurredAt: new Date().toISOString()
        });
        merchant.privateTransactions = [...merchant.privateTransactions, transaction].slice(-500);
        merchant.updatedAt = new Date().toISOString();
        return { merchant, transaction };
    }

    function getMerchantCategoryLabel(category) {
        return CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
    }

    function getRestockLabel(merchant) {
        if (merchant?.restockMode !== 'custom') return RESTOCK_LABELS[merchant?.restockMode] || RESTOCK_LABELS.manual;
        const days = Math.max(1, Math.round((Number(merchant.customIntervalMinutes) || 1440) / 1440));
        return `A cada ${days} dia${days === 1 ? '' : 's'}`;
    }

    function renderItemIcon(item) {
        const icon = String(item?.icon || '📦');
        return /^https?:\/\//i.test(icon)
            ? `<img src="${escapeHtml(icon)}" alt="" loading="lazy">`
            : `<span aria-hidden="true">${escapeHtml(icon)}</span>`;
    }

    function renderNpcCommerce(npc, options = {}) {
        const playerMode = options.playerMode === true;
        const merchant = npc?.merchant;
        if (!merchant) {
            return playerMode ? '' : `<section class="world-merchant-empty"><span>🏪 Este NPC ainda não possui uma loja.</span><button type="button" class="session-secondary" onclick="openWorldMerchantEditor('${escapeHtml(npc.id)}')">Criar loja</button></section>`;
        }
        const availableProducts = merchant.catalog.filter(entry => entry.enabled && entry.stock > 0).length;
        const availableServices = merchant.services.filter(entry => entry.enabled && (entry.unlimited || entry.stock > 0)).length;
        return `
            <section class="world-merchant-summary">
                <div><small>${escapeHtml(getMerchantCategoryLabel(merchant.category).toUpperCase())}</small><strong>🏪 ${escapeHtml(merchant.name)}</strong><span>${availableProducts} produtos · ${availableServices} serviços · Reposição ${escapeHtml(getRestockLabel(merchant).toLowerCase())}</span></div>
                <div class="world-merchant-summary-actions">
                    <button type="button" class="session-primary" onclick="openWorldMerchantShop('${escapeHtml(npc.id)}')">Abrir loja</button>
                    ${playerMode ? '' : `<button type="button" class="session-secondary" onclick="openWorldMerchantEditor('${escapeHtml(npc.id)}')">Gerenciar</button>`}
                </div>
            </section>`;
    }

    function closeWorldMerchantEditor() {
        root.document?.getElementById('worldMerchantEditorModal')?.remove();
        editorNpcId = '';
        editorDraft = null;
    }

    function makeDefaultMerchant(npc) {
        return root.worldModel.normalizeMerchant({
            enabled: true,
            name: `Loja de ${npc.name}`,
            category: 'general',
            negotiationDifficulty: 0,
            discountPercent: 0,
            buybackPercent: 50,
            restockMode: 'manual',
            customIntervalMinutes: 1440,
            lastRestockMinute: getCurrentCampaignMinute(),
            openingSchedule: { enabled: false, weekdays: [0, 1, 2, 3, 4, 5, 6], opensAt: '08:00', closesAt: '18:00' },
            purchaseApprovalRequired: true,
            catalog: [],
            services: []
        });
    }

    function captureEditorDraft() {
        const form = root.document?.getElementById('worldMerchantEditorForm');
        if (!form || !editorDraft) return;
        const data = new FormData(form);
        editorDraft.name = String(data.get('name') || '').trim();
        editorDraft.category = String(data.get('category') || 'general');
        editorDraft.description = String(data.get('description') || '').trim();
        editorDraft.privateNotes = String(data.get('privateNotes') || '').trim();
        editorDraft.negotiationDifficulty = Math.max(0, Math.floor(Number(data.get('negotiationDifficulty')) || 0));
        editorDraft.discountPercent = Math.min(100, Math.max(0, Number(data.get('discountPercent')) || 0));
        editorDraft.buybackPercent = Math.min(100, Math.max(0, Number(data.get('buybackPercent')) || 0));
        editorDraft.restockMode = String(data.get('restockMode') || 'manual');
        editorDraft.customIntervalMinutes = Math.max(60, Math.floor((Number(data.get('customIntervalDays')) || 1) * 1440));
        editorDraft.openingSchedule = root.worldModel.normalizeOpeningSchedule({
            enabled: data.get('openingEnabled') === 'on',
            weekdays: data.getAll('openingWeekdays').map(Number),
            opensAt: String(data.get('opensAt') || '08:00'),
            closesAt: String(data.get('closesAt') || '18:00')
        });
        editorDraft.purchaseApprovalRequired = data.get('purchaseApprovalRequired') === 'on';
        editorDraft.catalog = editorDraft.catalog.map(entry => ({
            ...entry,
            stock: Math.max(0, Math.floor(Number(data.get(`item-stock-${entry.id}`)) || 0)),
            maximumStock: Math.max(0, Math.floor(Number(data.get(`item-max-${entry.id}`)) || 0)),
            price: Math.max(0, Math.round(Number(data.get(`item-price-${entry.id}`)) || 0)),
            restockQuantity: Math.max(0, Math.floor(Number(data.get(`item-restock-${entry.id}`)) || 0))
        })).map(entry => ({ ...entry, stock: Math.min(entry.stock, entry.maximumStock) }));
        editorDraft.services = editorDraft.services.map(service => {
            const unlimited = data.get(`service-unlimited-${service.id}`) === 'on';
            const maximumStock = unlimited ? 0 : Math.max(0, Math.floor(Number(data.get(`service-max-${service.id}`)) || 0));
            return {
                ...service,
                name: String(data.get(`service-name-${service.id}`) || '').trim(),
                description: String(data.get(`service-description-${service.id}`) || '').trim(),
                price: Math.max(0, Math.round(Number(data.get(`service-price-${service.id}`)) || 0)),
                unlimited,
                stock: unlimited ? 0 : Math.min(maximumStock, Math.max(0, Math.floor(Number(data.get(`service-stock-${service.id}`)) || 0))),
                maximumStock,
                restockQuantity: unlimited ? 0 : Math.max(0, Math.floor(Number(data.get(`service-restock-${service.id}`)) || 0))
            };
        });
    }

    function renderMerchantEditor(preserveScroll = false) {
        const modal = root.document?.getElementById('worldMerchantEditorModal');
        const npc = getWorldNpc(editorNpcId);
        if (!modal || !npc || !editorDraft) return;
        const dialog = modal.querySelector('.world-merchant-editor');
        const scrollTop = preserveScroll ? dialog?.scrollTop || 0 : 0;
        const catalog = [...getCatalog()].filter(item => item.id !== 'coroa').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        const selectedItemIds = new Set(editorDraft.catalog.map(entry => entry.itemId));
        dialog.innerHTML = `
            <div class="session-dialog-header"><div><small class="world-hub-kicker">COMERCIANTE</small><h2 id="worldMerchantEditorTitle">Gerenciar loja de ${escapeHtml(npc.name)}</h2></div><button type="button" class="session-close" onclick="closeWorldMerchantEditor()" aria-label="Fechar">×</button></div>
            <form id="worldMerchantEditorForm" onsubmit="saveWorldMerchant(event)">
                <div class="world-merchant-form-grid">
                    <label><span>Nome da loja *</span><input name="name" required maxlength="120" value="${escapeHtml(editorDraft.name)}"></label>
                    <label><span>Categoria</span><select name="category">${Object.entries(CATEGORY_LABELS).map(([value, label]) => `<option value="${value}"${editorDraft.category === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label>
                    <label><span>ND de Negócios</span><input name="negotiationDifficulty" type="number" min="0" step="1" value="${editorDraft.negotiationDifficulty}"><small>Use 0 para desativar negociação.</small></label>
                    <label><span>Desconto por sucesso</span><input name="discountPercent" type="number" min="0" max="100" step="1" value="${editorDraft.discountPercent}"><small>Percentual aplicado a toda esta visita.</small></label>
                    <label><span>Recompra (%)</span><input name="buybackPercent" type="number" min="0" max="100" step="1" value="${editorDraft.buybackPercent}"><small>Parcela do preço de catálogo oferecida ao comprar itens dos personagens.</small></label>
                    <label><span>Reposição</span><select name="restockMode">${Object.entries(RESTOCK_LABELS).map(([value, label]) => `<option value="${value}"${editorDraft.restockMode === value ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label>
                    <label><span>Intervalo personalizado em dias</span><input name="customIntervalDays" type="number" min="1" step="1" value="${Math.max(1, Math.round(editorDraft.customIntervalMinutes / 1440))}"></label>
                </div>
                <label><span>Descrição pública</span><textarea name="description" maxlength="3000" rows="3">${escapeHtml(editorDraft.description)}</textarea></label>
                <label class="world-npc-private-field"><span>Anotações privadas do mestre</span><textarea name="privateNotes" maxlength="4000" rows="3">${escapeHtml(editorDraft.privateNotes)}</textarea></label>

                <section class="world-merchant-editor-section world-merchant-hours-editor">
                    <div class="world-merchant-editor-heading"><div><small>FUNCIONAMENTO</small><strong>Horário e colaboração</strong></div></div>
                    <label class="world-merchant-checkbox"><input name="openingEnabled" type="checkbox"${editorDraft.openingSchedule?.enabled ? ' checked' : ''}><span>Usar horário de abertura da loja</span></label>
                    <div class="world-merchant-weekdays">${(root.worldTime?.DAY_LABELS || ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']).map((label, day) => `<label><input name="openingWeekdays" type="checkbox" value="${day}"${(editorDraft.openingSchedule?.weekdays || []).includes(day) ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div>
                    <div class="world-merchant-form-grid"><label><span>Abre às</span><input name="opensAt" type="time" value="${escapeHtml(editorDraft.openingSchedule?.opensAt || '08:00')}"></label><label><span>Fecha às</span><input name="closesAt" type="time" value="${escapeHtml(editorDraft.openingSchedule?.closesAt || '18:00')}"></label></div>
                    <label class="world-merchant-checkbox"><input name="purchaseApprovalRequired" type="checkbox"${editorDraft.purchaseApprovalRequired !== false ? ' checked' : ''}><span>Compras online exigem aprovação do mestre</span></label>
                </section>

                <section class="world-merchant-editor-section"><div class="world-merchant-editor-heading"><div><small>CATÁLOGO INDIVIDUAL</small><strong>${editorDraft.catalog.length} produtos</strong></div></div>
                    <div class="world-merchant-add-row"><select id="worldMerchantCatalogSelect"><option value="">Escolha um item</option>${catalog.filter(item => !selectedItemIds.has(item.id)).map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${Math.max(0, Number(item.goldValue) || 0)} Coroas</option>`).join('')}</select><button type="button" class="session-secondary" onclick="addWorldMerchantCatalogItem()">+ Produto</button></div>
                    <div class="world-merchant-editor-list">${editorDraft.catalog.length ? editorDraft.catalog.map(entry => {
                        const item = getCatalogItem(entry.itemId);
                        return `<article class="world-merchant-editor-entry"><div class="world-merchant-entry-title">${renderItemIcon(item)}<strong>${escapeHtml(item?.name || entry.itemId)}</strong><button type="button" class="session-danger" onclick="removeWorldMerchantCatalogItem('${escapeHtml(entry.id)}')">Remover</button></div><div class="world-merchant-entry-fields"><label><span>Estoque</span><input name="item-stock-${escapeHtml(entry.id)}" type="number" min="0" value="${entry.stock}"></label><label><span>Máximo</span><input name="item-max-${escapeHtml(entry.id)}" type="number" min="0" value="${entry.maximumStock}"></label><label><span>Preço</span><input name="item-price-${escapeHtml(entry.id)}" type="number" min="0" value="${entry.price}"></label><label><span>Repõe</span><input name="item-restock-${escapeHtml(entry.id)}" type="number" min="0" value="${entry.restockQuantity}"></label></div></article>`;
                    }).join('') : '<p class="world-atlas-empty">Nenhum produto cadastrado.</p>'}</div>
                </section>

                <section class="world-merchant-editor-section"><div class="world-merchant-editor-heading"><div><small>SERVIÇOS</small><strong>${editorDraft.services.length} cadastrados</strong></div><button type="button" class="session-secondary" onclick="addWorldMerchantService()">+ Serviço</button></div>
                    <div class="world-merchant-editor-list">${editorDraft.services.length ? editorDraft.services.map(service => `<article class="world-merchant-editor-entry"><div class="world-merchant-entry-title"><span>🛠️</span><input name="service-name-${escapeHtml(service.id)}" required maxlength="120" value="${escapeHtml(service.name)}" placeholder="Nome do serviço"><button type="button" class="session-danger" onclick="removeWorldMerchantService('${escapeHtml(service.id)}')">Remover</button></div><label><span>Descrição</span><textarea name="service-description-${escapeHtml(service.id)}" rows="2" maxlength="2000">${escapeHtml(service.description)}</textarea></label><div class="world-merchant-entry-fields"><label><span>Preço</span><input name="service-price-${escapeHtml(service.id)}" type="number" min="0" value="${service.price}"></label><label class="world-merchant-checkbox"><input name="service-unlimited-${escapeHtml(service.id)}" type="checkbox"${service.unlimited ? ' checked' : ''}><span>Disponibilidade ilimitada</span></label><label><span>Disponível</span><input name="service-stock-${escapeHtml(service.id)}" type="number" min="0" value="${service.stock}"></label><label><span>Máximo</span><input name="service-max-${escapeHtml(service.id)}" type="number" min="0" value="${service.maximumStock}"></label><label><span>Repõe</span><input name="service-restock-${escapeHtml(service.id)}" type="number" min="0" value="${service.restockQuantity}"></label></div></article>`).join('') : '<p class="world-atlas-empty">Nenhum serviço cadastrado.</p>'}</div>
                </section>
                <div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="restockWorldMerchant('${escapeHtml(npc.id)}', true)">Repor agora</button><button type="button" class="session-secondary" onclick="closeWorldMerchantEditor()">Cancelar</button><button type="submit" class="session-primary">Salvar loja</button></div>
            </form>`;
        if (dialog) dialog.scrollTop = scrollTop;
    }

    function openWorldMerchantEditor(npcId) {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Somente o mestre pode gerenciar lojas.');
        const npc = getWorldNpc(npcId);
        if (!npc) return;
        closeWorldMerchantEditor();
        editorNpcId = String(npc.id);
        editorDraft = clone(npc.merchant) || makeDefaultMerchant(npc);
        const modal = root.document.createElement('div');
        modal.id = 'worldMerchantEditorModal';
        modal.className = 'session-overlay world-merchant-editor-overlay';
        modal.innerHTML = '<section class="session-dialog world-merchant-editor" role="dialog" aria-modal="true" aria-labelledby="worldMerchantEditorTitle"></section>';
        modal.addEventListener('click', event => { if (event.target === modal) closeWorldMerchantEditor(); });
        root.document.body.appendChild(modal);
        renderMerchantEditor();
    }

    function addWorldMerchantCatalogItem() {
        captureEditorDraft();
        const itemId = root.document?.getElementById('worldMerchantCatalogSelect')?.value;
        const item = getCatalogItem(itemId);
        if (!item || editorDraft.catalog.some(entry => entry.itemId === item.id)) return;
        editorDraft.catalog.push(root.worldModel.normalizeMerchantCatalogEntry({
            id: root.worldModel.makeMerchantEntryId('item'), itemId: item.id, stock: 1, maximumStock: 1,
            price: Math.max(0, Math.round(Number(item.goldValue) || 0)), restockQuantity: 1
        }));
        renderMerchantEditor(true);
    }

    function removeWorldMerchantCatalogItem(entryId) {
        captureEditorDraft();
        editorDraft.catalog = editorDraft.catalog.filter(entry => String(entry.id) !== String(entryId));
        renderMerchantEditor(true);
    }

    function addWorldMerchantService() {
        captureEditorDraft();
        editorDraft.services.push(root.worldModel.normalizeMerchantService({
            id: root.worldModel.makeMerchantEntryId('service'), name: 'Novo serviço', unlimited: true, price: 0
        }));
        renderMerchantEditor(true);
    }

    function removeWorldMerchantService(entryId) {
        captureEditorDraft();
        editorDraft.services = editorDraft.services.filter(entry => String(entry.id) !== String(entryId));
        renderMerchantEditor(true);
    }

    function saveWorldMerchant(event) {
        event?.preventDefault?.();
        captureEditorDraft();
        if (!editorDraft?.name) return root.showToast?.('Informe o nome da loja.');
        const npc = getWorldNpc(editorNpcId);
        if (!npc) return;
        editorDraft.lastRestockMinute ??= getCurrentCampaignMinute();
        root.worldStore.updateNpc(npc.id, { merchant: editorDraft });
        closeWorldMerchantEditor();
        root.showToast?.('🏪 Loja salva na campanha.');
        root.openWorldHub?.('npcs');
    }

    function removeWorldMerchant(npcId) {
        if (root.collaborationSession?.isPlayer?.()) return;
        const npc = getWorldNpc(npcId);
        if (!npc?.merchant) return;
        root.openSessionConfirm?.({
            title: `Remover ${npc.merchant.name}?`,
            message: 'O catálogo, o estoque e os serviços desta loja serão removidos. O NPC será preservado.',
            confirmLabel: 'Remover loja',
            danger: true,
            onConfirm: () => {
                root.worldStore.updateNpc(npc.id, { merchant: null });
                closeWorldMerchantShop();
                root.openWorldHub?.('npcs');
                root.showToast?.('🏪 Loja removida do NPC.');
            }
        });
    }

    function getBuyerOptions() {
        const session = root.collaborationSession?.getSession?.();
        const playerMode = session?.role === 'player';
        const participants = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants.filter(entry => entry.type === 'player' && (!playerMode || String(entry.id) === String(session.linkedParticipantId)))
            : [];
        if (participants.length) return participants.map(entry => ({ key: `combatant:${entry.id}`, owner: entry }));
        const sheets = typeof characterSheets !== 'undefined' && Array.isArray(characterSheets)
            ? characterSheets.filter(entry => !playerMode || String(entry.id) === String(session?.linkedSheetId))
            : [];
        return sheets.map(entry => ({ key: `sheet:${entry.id}`, owner: entry }));
    }

    function getActiveBuyer() {
        const options = getBuyerOptions();
        return options.find(option => option.key === activeShop?.buyerKey)?.owner || null;
    }

    function getBusinessTotal(owner) {
        if (!owner || owner.creationMode !== 'full') return 0;
        return Number(root.characterSheetModel?.getCharacterSkillBreakdown?.('business', owner.skills, owner.attributes)?.total) || 0;
    }

    function getBusinessRollMode() {
        try {
            return JSON.parse(root.localStorage?.getItem('dnd_app_preferences') || '{}').rollModes?.skills === 'auto'
                ? 'auto'
                : 'manual';
        } catch {
            return 'manual';
        }
    }

    function closeWorldMerchantShop() {
        root.document?.getElementById('worldMerchantShopModal')?.remove();
        activeShop = null;
    }

    function selectWorldMerchantBuyer(key) {
        if (!activeShop) return;
        activeShop.buyerKey = String(key || '');
        activeShop.discountPercent = 0;
        activeShop.negotiationResult = null;
        root.selectCharacterCollectionOwner?.(activeShop.buyerKey);
        renderMerchantShop();
    }

    function getSellableInventoryItems() {
        return (root.getCurrentInventoryItems?.() || [])
            .filter(item => item && item.id !== 'coroa')
            .map(item => {
                const catalogItem = getCatalogItem(item.id) || item;
                const packSize = Math.max(1, Math.floor(Number(catalogItem.acquisitionPackSize) || 1));
                const reserved = root.isItemEquippedForCurrentOwner?.(item.id) ? 1 : 0;
                let availableQuantity = Math.max(0, Math.floor(Number(item.quantity) || 0) - reserved);
                const removableTransportQuantity = root.getRemovableTransportInventoryQuantity?.(item);
                if (Number.isFinite(Number(removableTransportQuantity))) {
                    availableQuantity = Math.min(availableQuantity, Math.max(0, Math.floor(Number(removableTransportQuantity))));
                }
                return { item, catalogItem, packSize, availableQuantity, availableUnits: Math.floor(availableQuantity / packSize) };
            })
            .filter(entry => entry.availableUnits > 0)
            .sort((a, b) => String(a.catalogItem.name || '').localeCompare(String(b.catalogItem.name || ''), 'pt-BR'));
    }

    function formatMerchantTransactionDate(transaction) {
        const chronology = transaction?.chronology;
        if (chronology?.year) {
            const hour = String(Math.max(0, Number(chronology.hour) || 0)).padStart(2, '0');
            const minute = String(Math.max(0, Number(chronology.minute) || 0)).padStart(2, '0');
            return `${chronology.day}/${chronology.month}/${chronology.year} ${chronology.era || 'DR'} · ${hour}:${minute}`;
        }
        return new Date(transaction?.occurredAt || Date.now()).toLocaleString('pt-BR');
    }

    function renderMerchantTransaction(transaction) {
        const labels = { purchase: 'Compra', sale: 'Venda', service: 'Serviço' };
        const quantity = transaction.type === 'service' ? '' : ` x${transaction.quantity}`;
        return `<article class="world-merchant-transaction"><div><strong>${escapeHtml(labels[transaction.type] || 'Movimento')} · ${escapeHtml(transaction.buyerName)}</strong><span>${escapeHtml(transaction.itemName || 'Registro comercial')}${quantity}</span></div><div><strong>👑 ${transaction.total}</strong><small>${escapeHtml(formatMerchantTransactionDate(transaction))}</small></div></article>`;
    }

    function renderMerchantShop() {
        const modal = root.document?.getElementById('worldMerchantShopModal');
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        if (!modal || !merchant) return;
        const playerMode = root.collaborationSession?.isPlayer?.() === true;
        const buyerOptions = getBuyerOptions();
        if (!activeShop.buyerKey && buyerOptions.length) activeShop.buyerKey = buyerOptions[0].key;
        if (activeShop.buyerKey && root.getCharacterCollectionContextKey?.() !== activeShop.buyerKey) {
            root.selectCharacterCollectionOwner?.(activeShop.buyerKey);
        }
        const buyer = getActiveBuyer();
        const discount = Math.max(0, Number(activeShop.discountPercent) || 0);
        const balance = Number(root.getInventoryCrownBalance?.()) || 0;
        const shopOpen = root.worldTime?.isMerchantOpen?.(merchant) !== false;
        const hours = merchant.openingSchedule?.enabled
            ? `${merchant.openingSchedule.opensAt}–${merchant.openingSchedule.closesAt}`
            : 'Sem horário restrito';
        const sellableItems = playerMode ? [] : getSellableInventoryItems();
        const dialog = modal.querySelector('.world-merchant-shop-dialog');
        dialog.innerHTML = `
            <div class="session-dialog-header"><div><small class="world-hub-kicker">${escapeHtml(getMerchantCategoryLabel(merchant.category).toUpperCase())}</small><h2 id="worldMerchantShopTitle">${escapeHtml(merchant.name)}</h2></div><button type="button" class="session-close" onclick="closeWorldMerchantShop()" aria-label="Fechar">×</button></div>
            <p class="world-hub-intro">${escapeHtml(merchant.description || `Catálogo de ${npc.name}.`)}</p>
            <div class="world-merchant-open-status ${shopOpen ? 'is-open' : 'is-closed'}"><strong>${shopOpen ? '🟢 Loja aberta' : '🔴 Loja fechada'}</strong><span>${escapeHtml(hours)}</span></div>
            ${buyerOptions.length ? `<section class="world-merchant-buyer"><label><span>Comprador</span><select onchange="selectWorldMerchantBuyer(this.value)">${buyerOptions.map(option => `<option value="${escapeHtml(option.key)}"${option.key === activeShop.buyerKey ? ' selected' : ''}>${escapeHtml(option.owner.name || 'Ficha sem nome')}</option>`).join('')}</select></label><div><small>SALDO</small><strong>👑 ${balance}</strong></div></section>` : '<p class="world-atlas-empty">Adicione um personagem ou uma ficha para realizar compras.</p>'}
            ${merchant.negotiationDifficulty > 0 && merchant.discountPercent > 0 && buyer && (!playerMode || merchant.purchaseApprovalRequired !== false) ? `<section class="world-merchant-negotiation ${discount ? 'is-success' : ''}"><div><small>TESTE DE NEGÓCIOS</small><strong>1d20 + ${getBusinessTotal(buyer)} contra ND ${merchant.negotiationDifficulty}</strong><span>${discount ? `${discount}% de desconto nas compras e bônus nas vendas ativo nesta visita.` : `Sucesso concede ${merchant.discountPercent}% de desconto nas compras e bônus nas vendas.`}</span></div>${discount ? '' : `${getBusinessRollMode() === 'manual' ? `<label><span>Resultado natural</span><input id="worldMerchantBusinessRoll" type="number" min="1" max="20" inputmode="numeric" placeholder="1–20"></label>` : '<span class="world-merchant-auto-roll">🎲 Rolagem automática</span>'}<button type="button" class="session-secondary" onclick="performWorldMerchantNegotiation()">Testar Negócios</button>`}</section>` : ''}
            <section class="world-merchant-shop-section"><div class="world-merchant-shop-heading"><small>PRODUTOS</small><strong>${merchant.catalog.filter(entry => entry.enabled).length}</strong></div><div class="world-merchant-product-list">${merchant.catalog.filter(entry => entry.enabled).length ? merchant.catalog.filter(entry => entry.enabled).map(entry => {
                const item = getCatalogItem(entry.itemId);
                const price = calculateDiscountedPrice(entry.price, discount);
                return `<article class="world-merchant-product ${entry.stock <= 0 || !shopOpen ? 'is-sold-out' : ''}">${renderItemIcon(item)}<div><strong>${escapeHtml(item?.name || entry.itemId)}</strong><span>Estoque ${entry.stock}/${entry.maximumStock}${discount ? ` · <s>${entry.price}</s> 👑 ${price}` : ` · 👑 ${price}`}</span></div><label><span>Qtd.</span><input id="merchant-quantity-${escapeHtml(entry.id)}" type="number" min="1" max="${entry.stock}" value="1" inputmode="numeric"></label><button type="button" class="session-primary" onclick="${playerMode ? 'requestWorldMerchantPurchase' : 'purchaseWorldMerchantItem'}('${escapeHtml(entry.id)}')"${!buyer || entry.stock <= 0 || !shopOpen ? ' disabled' : ''}>${playerMode ? (merchant.purchaseApprovalRequired === false ? 'Comprar' : 'Solicitar') : 'Comprar'}</button></article>`;
            }).join('') : '<p class="world-atlas-empty">Nenhum produto disponível.</p>'}</div></section>
            <section class="world-merchant-shop-section"><div class="world-merchant-shop-heading"><small>SERVIÇOS</small><strong>${merchant.services.filter(entry => entry.enabled).length}</strong></div><div class="world-merchant-service-list">${merchant.services.filter(entry => entry.enabled).length ? merchant.services.filter(entry => entry.enabled).map(service => {
                const available = service.unlimited || service.stock > 0;
                const price = calculateDiscountedPrice(service.price, discount);
                return `<article class="world-merchant-service ${available && shopOpen ? '' : 'is-sold-out'}"><div><strong>🛠️ ${escapeHtml(service.name)}</strong><p>${escapeHtml(service.description || 'Serviço oferecido pelo comerciante.')}</p><span>${service.unlimited ? 'Disponível' : `${service.stock}/${service.maximumStock} disponíveis`} · 👑 ${price}</span></div><button type="button" class="session-primary" onclick="${playerMode ? 'requestWorldMerchantService' : 'hireWorldMerchantService'}('${escapeHtml(service.id)}')"${!buyer || !available || !shopOpen ? ' disabled' : ''}>${playerMode ? (merchant.purchaseApprovalRequired === false ? 'Contratar' : 'Solicitar') : 'Contratar'}</button></article>`;
            }).join('') : '<p class="world-atlas-empty">Nenhum serviço cadastrado.</p>'}</div></section>
            ${playerMode ? '' : `<section class="world-merchant-shop-section"><div class="world-merchant-shop-heading"><div><small>VENDER DO INVENTÁRIO</small><span>Oferta-base: ${merchant.buybackPercent}% do valor · ajuste permitido pelo mestre</span></div><strong>${sellableItems.length}</strong></div><div class="world-merchant-sale-list">${sellableItems.length ? sellableItems.map(({ item, catalogItem, packSize, availableQuantity, availableUnits }) => {
                const storeEntry = merchant.catalog.find(entry => String(entry.itemId) === String(item.id));
                const referencePrice = Math.max(0, Number(storeEntry?.price ?? catalogItem.goldValue) || 0);
                const offer = calculateBuybackPrice(referencePrice, merchant.buybackPercent, discount);
                const unitName = packSize > 1 ? (catalogItem.acquisitionUnitLabel || 'kit') : 'unidade';
                const availability = packSize > 1 ? `${availableUnits} ${unitName}${availableUnits === 1 ? '' : 's'} · ${availableQuantity} itens` : `${availableQuantity} disponíveis`;
                return `<article class="world-merchant-sale">${renderItemIcon(catalogItem)}<div><strong>${escapeHtml(catalogItem.name || item.id)}</strong><span>${escapeHtml(availability)}${root.isItemEquippedForCurrentOwner?.(item.id) ? ' · última unidade equipada protegida' : ''}</span></div><label><span>Qtd.</span><input id="merchant-sale-quantity-${escapeHtml(item.id)}" type="number" min="1" max="${availableUnits}" value="1" inputmode="numeric"></label><label><span>Oferta/${escapeHtml(unitName)}</span><input id="merchant-sale-price-${escapeHtml(item.id)}" type="number" min="0" value="${offer}" inputmode="numeric"></label><button type="button" class="session-primary" onclick="sellWorldMerchantItem('${escapeHtml(item.id)}')"${!buyer ? ' disabled' : ''}>Vender</button></article>`;
            }).join('') : '<p class="world-atlas-empty">Este personagem não possui itens disponíveis para venda.</p>'}</div></section>
            <section class="world-merchant-shop-section"><div class="world-merchant-shop-heading"><small>HISTÓRICO DA LOJA</small><strong>${merchant.privateTransactions.length}</strong></div><div class="world-merchant-transaction-list">${merchant.privateTransactions.length ? [...merchant.privateTransactions].reverse().slice(0, 20).map(renderMerchantTransaction).join('') : '<p class="world-atlas-empty">Nenhuma transação registrada.</p>'}</div></section>`}
            ${playerMode ? '' : `<div class="session-dialog-actions"><button type="button" class="session-danger" onclick="removeWorldMerchant('${escapeHtml(npc.id)}')">Remover loja</button><button type="button" class="session-secondary" onclick="restockWorldMerchant('${escapeHtml(npc.id)}')">Repor estoque</button><button type="button" class="session-secondary" onclick="closeWorldMerchantShop(); openWorldMerchantEditor('${escapeHtml(npc.id)}')">Gerenciar</button></div>`}`;
    }

    function openWorldMerchantShop(npcId) {
        const npc = getWorldNpc(npcId);
        if (!npc?.merchant) return;
        closeWorldMerchantShop();
        const options = getBuyerOptions();
        activeShop = { npcId: String(npc.id), buyerKey: options[0]?.key || '', discountPercent: 0, negotiationResult: null };
        const modal = root.document.createElement('div');
        modal.id = 'worldMerchantShopModal';
        modal.className = 'session-overlay world-merchant-shop-overlay';
        modal.innerHTML = '<section class="session-dialog world-merchant-shop-dialog" role="dialog" aria-modal="true" aria-labelledby="worldMerchantShopTitle"></section>';
        modal.addEventListener('click', event => { if (event.target === modal) closeWorldMerchantShop(); });
        root.document.body.appendChild(modal);
        renderMerchantShop();
    }

    function performWorldMerchantNegotiation(random = Math.random) {
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        const buyer = getActiveBuyer();
        if (!merchant || !buyer) return;
        const auto = getBusinessRollMode() === 'auto';
        const input = root.document?.getElementById('worldMerchantBusinessRoll');
        const naturalRoll = auto ? Math.floor(random() * 20) + 1 : Number(input?.value);
        const result = resolveBusinessNegotiation({ naturalRoll, skillTotal: getBusinessTotal(buyer), difficulty: merchant.negotiationDifficulty, discountPercent: merchant.discountPercent });
        if (!result.valid) {
            root.showToast?.('Informe um resultado natural entre 1 e 20.');
            input?.focus();
            return result;
        }
        activeShop.discountPercent = result.discountPercent;
        activeShop.negotiationResult = result;
        if (result.luckDiceGained > 0) {
            buyer.progression = { ...(buyer.progression || {}), luckDice: Math.max(0, Number(buyer.progression?.luckDice) || 0) + result.luckDiceGained };
            root.savePlayersToStorage?.();
            if (typeof persistCharacterSheets === 'function') persistCharacterSheets();
        }
        root.addCombatHistoryEntry?.(`${buyer.name}: Negócios ${result.finalResult} — ${result.success ? 'Sucesso' : 'Falha'}`, `Comerciante: ${npc.name}\nDado: ${result.naturalRoll}${result.critical ? ' (20 natural — Crítico)' : ''}\nPerícia: ${result.skillTotal >= 0 ? '+' : ''}${result.skillTotal}\nND: ${result.difficulty}\nMargem: ${result.margin >= 0 ? '+' : ''}${result.margin}\nDesconto: ${result.discountPercent}%`, { type: 'skill-test', source: { id: buyer.id, name: buyer.name }, participants: [{ id: buyer.id, name: buyer.name }], merchant: { npcId: npc.id, discountPercent: result.discountPercent } });
        root.showToast?.(result.success ? `🤝 Vantagem comercial de ${result.discountPercent}% obtida.` : 'Negociação sem vantagem comercial.');
        renderMerchantShop();
        return result;
    }

    function submitMerchantTransactionRequest(kind, entryId) {
        if (!root.collaborationSession?.isPlayer?.()) return false;
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        const buyer = getActiveBuyer();
        if (!merchant || !buyer || !entryId) return false;
        if (root.worldTime?.isMerchantOpen?.(merchant) === false) return root.showToast?.('A loja está fechada neste horário.');
        const session = root.collaborationSession.getSession?.() || {};
        if (String(buyer.id) !== String(session.linkedParticipantId || '')) {
            root.showToast?.('Selecione o seu personagem vinculado à sala.');
            return false;
        }
        const isService = kind === 'service';
        const entry = (isService ? merchant.services : merchant.catalog)?.find(item => String(item.id) === String(entryId));
        if (!entry) return false;
        const quantity = isService ? 1 : Math.max(1, Math.floor(Number(root.document?.getElementById(`merchant-quantity-${entry.id}`)?.value) || 1));
        if (!isService && quantity > entry.stock) return root.showToast?.(`Estoque insuficiente: há ${entry.stock} disponível.`);
        if (isService && !entry.unlimited && entry.stock < 1) return root.showToast?.('Este serviço não está disponível.');
        const item = isService ? null : getCatalogItem(entry.itemId);
        const discountPercent = merchant.purchaseApprovalRequired === false ? 0 : Math.max(0, Number(activeShop.discountPercent) || 0);
        const unitPrice = calculateDiscountedPrice(entry.price, discountPercent);
        const label = isService
            ? `${buyer.name} solicita o serviço ${entry.name}`
            : `${buyer.name} solicita ${item?.name || entry.itemId} x${quantity}`;
        const permission = root.collaborationSession.authorize?.('merchant.transaction', buyer.id, {
            kind: isService ? 'service' : 'item', npcId: npc.id, entryId: entry.id, quantity, unitPrice,
            discountPercent, itemId: item?.id || null, itemName: item?.name || entry.name,
            packSize: Math.max(1, Math.floor(Number(item?.acquisitionPackSize) || 1)),
            item: item ? clone(item, {}) : null, label
        }, { entityKey: `merchant:${npc.id}:${entry.id}:${buyer.id}` });
        if (!permission || permission.decision === 'deny') {
            root.showToast?.(permission?.reason || 'Esta compra não é permitida.');
            return false;
        }
        const sent = root.collaborationRealtime?.submitCommand?.(permission.command);
        if (sent) root.showToast?.(merchant.purchaseApprovalRequired === false ? '🛒 Compra enviada e processada pela sala.' : '📨 Compra enviada para aprovação do mestre.');
        return Boolean(sent);
    }

    function requestWorldMerchantPurchase(entryId) {
        return submitMerchantTransactionRequest('item', entryId);
    }

    function requestWorldMerchantService(serviceId) {
        return submitMerchantTransactionRequest('service', serviceId);
    }

    function purchaseWorldMerchantItem(entryId) {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Solicite a compra ao mestre.');
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        const buyer = getActiveBuyer();
        const entry = merchant?.catalog.find(item => String(item.id) === String(entryId));
        if (!merchant || !buyer || !entry) return;
        if (root.worldTime?.isMerchantOpen?.(merchant) === false) return root.showToast?.('A loja está fechada neste horário.');
        const quantity = Math.max(1, Math.floor(Number(root.document?.getElementById(`merchant-quantity-${entry.id}`)?.value) || 1));
        if (quantity > entry.stock) return root.showToast?.(`Estoque insuficiente: há ${entry.stock} disponível.`);
        const unitPrice = calculateDiscountedPrice(entry.price, activeShop.discountPercent);
        const payment = root.purchaseCurrentInventoryItem?.(entry.itemId, quantity, unitPrice * quantity);
        if (!payment?.purchased) return root.showToast?.(`Coroas insuficientes: possui ${payment?.balance || 0} e precisa de ${payment?.required || unitPrice * quantity}.`);
        const item = getCatalogItem(entry.itemId);
        const consumed = consumeMerchantEntry(merchant, 'item', entry.id, quantity);
        const recorded = appendMerchantTransaction(consumed.merchant, {
            type: 'purchase', buyerId: buyer.id, buyerName: buyer.name,
            itemId: entry.itemId, itemName: item?.name || entry.itemId,
            quantity: payment.quantity, acquisitionUnits: quantity,
            unitPrice, total: payment.total, discountPercent: activeShop.discountPercent || 0
        });
        root.worldStore.updateNpc(npc.id, { merchant: recorded.merchant });
        root.addCombatHistoryEntry?.(`${buyer.name} comprou ${item?.name || entry.itemId} x${payment.quantity}`, `Loja: ${merchant.name}\nUnidades de estoque: ${quantity}\nPreço unitário: ${unitPrice} Coroas\nTotal: ${payment.total} Coroas\nSaldo: ${payment.balanceAfter}\nDesconto: ${activeShop.discountPercent || 0}%`, { type: 'item', actor: { id: buyer.id, name: buyer.name }, target: { id: buyer.id, name: buyer.name }, participants: [{ id: buyer.id, name: buyer.name }], merchant: { npcId: npc.id, entryId: entry.id, total: payment.total } });
        root.showToast?.(`🛒 ${item?.name || 'Item'} comprado por ${payment.total} Coroas.`);
        renderMerchantShop();
    }

    function hireWorldMerchantService(serviceId) {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Solicite o serviço ao mestre.');
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        const buyer = getActiveBuyer();
        const service = merchant?.services.find(entry => String(entry.id) === String(serviceId));
        if (!merchant || !buyer || !service) return;
        if (root.worldTime?.isMerchantOpen?.(merchant) === false) return root.showToast?.('A loja está fechada neste horário.');
        const price = calculateDiscountedPrice(service.price, activeShop.discountPercent);
        const payment = root.payCurrentInventoryCrowns?.(price);
        if (!payment?.paid) return root.showToast?.(`Coroas insuficientes: possui ${payment?.balance || 0} e precisa de ${payment?.required || price}.`);
        const consumed = consumeMerchantEntry(merchant, 'service', service.id, 1);
        if (!consumed.consumed) return root.showToast?.('Este serviço não está disponível.');
        const recorded = appendMerchantTransaction(consumed.merchant, {
            type: 'service', buyerId: buyer.id, buyerName: buyer.name,
            itemName: service.name, quantity: 1, acquisitionUnits: 1,
            unitPrice: price, total: payment.total, discountPercent: activeShop.discountPercent || 0
        });
        root.worldStore.updateNpc(npc.id, { merchant: recorded.merchant });
        root.addCombatHistoryEntry?.(`${buyer.name} contratou ${service.name}`, `Loja: ${merchant.name}\nValor: ${payment.total} Coroas\nSaldo: ${payment.balanceAfter}\nDesconto: ${activeShop.discountPercent || 0}%\n${service.description || 'Execução assistida pelo mestre.'}`, { type: 'item', actor: { id: buyer.id, name: buyer.name }, participants: [{ id: buyer.id, name: buyer.name }], merchant: { npcId: npc.id, serviceId: service.id, total: payment.total } });
        root.showToast?.(`🛠️ ${service.name} contratado por ${payment.total} Coroas.`);
        renderMerchantShop();
    }

    function sellWorldMerchantItem(itemId) {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Somente o mestre pode confirmar vendas.');
        const npc = getWorldNpc(activeShop?.npcId);
        const merchant = npc?.merchant;
        const seller = getActiveBuyer();
        const item = getCatalogItem(itemId) || root.getCurrentInventoryItems?.().find(entry => String(entry.id) === String(itemId));
        if (!merchant || !seller || !item) return;

        const quantityInput = root.document?.getElementById(`merchant-sale-quantity-${item.id}`);
        const priceInput = root.document?.getElementById(`merchant-sale-price-${item.id}`);
        const acquisitionUnits = Math.max(1, Math.floor(Number(quantityInput?.value) || 1));
        const unitPrice = Math.max(0, Math.round(Number(priceInput?.value) || 0));
        const sale = root.sellCurrentInventoryItem?.(item.id, acquisitionUnits, unitPrice * acquisitionUnits);
        if (!sale?.sold) {
            const messages = {
                'equipped-item': 'Desequipe a unidade reservada ou reduza a quantidade da venda.',
                'transport-in-use': 'Descarregue, desatrele ou desequipe este item antes de vendê-lo.',
                'insufficient-quantity': 'Quantidade insuficiente no inventário.'
            };
            return root.showToast?.(messages[sale?.reason] || 'Não foi possível vender este item.');
        }

        const storePrice = merchant.catalog.find(entry => String(entry.itemId) === String(item.id))?.price;
        const received = receiveMerchantItem(merchant, item.id, acquisitionUnits, storePrice ?? item.goldValue ?? unitPrice);
        const recorded = appendMerchantTransaction(received.merchant, {
            type: 'sale', buyerId: seller.id, buyerName: seller.name,
            itemId: item.id, itemName: item.name,
            quantity: sale.quantity, acquisitionUnits,
            unitPrice, total: sale.total, discountPercent: activeShop.discountPercent || 0
        });
        root.worldStore.updateNpc(npc.id, { merchant: recorded.merchant });
        root.addCombatHistoryEntry?.(
            `${seller.name} vendeu ${item.name} x${sale.quantity}`,
            `Loja: ${merchant.name}\nUnidades de estoque: ${acquisitionUnits}\nOferta por unidade: ${unitPrice} Coroas\nTotal recebido: ${sale.total} Coroas\nSaldo: ${sale.balanceAfter}\nBônus de Negócios: ${activeShop.discountPercent || 0}%`,
            { type: 'item', actor: { id: seller.id, name: seller.name }, participants: [{ id: seller.id, name: seller.name }], merchant: { npcId: npc.id, itemId: item.id, total: sale.total, transactionType: 'sale' } }
        );
        root.showToast?.(`💰 ${item.name} vendido por ${sale.total} Coroas.`);
        renderMerchantShop();
        return sale;
    }

    function restockWorldMerchant(npcId, keepEditorOpen = false) {
        if (root.collaborationSession?.isPlayer?.()) return;
        if (keepEditorOpen && editorNpcId === String(npcId)) captureEditorDraft();
        const npc = getWorldNpc(npcId);
        const source = keepEditorOpen && editorDraft ? editorDraft : npc?.merchant;
        if (!npc || !source) return;
        const result = restockMerchant(source, { force: true, afterMinute: getCurrentCampaignMinute() });
        root.worldStore.updateNpc(npc.id, { merchant: result.merchant });
        if (keepEditorOpen) {
            editorDraft = clone(result.merchant);
            renderMerchantEditor(true);
        } else if (activeShop?.npcId === String(npc.id)) renderMerchantShop();
        root.showToast?.(`📦 Estoque reposto: ${result.itemsAdded} produtos e ${result.servicesAdded} serviços.`);
    }

    function processTimedRestocks(context = {}, preview = false) {
        if (root.collaborationSession?.isPlayer?.()) return null;
        const world = root.worldStore?.getWorld?.();
        if (!world) return null;
        let shopsDue = 0;
        let itemsAdded = 0;
        let servicesAdded = 0;
        const next = clone(world);
        next.npcs = next.npcs.map(npc => {
            if (!npc.merchant || !getRestockIntervalMinutes(npc.merchant)) return npc;
            const result = restockMerchant(npc.merchant, context);
            if (!result.cycles) return npc;
            shopsDue += 1;
            itemsAdded += result.itemsAdded;
            servicesAdded += result.servicesAdded;
            return { ...npc, merchant: result.merchant };
        });
        if (!shopsDue) return null;
        if (preview) return { summary: `${shopsDue} loja${shopsDue === 1 ? '' : 's'} terão reposição de estoque` };
        root.worldStore.saveWorld(next, 'world-merchant-restocked');
        return { summary: `${shopsDue} loja${shopsDue === 1 ? '' : 's'} reposta${shopsDue === 1 ? '' : 's'}`, detail: `${itemsAdded} produtos e ${servicesAdded} serviços adicionados`, shopsDue, itemsAdded, servicesAdded };
    }

    root.campaignClock?.registerTimeProcessor?.({
        id: 'world-merchant-restock',
        name: 'Reposição de comerciantes',
        preview: context => processTimedRestocks(context, true),
        apply: context => processTimedRestocks(context, false)
    });

    const api = Object.freeze({ CATEGORY_LABELS, RESTOCK_LABELS, getRestockIntervalMinutes, calculateDiscountedPrice, calculateBuybackPrice, resolveBusinessNegotiation, restockMerchant, consumeMerchantEntry, receiveMerchantItem, appendMerchantTransaction, getMerchantCategoryLabel, getRestockLabel, renderNpcCommerce });
    root.worldCommerce = api;
    root.openWorldMerchantEditor = openWorldMerchantEditor;
    root.closeWorldMerchantEditor = closeWorldMerchantEditor;
    root.addWorldMerchantCatalogItem = addWorldMerchantCatalogItem;
    root.removeWorldMerchantCatalogItem = removeWorldMerchantCatalogItem;
    root.addWorldMerchantService = addWorldMerchantService;
    root.removeWorldMerchantService = removeWorldMerchantService;
    root.saveWorldMerchant = saveWorldMerchant;
    root.removeWorldMerchant = removeWorldMerchant;
    root.openWorldMerchantShop = openWorldMerchantShop;
    root.closeWorldMerchantShop = closeWorldMerchantShop;
    root.selectWorldMerchantBuyer = selectWorldMerchantBuyer;
    root.performWorldMerchantNegotiation = performWorldMerchantNegotiation;
    root.requestWorldMerchantPurchase = requestWorldMerchantPurchase;
    root.requestWorldMerchantService = requestWorldMerchantService;
    root.purchaseWorldMerchantItem = purchaseWorldMerchantItem;
    root.hireWorldMerchantService = hireWorldMerchantService;
    root.sellWorldMerchantItem = sellWorldMerchantItem;
    root.restockWorldMerchant = restockWorldMerchant;

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
