import { LogoMark } from './LogoMark'

const PRODUCT_NAME = 'Assay'

/**
 * Mark plus wordmark. The wordmark is real text so it uses the font token. The
 * whole logo is one image named "Assay", and its parts are hidden, so the name
 * is announced once.
 */
export function Logo() {
  return (
    <span
      role="img"
      aria-label={PRODUCT_NAME}
      className="inline-flex items-center gap-2 whitespace-nowrap text-slate-900"
    >
      <LogoMark />
      <span aria-hidden="true" className="text-xl font-semibold tracking-logo">
        assay
      </span>
    </span>
  )
}
