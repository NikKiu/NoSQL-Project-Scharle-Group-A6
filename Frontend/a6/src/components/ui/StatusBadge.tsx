interface StatusBadgeProps {
  value: string
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const variant = value === 'active' ? 'success' : value === 'finished' ? 'neutral' : 'info'
  return <span className={`status-badge status-badge--${variant}`}>{value}</span>
}

