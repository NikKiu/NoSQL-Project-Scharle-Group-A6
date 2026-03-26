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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await authService.login({ email, password })
      login({ user: result.user, apiAuth: result.auth })
      navigate(targetByRole(result.auth.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page centered-page--auth">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="page-hero__eyebrow">Echtzeit Sporttracking</span>
          <h1>Training, Analyse und Administration in einer Plattform.</h1>
          <p>
            Beginne jetzt deine Erfahrungen mit uns.
          </p>
          <div className="auth-highlights">
            <span>Rollenbasierte Bereiche</span>
            <span>Live-Sensordaten</span>
            <span>Analytics und Monitoring</span>
          </div>
        </section>

        <section className="auth-panel">
          <h2>Anmelden</h2>
          <p>Nutze dein Konto, um direkt in deinen Rollenbereich zu wechseln.</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>E-Mail</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" />
            </label>
            <label>
              <span>Passwort</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="button" disabled={submitting} type="submit">
              {submitting ? 'Prüfe Login...' : 'Login'}
            </button>
          </form>
          <p className="auth-panel__footer">
            Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
          </p>
        </section>
      </div>
    </div>
  )
}

