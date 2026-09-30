import * as React from "react";
import { Armchair, BookOpen, ConciergeBell, Crown, ListChecks, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AdminShell, PersonalizationMenu, type ChatHistoryGroup, type ShellConfigOverrides, type ShellMode, type UserRoleOption } from "@/components/app-shell";
import { ChatPanel, ChatProvider, ChatScreen, ChatVoiceMode, type ChatContextValue } from "@/components/chat";
import { groupConversations } from "@/lib/chat";
import { useLocale } from "@/i18n";
import { useTheme } from "@/themes";
import { useAppT } from "../i18n";
import type { AppMessageKey } from "../i18n/types";
import { useAuth } from "@/features/auth";
import { BrandLogoSection, useBrandingQuery } from "@/features/branding";
import { BRANCHES, DEFAULT_BRANCH_ID } from "@/features/branches";
import { buildSettingsGroups, SETTINGS_ALL } from "@/features/settings/settingsCatalog";
import { buildAppNavigation, findActiveNavId } from "../navigation";
import { PageLoader } from "../components/PageLoader";
import { HelpGuidesDrawer } from "@/help/HelpGuidesDrawer";
import { helpPath, useHelpIndex } from "@/help/content";
import { chatStore, createAppChatBackend } from "../chat";

/** Lo que cada persona pregunta primero: las puertas de arranque del chat. */
const CHAT_SUGGESTION_KEYS = ["chat.suggestion1", "chat.suggestion2", "chat.suggestion3", "chat.suggestion4"] as const;

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
export function AppLayout() {
  const { user, logout } = useAuth();
  const { resolvedMode, setMode } = useTheme();
  const t = useAppT();
  const roles = React.useMemo(() => buildAppRoles(t), [t]);
  const navigate = useNavigate();
  const location = useLocation();
  // Mirar como otro rol es estado de la app, no de la sesión: el token sigue
  // siendo el mismo y al recargar se vuelve al rol propio.
  const [viewRoleId, setViewRoleId] = React.useState<string | null>(null);
  // La sucursal activa: mientras no haya endpoint, la recuerda la sesión de
  // navegación. Todo lo que se ve debajo es de esta sucursal.
  const [branchId, setBranchId] = React.useState(DEFAULT_BRANCH_ID);
  const settings = React.useMemo(() => buildSettingsGroups(t), [t]);
  // La identidad que subió la barbería: su isologo, su nombre y debajo
  // «Barbería». Mientras carga (o si falla) va la flecha de Barberlytics con
  // el mismo formato, así el menú nunca cambia de forma.
  const { data: branding } = useBrandingQuery();
  // La ayuda: el botón de la cabecera abre el panel de la pantalla actual y
  // los artículos entran en la búsqueda general como objetos que se abren.
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isGuidesOpen, setIsGuidesOpen] = React.useState(false);
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
      }),
    [t]
  );
  const chatContext = React.useMemo<ChatContextValue>(
    () => ({
      store: chatStore,
      backend: chatBackend,
      user: { name: user?.name ?? "" },
      lang: locale === "en" ? "en-US" : "es-CO",
      onNavigate: (href) => {
        setIsHelpOpen(false);
        setShellMode("workspace");
        navigate(href);
      },
      suggestions: CHAT_SUGGESTION_KEYS.map((key) => t(key)),
      news: { text: t("chat.news.help"), onOpen: () => navigate(helpPath()) },
      onOpenFull: (conversationId) => {
        chatStore.setActive(conversationId);
        setShellMode("agent");
      },
      onOpenVoice: () => setIsVoiceOpen(true),
    }),
    [chatBackend, user?.name, locale, navigate, t]
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

  const config = React.useMemo<ShellConfigOverrides>(
    () => ({
      user: user
        ? { id: user.id, name: user.name, email: user.email, role: roles.find((role) => role.id === user.role)?.label ?? user.role, avatarUrl: user.avatarUrl ?? null }
        : undefined,
      brand,
      navigation: buildAppNavigation(t),
      roles,
      // Aquí se trabaja por sucursal, no por empresa: el conmutador de la
      // cabecera dice en cuál estás y no vende licencias que enseñar.
      companies: BRANCHES,
      activeCompanyId: branchId,
      onSelectCompany: setBranchId,
      companyMenuLinks: [],
      workspaceLabels: { entity: t("branch.entity"), change: t("branch.change"), list: t("branch.list") },
      showWorkspaceUsage: false,
      settings,
      settingsAll: { ...SETTINGS_ALL, label: t("settings.all") },
      activeRoleId: viewRoleId ?? user?.role,
      onSelectRole: setViewRoleId,
      activeNavId: findActiveNavId(location.pathname),
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
      onOpenHelp: () => setIsHelpOpen(true),
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
        { id: "ask", label: t("help.menuAsk"), description: t("help.menuAskHint"), icon: Sparkles, tone: "ai", onSelect: () => setIsHelpOpen(true) },
        { id: "center", label: t("help.menuCenter"), description: t("help.menuCenterHint"), icon: BookOpen, onSelect: () => navigate(helpPath()) },
        { id: "guide", label: t("help.menuGuide"), description: t("help.menuGuideHint"), icon: ListChecks, onSelect: () => setIsGuidesOpen(true) },
      ],
      search: { objects: helpObjects },
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
    [user, brand, roles, viewRoleId, branchId, settings, helpObjects, location.pathname, navigate, resolvedMode, setMode, logout, t, personalizationLeading, shellMode, chatHistory, chatState.activeId, chatBackend]
  );

  return (
    <ChatProvider value={chatContext}>
      <AdminShell config={config}>
        <React.Suspense fallback={<PageLoader />}>
          <Outlet />
        </React.Suspense>
        <ChatPanel open={isHelpOpen && shellMode !== "agent"} onOpenChange={setIsHelpOpen} title={t("help.drawerTitle")} subtitle={t("help.title")} />
        <HelpGuidesDrawer open={isGuidesOpen} onOpenChange={setIsGuidesOpen} />
      </AdminShell>
      <ChatVoiceMode
        open={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onWrite={() => {
          // Volver a escribir: el panel o la pantalla siguen abiertos con la caja lista.
        }}
        onSend={(text) => chatStore.send(text, chatBackend)}
      />
    </ChatProvider>
  );
}
