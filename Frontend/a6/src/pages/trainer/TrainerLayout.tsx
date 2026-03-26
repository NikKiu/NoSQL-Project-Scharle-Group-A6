import { AppShell } from '../../components/layout/AppShell'

const items = [
  { to: '/app/trainer', label: 'Landingpage' },
  { to: '/app/trainer/athletes', label: 'Sportler' },
  { to: '/app/trainer/compare', label: 'Vergleiche' }
]

export default function TrainerLayout() {
  return <AppShell items={items} role="trainer" title="Trainerbereich" />
}

