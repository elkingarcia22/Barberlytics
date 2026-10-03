import { useAppT } from "@/app/i18n";
import { Badge } from "@/components/ui/badge";
import { STATUS_STYLE } from "./transactionsStyle";
import { ACCOUNT_STATUS_KEYS, type AccountStatus } from "./types";

/** El estado de una cuenta, con su color y su icono. */
export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const t = useAppT();
  const { icon: Icon, badge } = STATUS_STYLE[status];
  return (
    <Badge variant={badge}>
      <Icon className="size-3" aria-hidden /> {t(ACCOUNT_STATUS_KEYS[status])}
    </Badge>
  );
}
