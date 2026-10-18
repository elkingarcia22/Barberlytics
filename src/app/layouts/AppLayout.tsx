import * as React from "react";
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
import { useAuth } from "@/features/auth";
import { AccessProvider, buildAccess, readViewAs, ROLE_HOME, teamRoleFromSession, writeViewAs } from "@/features/access";
import type { TeamRole } from "@/features/team/types";
import { BrandLogoSection, useBrandingQuery } from "@/features/branding";
import { ACTIVE_FEEDBACK_CAMPAIGN, FeedbackHost, findNavLabel } from "@/features/feedback";
import { DEFAULT_BRANCH_ID, useBranches } from "@/features/branches";
import { useMessageDispatcher } from "@/features/calendar/messages";
import { buildSettingsGroups, SETTINGS_ALL } from "@/features/settings/settingsCatalog";
import { buildAppNavigation, findActiveNavId, showsLegalFooter } from "../navigation";
import { PageLoader } from "../components/PageLoader";
import { HelpGuidesDrawer } from "@/help/HelpGuidesDrawer";
import { helpPath, toHelpLocale, useHelpIndex } from "@/help/content";
import { chatStore, createAppChatBackend } from "../chat";
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
  const roles = React.useMemo(() => buildAppRoles(t), [t]);
  const navigate = useNavigate();
  const location = useLocation();
  // Mirar como otro rol es estado de la app, no de la sesión: el token sigue
  // siendo el mismo. Se recuerda entre recargas (features/access/viewAs).
  const [viewRoleId, setViewRoleId] = React.useState<TeamRole | null>(() => readViewAs());
  const ownRole = teamRoleFromSession(user?.role);
  const effectiveRole = viewRoleId ?? ownRole;
  // Quién mira y qué puede: el menú, las rutas y cada pantalla preguntan aquí.
  const access = React.useMemo(() => buildAccess({ role: effectiveRole, previewing: viewRoleId !== null && viewRoleId !== ownRole }), [effectiveRole, viewRoleId, ownRole]);
  const selectRole = React.useCallback(
    (roleId: string) => {
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
  const [chosenBranchId, setBranchId] = React.useState(DEFAULT_BRANCH_ID);
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
  const { locale } = useLocale();
  const chatState = React.useSyncExternalStore(chatStore.subscribe, chatStore.getState, chatStore.getState);
  const chatBackend = React.useMemo(
    () =>
      createAppChatBackend({
        from: (title) => t("help.chatFrom", { title }),
        notFound: t("help.chatNotFound"),
        openArticle: t("help.chatOpenArticle"),
        seeMore: t("help.chatSeeMore"),
      }, toHelpLocale(locale)),
    [t, locale]
  );
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
    }),
    [agentContext, agentFocusValue, answeringBackend, user?.name, locale, navigate, t]
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
    }),
    [branding]
  );
  // «Cambiar» en Personalización lleva a Identidad de marca, donde vive el recortador.
  const personalizationLeading = React.useCallback(
    (close: () => void) => (
      <BrandLogoSection
        logo={brand.logo}
        name={brand.productName}
        onChange={() => {
          close();
          navigate("/configuracion/identidad");
        }}
      />
    ),
    [brand, navigate]
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
      workspaceMenuExtra: <PersonalizationMenu leading={personalizationLeading} />,
      isDark: resolvedMode === "dark",
      onToggleDark: (dark) => setMode(dark ? "dark" : "light"),
      onLogout: () => {
        void logout().then(() => navigate("/login", { replace: true }));
      },
    }),
    [user, brand, roles, effectiveRole, selectRole, branchId, branches, settings, helpObjects, navigation, activeNavId, location.pathname, navigate, resolvedMode, setMode, logout, t, personalizationLeading, shellMode, chatHistory, chatState.activeId, chatBackend]
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
      <AdminShell config={config} showFooter={showsLegalFooter(location.pathname)}>
        <RailAgentProvider value={agentRailAction}>
          <PageHeaderExtrasProvider value={agentButton}>
            <React.Suspense fallback={<PageLoader />}>
              <Outlet />
            </React.Suspense>
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
    </ChatProvider>
    </AccessProvider>
  );
}
