import { StatusBadge } from "@/components/data-display";
import { USER_STATUS_LABELS, type UserStatus } from "./types";

const STATUS_MAP: Record<UserStatus, "active" | "pending" | "inactive"> = {
  active: "active",
  invited: "pending",
  inactive: "inactive",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <StatusBadge status={STATUS_MAP[status]} label={USER_STATUS_LABELS[status]} />;
}
