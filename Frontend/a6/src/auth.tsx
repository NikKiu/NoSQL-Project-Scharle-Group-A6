import { createContext, useContext, useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react"
import type { User  } from "./types.ts"




type AuthContextValue = {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("app:user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                // ignore
            }
        }
    }, []);

    const login = (u: User) => {
        setUser(u);
        localStorage.setItem("app:user", JSON.stringify(u));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("app:user");
    };

    const value = useMemo(() => ({ user, login, logout }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
