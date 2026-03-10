import { useAuth } from "../../auth";
import { useEffect, useState } from "react";
import "./trainer.css";
import Header from "../components/Header.tsx";

type AthleteCard = { id: string; name: string; avgHr7d: number; minutes7d: number; lastSession?: string };

export default function TrainerDashboard() {
    const  { user, logout } = useAuth();
    const [athletes, setAthletes] = useState<AthleteCard[]>([]);
    useEffect(() => { fetch("/api/trainer/athletes").then(r => r.json()).then(setAthletes); }, []);

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
                    <div key={a.id} className="athlete-card">
                        <div className="name">{a.name}</div>
                        <div className="mini-kpis">
                            <span>Ø Puls 7d: {a.avgHr7d} bpm</span>
                            <span>Minuten 7d: {a.minutes7d}</span>
                            <span>Letzte Einheit: {a.lastSession ?? "-"}</span>
                        </div>
                        <button onClick={() => location.assign(`/dashboard/trainer/${a.id}`)}>Details</button>
                    </div>
                ))}
            </section>

            <button onClick={logout}>Logout</button>
        </div>
    );
}
