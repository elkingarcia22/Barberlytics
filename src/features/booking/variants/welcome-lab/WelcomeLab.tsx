import { useAppT } from "@/app/i18n";
import { SegmentedControl } from "@/components/selection";
import { Text } from "@/components/typography";
import { WelcomeBento } from "./WelcomeBento";
import { WelcomePass } from "./WelcomePass";
import { WelcomeRhythm } from "./WelcomeRhythm";
import { useWelcomeData } from "./useWelcomeData";

export type WelcomeProposal = "pass" | "bento" | "rhythm";

interface WelcomeLabProps {
  proposal: WelcomeProposal;
  onProposalChange: (proposal: WelcomeProposal) => void;
}

/**
 * Laboratorio temporal de la bienvenida del cliente que vuelve: tres rediseños sobre los mismos
 * datos y acciones, con un selector arriba para compararlos. Al decidir, el elegido sustituye a
 * `WelcomeStep` y esta carpeta y la versión `welcome-lab` se borran.
 */
export function WelcomeLab({ proposal, onProposalChange }: WelcomeLabProps) {
  const t = useAppT();
  const data = useWelcomeData();
  const options = [
    { value: "pass", label: t("booking.welcomeLab.pass") },
    { value: "bento", label: t("booking.welcomeLab.bento") },
    { value: "rhythm", label: t("booking.welcomeLab.rhythm") },
  ];
  const hint = { pass: t("booking.welcomeLab.passHint"), bento: t("booking.welcomeLab.bentoHint"), rhythm: t("booking.welcomeLab.rhythmHint") }[proposal];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-1.5 border-b border-dashed border-primary/40 bg-primary/5 px-5 py-3">
        <SegmentedControl options={options} value={proposal} onChange={(value) => onProposalChange(value as WelcomeProposal)} size="sm" fullWidth ariaLabel={t("booking.welcomeLab.label")} />
        <Text size="xs" tone="secondary">
          {hint}
        </Text>
      </div>
      {proposal === "pass" ? <WelcomePass data={data} /> : proposal === "bento" ? <WelcomeBento data={data} /> : <WelcomeRhythm data={data} />}
    </div>
  );
}
