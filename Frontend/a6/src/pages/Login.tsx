import "./Login.css";
import React, { useState } from "react";
import type { Role } from "../types.ts";
import { useAuth } from "../auth.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import Run from '../assets/runner.jpg';
import { NavLink } from "react-router-dom";
import { createApiClient } from "../services/API-functions";


const roleToPath: Record<Role, string> = {
    admin: "/dashboard/admin",
    trainer: "/dashboard/trainer",
    athlete: "/dashboard/sportler",
};

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("athlete");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname as string | undefined;
    const api = createApiClient();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const result = await api.login({ email, password });
            if (result.auth.role !== role) {
                throw new Error("Die ausgewählte Rolle passt nicht zu diesem Konto.");
            }

            login({
                user: {
                    id: result.user.userId,
                    userId: result.user.userId,
                    email: result.user.email,
                    role: result.user.role,
                    athleteId: result.user.athleteId ?? null,
                    trainerAthleteIds: result.user.trainerAthleteIds ?? [],
                    name: result.user.name ?? undefined
                },
                apiAuth: result.auth
            });
            navigate(from ?? roleToPath[result.auth.role], { replace: true });
        } catch (err: any) {
            setError(err?.message || "Login fehlgeschlagen");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
        <img className="back" src={Run} alt="Runner"/>
        <div className="login-container">
            <form className="login-box" onSubmit={handleSubmit}>
                <h1>Login</h1>
                <div className="inputs">
                <label>
                    <h2>E-Mail</h2>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-Mail"
                        required
                    />
                </label>
                </div>
                    <div className="inputs">
                <label>
                    <h2>Passwort</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Passwort"
                        required
                    />
                </label>
                    </div>


                <label >
                    <h2>Rolle wählen</h2>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                    >
                        <option value="trainer">Trainer</option>
                        <option value="admin">Admin</option>
                        <option value="athlete">Sportler</option>
                    </select>
                </label>

                {error ? <p className="error-text">{error}</p> : null}

                <button type="submit" disabled={loading}>
                    Anmelden
                </button>
                <ul >
                    <NavLink className={'nav-link mobile-button'} to="/register"> <p className={'profileLink'}>Du hast noch kein Profil? Hier Registrieren</p></NavLink>
                </ul>
            </form>
        </div>
        </div>
    );
}
