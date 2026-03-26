import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export function ErrorPage() {
  const error = useRouteError()

  let title = 'Ein Fehler ist aufgetreten'
  let message = 'Bitte versuche es erneut oder gehe zur Startseite zurück.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = typeof error.data === 'string' ? error.data : message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="centered-page">
      <div className="auth-panel auth-panel--narrow">
        <span className="page-hero__eyebrow">Fehler</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <Link className="button" to="/">
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  )
}

