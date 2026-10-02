import * as React from "react";
import { Navigate, useLocation } from "react-router";
import { useAppT } from "@/app/i18n";
import { Enter, Foil, Grain, HairCanvas, Halo, Vignette } from "@/components/atmosphere";
import { Heading, Text } from "@/components/typography";
import { BarberlyticsLogo } from "@/components/ui/BarberlyticsLogo";
import { LanguageSelector } from "@/i18n";
import { ThemeModeToggle, useForcedPreset } from "@/themes";
import { useAuth } from "./useAuth";
import { LoginForm } from "./LoginForm";
import { RecoveryPanel } from "./RecoveryPanel";
import { LoginHeroImage } from "./LoginHeroImage";
import { LockedPanel } from "./LockedPanel";
import { SignupPanel } from "./SignupPanel";
import { SupportTicketPanel, type TicketContext } from "./SupportTicketPanel";
import { cn } from "@/lib/utils";

interface LocationState {
  from?: string;
}

type View =
  | { name: "login" }
  | { name: "recovery" }
  | { name: "signup" }
  | { name: "locked"; phone: string }
  | { name: "ticket"; context: TicketContext };

const WIDE_VIEWS: ReadonlySet<View["name"]> = new Set(["signup", "ticket"]);

/** El login siempre se presenta con el tema premium, elija lo que elija la persona en la app. */
const LOGIN_PRESET = "premium";

/**
 * Entrada a la aplicación en dos mitades. A la izquierda, el panel de
 * portada sobre el cromo oscuro del tema premium: la foto de barbería en duotono,
 * halo, grano y el titular abajo. A la derecha, el formulario sobre el fondo
 * de la app con el cabello cayendo detrás, que alterna entre entrar y
 * recuperar el acceso. Idioma y tema, arriba.
 */
export function LoginPage() {
  const t = useAppT();
  useForcedPreset(LOGIN_PRESET);
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? "/metricas";
  const [view, setView] = React.useState<View>({ name: "login" });
  const toLogin = () => setView({ name: "login" });

  if (status === "authenticated") return <Navigate to={from} replace />;

  return (
    <main className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <section
        aria-label={t("auth.stage.kicker")}
        className="relative isolate flex flex-col justify-between overflow-clip bg-surface-nav px-6 py-6 text-nav-foreground sm:px-10 lg:min-h-dvh lg:w-[52%] lg:p-14"
      >
        <div aria-hidden className="absolute inset-0 -z-10">
          <LoginHeroImage />
          <Halo x="28%" y="24%" size="60rem 40rem" strength={0.42} />
          <Halo x="90%" y="96%" size="40rem 24rem" strength={0.2} />
          <Grain />
          <Vignette />
        </div>

        <Enter>
          <BarberlyticsLogo height={44} className="text-nav-foreground" />
        </Enter>

        <div className="mt-10 flex max-w-xl flex-col gap-4 lg:mt-0 lg:gap-6">
          <Enter delay={80}>
            <Text size="sm" weight="semibold" tone="primary">
              {t("auth.stage.kicker")}
            </Text>
          </Enter>
          <Enter delay={140}>
            <Heading level={1} weight="bold" tone="inverse">
              {t("auth.stage.title")}
              <br />
              <Foil as="em" className="not-italic">
                {t("auth.stage.titleAccent")}
              </Foil>
            </Heading>
          </Enter>
          <Enter delay={200} className="hidden lg:block">
            <Text variant="lead" tone="inverse" className="max-w-md">
              {t("auth.stage.lead")}
            </Text>
          </Enter>
        </div>
      </section>

      <div className="relative isolate flex flex-1 flex-col overflow-clip">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Halo x="50%" y="42%" size="48rem 36rem" strength={0.14} />
          <HairCanvas density={1.15} />
          <Grain />
        </div>
        <header className="flex items-center justify-end gap-1.5 px-6 py-4 sm:px-10" role="group" aria-label={t("auth.themeTools")}>
          <LanguageSelector compact />
          <ThemeModeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 sm:px-10">
          <Enter delay={120} className={cn("w-full", WIDE_VIEWS.has(view.name) ? "max-w-md" : "max-w-sm")}>
            <section aria-labelledby="login-heading" className="brand-ring panel-sheen rounded-3xl bg-card/85 p-6 backdrop-blur-xl sm:p-8">
              {view.name === "login" && (
                <LoginForm
                  onForgotNumber={() => setView({ name: "recovery" })}
                  onCreateAccount={() => setView({ name: "signup" })}
                  onLocked={(phone) => setView({ name: "locked", phone })}
                />
              )}
              {view.name === "recovery" && (
                <RecoveryPanel onBack={toLogin} onCreateTicket={(email) => setView({ name: "ticket", context: { reason: "recovery", email } })} />
              )}
              {view.name === "signup" && <SignupPanel onBack={toLogin} />}
              {view.name === "locked" && (
                <LockedPanel
                  phone={view.phone}
                  onBack={toLogin}
                  onCreateTicket={() => setView({ name: "ticket", context: { reason: "lockout", phone: view.phone } })}
                />
              )}
              {view.name === "ticket" && <SupportTicketPanel context={view.context} onBack={toLogin} />}
            </section>
          </Enter>
        </div>
      </div>
    </main>
  );
}
