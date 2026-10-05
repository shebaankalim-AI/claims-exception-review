// Shared class lists for controls and cards, so every button, input and card
// is built from the same tokens. Plain strings, not components, because the
// elements themselves vary (button, a submit button, a link-like button).

const disabled =
  'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted disabled:text-disabled ' +
  'aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-surface-muted aria-disabled:text-disabled'

/** Accent filled, 36 tall. Disabled is muted, never just faded. */
export const buttonPrimary =
  'focus-ring inline-flex h-control shrink-0 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 font-medium whitespace-nowrap text-on-accent ' +
  'enabled:hover:border-accent-hover enabled:hover:bg-accent-hover aria-disabled:hover:border-border aria-disabled:hover:bg-surface-muted ' +
  disabled

/** White with a border, 36 tall. */
export const buttonSecondary =
  'focus-ring inline-flex h-control shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 font-medium whitespace-nowrap text-ink ' +
  'enabled:hover:bg-surface-muted ' +
  disabled

/** A text button that reads as a link. */
export const linkButton =
  'focus-ring rounded-sm font-medium text-accent hover:text-accent-hover hover:underline'

export const input =
  'focus-ring h-control rounded-sm border border-border-strong bg-surface px-3 text-ink placeholder:text-ink-subtle'

export const textarea =
  'focus-ring rounded-sm border border-border-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-subtle'

/** White card: 12 radius, warm border, a whisper of shadow. */
export const card = 'rounded-lg border border-border bg-surface shadow-card'

/** 12/500 muted, sentence case. */
export const sectionTitle = 'text-xs font-medium text-ink-muted'
