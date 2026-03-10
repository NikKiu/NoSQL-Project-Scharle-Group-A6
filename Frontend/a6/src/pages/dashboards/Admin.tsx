import Header from "../components/Header.tsx";
import "./Admin.css";
import { useAuth } from "../../auth";
import {  useState } from 'react'
import type { User , Sensor} from "../../types"
import usersJson from "../mock/users.json";
import sensorenJson from "../mock/sensore.json";

export default function AdminDashboard() {
    const [users] = useState<User[]>(usersJson as User[]);
    const [sensoren] = useState<Sensor[]>(sensorenJson as Sensor[]);
    const  { user, logout } = useAuth();
    return (
        <div>
            <Header
                email= {user?.email}
                role={user?.role}
                logout = {logout}
            />
            <div className="content">
                <h2> Admin - Dashboard</h2>
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
                                        {u.role === 'sportler' ? `sportlerId: ${(u as any).sportlerId ?? '—'}` : u.role === 'trainer' ? `Sportlers: ${(u as any).trainersportlerIds?.join(', ') ?? '—'}` : '—'}
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
            </div>
        </div>
    );
}
