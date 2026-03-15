import "./Sportler.css";
import { useAuth } from "../../auth";
import Header from "../components/Header.tsx";
import {IoPersonOutline} from "react-icons/io5";
import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { createApiClient } from "../../services/API-functions";

type SessionDto = {
    sessionId: string;
    sport: string;
    status: string;
    startAt: string;
    endAt?: string;
};



export default function SportlerDashboard() {
    const { user, apiAuth, logout } = useAuth();
    const [history, setHistory] = useState<SessionDto[]>([]);
    const [sport, setSport] = useState("running");
    const [selectedSensors, setSelectedSensors] = useState<string[]>(["heart-rate", "gps"]);
    const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [live, setLive] = useState({ heartRate: 0, speed: 0, totalDistance: 0, count: 0, avgHeartRate: 0, maxSpeed: 0 });
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const api = useMemo(() => createApiClient({ auth: apiAuth ?? undefined }), [apiAuth]);
    const athleteId = user?.athleteId ?? null;

    const availableSensors = ["heart-rate", "gps", "power"];

    const loadHistory = async () => {
        if (!athleteId) return;
        const sessions = await api.listSessionsForAthlete<SessionDto[]>(athleteId, { limit: 50 });
        setHistory(sessions);
    };

    useEffect(() => {
        loadHistory().catch((err: any) => setError(err?.message || "Historie konnte nicht geladen werden"));
        return () => {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [athleteId]);

    const toggleSensor = (sensorType: string) => {
        setSelectedSensors((prev) =>
            prev.includes(sensorType) ? prev.filter((s) => s !== sensorType) : [...prev, sensorType]
        );
    };

    const generateData = () => {
        const now = new Date().toISOString();
        const baseHr = sport === "cycling" ? 140 : sport === "swimming" ? 132 : 145;
        const baseSpeed = sport === "cycling" ? 27 : sport === "swimming" ? 4 : 12;
        const hr = Math.round(baseHr + (Math.random() - 0.5) * 16);
        const speed = Math.max(0.4, Number((baseSpeed + (Math.random() - 0.5) * 2).toFixed(2)));
        const delta = Number((speed * 2 / 3.6).toFixed(2));

        setLive((prev) => {
            const count = prev.count + 1;
            const totalDistance = Number((prev.totalDistance + delta).toFixed(2));
            const avgHeartRate = Math.round(((prev.avgHeartRate * prev.count) + hr) / count);
            return {
                heartRate: hr,
                speed,
                totalDistance,
                count,
                avgHeartRate,
                maxSpeed: Math.max(prev.maxSpeed, speed)
            };
        });

        return { now, hr, speed, delta };
    };

    const streamTick = async (sessionId: string) => {
        const sample = generateData();
        for (const sensorType of selectedSensors) {
            await api.createSensorEvent({
                sessionId,
                timestamp: sample.now,
                sensorType,
                metrics: { heartRate: sample.hr, speed: sample.speed, distanceDelta: sample.delta },
                heartRate: sample.hr,
                speed: sample.speed,
                distanceDelta: sample.delta
            });
        }
    };

    const startSimulation = async () => {
        if (!athleteId || selectedSensors.length === 0) {
            setError("Bitte mindestens einen Sensor wählen.");
            return;
        }
        try {
            setError(null);
            const session = await api.createSession<{ sessionId: string }>({ athleteId, sport, sensorTypes: selectedSensors });
            setCurrentSessionId(session.sessionId);
            setLive({ heartRate: 0, speed: 0, totalDistance: 0, count: 0, avgHeartRate: 0, maxSpeed: 0 });
            setStatus("running");

            if (timerRef.current) window.clearInterval(timerRef.current);
            timerRef.current = window.setInterval(() => {
                streamTick(session.sessionId).catch((err: any) => setError(err?.message || "Live-Daten konnten nicht gesendet werden"));
            }, 2000);
        } catch (err: any) {
            setError(err?.message || "Training konnte nicht gestartet werden");
        }
    };

    const pauseSimulation = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setStatus("paused");
    };

    const resumeSimulation = () => {
        if (!currentSessionId) return;
        setStatus("running");
        timerRef.current = window.setInterval(() => {
            streamTick(currentSessionId).catch((err: any) => setError(err?.message || "Live-Daten konnten nicht gesendet werden"));
        }, 2000);
    };

    const finishSimulation = async () => {
        if (!currentSessionId) return;
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        try {
            await api.finishSession(currentSessionId, { endAt: new Date().toISOString() });
            setStatus("idle");
            setCurrentSessionId(null);
            await loadHistory();
        } catch (err: any) {
            setError(err?.message || "Training konnte nicht beendet werden");
        }
    };

    const animationIcon = sport === "cycling" ? "BIKE" : sport === "swimming" ? "SWIM" : "RUN";


    return (
        <div className="page">
            <Header
                email= {user?.email}
                role={user?.role}
                logout = {logout}
            />
            <div className="box">
                <ul >
                    <NavLink className='profilehead' to="/profil"><IoPersonOutline/> <p className={'profiletext'}>Mein Profil</p></NavLink>
                </ul>
            </div>
            {athleteId ? (
                <section className="simulation-card">
                    <h2>Training starten</h2>
                    <div className="simulation-controls">
                        <label>
                            Sportart
                            <select value={sport} onChange={(e) => setSport(e.target.value)} disabled={status !== "idle"}>
                                <option value="running">Laufen</option>
                                <option value="cycling">Radfahren</option>
                                <option value="swimming">Schwimmen</option>
                            </select>
                        </label>
                        <div className="sensor-grid">
                            {availableSensors.map((sensor) => (
                                <label key={sensor}>
                                    <input
                                        type="checkbox"
                                        checked={selectedSensors.includes(sensor)}
                                        onChange={() => toggleSensor(sensor)}
                                        disabled={status !== "idle"}
                                    />
                                    {sensor}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="simulation-actions">
                        {status === "idle" ? <button onClick={startSimulation}>Start</button> : null}
                        {status === "running" ? <button onClick={pauseSimulation}>Pause</button> : null}
                        {status === "paused" ? <button onClick={resumeSimulation}>Fortsetzen</button> : null}
                        {status !== "idle" ? <button onClick={finishSimulation}>Beenden</button> : null}
                    </div>
                    {status !== "idle" ? <div className="sport-animation">{animationIcon}</div> : null}
                    <div className="live-kpis">
                        <span>Aktueller Puls: {live.heartRate || "-"} bpm</span>
                        <span>Aktuelle Geschwindigkeit: {live.speed || "-"} km/h</span>
                        <span>Durchschnittspuls: {live.avgHeartRate || "-"} bpm</span>
                        <span>Max. Geschwindigkeit: {live.maxSpeed || "-"} km/h</span>
                        <span>Distanz: {live.totalDistance.toFixed(2)} m</span>
                    </div>
                    {error ? <p className="error-text">{error}</p> : null}
                </section>
            ) : (
                <p className="error-text">Diesem Nutzer ist kein Sportlerprofil zugeordnet.</p>
            )}
            <div className="table-container">
            <div className="historie">
            <h2> Trainings-Historie</h2>
            <div className="trainingtable">
                <table className="table">
                    <thead>
                    <tr>
                        <th>ID</th><th>Sport Art</th><th>Start</th><th>Ende</th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.map(t => (
                        <tr key={String(t.sessionId)}>
                            <td>{t.sessionId}</td>
                            <td>{t.sport}</td>
                            <td>{new Date(t.startAt).toLocaleString()}</td>
                            <td>{t.endAt ? new Date(t.endAt).toLocaleString() : t.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            </div>

            </div>
        </div>
    );
}
