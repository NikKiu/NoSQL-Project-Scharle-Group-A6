import "./Login.css";
import React, { useState } from "react";
import type { Role } from "../types.ts";
import { useAuth } from "../auth.tsx";
import { useLocation, useNavigate } from "react-router-dom";
import Run from '../assets/runner.jpg';

const roleToPath: Record<Role, string> = {
    admin: "/dashboard/admin",
    trainer: "/dashboard/trainer",
    sportler: "/dashboard/sportler",
};

export default function Register() {
    const [email, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("sportler");
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname as string | undefined;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        login({ email, role });
        navigate(from ?? roleToPath[role], { replace: true });
    }

    return (
        <div>
            <img className="back" src={Run} alt="Runner"/>
            <div className="login-container">
                <form className="login-box" onSubmit={handleSubmit}>
                    <h1>Reregistration</h1>
                    <div className="inputs">
                        <label>
                            <h2>E-Mail</h2>
                            <input
                                value={email}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name"
                                required
                            />
                        </label>
                    </div>
                    <div className="inputs">
                        <label>
                            <h2>Passwort</h2>
                            <input
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
                            <option value="sportler">Sportler</option>
                        </select>
                    </label>

                    <button type="submit" >
                        Konto erstellen
                    </button>
                </form>
            </div>
        </div>
    );
}