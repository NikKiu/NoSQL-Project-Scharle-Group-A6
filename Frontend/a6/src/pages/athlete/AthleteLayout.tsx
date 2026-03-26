import { AppShell } from '../../components/layout/AppShell'

const items = [
  { to: '/app/athlete', label: 'Landingpage' },
  { to: '/app/athlete/training', label: 'Training' },
  { to: '/app/athlete/history', label: 'Trainingshistorie' },
  { to: '/app/athlete/profile', label: 'Profil' }
]

export default function AthleteLayout() {
  return <AppShell items={items} role="athlete" title="Sportlerbereich" />
}

