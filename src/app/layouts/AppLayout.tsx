import { ClockInButton } from "@/features/team/operations/ClockInButton";
import * as React from "react";
import { apiAuth } from "@/lib/api";
import { legalHref } from "@/features/legal/documents";
import { ClipperIcon } from "@/components/ai-interaction";
import { RailAgentProvider, type RailActionSpec } from "@/components/action-rail";
import { AiSparkGlyph } from "@/components/ai-interaction";
import { PageHeaderExtrasProvider } from "@/components/utility";
import { AgentButton } from "./AgentButton";
import { Armchair, BookOpen, ConciergeBell, Crown, ListChecks, Scissors, ShieldCheck } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AdminShell, PersonalizationMenu, type ChatHistoryGroup, type ShellConfigOverrides, type ShellMode, type UserRoleOption } from "@/components/app-shell";
import { ChatPanel, ChatProvider, ChatScreen, ChatVoiceMode, type ChatContextValue } from "@/components/chat";
import { groupConversations } from "@/lib/chat";
import { useLocale } from "@/i18n";
import { useTheme } from "@/themes";
import { useAppT } from "../i18n";
import type { AppMessageKey } from "../i18n/types";
import { StepUpHost, authApi, useAuth } from "@/features/auth";
import { AccessProvider, buildAccess, canViewAs, isBarberRole, readViewAs, ROLE_HOME, teamRoleFromSession, writeViewAs } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { BrandLogoSection, useBrandingQuery, useSaveBranding } from "@/features/branding";
import { PersonalizationPanel } from "@/features/personalization";
import { CommentsToggle } from "@/components/comments";
import { PlatformCommentLayer, PlatformCommentsPanel, PlatformCommentsProvider } from "@/features/comments";
import { BARBERLYTICS_DEFAULT_LOGO } from "@/components/ui/barberlyticsBrandColors";
import { ACTIVE_FEEDBACK_CAMPAIGN, FeedbackHost, findNavLabel } from "@/features/feedback";
import { DEFAULT_BRANCH_ID, readInitialBranch, useBranches } from "@/features/branches";
import { useMessageDispatcher } from "@/features/calendar/messages";
import { useMoney } from "@/features/calendar/calendarFormat";
import { toShellNotifications, useMarkNotificationsRead, useNotifications, useRetryMessage } from "../notifications";
import { buildSettingsGroups, SETTINGS_ALL } from "@/features/settings/settingsCatalog";
import { buildAppNavigation, findActiveNavId, showsLegalFooter } from "../navigation";
import { PageLoader } from "../components/PageLoader";
import { HelpGuidesDrawer } from "@/help/HelpGuidesDrawer";
import { helpPath, toHelpLocale, useHelpIndex } from "@/help/content";
import { chatStore, clearChatOnLogout, createAppChatBackend } from "../chat";
import { TOOL_LABEL_KEYS } from "@/features/clipper/tools";
import { runClipperAction } from "@/features/clipper/proposals";
import { sendClipperFeedback } from "@/features/clipper/clipperBackend";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError } from "@/lib/api";
import { useSettingsList } from "@/features/settings/settingsQueries";
import { branchSchema } from "@/features/settings/settingsTypes";
import { agentFocus, withAgentFocus } from "@/lib/chat";

/** Lo que cada persona pregunta primero: las puertas de arranque del chat. */
const CHAT_SUGGESTION_KEYS = ["chat.suggestion1", "chat.suggestion2", "chat.suggestion3", "chat.suggestion4"] as const;

/**
 * Lo que el agente propone preguntar depende de dónde se abra: en el
 * calendario, cosas del día; en clientes, de clientes. La pantalla que no
 * tenga las suyas ofrece las generales.
 */
const CONTEXT_SUGGESTIONS: readonly { prefix: string; labelKey: AppMessageKey; keys: readonly AppMessageKey[] }[] = [
  { prefix: "/calendario", labelKey: "calendar.title", keys: ["agent.calendar.1", "agent.calendar.2", "agent.calendar.3", "agent.calendar.4"] },
  { prefix: "/clientes", labelKey: "agent.context.customers", keys: ["agent.customers.1", "agent.customers.2", "agent.customers.3", "agent.customers.4"] },
  { prefix: "/usuarios", labelKey: "team.title", keys: ["agent.team.1", "agent.team.2", "agent.team.3", "agent.team.4"] },
  { prefix: "/metricas", labelKey: "agent.context.metrics", keys: ["agent.metrics.1", "agent.metrics.2", "agent.metrics.3", "agent.metrics.4"] },
];

/**
 * Los roles de la barbería, de más alcance a menos, con la línea que explica
 * qué se ve al asumirlos y el icono que los distingue sin leer. El menú de la
 * cuenta los ofrece para mirar la plataforma como otra persona sin cerrar
 * sesión.
 *
 * Los dos tipos de barbero no son un matiz de nómina: uno cobra comisión por
 * servicio y el otro paga la renta de su silla y cobra directo, así que ven
 * cuentas distintas.
 */
function buildAppRoles(t: (key: AppMessageKey) => string): readonly UserRoleOption[] {
  return [
    { id: "owner", label: t("role.owner"), description: t("role.ownerHint"), icon: Crown },
    { id: "admin", label: t("role.admin"), description: t("role.adminHint"), icon: ShieldCheck },
    { id: "recepcion", label: t("role.reception"), description: t("role.receptionHint"), icon: ConciergeBell },
    { id: "barbero-comision", label: t("role.barberCommission"), description: t("role.barberCommissionHint"), icon: Scissors },
    { id: "barbero-renta", label: t("role.barberRent"), description: t("role.barberRentHint"), icon: Armchair },
  ];
}

/**
 * El shell de administración alimentado con datos reales: la persona de la
 * sesión, la navegación de la app con sus rutas, el tema del ThemeProvider y
 * el cierre de sesión. Las notificaciones y novedades siguen con datos demo
 * hasta que exista su endpoint (ver docs/API_CONTRACT.md).
 */
/**
 * La campaña de feedback (recorrido guiado + botón flotante) está apagada
 * por ahora: el botón tapaba los paneles de trabajo. Volver a `true` la
 * devuelve tal cual. El diálogo de feedback sigue disponible desde el menú
 * lateral: esto solo decide si además se sale a pedir la opinión.
 */
const FEEDBACK_CAMPAIGN_VISIBLE = false;

export function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedMode, setMode } = useTheme();
  const t = useAppT();
  const allRoles = React.useMemo(() => buildAppRoles(t), [t]);
  const navigate = useNavigate();
  const location = useLocation();
  // Mirar como otro rol es estado de la app, no de la sesión: el token sigue
  // siendo el mismo. Se recuerda entre recargas (features/access/viewAs).
  const [storedViewRole, setViewRoleId] = React.useState<TeamRole | null>(() => readViewAs());
  // El rol en la barbería viene de la sesión; las cuentas antiguas solo traen el de la plantilla.
  const ownRole = teamRoleFromSession(user?.teamRole ?? user?.role);
  // Solo hacia abajo: un «ver como» guardado que este rol no puede usar se ignora.
  const viewRoleId = storedViewRole && canViewAs(ownRole, storedViewRole) ? storedViewRole : null;
  const roles = React.useMemo(() => allRoles.filter((role) => canViewAs(ownRole, role.id as TeamRole)), [allRoles, ownRole]);
  const effectiveRole = viewRoleId ?? ownRole;
  // Quién mira y qué puede: el menú, las rutas y cada pantalla preguntan aquí.
  const previewing = viewRoleId !== null && viewRoleId !== ownRole;
  // Sin «ver como», la persona es la de la sesión (su ficha real); mirando otro rol, la de ejemplo de ese rol.
  const access = React.useMemo(
    () => buildAccess({ role: effectiveRole, previewing, ...(!previewing && user?.memberId ? { member: { id: user.memberId, name: user.name } } : {}) }),
    [effectiveRole, previewing, user]
  );
  // Mirando como otro rol todo es de solo lectura: cada petición lo dice y el servidor rechaza los cambios.
  React.useEffect(() => {
    apiAuth.getViewAs = () => (previewing ? effectiveRole : null);
    return () => {
      apiAuth.getViewAs = undefined;
    };
  }, [previewing, effectiveRole]);
  const selectRole = React.useCallback(
    (roleId: string) => {
      if (!canViewAs(ownRole, roleId as TeamRole)) return;
      const next = roleId === ownRole ? null : (roleId as TeamRole);
      setViewRoleId(next);
      writeViewAs(next);
      // Como en producción: al cambiar de perfil se aterriza en el inicio de ese rol.
      navigate(ROLE_HOME[roleId as TeamRole] ?? "/");
    },
    [navigate, ownRole]
  );
  // La sucursal activa: mientras no haya endpoint, la recuerda la sesión de
  // navegación. Todo lo que se ve debajo es de esta sucursal.
  // Una cuenta recién registrada entra a la sucursal que acaba de crear.
  const [chosenBranchId, setBranchId] = React.useState(() => readInitialBranch() ?? DEFAULT_BRANCH_ID);
  // Las de Configuración: si la elegida se borra o se desactiva, se pasa a la primera que queda.
  const branches = useBranches();
  // Los mensajes de WhatsApp que ya tocan salen mientras alguien del equipo tiene la app abierta.
  useMessageDispatcher(Boolean(user));
  const branchId = branches.some((branch) => branch.id === chosenBranchId) ? chosenBranchId : (branches[0]?.id ?? DEFAULT_BRANCH_ID);
  const settings = React.useMemo(() => buildSettingsGroups(t, access), [t, access]);
  // La identidad que subió la barbería: su isologo, su nombre y debajo
  // «Barbería». Mientras carga (o si falla) va la flecha de Barberlytics con
  // el mismo formato, así el menú nunca cambia de forma.
  const { data: branding } = useBrandingQuery();
  const { mutate: saveBranding, isPending: isResettingLogo } = useSaveBranding();
  // La ayuda: el botón de la cabecera abre el panel de la pantalla actual y
  // los artículos entran en la búsqueda general como objetos que se abren.
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  // Quién abrió el chat: «Ayuda» o el agente de la cabecera, que lo abre con el contexto de la pantalla.
  const [chatFrom, setChatFrom] = React.useState<"help" | "agent">("help");
  const [isGuidesOpen, setIsGuidesOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  // El chat: «Pregúntame» abre el panel; el modo «Agente IA» del shell lo
  // abre a pantalla completa con el historial. Los dos miran el mismo
  // almacén de conversaciones.
  const [shellMode, setShellMode] = React.useState<ShellMode>("workspace");
  const [isVoiceOpen, setIsVoiceOpen] = React.useState(false);
  const { locale, formatDate } = useLocale();
  const formatMoney = useMoney();
  // La campana: los avisos de esta sucursal para este rol (y, si es barbero, solo los suyos).
  const notificationsQuery = useNotifications({ branchId, role: effectiveRole, memberId: isBarberRole(effectiveRole) ? (access.member?.id ?? null) : null, enabled: Boolean(user) });
  const markRead = useMarkNotificationsRead();
  const retry = useRetryMessage();
  const notificationItems = React.useMemo(
    () =>
      toShellNotifications(notificationsQuery.data?.items ?? [], {
        t,
        formatMoney,
        formatDate,
        navigate,
        markRead: (ids) => markRead.mutate(ids),
        revokeOtherSessions: () =>
          void authApi
            .revokeOtherSessions()
            .then((result) => toast.success(t("notifications.revoked", { count: result.closed })))
            .catch((error: unknown) => toast.error(describeError(error).title, { description: describeError(error).description })),
        retryMessage: (id) =>
          retry.mutate(id, {
            onSuccess: () => toast.success(t("notifications.retried")),
            onError: (error) => toast.error(describeError(error).title, { description: describeError(error).description }),
          }),
      }),
    [notificationsQuery.data, t, formatMoney, formatDate, navigate, markRead, retry]
  );
  const queryClient = useQueryClient();
  const chatState = React.useSyncExternalStore(chatStore.subscribe, chatStore.getState, chatStore.getState);
  // Clipper consulta con la sesión de quien pregunta: su rol, su ficha, su sucursal y su moneda.
  const branchSettings = useSettingsList("branches", branchSchema);
  const currency = branchSettings.data?.items.find((branch) => branch.id === branchId)?.currency ?? "USD";
  const branchName = branches.find((branch) => branch.id === branchId)?.name ?? "";
  const memberId = access.member?.id ?? null;
  const userName = user?.name ?? "";
  // Quien comenta en la revisión es quien inició sesión: su nombre firma cada comentario en la hoja.
  const chatBackend = React.useMemo(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return createAppChatBackend(
      {
        from: (title) => t("help.chatFrom", { title }),
        notFound: t("help.chatNotFound"),
        openArticle: t("help.chatOpenArticle"),
        seeMore: t("help.chatSeeMore"),
      },
      toHelpLocale(locale),
      {
        context: { branchId, role: effectiveRole, memberId, today, locale: toHelpLocale(locale), branch: branchName, currency, userName, t },
        labels: { consulted: t("clipper.consulted"), tool: (name) => t(TOOL_LABEL_KEYS[name as keyof typeof TOOL_LABEL_KEYS] ?? "clipper.consulted") },
      }
    );
  }, [t, locale, branchId, effectiveRole, memberId, branchName, currency, userName]);
  // Lo que una pantalla le pidió al agente que mire (una cita): mientras esté, responde primero eso.
  const { focus: agentFocusValue } = React.useSyncExternalStore(agentFocus.subscribe, agentFocus.getState, agentFocus.getState);
  const answeringBackend = React.useMemo(() => (agentFocusValue ? withAgentFocus(chatBackend, agentFocusValue) : chatBackend), [agentFocusValue, chatBackend]);
  // Una pantalla pide abrir el agente con su foco: conversación nueva, el panel abierto y la primera pregunta hecha.
  const chatBackendRef = React.useRef(chatBackend);
  React.useEffect(() => {
    chatBackendRef.current = chatBackend;
  }, [chatBackend]);
  React.useEffect(() => {
    let seen = agentFocus.getState().request;
    return agentFocus.subscribe(() => {
      const { focus, request } = agentFocus.getState();
      if (!focus || request === seen) return;
      seen = request;
      setChatFrom("agent");
      setShellMode("workspace");
      setIsHelpOpen(true);
      chatStore.setActive(null);
      if (focus.opening) chatStore.send(focus.opening, withAgentFocus(chatBackendRef.current, focus));
    });
  }, []);
  const setChatOpen = React.useCallback((open: boolean) => {
    setIsHelpOpen(open);
    if (!open) agentFocus.clear();
  }, []);
  const openHelp = React.useCallback(() => {
    setChatFrom("help");
    setIsHelpOpen(true);
  }, []);
  // El contexto del agente: la pantalla desde la que se abrió.
  const agentContext = chatFrom === "agent" ? CONTEXT_SUGGESTIONS.find((item) => location.pathname.startsWith(item.prefix)) : undefined;
  const chatContext = React.useMemo<ChatContextValue>(
    () => ({
      store: chatStore,
      backend: answeringBackend,
      user: { name: user?.name ?? "" },
      lang: locale === "en" ? "en-US" : "es-CO",
      onNavigate: (href) => {
        setIsHelpOpen(false);
        setShellMode("workspace");
        navigate(href);
      },
      suggestions: agentFocusValue?.suggestions ?? (agentContext?.keys ?? CHAT_SUGGESTION_KEYS).map((key) => t(key)),
      news: { text: t("chat.news.help"), onOpen: () => navigate(helpPath()) },
      onOpenFull: (conversationId) => {
        chatStore.setActive(conversationId);
        setShellMode("agent");
      },
      onOpenVoice: () => setIsVoiceOpen(true),
      // El 👍/👎 de una respuesta del modelo va a su registro; la conversación, solo si la persona la compartió.
      onFeedback: (message, value, detail) => {
        if (message.via !== "model" || !message.traceId) return;
        const conversation = chatStore.getState().conversations.find((item) => item.messages.some((entry) => entry.id === message.id));
        const index = conversation?.messages.findIndex((entry) => entry.id === message.id) ?? -1;
        const question = conversation && index > 0 ? [...conversation.messages.slice(0, index)].reverse().find((entry) => entry.role === "user")?.text : undefined;
        void sendClipperFeedback({ turnId: message.traceId, value, reasons: detail?.reasons, comment: detail?.comment, share: detail?.share, question, answer: message.text });
      },
      // Lo que propuso Clipper se aplica (o se deshace) con los endpoints de siempre; después, todo se vuelve a leer.
      onAction: async (action, op) => {
        try {
          return await runClipperAction(action, op);
        } catch (error) {
          throw new Error(describeError(error).description, { cause: error });
        } finally {
          void queryClient.invalidateQueries();
        }
      },
    }),
    [agentContext, agentFocusValue, answeringBackend, user?.name, locale, navigate, t, queryClient]
  );
  // El historial de la barra lateral, con Hoy / Ayer / Últimos 7 días.
  const chatHistory = React.useMemo<readonly ChatHistoryGroup[]>(() => {
    const labels = { today: t("chat.history.today"), yesterday: t("chat.history.yesterday"), week: t("chat.history.week"), older: t("chat.history.older") };
    return groupConversations(chatState.conversations).map((group) => ({
      label: labels[group.key],
      items: group.items.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        status: conversation.messages.at(-1)?.status === "pending" ? "thinking" : conversation.unread ? "unread" : "read",
      })),
    }));
  }, [chatState.conversations, t]);
  const { data: helpIndex } = useHelpIndex();
  const helpObjects = React.useMemo(
    () =>
      Object.values(helpIndex?.articles ?? {}).map((article) => ({
        id: `help-${article.id}`,
        title: article.title,
        meta: [t("help.title"), helpIndex?.sections.find((section) => section.id === article.section)?.title ?? article.section],
        keywords: article.keywords,
        onSelect: () => navigate(helpPath(article.id)),
      })),
    [helpIndex, navigate, t]
  );
  const brand = React.useMemo(
    () => ({
      productName: branding?.name ?? "Barberlytics",
      tagline: "Barbería",
      logo: branding?.logo ? { src: branding.logo, darkSrc: branding.logoDark } : null,
      display: "isologo" as const,
      termsHref: legalHref("terms"),
      privacyHref: legalHref("privacy"),
    }),
    [branding]
  );
  // Personalización es un panel lateral que empuja la página: vive aquí y no en el menú
  // de la marca, que se cierra al abrirlo.
  const [personalizationOpen, setPersonalizationOpen] = React.useState(false);
  // «Cambiar» lleva a Identidad de marca con el panel aún abierto: al subir el logo,
  // «Desde tu logo» propone sus colores ahí mismo.
  const personalizationLogo = (
    <BrandLogoSection
      logo={brand.logo}
      name={brand.productName}
      onChange={() => navigate("/configuracion/identidad")}
      // Quitar el logo propio deja el nombre como está: solo vuelve la flecha de Barberlytics.
      onReset={() => saveBranding({ name: branding?.name ?? null, logo: null, logoDark: null })}
      isResetting={isResettingLogo}
    />
  );

  const navigation = React.useMemo(() => buildAppNavigation(t, access), [t, access]);
  const activeNavId = findActiveNavId(location.pathname);

  const config = React.useMemo<ShellConfigOverrides>(
    () => ({
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: roles.find((role) => role.id === effectiveRole)?.label ?? effectiveRole, avatarUrl: user.avatarUrl ?? null }
        : undefined,
      brand,
      navigation,
      roles,
      // Fichar: el botón se esconde solo para quien no ficha.
      // Comentar cualquier pantalla (queda en la hoja con dónde se dejó) y fichar.
      headerActions: (
        <>
          <CommentsToggle />
          <ClockInButton />
        </>
      ),
      notifications: notificationItems,
      onMarkAllNotificationsRead: () => markRead.mutate(notificationItems.filter((item) => item.unread).map((item) => item.id)),
      // Novedades se apaga hasta tener notas de versión propias: las de ejemplo eran de otro producto.
      chrome: { news: false },
      // Aquí se trabaja por sucursal, no por empresa: el conmutador de la
      // cabecera dice en cuál estás y no vende licencias que enseñar.
      companies: branches,
      activeCompanyId: branchId,
      onSelectCompany: setBranchId,
      companyMenuLinks: [],
      workspaceLabels: { entity: t("branch.entity"), change: t("branch.change"), list: t("branch.list") },
      showWorkspaceUsage: false,
      settings,
      settingsAll: { ...SETTINGS_ALL, label: t("settings.all") },
      activeRoleId: effectiveRole,
      onSelectRole: selectRole,
      activeNavId,
      onNavigate: (_id, path) => {
        // Desde el chat a pantalla completa, ir a una pantalla es salir del modo agente.
        setShellMode("workspace");
        if (path) navigate(path);
      },
      promo: null,
      // 1140 y a partir de ahí centrado: en un monitor ancho una línea de 1600
      // px obliga a barrer la cabeza para leerla, y las tarjetas se estiran
      // hasta parecer otra cosa. La tabla, que es lo que pedía sitio, se
      // desplaza de lado dentro de su marco sin arrastrar al resto.
      // El calendario es la única pantalla que se lleva todo el ancho: una
      // columna por barbero necesita el sitio, el resto de la app lee mejor
      // en la columna normal.
      contentWidth: location.pathname.startsWith("/calendario") ? "full" : "normal",
      onOpenHelp: openHelp,
      // «Enviar feedback» del menú abre el mismo diálogo que el botón de la
      // campaña; sin campaña activa no hay a dónde enviar y decide el shell.
      onOpenFeedback: ACTIVE_FEEDBACK_CAMPAIGN ? () => setIsFeedbackOpen(true) : undefined,
      // El chat en pantalla completa y su historial.
      mode: shellMode,
      onModeChange: setShellMode,
      agentView: <ChatScreen />,
      // El chat a pantalla completa trae su propio historial; la barra lateral sigue navegando.
      agentSidebar: "navigation",
      chatHistory,
      activeChatId: chatState.activeId,
      onSelectChat: (id) => chatStore.setActive(id),
      onNewChat: () => chatStore.setActive(null),
      onRemoveChat: (id) => chatStore.remove(id),
      agentSuggestions: CHAT_SUGGESTION_KEYS.map((key) => t(key)),
      onAgentPrompt: (prompt) => chatStore.send(prompt, chatBackend),
      // «Ayuda» abre tres puertas: preguntar (el chat), leer (el centro de ayuda) y que te guíen (paso a paso).
      helpActions: [
        { id: "ask", label: t("help.menuAsk"), description: t("help.menuAskHint"), icon: ClipperIcon, tone: "ai", onSelect: openHelp },
        { id: "center", label: t("help.menuCenter"), description: t("help.menuCenterHint"), icon: BookOpen, onSelect: () => navigate(helpPath()) },
        { id: "guide", label: t("help.menuGuide"), description: t("help.menuGuideHint"), icon: ListChecks, onSelect: () => setIsGuidesOpen(true) },
      ],
      // La búsqueda sabe dónde se está: rotula las acciones de la pantalla con
      // su nombre y sugiere las preguntas de esa pantalla, las mismas que
      // ofrece el agente al abrirlo desde ahí.
      search: {
        objects: helpObjects,
        contextLabel: findNavLabel(navigation, activeNavId),
        askSuggestions: (CONTEXT_SUGGESTIONS.find((item) => location.pathname.startsWith(item.prefix))?.keys ?? CHAT_SUGGESTION_KEYS).map((key) => t(key)),
      },
      // Tema e idioma ya no van sueltos en la cabecera ni son dos filas
      // aparte en el menú de la marca: son la misma pregunta —«cómo se ve
      // esto»— así que cuelgan de una sola puerta, «Personalización», con la
      // pastilla del color activo puesta encima para reconocerlo sin abrir
      // nada.
      workspaceMenuExtra: <PersonalizationMenu onOpen={() => setPersonalizationOpen(true)} />,
      isDark: resolvedMode === "dark",
      onToggleDark: (dark) => setMode(dark ? "dark" : "light"),
      onLogout: () => {
        // «Ver como» no sobrevive a la sesión: el siguiente que entre en este navegador empieza con su rol.
        writeViewAs(null);
        setViewRoleId(null);
        clearChatOnLogout();
        void logout().then(() => navigate("/login", { replace: true }));
      },
    }),
    [user, brand, roles, notificationItems, markRead, effectiveRole, selectRole, branchId, branches, settings, helpObjects, navigation, activeNavId, location.pathname, navigate, resolvedMode, setMode, logout, t, shellMode, chatHistory, chatState.activeId, chatBackend]
  );

  const openAgent = React.useCallback(() => {
    setChatFrom("agent");
    setIsHelpOpen(true);
  }, []);
  const agentButton = React.useMemo(() => <AgentButton onOpen={openAgent} />, [openAgent]);
  // El mismo agente como acción de la barra flotante, para cuando las acciones viven ahí.
  const agentRailAction = React.useMemo<RailActionSpec>(
    () => ({ id: "agent", label: t("agent.name"), icon: <AiSparkGlyph size={20} />, scope: ["screen"], onSelect: openAgent }),
    [openAgent, t]
  );

  return (
    <AccessProvider value={access}>
    <ChatProvider value={chatContext}>
    <PlatformCommentsProvider pageLabel={findNavLabel(navigation, activeNavId)}>
      <AdminShell config={config} showFooter={showsLegalFooter(location.pathname)}>
        <RailAgentProvider value={agentRailAction}>
          <PageHeaderExtrasProvider value={agentButton}>
            <PlatformCommentLayer>
              <React.Suspense fallback={<PageLoader />}>
                <Outlet />
              </React.Suspense>
            </PlatformCommentLayer>
            <PlatformCommentsPanel />
            <PersonalizationPanel
              open={personalizationOpen}
              onOpenChange={setPersonalizationOpen}
              leading={personalizationLogo}
              logoSrc={brand.logo?.src}
              defaultLogo={BARBERLYTICS_DEFAULT_LOGO}
            />
          </PageHeaderExtrasProvider>
        </RailAgentProvider>
        <ChatPanel
          open={isHelpOpen && shellMode !== "agent"}
          onOpenChange={setChatOpen}
          title={chatFrom === "agent" ? t("agent.name") : t("help.drawerTitle")}
          subtitle={chatFrom === "agent" ? (agentFocusValue?.title ?? (agentContext ? t(agentContext.labelKey) : t("agent.subtitle"))) : t("help.title")}
        />
        <HelpGuidesDrawer open={isGuidesOpen} onOpenChange={setIsGuidesOpen} />
        {/* El feedback: un solo diálogo, que abre «Enviar feedback» del menú y,
            con la campaña a la vista, también su recorrido y su botón flotante. */}
        {/* Lo sensible pide el código otra vez: el diálogo vive aquí y lo abre el cliente de la API. */}
        <StepUpHost />
        <FeedbackHost
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          showCampaign={FEEDBACK_CAMPAIGN_VISIBLE}
          page={location.pathname}
          pageLabel={findNavLabel(navigation, activeNavId)}
          roleLabel={roles.find((role) => role.id === effectiveRole)?.label}
        />
      </AdminShell>
      <ChatVoiceMode
        open={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onWrite={() => {
          // Volver a escribir: el panel o la pantalla siguen abiertos con la caja lista.
        }}
        onSend={(text) => chatStore.send(text, answeringBackend)}
        appearance="page"
      />
    </PlatformCommentsProvider>
    </ChatProvider>
    </AccessProvider>
  );
}
