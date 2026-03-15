import Header from "../components/Header.tsx";
import "./Admin.css";
import { useAuth } from "../../auth";
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { User , Sensor} from "../../types"
import { createApiClient } from "../../services/API-functions";

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [sensoren, setSensoren] = useState<Sensor[]>([]);
    const [newUser, setNewUser] = useState({ email: "", password: "", role: "trainer" });
    const [newSensor, setNewSensor] = useState({ sensorType: "", displayName: "", unit: "", description: "" });
    const [error, setError] = useState<string | null>(null);
    const  { user, apiAuth, logout } = useAuth();
    const api = useMemo(() => createApiClient({ auth: apiAuth ?? undefined }), [apiAuth]);

    const loadData = async () => {
        const [usersData, sensorsData] = await Promise.all([
            api.getAdminUsers<any[]>(),
            api.getAdminSensorCatalog<any[]>()
        ]);

        setUsers(
            usersData.map((u) => ({
                id: u.userId,
                userId: u.userId,
                email: u.email,
                role: u.role,
                athleteId: u.athleteId,
                trainerAthleteIds: u.trainerAthleteIds,
                name: u.name
            }))
        );

        setSensoren(
            sensorsData.map((s) => ({
                id: s.sensorType,
                type: s.sensorType,
                name: s.displayName,
                details: s.description
            }))
        );
    };

    useEffect(() => {
        loadData().catch((err: any) => setError(err?.message || "Admin-Daten konnten nicht geladen werden"));
    }, [apiAuth?.userId]);

    const submitUser = async (event: FormEvent) => {
        event.preventDefault();
        try {
            setError(null);
            await api.createAdminUser(newUser);
            setNewUser({ email: "", password: "", role: "trainer" });
            await loadData();
        } catch (err: any) {
            setError(err?.message || "Nutzer konnte nicht erstellt werden");
        }
    };

    const submitSensor = async (event: FormEvent) => {
        event.preventDefault();
        try {
            setError(null);
            await api.upsertAdminSensorType(newSensor);
            setNewSensor({ sensorType: "", displayName: "", unit: "", description: "" });
            await loadData();
        } catch (err: any) {
            setError(err?.message || "Sensortyp konnte nicht gespeichert werden");
        }
    };

    return (
        <div>
            <Header
                email= {user?.email}
                role={user?.role}
                logout = {logout}
            />
            <div className="content">
                <h2> Admin - Dashboard</h2>
                <div className="admin-forms">
                    <form onSubmit={submitUser} className="admin-form">
                        <h3>Nutzer anlegen</h3>
                        <input
                            value={newUser.email}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="E-Mail"
                            required
                        />
                        <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="Passwort"
                            required
                        />
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                        >
                            <option value="admin">Admin</option>
                            <option value="trainer">Trainer</option>
                            <option value="athlete">Sportler</option>
                        </select>
                        <button type="submit">Nutzer speichern</button>
                    </form>

                    <form onSubmit={submitSensor} className="admin-form">
                        <h3>Sensortyp pflegen</h3>
                        <input
                            value={newSensor.sensorType}
                            onChange={(e) => setNewSensor((prev) => ({ ...prev, sensorType: e.target.value }))}
                            placeholder="sensorType (z.B. cadence)"
                            required
                        />
                        <input
                            value={newSensor.displayName}
                            onChange={(e) => setNewSensor((prev) => ({ ...prev, displayName: e.target.value }))}
                            placeholder="Anzeigename"
                        />
                        <input
                            value={newSensor.unit}
                            onChange={(e) => setNewSensor((prev) => ({ ...prev, unit: e.target.value }))}
                            placeholder="Einheit"
                        />
                        <input
                            value={newSensor.description}
                            onChange={(e) => setNewSensor((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Beschreibung"
                        />
                        <button type="submit">Sensor speichern</button>
                    </form>
                </div>

                <div className="roletable">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th><th>E‑Mail</th><th>Rolle</th><th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={String(u.id)}>
                                    <td>{u.id}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>
                                        {u.role === 'athlete' ? `athleteId: ${(u as any).athleteId ?? '---'}` : u.role === 'trainer' ? `Athletes: ${(u as any).trainerAthleteIds?.join(', ') ?? '---'}` : '---'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="sensortypes">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Beschreibung</th><th>Details</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sensoren.map(s => (
                            <tr key={String(s.id)}>
                                <td>{s.id}</td>
                                <td>{s.type}</td>
                                <td>{s.name}</td>
                                <td>{s.details}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                {error ? <p className="error-text">{error}</p> : null}
            </div>
        </div>
    );
}
