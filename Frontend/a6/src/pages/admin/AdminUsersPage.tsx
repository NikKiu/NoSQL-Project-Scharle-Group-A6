import { useEffect, useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router-dom'
import { DataTable } from '../../components/ui/DataTable'
import { PageHero } from '../../components/ui/PageHero'
import { SectionCard } from '../../components/ui/SectionCard'
import { adminService } from '../../services'
import type { Role, User } from '../../types'

interface LoaderData {
  users: User[]
}

export default function AdminUsersPage() {
  const { users } = useLoaderData() as LoaderData
  const revalidator = useRevalidator()
  const [form, setForm] = useState({ email: '', password: '', role: 'trainer', name: '' })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingRoleByUserId, setPendingRoleByUserId] = useState<Record<string, Role>>({})

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    setPendingRoleByUserId({})
  }, [users])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setToast(null)
    setIsCreating(true)

    try {
      await adminService.createUser(form)
      revalidator.revalidate()
      setToast({ type: 'success', text: 'Nutzer wurde erfolgreich erstellt.' })
      setForm({ email: '', password: '', role: 'trainer', name: '' })
    } catch (err) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Nutzer konnte nicht angelegt werden' })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleRoleChange(user: User, nextRole: Role) {
    const userId = user.userId
    if (!userId || user.role === nextRole) return

    setToast(null)
    setPendingRoleByUserId((previous) => ({ ...previous, [userId]: nextRole }))

    try {
      await adminService.updateUserRole(userId, { role: nextRole })
      revalidator.revalidate()
      setToast({
        type: 'success',
        text: `Die Rolle von ${user.name ?? user.email} wurde auf ${nextRole} aktualisiert.`
      })
    } catch (err) {
      setPendingRoleByUserId((previous) => {
        const next = { ...previous }
        delete next[userId]
        return next
      })
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Rolle konnte nicht aktualisiert werden' })
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Nutzerverwaltung"
        title="Rollen und Konten pflegen"
        description="Admin-Subpage für den zentralen Zugriff auf Benutzer, Rollen und Berechtigungen."
      />

      <SectionCard title="Neuen Nutzer anlegen" subtitle="Erfüllt die Anforderungen zur Rollen- und Benutzerverwaltung.">
        <form className="form-grid form-grid--two-columns" onSubmit={handleCreate}>
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </label>
          <label>
            <span>E-Mail</span>
            <input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required type="email" />
          </label>
          <label>
            <span>Passwort</span>
            <input value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required type="password" />
          </label>
          <label>
            <span>Rolle</span>
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
              <option value="admin">Admin</option>
              <option value="trainer">Trainer</option>
              <option value="athlete">Sportler</option>
            </select>
          </label>
          <button className="button" type="submit" disabled={isCreating || revalidator.state === 'loading'}>
            {isCreating ? 'Nutzer wird erstellt ...' : 'Nutzer erstellen'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Alle Nutzer" subtitle="Loader-gestuetzt direkt beim Routenwechsel verfuegbar, inklusive Rollenpflege pro Nutzer.">
        <DataTable
          columns={[
            { key: 'email', header: 'E-Mail', render: (row: User) => row.email },
            {
              key: 'role',
              header: 'Rolle',
              render: (row: User) => {
                const userId = row.userId
                const value = (userId ? pendingRoleByUserId[userId] : undefined) ?? row.role
                const isUpdating = Boolean(userId && pendingRoleByUserId[userId])

                return (
                  <select
                    value={value}
                    onChange={(event) => handleRoleChange(row, event.target.value as Role)}
                    disabled={!userId || revalidator.state === 'loading' || isUpdating}
                  >
                    <option value="admin">Admin</option>
                    <option value="trainer">Trainer</option>
                    <option value="athlete">Sportler</option>
                  </select>
                )
              }
            },
            { key: 'name', header: 'Name', render: (row: User) => row.name ?? '-' },
            { key: 'athleteId', header: 'Athlete ID', render: (row: User) => row.athleteId ?? '-' },
            {
              key: 'status',
              header: 'Status',
              render: (row: User) => {
                const isUpdating = Boolean(row.userId && pendingRoleByUserId[row.userId])
                return isUpdating ? 'Wird aktualisiert ...' : 'Bereit'
              }
            }
          ]}
          emptyText="Keine Nutzer vorhanden."
          rows={users}
        />
      </SectionCard>

      {toast ? (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      ) : null}
    </div>
  )
}

