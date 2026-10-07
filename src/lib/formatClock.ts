/** A time of day for messages like "Approved by you at 14:32": 24-hour, local time. */
export function formatClock(iso: string, withSeconds = false): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '–'
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  })
}
