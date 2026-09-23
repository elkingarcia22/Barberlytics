import { StatusBadge } from "@/components/data-display";
import { useAppT } from "@/app/i18n";
import { USER_STATUS_KEYS, type UserStatus } from "./types";

const STATUS_MAP: Record<UserStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  invited: "pending",
  inactive: "inactive",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const t = useAppT();
  return <StatusBadge status={STATUS_MAP[status]} label={t(USER_STATUS_KEYS[status])} />;
}
