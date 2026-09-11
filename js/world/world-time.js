(function initializeWorldTime(root) {
    'use strict';

    const DAY_LABELS = Object.freeze(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    const RECURRENCE_LABELS = Object.freeze({ none: 'Uma vez', daily: 'Diário', weekly: 'Semanal', annual: 'Anual' });
    let pendingTravelPlan = null;

    function clone(value, fallback = null) {
        try { return JSON.parse(JSON.stringify(value ?? fallback)); } catch { return fallback; }
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }

    function timeToMinute(value) {
        const [hour, minute] = String(value || '00:00').split(':').map(Number);
        return Math.max(0, Math.min(1439, (Number(hour) || 0) * 60 + (Number(minute) || 0)));
    }

    function isScheduleActive(schedule, campaignMinute, clock = root.campaignClock) {
        if (!schedule?.enabled && Object.prototype.hasOwnProperty.call(schedule || {}, 'enabled')) return false;
        const parts = clock?.getDateParts?.(campaignMinute);
        if (!parts || !(schedule?.weekdays || []).includes(parts.weekday)) return false;
        const current = parts.hour * 60 + parts.minute;
        const start = timeToMinute(schedule.opensAt || schedule.startsAt);
        const end = timeToMinute(schedule.closesAt || schedule.endsAt);
        if (start === end) return true;
        return start < end ? current >= start && current < end : current >= start || current < end;
    }

    function isMerchantOpen(merchant, campaignMinute = Number(root.campaignClock?.getSnapshot?.()?.currentMinute) || 0) {
        if (!merchant?.openingSchedule?.enabled) return true;
        return isScheduleActive(merchant.openingSchedule, campaignMinute);
    }

    function getNpcActiveSchedule(npc, campaignMinute = Number(root.campaignClock?.getSnapshot?.()?.currentMinute) || 0) {
        return (npc?.schedule || []).find(entry => isScheduleActive(entry, campaignMinute)) || null;
    }

    function locationContains(world, regionId, locationId) {
        if (!regionId) return true;
        let current = root.worldModel?.getLocation?.(world, locationId);
        const visited = new Set();
        while (current && !visited.has(current.id)) {
            if (String(current.id) === String(regionId)) return true;
            visited.add(current.id);
            current = current.parentId ? root.worldModel?.getLocation?.(world, current.parentId) : null;
        }
        return false;
    }

    function getEventOccurrenceMinutes(event, beforeMinute, afterMinute, clock = root.campaignClock) {
        if (!event?.enabled || afterMinute <= beforeMinute) return [];
        const start = Number(event.startMinute) || 0;
        if (event.recurrence === 'none') return start > beforeMinute && start <= afterMinute ? [start] : [];
        if (event.recurrence === 'daily' || event.recurrence === 'weekly') {
            const interval = event.recurrence === 'daily' ? 1440 : 10080;
            const first = start > beforeMinute ? start : start + Math.max(0, Math.floor((beforeMinute - start) / interval) + 1) * interval;
            const result = [];
            for (let minute = first; minute <= afterMinute && result.length < 500; minute += interval) result.push(minute);
            return result;
        }
        const original = clock?.getDateParts?.(start);
        const firstYear = clock?.getDateParts?.(beforeMinute)?.astronomicalYear;
        const lastYear = clock?.getDateParts?.(afterMinute)?.astronomicalYear;
        if (!original || !Number.isFinite(firstYear) || !Number.isFinite(lastYear)) return [];
        const result = [];
        for (let year = firstYear; year <= lastYear && result.length < 500; year++) {
            const display = clock.fromAstronomicalYear(year);
            const date = `${String(display.year).padStart(4, '0')}-${String(original.month).padStart(2, '0')}-${String(original.day).padStart(2, '0')}`;
            const time = `${String(original.hour).padStart(2, '0')}:${String(original.minute).padStart(2, '0')}`;
            const minute = clock.minuteFromInputs(date, time, display.era);
            if (minute > beforeMinute && minute <= afterMinute) result.push(minute);
        }
        return result;
    }

    function getRelevantRegionalEvents(world, locationId, campaignMinute = Number(root.campaignClock?.getSnapshot?.()?.currentMinute) || 0) {
        return (world?.regionalEvents || []).filter(event => {
            if (!event.enabled || !locationContains(world, event.locationId, locationId)) return false;
            if (event.recurrence !== 'none') return true;
            return Number(event.endMinute) >= campaignMinute;
        }).sort((left, right) => Number(left.startMinute) - Number(right.startMinute));
    }

    function collectTemporalChanges(context, preview = false) {
        if (root.collaborationSession?.isPlayer?.()) return null;
        const world = root.worldStore?.getWorld?.();
        if (!world) return null;
        const occurrences = [];
        (world.regionalEvents || []).forEach(event => {
            getEventOccurrenceMinutes(event, context.beforeMinute, context.afterMinute).forEach(minute => {
                const key = `${event.id}:${minute}`;
                const processed = Array.isArray(event.processedOccurrences) ? event.processedOccurrences : [];
                if (event.lastTriggeredOccurrence !== key && !processed.includes(key)) occurrences.push({ event, minute, key });
            });
        });
        const shopChanges = (world.npcs || []).filter(npc => npc.merchant?.openingSchedule?.enabled)
            .map(npc => ({ npc, before: isMerchantOpen(npc.merchant, context.beforeMinute), after: isMerchantOpen(npc.merchant, context.afterMinute) }))
            .filter(entry => entry.before !== entry.after);
        const routineChanges = (world.npcs || []).map(npc => ({
            npc,
            before: getNpcActiveSchedule(npc, context.beforeMinute),
            after: getNpcActiveSchedule(npc, context.afterMinute)
        })).filter(entry => String(entry.before?.id || '') !== String(entry.after?.id || ''));
        if (!occurrences.length && !shopChanges.length && !routineChanges.length) return null;

        const summaryParts = [];
        if (occurrences.length) summaryParts.push(`${occurrences.length} evento${occurrences.length === 1 ? '' : 's'} regional${occurrences.length === 1 ? '' : 'is'}`);
        if (shopChanges.length) summaryParts.push(`${shopChanges.length} mudança${shopChanges.length === 1 ? '' : 's'} de loja`);
        if (routineChanges.length) summaryParts.push(`${routineChanges.length} mudança${routineChanges.length === 1 ? '' : 's'} de rotina`);
        if (preview) return { summary: summaryParts.join(' · '), occurrences, shopChanges, routineChanges };

        if (occurrences.length) {
            const next = clone(world);
            occurrences.forEach(occurrence => {
                const event = next.regionalEvents.find(entry => entry.id === occurrence.event.id);
                if (event) {
                    event.lastTriggeredOccurrence = occurrence.key;
                    event.processedOccurrences = [...(Array.isArray(event.processedOccurrences) ? event.processedOccurrences : []), occurrence.key].slice(-500);
                }
            });
            root.worldStore.saveWorld(next, 'world-regional-events-processed');
            root.showToast?.(`📍 ${occurrences.length} evento${occurrences.length === 1 ? '' : 's'} regional${occurrences.length === 1 ? '' : 'is'} alcançado${occurrences.length === 1 ? '' : 's'}.`);
        }
        const detail = [
            ...occurrences.map(entry => `📍 ${entry.event.title} · ${formatCampaignMinute(entry.minute)}`),
            ...shopChanges.map(entry => `🏪 ${entry.npc.merchant.name}: ${entry.after ? 'abriu' : 'fechou'}`),
            ...routineChanges.map(entry => `🧑 ${entry.npc.name}: ${entry.after?.label || 'fora da rotina cadastrada'}`)
        ].join('\n');
        return { summary: summaryParts.join(' · '), detail, occurrences, shopChanges, routineChanges };
    }

    function formatCampaignMinute(minute) {
        return root.campaignClock?.formatDateShort?.(minute) || `minuto ${minute}`;
    }

    function closeWorldTimeModal(id) {
        if (id === 'worldTravelModal') {
            pendingTravelPlan = null;
            root.worldMap?.clearRoutePreview?.();
        }
        root.document?.getElementById(id)?.remove();
    }

    function renderLocationOptions(world, selectedId = '', excludeId = '', options = {}) {
        return (world?.locations || []).filter(location => location.id !== root.worldModel?.ROOT_CONTINENT_ID
            && location.id !== excludeId
            && (options.coordinatesOnly !== true || (Number.isFinite(Number(location.coordinates?.x)) && Number.isFinite(Number(location.coordinates?.y)))))
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
            .map(location => `<option value="${escapeHtml(location.id)}"${String(selectedId) === String(location.id) ? ' selected' : ''}>${escapeHtml((root.worldModel?.getLocationPath?.(world, location.id) || [location]).map(entry => entry.name).join(' › '))}</option>`)
            .join('');
    }

    function getTravelOwners() {
        const participants = typeof combatants !== 'undefined' && Array.isArray(combatants)
            ? combatants.filter(entry => entry.type === 'player')
            : [];
        const sheets = typeof characterSheets !== 'undefined' && Array.isArray(characterSheets) ? characterSheets : [];
        const representedSheetIds = new Set(participants.map(owner => String(owner.sheetId || '')).filter(Boolean));
        return [
            ...participants.map(owner => ({ key: `combatant:${owner.id}`, owner })),
            ...sheets.filter(owner => !representedSheetIds.has(String(owner.id))
                && !participants.some(participant => String(participant.id) === String(owner.id)))
                .map(owner => ({ key: `sheet:${owner.id}`, owner }))
        ];
    }

    function hasTravelAbility(owner, abilityId) {
        const normalizedId = String(abilityId || '').trim();
        if (!owner || !normalizedId) return false;
        if ((Array.isArray(owner.learnedAbilityIds) ? owner.learnedAbilityIds : []).some(id => String(id) === normalizedId)) return true;
        return (Array.isArray(owner.abilities) ? owner.abilities : []).some(ability =>
            String(ability?.id || '') === normalizedId
            || (normalizedId === 'portal_vertical' && String(ability?.name || '').trim().toLocaleLowerCase('pt-BR') === 'portal vertical'));
    }

    function getTravelCapacity(mode) {
        if (mode === 'horse') return 1;
        if (mode === 'carriage' || mode === 'portal') return Number.POSITIVE_INFINITY;
        return 0;
    }

    function getTransportOptions(owner) {
        const options = [{ value: 'foot', mode: 'foot', assetId: null, label: '🥾 A pé', movement: Math.max(1, Number(owner?.movement) || 10), passengerLimit: 0 }];
        if (hasTravelAbility(owner, 'portal_vertical')) {
            options.push({ value: 'portal:portal_vertical', mode: 'portal', assetId: 'portal_vertical', label: '🌀 Portal Vertical · 1 turno', name: 'Portal Vertical', movement: 0, passengerLimit: Number.POSITIVE_INFINITY });
        }
        if (!owner || typeof root.ensureTransportState !== 'function') return options;
        const state = root.ensureTransportState(owner);
        (state?.mounts || []).forEach(mount => {
            const movement = Number(root.getMountMovement?.(owner, mount)) || 0;
            if (Number(mount.hpCurrent) <= 0 || mount.attachedVehicleId || movement <= 0) return;
            options.push({ value: `horse:${mount.id}`, mode: 'horse', assetId: mount.id, label: `🐎 ${mount.name} · MOV ${movement} · +1 passageiro`, name: mount.name, movement, passengerLimit: 1 });
        });
        (state?.vehicles || []).forEach(vehicle => {
            const movement = Number(root.getVehicleMovement?.(owner, vehicle)) || 0;
            if (Number(vehicle.hpCurrent) <= 0 || movement <= 0) return;
            options.push({ value: `carriage:${vehicle.id}`, mode: 'carriage', assetId: vehicle.id, label: `🛒 ${vehicle.name} · MOV ${movement} · grupo`, name: vehicle.name, movement, passengerLimit: Number.POSITIVE_INFINITY });
        });
        return options;
    }

    function renderTransportOptions(owner, selectedValue = 'foot') {
        return getTransportOptions(owner).map(option => `<option value="${escapeHtml(option.value)}"${option.value === selectedValue ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
    }

    function getTravelPlannerSelection() {
        const form = root.document?.querySelector?.('#worldTravelModal form');
        if (!form) return null;
        const ownerEntry = getTravelOwners().find(entry => entry.key === String(form.elements.travelerKey?.value || '')) || null;
        const owner = ownerEntry?.owner || null;
        const options = getTransportOptions(owner);
        const transport = options.find(option => option.value === form.elements.transport?.value) || options[0];
        return { form, ownerEntry, owner, transport };
    }

    function renderTravelPartySelector(selection) {
        const capacity = getTravelCapacity(selection?.transport?.mode);
        const candidates = getTravelOwners().filter(entry => entry.key !== selection?.ownerEntry?.key);
        if (!selection?.ownerEntry || capacity <= 0 || !candidates.length) return '';
        const legend = capacity === 1
            ? 'Passageiro adicional · escolha até 1'
            : selection.transport.mode === 'portal'
                ? 'Personagens que atravessarão o Portal Vertical'
                : 'Personagens que viajarão na carroça';
        const help = capacity === 1
            ? 'O cavalo transporta o dono e mais um personagem.'
            : 'Marque todos os personagens que acompanharão o responsável pela viagem.';
        return `<fieldset class="world-time-checklist world-travel-party"><legend>${escapeHtml(legend)}</legend><small class="world-travel-party-help">${escapeHtml(help)}</small>${candidates.map(entry => `<label><input type="checkbox" name="travelerKeys" value="${escapeHtml(entry.key)}" onchange="updateWorldTravelCompanionSelection(this)"><span>${escapeHtml(entry.owner?.name || 'Personagem')}</span></label>`).join('')}</fieldset>`;
    }

    function getSelectedTravelers(selection) {
        if (!selection?.ownerEntry) return [];
        const selectedKeys = new Set(Array.from(selection.form.querySelectorAll?.('input[name="travelerKeys"]:checked') || []).map(input => String(input.value)));
        const capacity = getTravelCapacity(selection.transport.mode);
        const selectedCompanions = getTravelOwners()
            .filter(entry => entry.key !== selection.ownerEntry.key && selectedKeys.has(entry.key));
        const companions = Number.isFinite(capacity)
            ? selectedCompanions.slice(0, capacity)
            : selectedCompanions;
        return [selection.ownerEntry, ...companions].map((entry, index) => ({
            id: String(entry.owner?.id || '') || null,
            name: String(entry.owner?.name || 'Personagem'),
            role: index === 0 ? 'leader' : 'companion'
        }));
    }

    function updateWorldTravelCompanions() {
        const selection = getTravelPlannerSelection();
        const area = root.document?.getElementById?.('worldTravelCompanionArea');
        if (area) area.innerHTML = selection ? renderTravelPartySelector(selection) : '';
        return updateWorldTravelPreview();
    }

    function updateWorldTravelCompanionSelection(changedInput) {
        const selection = getTravelPlannerSelection();
        const capacity = getTravelCapacity(selection?.transport?.mode);
        if (changedInput?.checked && Number.isFinite(capacity)) {
            const checked = Array.from(selection.form.querySelectorAll?.('input[name="travelerKeys"]:checked') || []);
            checked.filter(input => input !== changedInput).slice(0, Math.max(0, checked.length - capacity)).forEach(input => { input.checked = false; });
        }
        return updateWorldTravelPreview();
    }

    function updateWorldTravelTransports() {
        const selection = getTravelPlannerSelection();
        if (!selection) return;
        const field = selection.form.elements.transport;
        if (field) field.innerHTML = renderTransportOptions(selection.owner, 'foot');
        updateWorldTravelCompanions();
    }

    function updateWorldTravelPreview() {
        const selection = getTravelPlannerSelection();
        const preview = root.document?.getElementById?.('worldTravelRoutePreview');
        const submit = root.document?.getElementById?.('worldTravelConfirmButton');
        if (!selection || !preview) return null;
        const world = root.worldStore?.getWorld?.();
        const origin = root.worldStore?.getCurrentLocation?.();
        const destination = root.worldModel?.getLocation?.(world, selection.form.elements.destinationId?.value);
        pendingTravelPlan = null;
        root.worldMap?.clearRoutePreview?.();
        if (!origin?.coordinates || !destination?.coordinates) {
            preview.innerHTML = '<p class="world-travel-route-error">Selecione uma origem e um destino com coordenadas no mapa.</p>';
            if (submit) submit.disabled = true;
            return null;
        }
        const network = root.worldMap?.getRoadNetwork?.() || { nodes: root.worldRoadData?.ROAD_NODES || [], segments: root.worldRoadData?.ROAD_SEGMENTS || [] };
        const plan = root.worldRouteEngine?.planRoute?.({
            origin,
            destination,
            mode: selection.transport.mode,
            movement: selection.transport.movement,
            mapSettings: world.mapSettings,
            nodes: network.nodes,
            segments: network.segments
        });
        if (!plan?.ok) {
            preview.innerHTML = `<p class="world-travel-route-error">${escapeHtml(plan?.error || 'Não foi possível calcular esta rota.')}</p>`;
            if (submit) submit.disabled = true;
            return null;
        }
        const travelers = getSelectedTravelers(selection);
        pendingTravelPlan = { ...plan, destinationId: destination.id, transport: { ...selection.transport }, travelerId: selection.owner?.id || null, travelerName: selection.owner?.name || '', travelers };
        root.worldMap?.showRoutePreview?.(plan.points);
        const isPortal = plan.mode === 'portal';
        const routeLabel = isPortal ? 'Sem uso de estradas' : plan.usesRoads && plan.usesOffRoad ? 'Estradas e trechos fora de estrada' : plan.usesRoads ? 'Pelas estradas' : 'Fora de estrada';
        const durationLabel = isPortal ? '1 turno · 1 min' : (root.campaignClock?.formatDuration?.(plan.durationMinutes) || `${plan.durationMinutes} min`);
        const travelerNames = travelers.map(entry => entry.name).join(', ');
        preview.innerHTML = `<div class="world-travel-route-heading"><div><small>${isPortal ? 'DESLOCAMENTO INSTANTÂNEO' : 'ROTA CALCULADA POR A*'}</small><strong>${escapeHtml(origin.name)} → ${escapeHtml(destination.name)}</strong></div><b>${escapeHtml(durationLabel)}</b></div><div class="world-travel-route-stats"><span><b>${plan.distanceKm.toLocaleString('pt-BR')} km</b>Distância no mapa</span><span><b>${isPortal ? 'Portal' : `${plan.speedKmh.toLocaleString('pt-BR')} km/h`}</b>${isPortal ? 'Viagem mágica' : 'Velocidade média'}</span><span><b>${escapeHtml(routeLabel)}</b>${isPortal ? 'Destino direto' : `${plan.roadDistanceKm.toLocaleString('pt-BR')} km em estrada`}</span></div>${travelerNames ? `<p class="world-travel-party-summary"><b>Viajantes:</b> ${escapeHtml(travelerNames)}</p>` : ''}<p>Escala usada: <b>${plan.scale.kilometersPerGrid.toLocaleString('pt-BR')} km por quadrícula</b>. Alterar a calibração do mapa recalculará esta viagem.</p>`;
        if (submit) submit.disabled = false;
        return pendingTravelPlan;
    }

    async function openWorldTravelPlanner(destinationId = '') {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Somente o mestre pode deslocar a campanha.');
        try {
            await root.worldFeatureLoader?.ensureRouteFeatures?.();
        } catch (error) {
            root.showToast?.(error?.message || 'Não foi possível preparar o sistema de rotas.');
            return null;
        }
        closeWorldTimeModal('worldTravelModal');
        const world = root.worldStore?.getWorld?.();
        const current = root.worldStore?.getCurrentLocation?.();
        const npcs = (world?.npcs || []).filter(npc => !current || npc.currentLocationId === current.id);
        const owners = getTravelOwners();
        const firstOwner = owners[0]?.owner || null;
        const modal = root.document.createElement('div');
        modal.id = 'worldTravelModal';
        modal.className = 'session-overlay world-time-overlay';
        modal.innerHTML = `<section class="session-dialog world-time-dialog world-travel-dialog" role="dialog" aria-modal="true"><div class="session-dialog-header"><div><small class="world-hub-kicker">DESLOCAMENTO</small><h2>Planejar viagem</h2></div><button type="button" class="session-close" onclick="closeWorldTravelPlanner()">×</button></div><p>O sistema calcula a melhor rota, mostra a duração e só avança o relógio após a confirmação do mestre.</p><form onsubmit="confirmWorldTravel(event)"><label><span>Origem</span><input value="${escapeHtml(current?.name || 'Local não definido')}" disabled></label><label><span>Destino *</span><select name="destinationId" required onchange="updateWorldTravelPreview()"><option value="">Selecione o destino</option>${renderLocationOptions(world, destinationId, current?.id, { coordinatesOnly: true })}</select></label>${owners.length ? `<div class="world-time-form-grid"><label><span>Personagem responsável</span><select name="travelerKey" onchange="updateWorldTravelTransports()">${owners.map((entry, index) => `<option value="${escapeHtml(entry.key)}"${index === 0 ? ' selected' : ''}>${escapeHtml(entry.owner.name || 'Personagem')}</option>`).join('')}</select></label><label><span>Forma de viagem</span><select name="transport" onchange="updateWorldTravelCompanions()">${renderTransportOptions(firstOwner)}</select></label></div>` : `<label><span>Forma de viagem</span><select name="transport" onchange="updateWorldTravelCompanions()">${renderTransportOptions(null)}</select></label>`}<section id="worldTravelCompanionArea"></section><section id="worldTravelRoutePreview" class="world-travel-route-preview" aria-live="polite"><p>Selecione o destino para calcular a rota.</p></section><label><span>Observação</span><textarea name="note" rows="3" maxlength="2000" placeholder="Acontecimentos ou detalhes da viagem"></textarea></label><label><span>Visibilidade</span><select name="visibility"><option value="public">Visível aos jogadores</option><option value="private">Somente mestre</option></select></label>${npcs.length ? `<fieldset class="world-time-checklist"><legend>NPCs que viajam com o grupo</legend>${npcs.map(npc => `<label><input type="checkbox" name="movedNpcIds" value="${escapeHtml(npc.id)}"><span>${escapeHtml(npc.name)}</span></label>`).join('')}</fieldset>` : ''}<label class="world-travel-confirm"><input name="confirmRoute" type="checkbox" required><span>Confirmo esta rota e o avanço automático do relógio da campanha.</span></label><div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldTravelPlanner()">Cancelar</button><button id="worldTravelConfirmButton" type="submit" class="session-primary" disabled>Concluir viagem</button></div></form></section>`;
        modal.addEventListener('click', event => { if (event.target === modal) closeWorldTimeModal('worldTravelModal'); });
        root.document.body.appendChild(modal);
        if (destinationId) updateWorldTravelPreview();
    }

    function confirmWorldTravel(event) {
        event?.preventDefault?.();
        const data = new FormData(event.currentTarget);
        const destinationId = String(data.get('destinationId') || '');
        const plan = updateWorldTravelPreview();
        if (!data.get('confirmRoute')) return root.showToast?.('Confirme a rota antes de avançar o relógio.');
        if (!plan || plan.destinationId !== destinationId) return root.showToast?.('Calcule uma rota válida antes de concluir a viagem.');
        const minutes = plan.durationMinutes;
        const world = root.worldStore?.getWorld?.();
        const destination = root.worldModel?.getLocation?.(world, destinationId);
        if (!destination) {
            root.showToast?.('Selecione um destino válido antes de avançar o tempo.');
            return;
        }
        const snapshot = root.campaignClock?.getSnapshot?.();
        const departureMinute = Number(snapshot?.currentMinute) || 0;
        try {
            const advance = root.campaignClock?.advanceByMinutes?.(minutes, { source: 'world-travel' });
            const arrivalMinute = Number(advance?.context?.afterMinute ?? departureMinute + minutes);
            const travel = root.worldStore?.travelToLocation?.(destinationId, {
                departureMinute, arrivalMinute, durationMinutes: minutes,
                transportMode: plan.mode,
                transportLabel: plan.transport.name || plan.modeLabel,
                transportAssetId: plan.transport.assetId,
                travelerId: plan.travelerId,
                travelerName: plan.travelerName,
                travelers: plan.travelers,
                distanceKm: plan.distanceKm,
                roadDistanceKm: plan.roadDistanceKm,
                offRoadDistanceKm: plan.offRoadDistanceKm,
                routeNodeIds: plan.nodeIds,
                routeSegmentIds: plan.segmentIds,
                routeAlgorithm: plan.algorithm,
                scaleKilometersPerGrid: plan.scale.kilometersPerGrid,
                movedNpcIds: data.getAll('movedNpcIds').map(String),
                note: String(data.get('note') || '').trim(),
                visibility: data.get('visibility') === 'private' ? 'private' : 'public'
            });
            const travelerNames = (travel.travelers || []).map(entry => entry.name).filter(Boolean).join(', ');
            root.addCombatHistoryEntry?.(`Viagem concluída: ${travel.fromLocationName} → ${travel.toLocationName}`, `${travel.transportLabel} · ${travel.distanceKm.toLocaleString('pt-BR')} km\nDuração: ${plan.mode === 'portal' ? '1 turno (1 min)' : (root.campaignClock?.formatDuration?.(minutes) || `${minutes} min`)}${travelerNames ? `\nViajantes: ${travelerNames}` : ''}\nChegada: ${formatCampaignMinute(arrivalMinute)}${travel.note ? `\n${travel.note}` : ''}`, { type: 'turn' });
            closeWorldTimeModal('worldTravelModal');
            root.showToast?.(`🧭 O grupo chegou a ${travel.toLocationName}.`);
            root.openWorldHub?.('overview');
        } catch (error) { root.showToast?.(error?.message || 'Não foi possível concluir a viagem.'); }
    }

    function openWorldRegionalEventEditor(eventId = '') {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Somente o mestre pode editar eventos regionais.');
        closeWorldTimeModal('worldRegionalEventModal');
        const world = root.worldStore?.getWorld?.();
        const editing = (world?.regionalEvents || []).find(entry => entry.id === String(eventId));
        const snapshot = root.campaignClock?.getSnapshot?.();
        const start = Number(editing?.startMinute ?? snapshot?.currentMinute) || 0;
        const startParts = root.campaignClock?.getDateParts?.(start) || { year: 1276, era: 'DR' };
        const date = `${String(startParts.year).padStart(4, '0')}-${String(startParts.month).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}`;
        const time = `${String(startParts.hour).padStart(2, '0')}:${String(startParts.minute).padStart(2, '0')}`;
        const duration = Math.max(0, Number(editing?.endMinute ?? start) - start);
        const modal = root.document.createElement('div');
        modal.id = 'worldRegionalEventModal';
        modal.className = 'session-overlay world-time-overlay';
        modal.innerHTML = `<section class="session-dialog world-time-dialog" role="dialog" aria-modal="true"><div class="session-dialog-header"><div><small class="world-hub-kicker">AGENDA REGIONAL</small><h2>${editing ? 'Editar evento' : 'Criar evento'}</h2></div><button type="button" class="session-close" onclick="closeWorldRegionalEventEditor()">×</button></div><form onsubmit="saveWorldRegionalEvent(event, '${escapeHtml(eventId)}')"><label><span>Título *</span><input name="title" required maxlength="160" value="${escapeHtml(editing?.title || '')}"></label><label><span>Região ou local</span><select name="locationId"><option value="">Todo o Continente</option>${renderLocationOptions(world, editing?.locationId || '')}</select></label><div class="world-time-form-grid"><label><span>Data *</span><input name="date" type="text" inputmode="numeric" pattern="\\d{4,}-\\d{2}-\\d{2}" value="${date}" required></label><label><span>Era</span><select name="era"><option value="DR"${startParts.era !== 'AR' ? ' selected' : ''}>DR</option><option value="AR"${startParts.era === 'AR' ? ' selected' : ''}>AR</option></select></label><label><span>Horário</span><input name="time" type="time" value="${time}" required></label><label><span>Duração (min)</span><input name="durationMinutes" type="number" min="0" value="${duration}"></label></div><div class="world-time-form-grid"><label><span>Repetição</span><select name="recurrence">${Object.entries(RECURRENCE_LABELS).map(([value, label]) => `<option value="${value}"${(editing?.recurrence || 'none') === value ? ' selected' : ''}>${label}</option>`).join('')}</select></label><label><span>Visibilidade</span><select name="visibility"><option value="public"${editing?.visibility !== 'private' ? ' selected' : ''}>Público</option><option value="private"${editing?.visibility === 'private' ? ' selected' : ''}>Somente mestre</option></select></label></div><label><span>Descrição pública</span><textarea name="description" rows="4" maxlength="3000">${escapeHtml(editing?.description || '')}</textarea></label><label class="world-npc-private-field"><span>Anotações privadas</span><textarea name="privateNotes" rows="3" maxlength="4000">${escapeHtml(editing?.privateNotes || '')}</textarea></label><div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldRegionalEventEditor()">Cancelar</button><button type="submit" class="session-primary">Salvar evento</button></div></form></section>`;
        root.document.body.appendChild(modal);
    }

    function saveWorldRegionalEvent(event, eventId = '') {
        event?.preventDefault?.();
        const data = new FormData(event.currentTarget);
        const startMinute = root.campaignClock?.minuteFromInputs?.(String(data.get('date') || ''), String(data.get('time') || '00:00'), String(data.get('era') || 'DR'));
        if (!Number.isFinite(startMinute)) return root.showToast?.('Informe uma data válida para o evento.');
        const existing = (root.worldStore?.getWorld?.()?.regionalEvents || []).find(entry => entry.id === String(eventId));
        try {
            root.worldStore?.upsertRegionalEvent?.({
                ...existing, id: eventId || undefined,
                title: String(data.get('title') || '').trim(), description: String(data.get('description') || '').trim(),
                privateNotes: String(data.get('privateNotes') || '').trim(), locationId: String(data.get('locationId') || '') || null,
                startMinute, endMinute: startMinute + Math.max(0, Math.floor(Number(data.get('durationMinutes')) || 0)),
                recurrence: String(data.get('recurrence') || 'none'), visibility: data.get('visibility') === 'private' ? 'private' : 'public', enabled: true
            });
            closeWorldTimeModal('worldRegionalEventModal');
            root.showToast?.('📍 Evento regional salvo.');
            root.openWorldHub?.('events');
        } catch (error) { root.showToast?.(error?.message || 'Não foi possível salvar o evento.'); }
    }

    function removeWorldRegionalEvent(eventId) {
        if (root.collaborationSession?.isPlayer?.()) return;
        try { root.worldStore?.removeRegionalEvent?.(eventId); root.showToast?.('🗑️ Evento regional removido.'); root.openWorldHub?.('events'); }
        catch (error) { root.showToast?.(error?.message || 'Não foi possível remover o evento.'); }
    }

    function openWorldNpcScheduleEditor(npcId) {
        if (root.collaborationSession?.isPlayer?.()) return root.showToast?.('Somente o mestre pode editar horários de NPCs.');
        closeWorldTimeModal('worldNpcScheduleModal');
        const world = root.worldStore?.getWorld?.();
        const npc = root.worldModel?.getNpc?.(world, npcId);
        if (!npc) return;
        const modal = root.document.createElement('div');
        modal.id = 'worldNpcScheduleModal';
        modal.className = 'session-overlay world-time-overlay';
        modal.innerHTML = `<section class="session-dialog world-time-dialog" role="dialog" aria-modal="true"><div class="session-dialog-header"><div><small class="world-hub-kicker">ROTINA DO NPC</small><h2>${escapeHtml(npc.name)}</h2></div><button type="button" class="session-close" onclick="closeWorldNpcScheduleEditor()">×</button></div><div class="world-time-schedule-list">${(npc.schedule || []).length ? npc.schedule.map(entry => `<article><div><strong>${escapeHtml(entry.label)}</strong><span>${escapeHtml(entry.weekdays.map(day => DAY_LABELS[day]).join(', '))} · ${entry.startsAt}–${entry.endsAt}${entry.visibility === 'private' ? ' · Privado' : ''}</span></div><button type="button" class="session-danger" onclick="removeWorldNpcSchedule('${escapeHtml(npc.id)}','${escapeHtml(entry.id)}')">Remover</button></article>`).join('') : '<p class="world-atlas-empty">Nenhum horário cadastrado.</p>'}</div><form onsubmit="addWorldNpcSchedule(event, '${escapeHtml(npc.id)}')"><label><span>Atividade *</span><input name="label" required maxlength="120" placeholder="Ex.: Trabalha na forja"></label><label><span>Local</span><select name="locationId"><option value="">Localização atual do NPC</option>${renderLocationOptions(world, npc.currentLocationId || '')}</select></label><fieldset class="world-time-checklist"><legend>Dias da semana</legend>${DAY_LABELS.map((label, day) => `<label><input type="checkbox" name="weekdays" value="${day}" checked><span>${label}</span></label>`).join('')}</fieldset><div class="world-time-form-grid"><label><span>Início</span><input name="startsAt" type="time" value="08:00" required></label><label><span>Fim</span><input name="endsAt" type="time" value="18:00" required></label><label><span>Visibilidade</span><select name="visibility"><option value="public">Público</option><option value="private">Somente mestre</option></select></label></div><label><span>Informação pública</span><textarea name="publicInfo" rows="2" maxlength="1000"></textarea></label><label class="world-npc-private-field"><span>Anotação privada</span><textarea name="privateNotes" rows="2" maxlength="2000"></textarea></label><div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldNpcScheduleEditor()">Fechar</button><button type="submit" class="session-primary">+ Adicionar horário</button></div></form></section>`;
        root.document.body.appendChild(modal);
    }

    function addWorldNpcSchedule(event, npcId) {
        event?.preventDefault?.();
        const world = root.worldStore?.getWorld?.();
        const npc = root.worldModel?.getNpc?.(world, npcId);
        if (!npc) return;
        const data = new FormData(event.currentTarget);
        const schedule = [...(npc.schedule || []), root.worldModel.normalizeNpcScheduleEntry({
            label: String(data.get('label') || '').trim(), locationId: String(data.get('locationId') || '') || npc.currentLocationId || null,
            weekdays: data.getAll('weekdays').map(Number), startsAt: String(data.get('startsAt') || '08:00'), endsAt: String(data.get('endsAt') || '18:00'),
            visibility: data.get('visibility') === 'private' ? 'private' : 'public', publicInfo: String(data.get('publicInfo') || '').trim(), privateNotes: String(data.get('privateNotes') || '').trim()
        })];
        root.worldStore.updateNpc(npc.id, { schedule });
        openWorldNpcScheduleEditor(npc.id);
        root.showToast?.('🕰️ Horário adicionado.');
    }

    function removeWorldNpcSchedule(npcId, scheduleId) {
        const npc = root.worldModel?.getNpc?.(root.worldStore?.getWorld?.(), npcId);
        if (!npc || root.collaborationSession?.isPlayer?.()) return;
        root.worldStore.updateNpc(npc.id, { schedule: (npc.schedule || []).filter(entry => entry.id !== String(scheduleId)) });
        openWorldNpcScheduleEditor(npc.id);
    }

    root.campaignClock?.registerTimeProcessor?.({
        id: 'world-time-and-regional-events', name: 'Mundo, lojas e rotinas',
        preview: context => collectTemporalChanges(context, true),
        apply: context => collectTemporalChanges(context, false)
    });

    const api = Object.freeze({ DAY_LABELS, RECURRENCE_LABELS, timeToMinute, isScheduleActive, isMerchantOpen, getNpcActiveSchedule, locationContains, getEventOccurrenceMinutes, getRelevantRegionalEvents, collectTemporalChanges, formatCampaignMinute, hasTravelAbility, getTravelCapacity, getTransportOptions });
    root.worldTime = api;
    root.openWorldTravelPlanner = openWorldTravelPlanner;
    root.closeWorldTravelPlanner = () => closeWorldTimeModal('worldTravelModal');
    root.confirmWorldTravel = confirmWorldTravel;
    root.updateWorldTravelTransports = updateWorldTravelTransports;
    root.updateWorldTravelCompanions = updateWorldTravelCompanions;
    root.updateWorldTravelCompanionSelection = updateWorldTravelCompanionSelection;
    root.updateWorldTravelPreview = updateWorldTravelPreview;
    root.openWorldRegionalEventEditor = openWorldRegionalEventEditor;
    root.closeWorldRegionalEventEditor = () => closeWorldTimeModal('worldRegionalEventModal');
    root.saveWorldRegionalEvent = saveWorldRegionalEvent;
    root.removeWorldRegionalEvent = removeWorldRegionalEvent;
    root.openWorldNpcScheduleEditor = openWorldNpcScheduleEditor;
    root.closeWorldNpcScheduleEditor = () => closeWorldTimeModal('worldNpcScheduleModal');
    root.addWorldNpcSchedule = addWorldNpcSchedule;
    root.removeWorldNpcSchedule = removeWorldNpcSchedule;

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
