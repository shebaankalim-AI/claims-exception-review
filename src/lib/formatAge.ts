/**
 * How long ago something was flagged, in the shortest form an examiner can
 * scan: "1 min", "48 min", "3 h 05", "2 d 07 h". Under a minute reads as
 * "1 min", so a fresh claim never shows "0 min". Future or invalid times
 * read the same, because a clock that is a little off shouldn't show a
 * negative age.
 */
export function formatAge(flaggedAt: string, now: Date): string {
  const elapsedMs = now.getTime() - new Date(flaggedAt).getTime()
  const minutes = Number.isNaN(elapsedMs)
    ? 1
    : Math.max(1, Math.floor(elapsedMs / 60_000))

  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} h ${String(minutes % 60).padStart(2, '0')}`
  }

  const days = Math.floor(hours / 24)
  return `${days} d ${String(hours % 24).padStart(2, '0')} h`
}
