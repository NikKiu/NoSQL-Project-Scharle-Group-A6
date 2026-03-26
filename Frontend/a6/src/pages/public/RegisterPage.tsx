import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { authService } from '../../services'
import type { Role } from '../../types'

function targetByRole(role: Role) {
  if (role === 'admin') return '/app/admin'
  if (role === 'trainer') return '/app/trainer'
  return '/app/athlete'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'athlete' as Role
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await authService.register(form)
      login({ user: result.user, apiAuth: result.auth })
      navigate(targetByRole(result.auth.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page centered-page--auth">
      <div className="auth-shell auth-shell--reverse">
        <section className="auth-panel">
          <h2>Konto erstellen</h2>
          <p>Registriere einen neuen Nutzer und springe direkt in den passenden Rollenbereich.</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>E-Mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Passwort</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Rolle</span>
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as Role }))}
              >
                <option value="athlete">Sportler</option>
                <option value="trainer">Trainer</option>
              </select>
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="button" disabled={submitting} type="submit">
              {submitting ? 'Lege Konto an...' : 'Registrieren'}
            </button>
          </form>
          <p className="auth-panel__footer">
            Bereits registriert? <Link to="/login">Zum Login</Link>
          </p>
        </section>

        <section className="auth-hero">
          <span className="page-hero__eyebrow">Flexible Plattform</span>
          <h1>Neue Sensoren, neue Sportarten und neue Nutzer ohne Frontend-Bruch.</h1>
          <p>
            Das UI ist modular aufgebaut: Services, Loader, Layouts und Bereichsseiten orientieren sich direkt
            an den Backend-Endpunkten und Anforderungen.
          </p>
          <div className="auth-highlights">
            <span>Saubere Subpages</span>
            <span>Admin verwaltet Sensoren</span>
            <span>Loader laden direkt Inhalte</span>
          </div>
        </section>
      </div>
    </div>
  )
}

