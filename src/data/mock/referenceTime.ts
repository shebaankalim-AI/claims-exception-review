/**
 * The fixtures are written as if this were "now": every timestamp in them is
 * before it, and the newest claim was flagged four minutes earlier. A
 * repository moves all of them forward by however far its own clock is from
 * this instant, so the queue shows believable ages whenever the app runs.
 * Tests pass a clock set to exactly this instant and get the fixtures as written.
 */
export const MOCK_REFERENCE_TIME = new Date('2025-02-27T15:00:00.000Z')
