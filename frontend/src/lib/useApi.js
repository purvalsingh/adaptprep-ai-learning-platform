import { useCallback, useEffect, useRef, useState } from 'react';
import { get } from '../api/client';

// Fetch JSON on mount / when `path` changes. Returns { data, error, loading, reload, setData }.
export function useApi(path, { skip = false } = {}) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!skip && Boolean(path));
    const ctrl = useRef(null);

    const load = useCallback(async ({ quiet = false } = {}) => {
        if (!path || skip) return;
        ctrl.current?.abort();
        const c = new AbortController();
        ctrl.current = c;
        if (!quiet) setLoading(true);
        setError(null);
        try {
            const d = await get(path, { signal: c.signal });
            if (!c.signal.aborted) setData(d);
        } catch (e) {
            if (e.name !== 'AbortError') setError(e);
        } finally {
            if (!c.signal.aborted) setLoading(false);
        }
    }, [path, skip]);

    useEffect(() => {
        load();
        return () => ctrl.current?.abort();
    }, [load]);

    return { data, error, loading, reload: load, setData };
}

export function useDocumentTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} · AdaptPrep` : 'AdaptPrep — AI exam prep that adapts to you';
    }, [title]);
}
