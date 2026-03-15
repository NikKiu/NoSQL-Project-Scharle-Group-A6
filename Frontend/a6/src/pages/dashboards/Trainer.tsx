import { useAuth } from "../../auth";
import { useEffect, useState } from "react";
import "./Trainer.css";
import Header from "../components/Header.tsx";
import { createApiClient } from "../../services/API-functions";

type AthleteCard = { athleteId: string; firstName: string; lastName: string; trainingLevel: string };
type SessionDto = { sessionId: string; sport: string; status: string; startAt: string; endAt?: string };

export default function TrainerDashboard() {
    const  { user, apiAuth, logout } = useAuth();
    const [athletes, setAthletes] = useState<AthleteCard[]>([]);
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
    const [sessions, setSessions] = useState<SessionDto[]>([]);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [compareResult, setCompareResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const api = createApiClient({ auth: apiAuth ?? undefined });

    useEffect(() => {
        api.listAthletes<AthleteCard[]>()
            .then((list) => {
                setAthletes(list);
                if (list.length > 0) setSelectedAthleteId(list[0].athleteId);
            })
            .catch((err: any) => setError(err?.message || "Athleten konnten nicht geladen werden"));
    }, [apiAuth?.userId]);

    useEffect(() => {
        if (!selectedAthleteId) return;
        api.listSessionsForAthlete<SessionDto[]>(selectedAthleteId, { limit: 20 })
            .then(setSessions)
            .catch((err: any) => setError(err?.message || "Sessions konnten nicht geladen werden"));
    }, [selectedAthleteId, apiAuth?.userId]);

    const toggleCompare = (athleteId: string) => {
        setCompareIds((prev) =>
            prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId].slice(-3)
        );
    };

    const runComparison = async () => {
        if (compareIds.length < 2) {
            setError("Bitte mindestens zwei Sportler für den Vergleich wählen.");
            return;
        }
        try {
            setError(null);
            const result = await api.compareAthletes({ athleteIds: compareIds, sport: "running" });
            setCompareResult(result);
        } catch (err: any) {
            setError(err?.message || "Vergleich fehlgeschlagen");
        }
    };

    return (
        <div className="page">
            <Header
                email= {user?.email}
                role={user?.role}
                logout = {logout}
            />
            <header className="page-header"><h1>Teamübersicht</h1></header>

            <section className="grid">
                {athletes.map(a => (
                    <div key={a.athleteId} className="athlete-card">
                        <div className="name">{a.firstName} {a.lastName}</div>
                        <div className="mini-kpis">
                            <span>ID: {a.athleteId}</span>
                            <span>Level: {a.trainingLevel}</span>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={compareIds.includes(a.athleteId)}
                                    onChange={() => toggleCompare(a.athleteId)}
                                /> Vergleichen
                            </label>
                        </div>
                        <button onClick={() => setSelectedAthleteId(a.athleteId)}>Sessions anzeigen</button>
                    </div>
                ))}
            </section>

            <section className="trainer-panels">
                <div className="panel">
                    <h2>Session-Historie</h2>
                    <p>Ausgewählter Sportler: {selectedAthleteId || "-"}</p>
                    <table className="table">
                        <thead>
                        <tr><th>Session</th><th>Sport</th><th>Status</th><th>Start</th></tr>
                        </thead>
                        <tbody>
                        {sessions.map((s) => (
                            <tr key={s.sessionId}>
                                <td>{s.sessionId}</td>
                                <td>{s.sport}</td>
                                <td>{s.status}</td>
                                <td>{new Date(s.startAt).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="panel">
                    <h2>Sportlervergleich</h2>
                    <button onClick={runComparison}>Vergleich starten</button>
                    {compareResult ? (
                        <pre className="compare-box">{JSON.stringify(compareResult, null, 2)}</pre>
                    ) : (
                        <p>Wähle 2-3 Sportler und starte den Vergleich.</p>
                    )}
                </div>
            </section>

            {error ? <p className="error-text">{error}</p> : null}

        </div>
    );
}
