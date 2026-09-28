import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, put, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionNotice, setSessionNotice] = useState('');

    const logout = useCallback((notice = '') => {
        tokenStore.clear();
        setUser(null);
        setSessionNotice(notice);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler((message) => logout(message || 'Your session has ended. Please sign in again.'));
        if (!tokenStore.get()) { setLoading(false); return; }
        get('/auth/me')
            .then((d) => setUser(d.user))
            .catch(() => tokenStore.clear())
            .finally(() => setLoading(false));
    }, [logout]);

    const acceptSession = (data) => {
        tokenStore.set(data.token);
        setUser(data.user);
        setSessionNotice('');
        return data.user;
    };

    const login = async (email, password) => acceptSession(await post('/auth/login', { email, password }));
    const signup = async (payload) => acceptSession(await post('/auth/signup', payload));

    const updateProfile = async (patch) => {
        const d = await put('/me', patch);
        setUser(d.user);
        return d.user;
    };

    const changePassword = async (currentPassword, newPassword) => {
        const d = await post('/auth/change-password', { currentPassword, newPassword });
        tokenStore.set(d.token);
        return d;
    };

    const value = useMemo(() => ({
        user, loading, login, signup, logout, updateProfile, changePassword, setUser, sessionNotice, setSessionNotice
    }), [user, loading, logout, sessionNotice]); // eslint-disable-line react-hooks/exhaustive-deps

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
