import "./Profil.css";
import { useAuth } from "../../auth";
import Header from "../components/Header.tsx";

import {useState} from "react";



export default function Profil() {
    const  { user, logout } = useAuth();
    const [gewicht, setGewicht] = useState("");
    const [groese , setGroese] = useState("");
    const [alter , setAlter] = useState("");

    return (
        <div className="page">
            <Header
                email= {user?.email}
                role={user?.role}
                logout = {logout}
            />
            <div className="login-container">
                <form className="login-box">
                    <h1>Profil</h1>
                    <div className="inputs">
                    <label>
                        <h2>Körperdaten</h2>
                        <input
                            value={gewicht}
                            onChange={(e) => setGewicht(e.target.value)}
                            placeholder="Gewicht"
                        />
                    </label>
            </div>
                    <div className="inputs">
                    <label>
                        <input
                            value={groese}
                            onChange={(e) => setGroese(e.target.value)}
                            placeholder="Größe"
                        />
                    </label>
                    </div>
                    <div className="inputs">
                    <label>
                        <input
                            value={alter}
                            onChange={(e) => setAlter(e.target.value)}
                            placeholder="alter"
                        />
                    </label>
            </div>


                    <div className="subbutt">
                    <button type="submit" >
                        Speichern
                    </button>
                    </div>
                    <div className="exbutt">
                    <button type="submit" >
                        Abrechen
                    </button>
            </div>
                </form>
        </div>
        </div>
    );
}
