import { AnimatePresence, motion, type Variants } from "framer-motion";
import { CheckCircle, Clock, Info, Loader, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * La variante animada del chip de estado: el icono entra y sale con un
 * muelle cuando el estado cambia en vivo (una importación en curso, un envío
 * que falla). Para un estado que solo se pinta una vez —una fila de tabla,
 * una ficha— usa `StatusBadge` de `@/components/data-display`, que no monta
 * framer-motion.
 */
export type StatusState = "pending" | "failed" | "success" | "neutral" | "info";

export interface StatusBadgeProps {
  state?: StatusState;
  labels?: Partial<Record<StatusState, string>>;
  className?: string;
}

const DEFAULT_LABELS: Record<StatusState, string> = {
  pending: "Pendiente",
  failed: "Con error",
  success: "Completado",
  neutral: "Por iniciar",
  info: "Información",
};

/** Los mismos tonos semánticos que usa el chip sin animación, para que un
 *  «Completado» no sea de dos verdes distintos según dónde se pinte. */
const STATE_CLASSES: Record<StatusState, { icon: string; bg: string; text: string }> = {
  pending: {
    icon: "text-warning",
    bg: "bg-warning/10 border-transparent",
    text: "text-warning",
  },
  failed: {
    icon: "text-destructive",
    bg: "bg-destructive/10 border-transparent",
    text: "text-destructive",
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10 border-transparent",
    text: "text-success",
  },
  neutral: {
    icon: "text-text-muted",
    bg: "bg-muted border-transparent",
    text: "text-text-secondary",
  },
  info: {
    icon: "text-info",
    bg: "bg-info/10 border-transparent",
    text: "text-info",
  },
};

const ICON_VARIANTS: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  exit: { scale: 0.5, opacity: 0, transition: { duration: 0.15 } },
};

function StateIcon({ state }: { state: StatusState }) {
  const cls = STATE_CLASSES[state].icon;
  if (state === "pending") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={cn("flex", cls)}
      >
        <Loader size={12} strokeWidth={2.5} />
      </motion.div>
    );
  }
  if (state === "failed")
    return <XCircle size={12} strokeWidth={2.5} className={cls} />;
  if (state === "neutral")
    return <Clock size={12} strokeWidth={2.5} className={cls} />;
  if (state === "info")
    return <Info size={12} strokeWidth={2.5} className={cls} />;
  return <CheckCircle size={12} strokeWidth={2.5} className={cls} />;
}

const MotionBadge = motion.create(Badge);

export function StatusBadge({
  state = "pending",
  labels,
  className,
}: StatusBadgeProps) {
  const label = { ...DEFAULT_LABELS, ...labels }[state];
  const cls = STATE_CLASSES[state];

  return (
    <MotionBadge
      variant="outline"
      layout="position"
      className={cn(
        "relative h-5 cursor-default overflow-hidden rounded-full",
        "gap-1.5 px-2 py-0.5",
        "text-[11px] font-semibold tracking-wide leading-none",
        "transition-colors duration-300",
        cls.bg,
        cls.text,
        className,
      )}
    >
      <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            variants={ICON_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute flex items-center"
          >
            <StateIcon state={state} />
          </motion.span>
        </AnimatePresence>
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          transition={{ duration: 0.2 }}
          className="flex leading-none"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </MotionBadge>
  );
}
