import "./Header.css"
import { useNavigate } from 'react-router-dom'

interface Userdata {
    email: string|undefined;
    role: string|undefined;
    logout: () => void;
}


export default function Header({email, role, logout}: Userdata){
    const navigate = useNavigate();
    const roleLabel = role === "athlete" ? "Sportler" : role === "trainer" ? "Trainer" : role === "admin" ? "Admin" : role;

    function handleLogout() {
        logout();
        navigate('/', { replace: true });
    }

    return(
        <header className="header">
            <div className="role">
                <a>{roleLabel}</a>
                <span className="line" />
                <span className="email">
                    Angemeldet als: {email}
                </span>
            </div>
            <div className="buttonspace">
                <button className="log-button" onClick={handleLogout} type="button">Logout</button>
            </div>
        </header>
    );
}
