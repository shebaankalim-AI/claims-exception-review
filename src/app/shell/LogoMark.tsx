// A plain geometric mark: a rounded square, an accent dot and a short bar.
// Colours come from currentColor and tokens, so there is nothing to keep in
// sync. Coordinates are SVG user units, not CSS pixels.
export function LogoMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6 shrink-0 text-slate-900"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        className="fill-current"
      />
      <circle cx="9.5" cy="12" r="3.5" className="fill-accent" />
      <rect
        x="14"
        y="11"
        width="5"
        height="2"
        rx="1"
        className="fill-surface"
      />
    </svg>
  )
}
