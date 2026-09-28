import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Modal } from '../components/ui';

const UiContext = createContext(null);
const THEME_KEY = 'adaptprep-theme';

const readTheme = () => {
    try {
        const t = localStorage.getItem(THEME_KEY);
        if (t === 'light' || t === 'dark') return t;
    } catch { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function UiProvider({ children }) {
    const [theme, setThemeState] = useState(readTheme);
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const idRef = useRef(0);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const setTheme = (t) => {
        setThemeState(t);
        try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
    };

    const toast = useCallback((message, type = 'success') => {
        idRef.current += 1;
        const id = idRef.current;
        setToasts((t) => [...t.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }, []);

    // Promise-based confirm dialog: `if (await confirm({...})) doIt()`.
    const confirm = useCallback((opts) => new Promise((resolve) => {
        setConfirmState({ ...opts, resolve });
    }), []);

    const closeConfirm = (result) => {
        confirmState?.resolve(result);
        setConfirmState(null);
    };

    return (
        <UiContext.Provider value={{ theme, setTheme, toast, confirm }}>
            {children}
            <div className="toasts" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        {t.type === 'error' ? <AlertCircle size={18} /> : t.type === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
            {confirmState && (
                <Modal
                    title={confirmState.title || 'Are you sure?'}
                    onClose={() => closeConfirm(false)}
                    footer={(
                        <>
                            <button className="btn btn-secondary" onClick={() => closeConfirm(false)}>{confirmState.cancelText || 'Cancel'}</button>
                            <button className={`btn ${confirmState.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => closeConfirm(true)} autoFocus>
                                {confirmState.confirmText || 'Confirm'}
                            </button>
                        </>
                    )}
                >
                    <p className="muted">{confirmState.message}</p>
                </Modal>
            )}
        </UiContext.Provider>
    );
}

export const useUi = () => useContext(UiContext);
