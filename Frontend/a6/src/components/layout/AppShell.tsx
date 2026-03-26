import { NavLink, Outlet, useNavigate, useNavigation } from 'react-router-dom'
import { useAuth } from '../../auth'
import type { Role } from '../../types'

interface NavItem {
  to: string
  label: string
}

interface AppShellProps {
  role: Role
  title: string
  items: NavItem[]
}

export function AppShell({ role, title, items }: AppShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const navigation = useNavigation()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand__eyebrow">NoSQL Sporttracking</span>
          <strong>{title}</strong>
          <p>Rolle: {role}</p>
        </div>
        <nav className="app-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 3}
              className={({ isActive }) => `app-nav__link${isActive ? ' app-nav__link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__user">
            <span className="topbar__label">Angemeldet als</span>
            <strong className="topbar__name">{user?.name ?? user?.email}</strong>
            <p className="topbar__email">{user?.email}</p>
          </div>
          <button className="button button--secondary" onClick={handleLogout} type="button">
            Logout
          </button>
        </header>

        {navigation.state !== 'idle' ? <div className="route-loader" /> : null}

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

