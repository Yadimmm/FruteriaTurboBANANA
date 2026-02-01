export type ExpirationStatus = 'vigente' | 'por_caducar' | 'caducado'

export function daysUntil(expirationDate: string): number {
  // expirationDate viene en "YYYY-MM-DD"
  const today = new Date()
  const [y, m, d] = expirationDate.split('-').map(Number)
  const exp = new Date(y, m - 1, d, 23, 59, 59)

  // Normaliza hoy a inicio de día
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)

  const diffMs = exp.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function getExpirationStatus(expirationDate: string): ExpirationStatus {
  const d = daysUntil(expirationDate)
  if (d < 0) return 'caducado'
  if (d <= 7) return 'por_caducar'
  return 'vigente'
}
