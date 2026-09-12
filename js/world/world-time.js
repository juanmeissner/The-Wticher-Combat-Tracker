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

    function encodeTravelReference(value) {
        return encodeURIComponent(String(value || ''));
    }

    function getParticipantTransportOptions(ownerEntry, owners = getTravelOwners()) {
        if (!ownerEntry) return [];
        const own = getTransportOptions(ownerEntry.owner).map(option => ({
            ...option,
            kind: 'self',
            ownerKey: ownerEntry.key,
            ownerId: String(ownerEntry.owner?.id || '') || null,
            ownerName: String(ownerEntry.owner?.name || 'Personagem')
        }));
        const shared = [];
        owners.filter(entry => entry.key !== ownerEntry.key).forEach(provider => {
            getTransportOptions(provider.owner)
                .filter(option => option.mode === 'horse' || option.mode === 'carriage')
                .forEach(option => shared.push({
                    value: `passenger|${option.mode}|${encodeTravelReference(provider.key)}|${encodeTravelReference(option.assetId)}`,
                    mode: 'passenger',
                    targetMode: option.mode,
                    targetOwnerKey: provider.key,
                    targetOwnerId: String(provider.owner?.id || '') || null,
                    targetOwnerName: String(provider.owner?.name || 'Personagem'),
                    assetId: option.assetId,
                    movement: option.movement,
                    name: option.name,
                    kind: 'passenger',
                    label: option.mode === 'horse'
                        ? `👥 Carona em ${option.name} · de ${provider.owner?.name || 'Personagem'}`
                        : `🛒 Passageiro em ${option.name} · de ${provider.owner?.name || 'Personagem'}`
                }));
        });
        return [...own, ...shared];
    }

    function getDefaultParticipantTransport(ownerEntry, options) {
        const activeMountId = String(ownerEntry?.owner?.transport?.activeMountId || '');
        return options.find(option => option.mode === 'horse' && String(option.assetId) === activeMountId)
            || options.find(option => option.mode === 'horse')
            || options.find(option => option.mode === 'foot')
            || options[0];
    }

    function renderTravelPartyPlanner(owners) {
        if (!owners.length) {
            return '<section class="world-travel-party-planner is-empty"><p>Nenhum personagem jogador está disponível. O deslocamento geral será calculado a pé.</p></section>';
        }
        return `<section class="world-travel-party-planner" aria-label="Organização dos participantes"><div class="world-travel-party-heading"><div><small>COMPOSIÇÃO DO GRUPO</small><strong>Como cada personagem viajará?</strong></div><span>${owners.length} selecionado${owners.length === 1 ? '' : 's'}</span></div><p>Todos começam marcados. Escolha cavalo próprio, carona, carruagem ou caminhada para cada participante.</p><div class="world-travel-participant-list">${owners.map(entry => {
            const options = getParticipantTransportOptions(entry, owners);
            const selected = getDefaultParticipantTransport(entry, options);
            return `<article class="world-travel-participant is-selected" data-travel-participant data-owner-key="${escapeHtml(entry.key)}"><label class="world-travel-participant-toggle"><input type="checkbox" name="participantKeys" value="${escapeHtml(entry.key)}" checked onchange="updateWorldTravelParticipant(this)"><span><b>${escapeHtml(entry.owner?.name || 'Personagem')}</b><small>Participará da viagem</small></span></label><label class="world-travel-participant-mode"><span>Forma de viagem</span><select data-travel-assignment onchange="updateWorldTravelPartyAssignment(this)">${options.map(option => `<option value="${escapeHtml(option.value)}"${option.value === selected?.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}</select></label></article>`;
        }).join('')}</div></section>`;
    }

    function getTravelPlannerSelection() {
        const form = root.document?.querySelector?.('#worldTravelModal form');
        if (!form) return null;
        const owners = getTravelOwners();
        const ownerByKey = new Map(owners.map(entry => [entry.key, entry]));
        const assignments = Array.from(form.querySelectorAll?.('[data-travel-participant]') || []).map(row => {
            const ownerEntry = ownerByKey.get(String(row.dataset?.ownerKey || '')) || null;
            const checkbox = row.querySelector?.('input[name="participantKeys"]');
            const select = row.querySelector?.('[data-travel-assignment]');
            if (!ownerEntry || !checkbox?.checked) return null;
            const options = getParticipantTransportOptions(ownerEntry, owners);
            const option = options.find(entry => entry.value === String(select?.value || '')) || getDefaultParticipantTransport(ownerEntry, options);
            return option ? { ownerEntry, owner: ownerEntry.owner, option } : null;
        }).filter(Boolean);
        if (!owners.length) {
            assignments.push({
                ownerEntry: null,
                owner: null,
                option: { value: 'foot', mode: 'foot', movement: 10, assetId: null, name: 'A pé', label: '🥾 A pé', kind: 'self' }
            });
        }
        return { form, owners, assignments };
    }

    function resolveTravelParty(selection) {
        const assignments = Array.isArray(selection?.assignments) ? selection.assignments : [];
        if (!assignments.length) return { ok: false, error: 'Selecione ao menos um personagem para a viagem.' };

        const portal = assignments.find(entry => entry.option?.mode === 'portal');
        if (portal) {
            const ordered = [portal, ...assignments.filter(entry => entry !== portal)];
            return {
                ok: true,
                portal: true,
                leader: portal.ownerEntry,
                units: [],
                transportLabel: `Portal Vertical${portal.owner?.name ? ` de ${portal.owner.name}` : ''}`,
                transportAssetId: 'portal_vertical',
                travelers: ordered.map((entry, index) => ({
                    id: String(entry.owner?.id || '') || null,
                    name: String(entry.owner?.name || 'Personagem'),
                    role: index === 0 ? 'leader' : 'companion',
                    transportMode: 'portal',
                    transportRole: entry === portal ? 'caster' : 'passenger',
                    transportAssetId: 'portal_vertical',
                    transportLabel: entry === portal ? 'Conjurador do Portal Vertical' : `Portal de ${portal.owner?.name || 'outro personagem'}`,
                    transportOwnerId: String(portal.owner?.id || '') || null,
                    transportOwnerName: String(portal.owner?.name || '')
                }))
            };
        }

        const drivers = new Map();
        assignments.forEach(entry => {
            if (!['horse', 'carriage'].includes(entry.option?.mode)) return;
            drivers.set(`${entry.ownerEntry?.key}|${entry.option.mode}|${entry.option.assetId}`, entry);
        });
        const passengerCounts = new Map();
        const travelers = [];
        const units = [];

        for (const [index, entry] of assignments.entries()) {
            const option = entry.option;
            if (option.mode === 'passenger') {
                const reference = `${option.targetOwnerKey}|${option.targetMode}|${option.assetId}`;
                const driver = drivers.get(reference);
                if (!driver) {
                    return { ok: false, error: `${entry.owner?.name || 'Um personagem'} escolheu ${option.name}, mas ${option.targetOwnerName} não está usando esse transporte.` };
                }
                const count = (passengerCounts.get(reference) || 0) + 1;
                if (option.targetMode === 'horse' && count > 1) {
                    return { ok: false, error: `${option.name} aceita somente um passageiro além do cavaleiro.` };
                }
                passengerCounts.set(reference, count);
                travelers.push({
                    id: String(entry.owner?.id || '') || null,
                    name: String(entry.owner?.name || 'Personagem'),
                    role: index === 0 ? 'leader' : 'companion',
                    transportMode: option.targetMode,
                    transportRole: 'passenger',
                    transportAssetId: String(option.assetId || '') || null,
                    transportLabel: option.targetMode === 'horse' ? `Carona em ${option.name}` : `Passageiro em ${option.name}`,
                    transportOwnerId: option.targetOwnerId,
                    transportOwnerName: option.targetOwnerName
                });
                continue;
            }

            const mode = ['foot', 'horse', 'carriage'].includes(option.mode) ? option.mode : 'foot';
            const transportLabel = mode === 'foot' ? 'A pé' : String(option.name || option.label || 'Transporte');
            travelers.push({
                id: String(entry.owner?.id || '') || null,
                name: String(entry.owner?.name || 'Personagem'),
                role: index === 0 ? 'leader' : 'companion',
                transportMode: mode,
                transportRole: mode === 'foot' ? 'walker' : 'driver',
                transportAssetId: String(option.assetId || '') || null,
                transportLabel,
                transportOwnerId: String(entry.owner?.id || '') || null,
                transportOwnerName: String(entry.owner?.name || '')
            });
            units.push({
                id: `travel-unit-${entry.ownerEntry?.key || 'campaign'}-${option.value}`,
                mode,
                movement: Math.max(1, Number(option.movement) || 10),
                label: transportLabel,
                assetId: option.assetId,
                ownerId: String(entry.owner?.id || '') || null,
                ownerName: String(entry.owner?.name || 'Grupo')
            });
        }

        if (!units.length) return { ok: false, error: 'A viagem precisa de ao menos um transporte conduzido ou um personagem a pé.' };
        return {
            ok: true,
            portal: false,
            leader: assignments[0]?.ownerEntry || null,
            units,
            travelers,
            transportAssetId: units.length === 1 ? units[0].assetId : null
        };
    }

    function updateWorldTravelParticipant(input) {
        const row = input?.closest?.('[data-travel-participant]');
        const select = row?.querySelector?.('[data-travel-assignment]');
        if (select) select.disabled = !input.checked;
        row?.classList?.toggle?.('is-selected', Boolean(input?.checked));
        const selected = root.document?.querySelectorAll?.('#worldTravelModal input[name="participantKeys"]:checked')?.length || 0;
        const badge = root.document?.querySelector?.('#worldTravelModal .world-travel-party-heading > span');
        if (badge) badge.textContent = `${selected} selecionado${selected === 1 ? '' : 's'}`;
        return updateWorldTravelPreview();
    }

    function updateWorldTravelPartyAssignment() {
        return updateWorldTravelPreview();
    }

    function updateWorldTravelCompanions() { return updateWorldTravelPreview(); }
    function updateWorldTravelCompanionSelection() { return updateWorldTravelPreview(); }
    function updateWorldTravelTransports() { return updateWorldTravelPreview(); }

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
        const party = resolveTravelParty(selection);
        if (!party.ok) {
            preview.innerHTML = `<p class="world-travel-route-error">${escapeHtml(party.error || 'Revise a composição do grupo antes de continuar.')}</p>`;
            if (submit) submit.disabled = true;
            return null;
        }
        const network = root.worldMap?.getRoadNetwork?.() || { nodes: root.worldRoadData?.ROAD_NODES || [], segments: root.worldRoadData?.ROAD_SEGMENTS || [] };
        const plan = party.portal
            ? root.worldRouteEngine?.planRoute?.({
                origin,
                destination,
                mode: 'portal',
                movement: 0,
                mapSettings: world.mapSettings,
                nodes: network.nodes,
                segments: network.segments
            })
            : root.worldRouteEngine?.planGroupRoute?.({
                origin,
                destination,
                units: party.units,
                mapSettings: world.mapSettings,
                nodes: network.nodes,
                segments: network.segments
            });
        if (!plan?.ok) {
            preview.innerHTML = `<p class="world-travel-route-error">${escapeHtml(plan?.error || 'Não foi possível calcular esta rota.')}</p>`;
            if (submit) submit.disabled = true;
            return null;
        }
        const leader = party.leader?.owner || null;
        const transportLabel = party.portal
            ? party.transportLabel
            : party.units.length === 1
                ? party.units[0].label
                : `Grupo misto · ritmo de ${plan.limitingUnit?.label || 'grupo'}`;
        pendingTravelPlan = {
            ...plan,
            destinationId: destination.id,
            travelerId: String(leader?.id || '') || null,
            travelerName: String(leader?.name || ''),
            travelers: party.travelers,
            transportLabel,
            transportAssetId: party.transportAssetId || null
        };
        root.worldMap?.showRoutePreview?.(plan);
        const isPortal = plan.mode === 'portal';
        const routeLabel = isPortal ? 'Sem uso de estradas' : 'Somente pelas estradas';
        const durationLabel = isPortal ? '1 turno · 1 min' : (root.campaignClock?.formatDuration?.(plan.durationMinutes) || `${plan.durationMinutes} min`);
        const assignments = party.travelers.map(entry => `${entry.name} — ${entry.transportLabel}`).join('; ');
        const paceLabel = isPortal ? 'Instantâneo' : (party.units.length > 1 ? (plan.limitingUnit?.label || 'Integrante mais lento') : transportLabel);
        preview.innerHTML = `<div class="world-travel-route-heading"><div><small>${isPortal ? 'DESLOCAMENTO INSTANTÂNEO' : 'ROTA DO GRUPO CALCULADA POR A*'}</small><strong>${escapeHtml(origin.name)} → ${escapeHtml(destination.name)}</strong></div><b>${escapeHtml(durationLabel)}</b></div><div class="world-travel-route-stats"><span><b>${plan.distanceKm.toLocaleString('pt-BR')} km</b>Distância pela rota</span><span><b>${isPortal ? 'Portal' : `${plan.speedKmh.toLocaleString('pt-BR')} km/h`}</b>${isPortal ? 'Viagem mágica' : 'Velocidade do grupo'}</span><span><b>${escapeHtml(routeLabel)}</b>${isPortal ? 'Destino direto' : `${plan.roadDistanceKm.toLocaleString('pt-BR')} km em estrada`}</span></div><p class="world-travel-party-summary"><b>Ritmo do grupo:</b> ${escapeHtml(paceLabel)}</p>${assignments ? `<p class="world-travel-assignment-summary"><b>Participantes:</b> ${escapeHtml(assignments)}</p>` : ''}<p>Escala usada: <b>${plan.scale.kilometersPerGrid.toLocaleString('pt-BR')} km por quadrícula</b>. Alterar a calibração do mapa recalculará esta viagem.</p>`;
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
        const modal = root.document.createElement('div');
        modal.id = 'worldTravelModal';
        const mapIsOpen = root.worldMap?.getDebugState?.().initialized === true;
        if (mapIsOpen) root.worldMap?.toggleFilters?.(false);
        modal.className = `session-overlay world-time-overlay${mapIsOpen ? ' world-travel-map-preview-overlay' : ''}`;
        modal.innerHTML = `<section class="session-dialog world-time-dialog world-travel-dialog" role="dialog" aria-modal="true"><div class="session-dialog-header"><div><small class="world-hub-kicker">DESLOCAMENTO</small><h2>Planejar viagem do grupo</h2></div><button type="button" class="session-close" onclick="closeWorldTravelPlanner()">×</button></div><p>Defina todos os participantes e como cada um viajará. O grupo inteiro chega junto no ritmo do transporte mais lento. Viagens físicas exigem uma rota contínua de estradas; Portal Vertical permanece instantâneo.</p><form onsubmit="confirmWorldTravel(event)"><label><span>Origem</span><input value="${escapeHtml(current?.name || 'Local não definido')}" disabled></label><label><span>Destino *</span><select name="destinationId" required onchange="updateWorldTravelPreview()"><option value="">Selecione o destino</option>${renderLocationOptions(world, destinationId, current?.id, { coordinatesOnly: true })}</select></label>${renderTravelPartyPlanner(owners)}<section id="worldTravelRoutePreview" class="world-travel-route-preview" aria-live="polite"><p>Selecione o destino para calcular a rota.</p></section><label><span>Observação</span><textarea name="note" rows="3" maxlength="2000" placeholder="Acontecimentos ou detalhes da viagem"></textarea></label><label><span>Visibilidade</span><select name="visibility"><option value="public">Visível aos jogadores</option><option value="private">Somente mestre</option></select></label>${npcs.length ? `<fieldset class="world-time-checklist"><legend>NPCs que viajam com o grupo</legend>${npcs.map(npc => `<label><input type="checkbox" name="movedNpcIds" value="${escapeHtml(npc.id)}"><span>${escapeHtml(npc.name)}</span></label>`).join('')}</fieldset>` : ''}<label class="world-travel-confirm"><input name="confirmRoute" type="checkbox" required><span>Confirmo esta rota e o avanço automático do relógio da campanha.</span></label><div class="session-dialog-actions"><button type="button" class="session-secondary" onclick="closeWorldTravelPlanner()">Cancelar</button><button id="worldTravelConfirmButton" type="submit" class="session-primary" disabled>Concluir viagem</button></div></form></section>`;
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
                transportLabel: plan.transportLabel || plan.modeLabel,
                transportAssetId: plan.transportAssetId,
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
            const travelerAssignments = (travel.travelers || []).map(entry => `${entry.name} — ${entry.transportLabel || 'A pé'}`).filter(Boolean).join('; ');
            root.addCombatHistoryEntry?.(`Viagem concluída: ${travel.fromLocationName} → ${travel.toLocationName}`, `${travel.transportLabel} · ${travel.distanceKm.toLocaleString('pt-BR')} km\nDuração: ${plan.mode === 'portal' ? '1 turno (1 min)' : (root.campaignClock?.formatDuration?.(minutes) || `${minutes} min`)}${travelerAssignments ? `\nParticipantes: ${travelerAssignments}` : ''}\nChegada: ${formatCampaignMinute(arrivalMinute)}${travel.note ? `\n${travel.note}` : ''}`, { type: 'turn' });
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

    const api = Object.freeze({ DAY_LABELS, RECURRENCE_LABELS, timeToMinute, isScheduleActive, isMerchantOpen, getNpcActiveSchedule, locationContains, getEventOccurrenceMinutes, getRelevantRegionalEvents, collectTemporalChanges, formatCampaignMinute, hasTravelAbility, getTravelCapacity, getTransportOptions, getParticipantTransportOptions, resolveTravelParty });
    root.worldTime = api;
    root.openWorldTravelPlanner = openWorldTravelPlanner;
    root.closeWorldTravelPlanner = () => closeWorldTimeModal('worldTravelModal');
    root.confirmWorldTravel = confirmWorldTravel;
    root.updateWorldTravelTransports = updateWorldTravelTransports;
    root.updateWorldTravelCompanions = updateWorldTravelCompanions;
    root.updateWorldTravelCompanionSelection = updateWorldTravelCompanionSelection;
    root.updateWorldTravelParticipant = updateWorldTravelParticipant;
    root.updateWorldTravelPartyAssignment = updateWorldTravelPartyAssignment;
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
