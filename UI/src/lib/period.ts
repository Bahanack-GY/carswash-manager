export type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
  year: 'Cette année',
  custom: 'Personnalisé',
}

export const PERIODS: Period[] = ['today', 'week', 'month', 'year', 'custom']

export function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getPeriodRange(
  period: Period,
  customStart: string,
  customEnd: string,
): { startDate: string; endDate: string } {
  const today = new Date()
  if (period === 'today') {
    const t = fmtDate(today)
    return { startDate: t, endDate: t }
  }
  if (period === 'week') {
    const d = new Date(today)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return { startDate: fmtDate(d), endDate: fmtDate(today) }
  }
  if (period === 'month') {
    return {
      startDate: fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      endDate: fmtDate(today),
    }
  }
  if (period === 'year') {
    return {
      startDate: fmtDate(new Date(today.getFullYear(), 0, 1)),
      endDate: fmtDate(today),
    }
  }
  return { startDate: customStart || fmtDate(today), endDate: customEnd || fmtDate(today) }
}
