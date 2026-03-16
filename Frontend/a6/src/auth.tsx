import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearStoredAuthSession, readStoredAuthSession, writeStoredAuthSession } from "./lib/auth-storage";
import type { StoredAuthSession } from "./lib/auth-storage";
import type { ApiAuth, User } from "./types";

type AuthContextValue = {
    user: User | null;
    apiAuth: ApiAuth | null;
    login: (payload: StoredAuthSession) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [apiAuth, setApiAuth] = useState<ApiAuth | null>(null);

    useEffect(() => {
        const stored = readStoredAuthSession();
        if (stored) {
            setUser(stored.user);
            setApiAuth(stored.apiAuth);
        }
    }, []);

    const login = (payload: StoredAuthSession) => {
        setUser(payload.user);
        setApiAuth(payload.apiAuth);
        writeStoredAuthSession(payload);
    };

    const logout = () => {
        setUser(null);
        setApiAuth(null);
        clearStoredAuthSession();
    };

    const value = useMemo(() => ({ user, apiAuth, login, logout }), [user, apiAuth]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
