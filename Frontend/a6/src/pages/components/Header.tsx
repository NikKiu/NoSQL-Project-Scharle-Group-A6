import "./Header.css"

interface Userdata {
    email: string|undefined;
    role: string|undefined;
    logout: () => void;
}


export default function Header({email, role, logout}: Userdata){
    return(
        <header className="header">
            <div className="role">
                <a>{role}</a>
                <span className="line" />
                <span className="email">
                    Angemeldet als: {email}
                </span>
            </div>
            <div className="buttonspace">
                <button className="log-button" onClick={logout}>Logout</button>
            </div>
        </header>
    );
}
