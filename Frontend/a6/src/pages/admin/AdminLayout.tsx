import { AppShell } from '../../components/layout/AppShell'

const items = [
  { to: '/app/admin', label: 'Landingpage' },
  { to: '/app/admin/users', label: 'Nutzer' },
  { to: '/app/admin/assignments', label: 'Zuordnungen' },
  { to: '/app/admin/sensors', label: 'Sensoren' },
  { to: '/app/admin/monitoring', label: 'Monitoring' }
]

export default function AdminLayout() {
  return <AppShell items={items} role="admin" title="Adminbereich" />
}

