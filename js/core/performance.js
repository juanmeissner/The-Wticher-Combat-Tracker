(function initializeAppPerformance(root) {
    'use strict';

    const metrics = new Map();
    const progressiveJobs = new WeakMap();
    const LONG_TASK_THRESHOLD_MS = 50;

    function clock() {
        return root?.performance?.now?.() ?? Date.now();
    }

    function record(name, duration, detail = {}) {
        const key = String(name || 'operation');
        const elapsed = Math.max(0, Number(duration) || 0);
        const current = metrics.get(key) || {
            name: key,
            count: 0,
            totalMs: 0,
            averageMs: 0,
            maximumMs: 0,
            lastMs: 0,
            longTasks: 0,
            lastDetail: null
        };
        current.count += 1;
        current.totalMs += elapsed;
        current.averageMs = current.totalMs / current.count;
        current.maximumMs = Math.max(current.maximumMs, elapsed);
        current.lastMs = elapsed;
        current.longTasks += elapsed >= LONG_TASK_THRESHOLD_MS ? 1 : 0;
        current.lastDetail = detail && typeof detail === 'object' ? { ...detail } : null;
        metrics.set(key, current);
        return { ...current };
    }

    function measure(name, callback, detail = {}) {
        const startedAt = clock();
        try {
            const result = callback();
            if (result && typeof result.then === 'function') {
                return result.finally(() => record(name, clock() - startedAt, detail));
            }
            record(name, clock() - startedAt, detail);
            return result;
        } catch (error) {
            record(name, clock() - startedAt, { ...detail, failed: true });
            throw error;
        }
    }

    function scheduleIdle(callback) {
        if (typeof root?.requestIdleCallback === 'function') {
            return root.requestIdleCallback(callback, { timeout: 120 });
        }
        return root?.setTimeout?.(() => callback({ timeRemaining: () => 8, didTimeout: true }), 0);
    }

    function cancelIdle(handle) {
        if (typeof root?.cancelIdleCallback === 'function') root.cancelIdleCallback(handle);
        else root?.clearTimeout?.(handle);
    }

    function cancelProgressiveRender(container) {
        const active = progressiveJobs.get(container);
        if (!active) return false;
        active.cancelled = true;
        if (active.handle !== null) cancelIdle(active.handle);
        progressiveJobs.delete(container);
        container?.removeAttribute?.('aria-busy');
        return true;
    }

    function renderProgressiveList(container, entries, renderEntry, options = {}) {
        if (!container || typeof renderEntry !== 'function') return null;
        cancelProgressiveRender(container);

        const items = Array.isArray(entries) ? entries : [];
        const batchSize = Math.max(1, Number(options.batchSize) || 32);
        const initialBatchSize = Math.max(1, Number(options.initialBatchSize) || batchSize);
        const metricName = String(options.metricName || 'render:list');
        const job = {
            cancelled: false,
            handle: null,
            index: 0,
            startedAt: clock(),
            total: items.length
        };
        progressiveJobs.set(container, job);
        container.innerHTML = '';

        if (!items.length) {
            container.innerHTML = String(options.emptyHtml || '');
            progressiveJobs.delete(container);
            record(metricName, clock() - job.startedAt, { items: 0, batches: 0 });
            return job;
        }

        container.setAttribute('aria-busy', 'true');
        let batches = 0;

        const appendBatch = limit => {
            if (job.cancelled || progressiveJobs.get(container) !== job) return false;
            const fragment = root.document.createDocumentFragment();
            const maximum = Math.min(items.length, job.index + limit);
            for (; job.index < maximum; job.index += 1) {
                const template = root.document.createElement('template');
                template.innerHTML = String(renderEntry(items[job.index], job.index) || '').trim();
                fragment.appendChild(template.content);
            }
            container.appendChild(fragment);
            batches += 1;
            return job.index < items.length;
        };

        const continueRendering = deadline => {
            if (job.cancelled || progressiveJobs.get(container) !== job) return;
            let hasMore = true;
            do {
                hasMore = appendBatch(batchSize);
            } while (hasMore && Number(deadline?.timeRemaining?.() || 0) > 4);

            if (hasMore) {
                job.handle = scheduleIdle(continueRendering);
                return;
            }

            progressiveJobs.delete(container);
            container.removeAttribute('aria-busy');
            record(metricName, clock() - job.startedAt, { items: items.length, batches });
            options.onComplete?.(items.length);
        };

        const hasMore = appendBatch(initialBatchSize);
        if (hasMore) job.handle = scheduleIdle(continueRendering);
        else {
            progressiveJobs.delete(container);
            container.removeAttribute('aria-busy');
            record(metricName, clock() - job.startedAt, { items: items.length, batches });
            options.onComplete?.(items.length);
        }
        return job;
    }

    function getReport() {
        return [...metrics.values()]
            .map(entry => ({ ...entry, lastDetail: entry.lastDetail ? { ...entry.lastDetail } : null }))
            .sort((left, right) => right.totalMs - left.totalMs);
    }

    function reset() {
        metrics.clear();
    }

    if (typeof root?.PerformanceObserver === 'function') {
        try {
            const observer = new root.PerformanceObserver(list => {
                list.getEntries().forEach(entry => record('browser:long-task', entry.duration, {
                    startTime: entry.startTime
                }));
            });
            observer.observe({ type: 'longtask', buffered: true });
        } catch {
            // Alguns navegadores ainda não oferecem a entrada longtask.
        }
    }

    const api = Object.freeze({
        LONG_TASK_THRESHOLD_MS,
        record,
        measure,
        renderProgressiveList,
        cancelProgressiveRender,
        getReport,
        reset
    });

    root.appPerformance = api;
    root.renderProgressiveList = renderProgressiveList;
    root.getAppPerformanceReport = getReport;
})(typeof globalThis !== 'undefined' ? globalThis : window);
