import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Compass,
  ArrowLeftRight,
  Gauge,
  Globe,
  KeyRound,
  LifeBuoy,
  Package,
  Receipt,
  Rocket,
  Scissors,
  Settings,
  ShieldCheck,
  Store,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * El icono de cada sección lo elige el contenido por nombre (`_sections.json`)
 * y aquí se traduce a un glifo. Un nombre desconocido cae en el libro.
 */
const SECTION_ICONS: Readonly<Record<string, LucideIcon>> = {
  rocket: Rocket,
  key: KeyRound,
  compass: Compass,
  gauge: Gauge,
  calendar: CalendarDays,
  users: Users,
  team: UserCog,
  scissors: Scissors,
  wallet: Wallet,
  receipt: Receipt,
  settings: Settings,
  chart: BarChart3,
  lifebuoy: LifeBuoy,
  book: BookOpen,
  shield: ShieldCheck,
  store: Store,
  package: Package,
  swap: ArrowLeftRight,
  globe: Globe,
};

export function sectionIcon(name: string | undefined): LucideIcon {
  return (name && SECTION_ICONS[name]) || BookOpen;
}

