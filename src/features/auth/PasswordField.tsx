import * as React from "react";
import { useAppT } from "@/app/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemaIcon } from "@/icons";

export interface PasswordFieldProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  id: string;
}

/**
 * Contraseña con el ojo para mostrarla. El botón es un `ghost` de icono
 * dentro del propio campo; el `pr-10` deja sitio para él.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { className, ...props },
  ref
) {
  const t = useAppT();
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input ref={ref} type={isVisible ? "text" : "password"} className={className ?? "pr-10"} {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={isVisible ? t("auth.hidePassword") : t("auth.showPassword")}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((value) => !value)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      >
        <ThemaIcon name={isVisible ? "eyeOff" : "eyeOn"} size="sm" tone="muted" />
      </Button>
    </div>
  );
});
