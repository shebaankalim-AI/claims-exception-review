// A fictional user. The app knows who is signed in and passes it to the screens
// that need it, since features can't import app/.
export const CURRENT_USER = {
  name: 'Casey Lindqvist',
  initials: 'CL',
  role: 'Examiner',
} as const
