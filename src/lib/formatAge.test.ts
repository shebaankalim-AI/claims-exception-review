import { formatAge } from './formatAge'

const NOW = new Date('2025-02-27T15:00:00.000Z')
const minutesAgo = (m: number) =>
  new Date(NOW.getTime() - m * 60_000).toISOString()

describe('formatAge', () => {
  it.each([
    [0, '1 min'],
    [1, '1 min'],
    [48, '48 min'],
    [59, '59 min'],
    [60, '1 h 00'],
    [185, '3 h 05'],
    [23 * 60 + 59, '23 h 59'],
    [24 * 60, '1 d 00 h'],
    [2 * 24 * 60 + 7 * 60 + 30, '2 d 07 h'],
    [44 * 24 * 60 + 5 * 60, '44 d 05 h'],
  ])('%i minutes ago reads %s', (minutes, expected) => {
    expect(formatAge(minutesAgo(minutes), NOW)).toBe(expected)
  })

  it('rounds seconds down, so 59 seconds is still 1 min', () => {
    const fiftyNineSecondsAgo = new Date(NOW.getTime() - 59_000).toISOString()
    expect(formatAge(fiftyNineSecondsAgo, NOW)).toBe('1 min')
  })

  it('does not go negative for a time in the future', () => {
    expect(formatAge(minutesAgo(-30), NOW)).toBe('1 min')
  })

  it('does not break on an invalid time', () => {
    expect(formatAge('not a date', NOW)).toBe('1 min')
  })
})
