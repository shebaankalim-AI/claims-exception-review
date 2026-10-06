import {
  ArrowFatLineUp,
  ArrowsDownUp,
  ArrowUUpLeft,
  ChartBar,
  Check,
  CheckCircle,
  CircleDashed,
  FileArrowUp,
  Files,
  FileText,
  GearSix,
  HourglassMedium,
  Info,
  Lightning,
  List,
  PencilSimple,
  Question,
  SealCheck,
  Warning,
  WarningCircle,
  WarningOctagon,
} from '@phosphor-icons/react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

// The only file that imports the icon package. Everything else asks for an
// icon by name, so swapping the set (decision 0005) touches one file.
const ICONS = {
  exceptions: WarningCircle,
  allClaims: Files,
  agentActivity: Lightning,
  reports: ChartBar,
  help: Question,
  menu: List,
  settings: GearSix,
  document: FileText,
  sort: ArrowsDownUp,
  // The four review states. Always shown with their text label, never alone.
  stateVerified: CheckCircle,
  stateNeedsReview: Warning,
  stateMissing: CircleDashed,
  stateEdited: PencilSimple,
  // Where a whole claim is. Also always shown with a word.
  stateApproved: SealCheck,
  stateFiled: FileArrowUp,
  stateSentBack: ArrowUUpLeft,
  stateEscalated: ArrowFatLineUp,
  // Messages: an icon plus words, never colour alone.
  info: Info,
  success: CheckCircle,
  error: WarningOctagon,
  // How an agent step ended, in the feed.
  resultCompleted: Check,
  resultWaiting: HourglassMedium,
} as const satisfies Record<string, PhosphorIcon>

export type IconName = keyof typeof ICONS

// Sizes are tokens (--spacing-icon, --spacing-icon-lg), applied as classes.
const SIZE_CLASS = { md: 'size-icon', lg: 'size-icon-lg' } as const

type IconProps = {
  name: IconName
  /** Regular by default; fill marks the active item. */
  weight?: 'regular' | 'fill'
  size?: keyof typeof SIZE_CLASS
  /** Give an icon a name only when it carries meaning alone. Otherwise it is hidden from assistive tech. */
  label?: string
}

export function Icon({
  name,
  weight = 'regular',
  size = 'md',
  label,
}: IconProps) {
  const Glyph = ICONS[name]
  return (
    <Glyph
      weight={weight}
      className={`${SIZE_CLASS[size]} shrink-0`}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    />
  )
}
