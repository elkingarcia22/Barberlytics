import { Ban, CalendarPlus, Download, Eye, NotebookPen, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import type { AppMessageKey } from "@/app/i18n/types";
import type { RailActionSpec } from "@/components/action-rail";
import type { CustomerPermissions } from "./customerAccess";

export interface CustomerListHandlers {
  create: () => void;
  exportList: () => void;
  importList: () => void;
  open: () => void;
  book: () => void;
  note: () => void;
  block: () => void;
  remove: () => void;
}

/** Las acciones de la lista; cada una aparece solo si su casilla de la matriz está marcada. */
export function customerListActions(t: (key: AppMessageKey) => string, on: CustomerListHandlers, blocked: boolean, perms: CustomerPermissions): readonly RailActionSpec[] {
  const actions: (RailActionSpec | false)[] = [
    perms.canCreate && { id: "create", label: t("customers.action.create"), icon: <UserPlus className="size-4" strokeWidth={2.5} />, scope: ["screen"], primary: true, onSelect: on.create },
    perms.canImport && { id: "import", label: t("customers.action.import"), icon: <Upload className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.importList },
    perms.canExport && { id: "export", label: t("customers.action.export"), icon: <Download className="size-5" strokeWidth={2} />, scope: ["screen"], overflow: true, onSelect: on.exportList },
    { id: "open", label: t("customers.action.open"), icon: <Eye className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: on.open },
    { id: "book", label: t("customers.action.book"), icon: <CalendarPlus className="size-5" strokeWidth={2} />, scope: ["single"], blockedReason: blocked ? t("customers.action.bookBlocked") : null, onSelect: on.book },
    { id: "note", label: t("customers.action.note"), icon: <NotebookPen className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: on.note },
    perms.canEdit &&
      (blocked
        ? { id: "unblock", label: t("customers.action.unblock"), icon: <ShieldCheck className="size-5" strokeWidth={2} />, scope: ["single"], onSelect: on.block }
        : { id: "block", label: t("customers.action.block"), icon: <Ban className="size-5" strokeWidth={2} />, scope: ["single"], tone: "danger", onSelect: on.block }),
    perms.canDelete && { id: "delete", label: t("customers.action.delete"), icon: <Trash2 className="size-5" strokeWidth={2} />, scope: ["single"], tone: "danger", overflow: true, onSelect: on.remove },
  ];
  return actions.filter((action): action is RailActionSpec => action !== false);
}
