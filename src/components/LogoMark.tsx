// A first pass and a second look: an outlined square behind a solid one that
// sits down and to the right. The outline follows the text colour
// (currentColor) and the solid square uses the accent token, so there is no
// colour to keep in sync. Numbers below are SVG user units on a 24-unit grid,
// not CSS pixels; the rendered size comes from a token class.
const SIZE_CLASS = {
  sm: 'size-icon',
  md: 'size-logo',
  lg: 'size-logo-lg',
} as const

type LogoMarkProps = {
  size?: keyof typeof SIZE_CLASS
  /** Name the mark only when it stands alone. Inside <Logo /> it stays hidden from assistive tech. */
  label?: string
}

export function LogoMark({ size = 'md', label }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${SIZE_CLASS[size]} shrink-0`}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    >
      <rect
        x="2.75"
        y="2.75"
        width="12.5"
        height="12.5"
        rx="3"
        strokeWidth="1.5"
        className="fill-none stroke-current"
      />
      <rect x="9" y="9" width="13" height="13" rx="3" className="fill-accent" />
    </svg>
  )
}
