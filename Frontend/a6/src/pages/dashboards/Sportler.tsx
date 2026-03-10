import "./Sportler.css";
import { useAuth } from "../../auth";
import Header from "../components/Header.tsx";
import {IoPersonOutline} from "react-icons/io5";
import {NavLink} from "react-router";
import trainingsJson from "../mock/trainings.json";
import {useState} from "react";
import type {Training} from "../../types.ts";



export default function SportlerDashboard() {
    const  { user, logout } = useAuth();

    const [trainings] = useState<Training[]>(trainingsJson as Training[]);


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
                    {trainings.map(t => (
                        <tr key={String(t.id)}>
                            <td>{t.id}</td>
                            <td>{t.sport}</td>
                            <td>{t.startTs}</td>
                            <td>{t.endTs}</td>
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
