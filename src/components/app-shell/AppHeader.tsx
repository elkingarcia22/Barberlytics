import * as React from "react";
import { Bell, HelpCircle, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SHELL_MENU_PANEL } from "./shellPanel";
import { AccountMenu } from "./AccountMenu";
import { NewsMenu } from "./NewsMenu";
import { useLiquidOrigin } from "./useLiquidOrigin";
import { GlobalSearch } from "@/components/search";
import { useT } from "@/i18n";
import { useShellConfig } from "./shellConfig";

interface AppHeaderProps {
  onToggleSidebar: () => void;
  /** @deprecated – Novedades is now self-contained in the header. Kept for backward compat. */
  onOpenNews: () => void;
  /** Receives the host element that screens portal their own identity into. */
  onSlotRef: (element: HTMLDivElement | null) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onToggleSidebar, onSlotRef }) => {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifOrigin = useLiquidOrigin();

  // Primeras 2 notificaciones marcadas como "nuevas" en los datos de demo
  const t = useT();
  const {
    user,
    news,
    notifications,
    onLogout,
    headerActions,
    chrome,
    search,
    roles,
    activeRoleId,
    onSelectRole,
    companies,
    companyMenuLinks,
    workspaceLabels,
    showWorkspaceUsage,
    activeCompanyId,
    onSelectCompany,
  } = useShellConfig();

  // El espacio activo puede venir de fuera (la app sabe en qué sucursal está)
  // o gestionarlo el shell, igual que el rol.
  const [ownCompanyId, setOwnCompanyId] = React.useState<string | undefined>(() => activeCompanyId ?? companies[0]?.id);
  const activeCompany = companies.find((company) => company.id === (activeCompanyId ?? ownCompanyId)) ?? companies[0];
  const handleSelectCompany = React.useCallback(
    (id: string) => {
      setOwnCompanyId(id);
      onSelectCompany?.(id);
    },
    [onSelectCompany]
  );

  // El rol activo puede venir de fuera (la app lo sabe) o gestionarlo el
  // shell, igual que la empresa activa del sidebar.
  const [ownRoleId, setOwnRoleId] = React.useState<string | undefined>(() => activeRoleId ?? roles[0]?.id);
  const activeRole = roles.find((role) => role.id === (activeRoleId ?? ownRoleId)) ?? roles[0];
  const handleSelectRole = React.useCallback(
    (id: string) => {
      setOwnRoleId(id);
      onSelectRole?.(id);
    },
    [onSelectRole]
  );
  const unreadCount = Math.min(2, notifications.length);

  // The strip reads as surface behind the actions on the right and dissolves
  // to nothing towards the sidebar, where the theme's atmosphere takes over.
  // Both stops are `card` (the surface colour in HSL channels, so it accepts
  // an alpha modifier) — fading from `transparent` instead would drift through
  // grey on its way to white. `border-b` is all that divides it from the page.
  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-border/60 bg-gradient-to-r from-card/0 via-card/0 via-45% to-card px-4 sm:gap-3 sm:px-6">
      {/* ---------- Sidebar toggle ----------
          Only below lg: there the sidebar is an off-canvas drawer, so its own
          edge handle is out of reach. On desktop that handle takes over. */}
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary lg:hidden"
        title="Menú"
        aria-label={t("shell.menu")}
      >
        <PanelLeft className="h-4 w-4" strokeWidth={2} />
      </button>

      {/* Where the mounted screen renders its own live identity (e.g. the
          ciclo builder's name + estado) — no breadcrumb trail here anymore.
          `overflow-hidden`: en pantalla estrecha este hueco se queda sin
          ancho, y sin recorte su contenido se montaba encima de los botones
          de la derecha en vez de ceder el sitio. */}
      <div ref={onSlotRef} className="flex min-w-0 items-center gap-2 overflow-hidden" />

      {/* ---------- Right actions ---------- */}
      {/* En el móvil solo queda lo que responde a dónde estás: búsqueda,
          avisos y el chip de la cuenta. Novedades baja al pie del menú
          lateral y la ayuda se va: son lo único de esta fila que no depende
          de la pantalla que estás mirando. */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">

        {/* ---------- Búsqueda general (⌘K) ---------- */}
        {chrome.search && search && <GlobalSearch {...search} />}

        {/* ---------- Novedades ----------
            Por debajo de `md` se va al pie del menú lateral: el chip de la
            cuenta necesita ese ancho para seguir diciendo dónde estás y como
            quién, y «Novedades» es lo único de esta fila que no responde a
            nada de la pantalla actual. */}
        {chrome.news && <NewsMenu items={news} className="max-md:hidden" />}

        {/* ---------- Ayuda ---------- */}
        {chrome.help && (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary max-sm:hidden"
            title="Ayuda"
            aria-label={t("shell.help")}
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
          </button>
        )}

        {/* ---------- Notifications ---------- */}
        {headerActions}
        {chrome.notifications && (
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button
                ref={notifOrigin.triggerRef}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary",
                  notifOpen && "bg-surface-muted text-text-primary"
                )}
                title="Notificaciones"
                aria-label={t("shell.notifications")}
              >
                <Bell className="h-4 w-4" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border-[1.5px] border-surface bg-primary" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              ref={notifOrigin.contentRef}
              align="end"
              sideOffset={8}
              liquid
              style={notifOrigin.style}
              className={cn("w-[340px] p-0 overflow-hidden", SHELL_MENU_PANEL)}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <span className="text-[13px] font-bold text-text-primary">Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="inline-flex h-5 items-center rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              {/* Lista con stagger */}
              <div className="flex flex-col gap-0.5 overflow-y-auto p-2" style={{ maxHeight: "380px" }}>
                {notifications.map((notification, index) => (
                  <button
                    key={notification.title}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-background",
                      "opacity-0 translate-y-2",
                      notifOpen && "opacity-100 translate-y-0"
                    )}
                    style={{
                      transition: notifOpen
                        ? `opacity 280ms cubic-bezier(0.16,1,0.3,1) ${index * 45}ms, transform 280ms cubic-bezier(0.16,1,0.3,1) ${index * 45}ms`
                        : "none",
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      {index < unreadCount && (
                        <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={cn("min-w-0 flex-1", index >= unreadCount && "pl-[14px]")}>
                        <div className={cn(
                          "text-[13px] text-text-primary",
                          index < unreadCount ? "font-bold" : "font-semibold"
                        )}>
                          {notification.title}
                        </div>
                        <div className="mt-0.5 text-xs leading-snug text-text-secondary">{notification.description}</div>
                        <div className="mt-1 text-[11px] text-text-muted">{notification.date}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 px-4 py-2.5">
                <button className="text-[12px] font-semibold text-primary transition-colors hover:text-primary/80">
                  Ver todas las notificaciones
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* ---------- La cuenta y su contexto ----------
            Quién eres, en qué sucursal estás y como quién miras: una sola
            puerta en la esquina. Antes eran tres —chip de sucursal a la
            izquierda, chip de rol y avatar a la derecha— y las tres
            respondían a la misma pregunta. El tema y el idioma no están
            aquí: son de la plataforma, no de la cuenta, y viven en
            «Personalización», colgando de la marca. */}
        {(chrome.profile || chrome.company) && (
          <AccountMenu
            user={chrome.profile ? user : undefined}
            onLogout={chrome.profile ? onLogout : undefined}
            companies={chrome.company ? companies : undefined}
            activeCompany={chrome.company ? activeCompany : undefined}
            onSelectCompany={handleSelectCompany}
            links={companyMenuLinks}
            labels={workspaceLabels}
            showUsage={showWorkspaceUsage}
            roles={chrome.role ? roles : undefined}
            activeRole={activeRole}
            onSelectRole={handleSelectRole}
          />
        )}
      </div>
    </header>
  );
};
