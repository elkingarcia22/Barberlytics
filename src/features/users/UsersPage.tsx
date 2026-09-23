import * as React from "react";
import { useNavigate } from "react-router";
import { useAppT } from "@/app/i18n";
import { useLocale } from "@/i18n";
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/feedback";
import { ShellHeaderSlot } from "@/components/app-shell";
import { Breadcrumbs } from "@/components/navigation";
import { PageHeader } from "@/components/utility";
import { QueryBoundary } from "@/lib/query";
import { useCurrentUser } from "@/features/auth";
import { cn } from "@/lib/utils";
import { useDeleteUser, useUsersQuery } from "./queries";
import { UserFormDrawer } from "./UserFormDrawer";
import { UserStatusBadge } from "./UserStatusBadge";
import { useUsersListState } from "./useUsersListState";
import { USER_ROLE_KEYS, USER_STATUS_KEYS, areaKey, userStatusSchema, type User } from "./types";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
/** La fecha de la fila, con la convención del idioma activo. */
const formatDate = (iso: string | null, intlLocale: string) =>
  iso ? new Intl.DateTimeFormat(intlLocale, DATE_OPTIONS).format(new Date(iso)) : "—";

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function UsersPage() {
  const t = useAppT();
  const navigate = useNavigate();
  const { current } = useLocale();
  const me = useCurrentUser();
  const list = useUsersListState();
  const query = useUsersQuery(list.params);
  const remove = useDeleteUser();
  const [editing, setEditing] = React.useState<User | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<User | null>(null);
  const canManage = me.role !== "member";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  return (
    <div className="cascade-enter space-y-section">
      <ShellHeaderSlot>
        <Breadcrumbs
          items={[
            { label: t("nav.home"), onClick: () => navigate("/dashboard") },
            { label: t("team.title"), onClick: () => navigate("/usuarios") },
            t("users.title"),
          ]}
        />
      </ShellHeaderSlot>

      <PageHeader
        title={t("users.title")}
        description={t("users.pageDescription")}
        actions={
          canManage ? (
            <Button onClick={openCreate} data-testid="users-new">
              <Plus /> {t("users.newPerson")}
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            value={list.search}
            onChange={(event) => list.setSearch(event.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="pl-9"
            data-testid="users-search"
            aria-label={t("users.searchAria")}
          />
        </label>
        <Select value={list.status || "all"} onValueChange={list.setStatus}>
          <SelectTrigger className="w-[160px]" aria-label={t("users.colStatus")} data-testid="users-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.allStatuses")}</SelectItem>
            {userStatusSchema.options.map((status) => (
              <SelectItem key={status} value={status}>
                {t(USER_STATUS_KEYS[status])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={list.sort} onValueChange={list.setSort}>
          <SelectTrigger className="w-[180px]" aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("users.sortNameAsc")}</SelectItem>
            <SelectItem value="-name">{t("users.sortNameDesc")}</SelectItem>
            <SelectItem value="-createdAt">{t("users.sortNewest")}</SelectItem>
            <SelectItem value="createdAt">{t("users.sortOldest")}</SelectItem>
          </SelectContent>
        </Select>
        {query.isFetching && !query.isPending && <Loader2 className="size-4 animate-spin text-text-muted" aria-label="Actualizando" />}
      </div>

      <QueryBoundary
        query={query}
        loading={<div className="rounded-2xl border border-border/60 bg-surface"><TableSkeleton /></div>}
        empty={{
          when: (data) => data.items.length === 0,
          render: (
            <EmptyState
              title={list.search || list.status ? t("users.noResultsTitle") : t("users.emptyTitle")}
              description={list.search || list.status ? t("users.noResultsHint") : t("users.emptyHint")}
            />
          ),
        }}
      >
        {(data) => (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
            <Table data-testid="users-table" className={cn(query.isFetching && "opacity-70 transition-opacity")}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.colPerson")}</TableHead>
                  <TableHead>{t("users.colArea")}</TableHead>
                  <TableHead>{t("users.colRole")}</TableHead>
                  <TableHead>{t("users.colStatus")}</TableHead>
                  <TableHead>{t("users.colLastActivity")}</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">{t("users.colActions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((user) => (
                  <TableRow key={user.id} data-user-email={user.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{user.name}</p>
                          <p className="truncate text-xs text-text-muted">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-text-secondary">{areaKey(user.area) ? t(areaKey(user.area)!) : user.area}</TableCell>
                    <TableCell className="text-text-secondary">{t(USER_ROLE_KEYS[user.role])}</TableCell>
                    <TableCell>
                      <UserStatusBadge status={user.status} />
                    </TableCell>
                    <TableCell className="tabular-nums text-text-secondary">{formatDate(user.lastActiveAt, current.intl)}</TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${user.name}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEdit(user)}>
                              <Pencil /> Editar
                            </DropdownMenuItem>
                            {me.role === "admin" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(user)}>
                                  <Trash2 /> Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-sm text-text-secondary">
              <span data-testid="users-total">
                {data.meta.total} personas · página {data.meta.page} de {data.meta.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={data.meta.page <= 1} onClick={() => list.setPage(data.meta.page - 1)} aria-label={t("users.prevPage")}>
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.page >= data.meta.totalPages}
                  onClick={() => list.setPage(data.meta.page + 1)}
                  aria-label={t("users.nextPage")}
                >
                  Siguiente <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        )}
      </QueryBoundary>

      <UserFormDrawer open={formOpen} onOpenChange={setFormOpen} user={editing} />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>{t("users.deleteWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) remove.mutate(pendingDelete);
                setPendingDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!canManage && (
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <UserPlus className="size-3.5" /> Solo administradores y líderes pueden crear o editar personas.
        </p>
      )}
    </div>
  );
}
