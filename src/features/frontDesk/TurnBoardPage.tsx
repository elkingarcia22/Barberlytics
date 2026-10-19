import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { Heading, Text } from "@/components/typography";
import { KioskError, kioskApi, kioskToken, type TurnBoard } from "./kioskApi";
import { Pairing } from "./KioskPage";

/**
 * La pantalla de turnos (`/turnos`): el televisor de la sala muestra a quién le toca y quién sigue, con
 * la espera aproximada. Sin datos personales: solo el nombre de pila y el turno, nada de celular ni de
 * servicio. Usa el token de un kiosco de la sede (se empareja con el mismo código de Configuración) y
 * se refresca sola.
 */

const REFRESH_MS = 15_000;

function Wait({ min, max }: { min: number | null; max: number | null }) {
  const t = useAppT();
  if (min === null || max === null) return <>{t("turns.noTime")}</>;
  if (max <= 10) return <>{t("turns.almost")}</>;
  return <>{t("turns.wait", { min, max })}</>;
}

function Board({ data }: { data: TurnBoard }) {
  const t = useAppT();
  return (
    <div className="grid flex-1 gap-6 lg:grid-cols-[2fr_3fr]">
      <section aria-labelledby="turns-now" className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6" data-testid="turns-called">
        <Heading level={2} id="turns-now">
          {t("turns.now")}
        </Heading>
        {data.called.length === 0 ? (
          <Text size="lg" tone="muted">
            {t("turns.nobodyCalled")}
          </Text>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.called.map((entry, index) => (
              <li key={entry.id} className={index === 0 ? "rounded-2xl bg-primary px-5 py-4 text-primary-foreground" : "rounded-2xl bg-surface-subtle px-5 py-3"}>
                <p className={index === 0 ? "text-4xl font-semibold" : "text-2xl font-medium"}>{entry.firstName}</p>
                {entry.barberFirstName && <p className={index === 0 ? "text-xl opacity-90" : "text-lg text-text-muted"}>{t("turns.with", { barber: entry.barberFirstName })}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="turns-next" className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6" data-testid="turns-next">
        <div className="flex items-baseline justify-between gap-3">
          <Heading level={2} id="turns-next">
            {t("turns.next")}
          </Heading>
          <Text size="lg" tone="muted">
            {t("turns.waiting", { count: data.waiting })}
          </Text>
        </div>
        {data.next.length === 0 ? (
          <Text size="lg" tone="muted">
            {t("turns.empty")}
          </Text>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {data.next.map((entry) => (
              <li key={entry.id} className="flex items-center gap-4 py-3">
                <span className="w-14 text-3xl font-semibold tabular-nums text-primary">{entry.position}</span>
                <span className="flex-1 truncate text-2xl">{entry.firstName}</span>
                <span className="text-lg text-text-muted">
                  <Wait min={entry.waitMin} max={entry.waitMax} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export function TurnBoardPage() {
  const t = useAppT();
  const { formatDate } = useLocale();
  const queryClient = useQueryClient();
  const [paired, setPaired] = React.useState(() => kioskToken.get() !== null);
  const board = useQuery({
    queryKey: ["kiosk", "board"],
    queryFn: () => kioskApi.board(),
    enabled: paired,
    refetchInterval: REFRESH_MS,
    retry: (count, error) => !(error instanceof KioskError && error.status === 401) && count < 2,
  });
  const revoked = board.error instanceof KioskError && board.error.status === 401;
  const onPaired = () => {
    setPaired(true);
    void queryClient.resetQueries({ queryKey: ["kiosk", "board"] });
  };

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-background p-6 text-text-primary lg:p-10" data-testid="turns">
      <header className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <Heading level={1}>{board.data?.shopName || t("turns.title")}</Heading>
          {board.data && (
            <Text size="lg" tone="muted">
              {board.data.branch.name}
            </Text>
          )}
        </div>
        {board.dataUpdatedAt > 0 && (
          <Text size="lg" tone="muted" tabular>
            {formatDate(new Date(board.dataUpdatedAt), { hour: "numeric", minute: "2-digit" })}
          </Text>
        )}
      </header>
      {!paired || revoked ? (
        <div className="mx-auto w-full max-w-md">
          <Pairing onPaired={onPaired} />
        </div>
      ) : board.data ? (
        <Board data={board.data} />
      ) : (
        <Text tone="muted">{t("kiosk.loading")}</Text>
      )}
      <Text size="lg" tone="muted" className="text-center">
        {t("turns.footer")}
      </Text>
    </main>
  );
}
