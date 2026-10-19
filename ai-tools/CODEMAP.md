# Mapa del código de producto

Generado con `npm run codemap` desde `src/`. No se edita a mano. Las piezas del sistema de diseño están en `ai-tools/CATALOG.md`; aquí está lo que se construyó con ellas.

Cada línea: archivo — qué es · lo que exporta · `llama:` endpoints · `piezas:` componentes del sistema que usa · `usa:` otros módulos. Ve directo al archivo que necesitas; no leas carpetas enteras.

## Rutas

De `src/app/router.tsx`.

- `/login` → LoginPage
- `/metricas` → MetricsPage
- `/dashboard` → Navigate
- `/calendario` → CalendarPage
- `/clientes` → CustomersPage
- `/clientes/:id` → CustomerProfilePage
- `/servicios` → ServicesPage
- `/servicios/orden` → ServiceOrderPage
- `/servicios/:id` → ServiceProfilePage
- `/productos` → ProductsPage
- `/productos/:id` → ProductProfilePage
- `/transacciones` → TransactionsPage
- `/gastos` → ExpensesPage
- `/nomina` → PayrollPage
- `/mi-pago` → MyPayPage
- `/usuarios` → TeamHomePage
- `/usuarios/lista` → UsersPage
- `/usuarios/miembros/:id` → MemberProfilePage
- `/usuarios/nuevo` → MemberWizardPage
- `/usuarios/horarios` → WorkHoursPage
- `/usuarios/niveles` → LevelsPage
- `/usuarios/orden` → BarberOrderPage
- `/usuarios/fila` → LineupPage
- `/usuarios/ausencias` → AbsencesPage
- `/configuracion` → SettingsPage
- `/configuracion/:seccion` → SettingsSectionPage
- `/403` → ForbiddenPage
- `/reservar` → BookingPage
- `/reservar/confirmar` → ConfirmAppointmentPage
- `/kiosco` → KioskPage
- `/turnos` → TurnBoardPage
- `/legal` → LegalPage
- `/legal/:slug` → LegalPage
- `/ayuda/*` → HelpApp
- `/docs/*` → DocsApp
- `*` → NotFoundPage

## Endpoints simulados

Lo que responde MSW hoy.

- `GET /shop` · src/mocks/booking/handlers.ts
- `GET /branches/:id` · src/mocks/booking/handlers.ts
- `GET /catalog` · src/mocks/booking/handlers.ts
- `GET /availability` · src/mocks/booking/handlers.ts
- `GET /alternatives` · src/mocks/booking/handlers.ts
- `GET /earliest` · src/mocks/booking/handlers.ts
- `POST /waitlist` · src/mocks/booking/handlers.ts
- `DELETE /waitlist/:id` · src/mocks/booking/handlers.ts
- `PATCH /me/cards/:id` · src/mocks/booking/handlers.ts
- `DELETE /me/cards/:id` · src/mocks/booking/handlers.ts
- `GET /me/suggestion` · src/mocks/booking/handlers.ts
- `POST /customers` · src/mocks/booking/handlers.ts
- `POST /promo` · src/mocks/booking/handlers.ts
- `POST /reservations` · src/mocks/booking/handlers.ts
- `POST /phone/check` · src/mocks/booking/handlers.ts
- `POST /otp/request` · src/mocks/booking/handlers.ts
- `POST /otp/verify` · src/mocks/booking/handlers.ts
- `GET /me/appointments` · src/mocks/booking/handlers.ts
- `PATCH /appointments/:id` · src/mocks/booking/handlers.ts
- `POST /events` · src/mocks/booking/handlers.ts
- `GET /funnel` · src/mocks/booking/handlers.ts
- `POST /packages/buy` · src/mocks/booking/handlers.ts
- `POST /gift-cards/check` · src/mocks/booking/handlers.ts
- `POST /gift-cards` · src/mocks/booking/handlers.ts
- `GET /barbers/:id/reviews` · src/mocks/booking/handlers.ts
- `POST /appointments/:id/review` · src/mocks/booking/handlers.ts
- `POST /appointments/:id/repeat` · src/mocks/booking/handlers.ts
- `POST /appointments/:id/cancel` · src/mocks/booking/handlers.ts
- `POST /reservations/:id/details` · src/mocks/booking/handlers.ts
- `POST /reservations/:id/receipt` · src/mocks/booking/handlers.ts
- `GET /calendar/catalog` · src/mocks/calendar/handlers.ts
- `GET /calendar/day` · src/mocks/calendar/handlers.ts
- `GET /calendar/appointments` · src/mocks/calendar/handlers.ts
- `GET /calendar/rhythm` · src/mocks/calendar/handlers.ts
- `GET /calendar/month` · src/mocks/calendar/handlers.ts
- `POST /appointments` · src/mocks/calendar/handlers.ts
- `PATCH /appointments/:id` · src/mocks/calendar/handlers.ts
- `POST /appointments/:id/checkout` · src/mocks/calendar/handlers.ts
- `POST /appointments/:id/refund` · src/mocks/calendar/handlers.ts
- `POST /appointments/:id/void-payment` · src/mocks/calendar/handlers.ts
- `POST /clients/:id/notes` · src/mocks/calendar/handlers.ts
- `PATCH /clients/:id/notes/:noteId` · src/mocks/calendar/handlers.ts
- `DELETE /clients/:id/notes/:noteId` · src/mocks/calendar/handlers.ts
- `POST /blocks` · src/mocks/calendar/handlers.ts
- `GET /calendar/blocks` · src/mocks/calendar/handlers.ts
- `POST /blocks/:id/approve` · src/mocks/calendar/handlers.ts
- `PATCH /blocks/:id` · src/mocks/calendar/handlers.ts
- `DELETE /blocks/:id` · src/mocks/calendar/handlers.ts
- `GET /waitlist` · src/mocks/calendar/handlers.ts
- `POST /waitlist` · src/mocks/calendar/handlers.ts
- `DELETE /waitlist/:id` · src/mocks/calendar/handlers.ts
- `POST /sales` · src/mocks/calendar/handlers.ts
- `GET /customers` · src/mocks/customers/handlers.ts
- `GET /customers/:id` · src/mocks/customers/handlers.ts
- `POST /customers` · src/mocks/customers/handlers.ts
- `PATCH /customers/:id` · src/mocks/customers/handlers.ts
- `DELETE /customers/:id` · src/mocks/customers/handlers.ts
- `POST /customers/:id/guests` · src/mocks/customers/handlers.ts
- `DELETE /customers/:id/guests/:guestId` · src/mocks/customers/handlers.ts
- `POST /customers/import` · src/mocks/customers/import.ts
- `DELETE /customers/import/:batchId` · src/mocks/customers/import.ts
- `GET /customers/:id/export` · src/mocks/customers/privacy.ts
- `POST /customers/:id/erase` · src/mocks/customers/privacy.ts
- `POST /customers/:id/privacy-requests` · src/mocks/customers/privacy.ts
- `GET /privacy-requests` · src/mocks/customers/privacy.ts
- `POST /privacy-requests/:id/done` · src/mocks/customers/privacy.ts
- `GET /customers/:id/relationship` · src/mocks/customers/relationship.ts
- `POST /customers/:id/messages` · src/mocks/customers/relationship.ts
- `PATCH /customers/:id/consent` · src/mocks/customers/relationship.ts
- `GET /customers/:id/next-visit` · src/mocks/customers/rhythm.ts
- `GET /customers/reactivation` · src/mocks/customers/rhythm.ts
- `POST /customers/reactivation` · src/mocks/customers/rhythm.ts
- `GET /expenses` · src/mocks/expenses/handlers.ts
- `POST /expenses` · src/mocks/expenses/handlers.ts
- `PATCH /expenses/:id` · src/mocks/expenses/handlers.ts
- `POST /expenses/:id/end` · src/mocks/expenses/handlers.ts
- `DELETE /expenses/:id` · src/mocks/expenses/handlers.ts
- `GET /front-desk/devices` · src/mocks/frontDesk/handlers.ts
- `POST /front-desk/devices` · src/mocks/frontDesk/handlers.ts
- `POST /front-desk/devices/:id/code` · src/mocks/frontDesk/handlers.ts
- `DELETE /front-desk/devices/:id` · src/mocks/frontDesk/handlers.ts
- `GET /front-desk/queue` · src/mocks/frontDesk/handlers.ts
- `POST /front-desk/queue` · src/mocks/frontDesk/handlers.ts
- `POST /front-desk/queue/:id/call` · src/mocks/frontDesk/handlers.ts
- `POST /front-desk/queue/:id/leave` · src/mocks/frontDesk/handlers.ts
- `POST /kiosk/pair` · src/mocks/frontDesk/handlers.ts
- `GET /kiosk/me` · src/mocks/frontDesk/handlers.ts
- `GET /kiosk/board` · src/mocks/frontDesk/handlers.ts
- `POST /kiosk/lookup` · src/mocks/frontDesk/handlers.ts
- `POST /kiosk/check-in` · src/mocks/frontDesk/handlers.ts
- `POST /kiosk/queue` · src/mocks/frontDesk/handlers.ts
- `POST /auth/otp/request` · src/mocks/handlers.ts
- `POST /auth/otp/verify` · src/mocks/handlers.ts
- `POST /auth/step-up/request` · src/mocks/handlers.ts
- `POST /auth/step-up/verify` · src/mocks/handlers.ts
- `POST /auth/signup/code` · src/mocks/handlers.ts
- `POST /auth/signup` · src/mocks/handlers.ts
- `POST /support/tickets` · src/mocks/handlers.ts
- `POST /auth/oauth` · src/mocks/handlers.ts
- `POST /auth/recovery/request` · src/mocks/handlers.ts
- `GET /auth/backup-email` · src/mocks/handlers.ts
- `POST /auth/backup-email` · src/mocks/handlers.ts
- `POST /auth/backup-email/verify` · src/mocks/handlers.ts
- `DELETE /auth/backup-email` · src/mocks/handlers.ts
- `GET /auth/me` · src/mocks/handlers.ts
- `POST /auth/logout` · src/mocks/handlers.ts
- `POST /feedback` · src/mocks/handlers.ts
- `POST /feedback/attachments` · src/mocks/handlers.ts
- `PUT /feedback/attachments/upload/:id` · src/mocks/handlers.ts
- `GET /dashboard/summary` · src/mocks/handlers.ts
- `GET /metrics/${tab}` · src/mocks/handlers.ts
- `GET /metrics/insights` · src/mocks/handlers.ts
- `GET /users` · src/mocks/handlers.ts
- `GET /users/:id` · src/mocks/handlers.ts
- `POST /users` · src/mocks/handlers.ts
- `PATCH /users/:id` · src/mocks/handlers.ts
- `DELETE /users/:id` · src/mocks/handlers.ts
- `GET /company/branding` · src/mocks/handlers.ts
- `PUT /company/branding` · src/mocks/handlers.ts
- `GET /inventory` · src/mocks/inventory/handlers.ts
- `POST /inventory/movements` · src/mocks/inventory/handlers.ts
- `PATCH /inventory/:productId` · src/mocks/inventory/handlers.ts
- `GET /inventory/:productId/movements` · src/mocks/inventory/handlers.ts
- `GET /legal/acceptances` · src/mocks/legal/handlers.ts
- `POST /legal/dpa/accept` · src/mocks/legal/handlers.ts
- `POST */api/messages/dispatch` · src/mocks/messages/handlers.ts
- `GET */api/appointments/:id/messages` · src/mocks/messages/handlers.ts
- `POST */api/appointments/:id/simulate-reply` · src/mocks/messages/handlers.ts
- `POST */api/appointments/:id/messages` · src/mocks/messages/handlers.ts
- `POST */api/booking/confirm` · src/mocks/messages/handlers.ts
- `GET /notifications` · src/mocks/notifications/handlers.ts
- `POST /notifications/read` · src/mocks/notifications/handlers.ts
- `GET /onboarding` · src/mocks/onboarding/handlers.ts
- `GET /payroll` · src/mocks/payroll/handlers.ts
- `POST /payroll/adjustments` · src/mocks/payroll/handlers.ts
- `DELETE /payroll/adjustments/:id` · src/mocks/payroll/handlers.ts
- `POST /payroll/rent-payments` · src/mocks/payroll/handlers.ts
- `DELETE /payroll/rent-payments/:id` · src/mocks/payroll/handlers.ts
- `POST /payroll/runs` · src/mocks/payroll/handlers.ts
- `POST /payroll/runs/:id/pay` · src/mocks/payroll/handlers.ts
- `POST /payroll/runs/:id/reopen` · src/mocks/payroll/handlers.ts
- `GET /products` · src/mocks/products/handlers.ts
- `PUT /products/activation` · src/mocks/products/handlers.ts
- `GET /products/:id` · src/mocks/products/handlers.ts
- `POST /products` · src/mocks/products/handlers.ts
- `PATCH /products/:id` · src/mocks/products/handlers.ts
- `DELETE /products/:id` · src/mocks/products/handlers.ts
- `POST /product-categories` · src/mocks/products/handlers.ts
- `PATCH /product-categories/:id` · src/mocks/products/handlers.ts
- `DELETE /product-categories/:id` · src/mocks/products/handlers.ts
- `GET /register` · src/mocks/register/handlers.ts
- `POST /register/close` · src/mocks/register/handlers.ts
- `GET /reports/income` · src/mocks/reports/income.ts
- `GET /reports/menu` · src/mocks/reports/menu.ts
- `GET /reports/week` · src/mocks/reports/week.ts
- `GET /payroll/review` · src/mocks/review/checks.ts
- `GET /register/review` · src/mocks/review/checks.ts
- `GET /services` · src/mocks/services/handlers.ts
- `PUT /services/order` · src/mocks/services/handlers.ts
- `PUT /services/activation` · src/mocks/services/handlers.ts
- `GET /services/:id` · src/mocks/services/handlers.ts
- `POST /services` · src/mocks/services/handlers.ts
- `PATCH /services/:id` · src/mocks/services/handlers.ts
- `DELETE /services/:id` · src/mocks/services/handlers.ts
- `PUT /services/:id/team` · src/mocks/services/handlers.ts
- `GET /service-resources` · src/mocks/services/handlers.ts
- `POST /service-resources` · src/mocks/services/handlers.ts
- `PATCH /service-resources/:id` · src/mocks/services/handlers.ts
- `DELETE /service-resources/:id` · src/mocks/services/handlers.ts
- `POST /service-categories` · src/mocks/services/handlers.ts
- `PATCH /service-categories/:id` · src/mocks/services/handlers.ts
- `DELETE /service-categories/:id` · src/mocks/services/handlers.ts
- `GET /settings/lists/:list` · src/mocks/settings/handlers.ts
- `POST /settings/lists/:list` · src/mocks/settings/handlers.ts
- `PATCH /settings/lists/:list/:id` · src/mocks/settings/handlers.ts
- `DELETE /settings/lists/:list/:id` · src/mocks/settings/handlers.ts
- `POST /settings/gateways/test` · src/mocks/settings/handlers.ts
- `POST /account/delete` · src/mocks/settings/handlers.ts
- `GET /settings/:section` · src/mocks/settings/handlers.ts
- `PUT /settings/:section` · src/mocks/settings/handlers.ts
- `GET /team/members` · src/mocks/team/handlers.ts
- `GET /team/members/:id` · src/mocks/team/handlers.ts
- `POST /team/members` · src/mocks/team/handlers.ts
- `PATCH /team/members/:id` · src/mocks/team/handlers.ts
- `DELETE /team/members/:id` · src/mocks/team/handlers.ts
- `PUT /team/activation` · src/mocks/team/handlers.ts
- `GET /team/levels` · src/mocks/team/handlers.ts
- `POST /team/levels` · src/mocks/team/handlers.ts
- `PATCH /team/levels/:id` · src/mocks/team/handlers.ts
- `DELETE /team/levels/:id` · src/mocks/team/handlers.ts
- `GET /team/order` · src/mocks/team/handlers.ts
- `PUT /team/order` · src/mocks/team/handlers.ts
- `GET /team/schedule` · src/mocks/team/handlers.ts
- `PUT /team/schedule/override` · src/mocks/team/handlers.ts
- `DELETE /team/schedule/override` · src/mocks/team/handlers.ts
- `POST /team/members/remind` · src/mocks/team/memberActions.ts
- `POST /team/members/deactivate` · src/mocks/team/memberActions.ts
- `POST /team/members/import` · src/mocks/team/memberActions.ts
- `GET /team/members/:id/bank` · src/mocks/team/memberActions.ts
- `GET /team/lineup/turn` · src/mocks/team/workforce.ts
- `GET /team/home` · src/mocks/team/workforce.ts
- `GET /team/members/:id/performance` · src/mocks/team/workforce.ts
- `GET /team/absences` · src/mocks/team/workforce.ts
- `POST /team/absences` · src/mocks/team/workforce.ts
- `POST /team/absences/:id/:decision` · src/mocks/team/workforce.ts
- `DELETE /team/absences/:id` · src/mocks/team/workforce.ts
- `GET /transactions` · src/mocks/transactions/handlers.ts
- `GET /payments` · src/mocks/transactions/ledger.ts

## App · `src/app`

Router, providers, layout, navegación y páginas de error.

### chat

- **index.ts** — Al cerrar sesión, las conversaciones se van con ella. · `chatStore`, `clearChatOnLogout`, `AppChatLabels`, `AppClipperOptions`, `createAppChatBackend` · usa: @/features/clipper, @/help/chat, @/help/content, @/lib/chat

### components

- **PageLoader.tsx** — Loader de página completa: para rutas perezosas y la resolución de sesión. · `PageLoader`
- **RouteError.tsx** — Límite de error de las rutas: atrapa lo que reviente al renderizar una página (o al cargarla en diferido) y l… · `RouteError` · piezas: Button · usa: @/lib/api, @/lib/query

### i18n/booking

- **en.ts** — Online booking in English. · `bookingEn`
- **es.ts** — La reserva en línea: lo que lee el cliente de la barbería, no quien la administra. · `bookingEs`
- **variants.en.ts** — Open schedule, Conversation and the version picker, in English. · `bookingVariantsEn`
- **variants.es.ts** — Las otras dos maneras de reservar (Agenda y Conversación) y el selector de versión de la vista previa. · `bookingVariantsEs`

### i18n/calendar

- **checkout.en.ts** · `calendarCheckoutEn`
- **checkout.es.ts** — El cobro de la caja en dos pasos (`features/calendar/checkout`): la cuenta y cómo paga. · `calendarCheckoutEs`
- **dayPanel.en.ts** · `calendarDayPanelEn`
- **dayPanel.es.ts** — El panel del día (Semana y Mes) y la marca de día suave o pesado (`features/calendar/dayPanel`, `dayWeight`). · `calendarDayPanelEs`
- **panel.en.ts** · `calendarPanelEn`
- **panel.es.ts** — Las versiones del panel de una cita (docs/investigacion-modulos/panel-de-cita.md): el selector para compararl… · `calendarPanelEs`
- **timeOff.en.ts** · `calendarTimeOffEn`
- **timeOff.es.ts** — Ausencias y bloqueos en la agenda (`features/calendar/timeOff`): la lista, la revisión y el alta. · `calendarTimeOffEs`

### i18n

- **en.ts** — Inglés de la aplicación. · `appEn`
- **es.ts** — El diccionario **de la aplicación**, no el del sistema de diseño. · `appEs`
- **index.ts** — El diccionario de esta aplicación, listo para `<LocaleProvider messages={…}>`. · `APP_MESSAGES`, `appEs`, `appEn` · usa: @/i18n
- **types.ts** — Toda clave de la aplicación, sacada de su diccionario español. · `AppMessageKey`, `AppMessageCatalog`
- **useAppT.ts** — `t()` con las claves de esta aplicación autocompletadas, más las del sistema: una pantalla dice tanto "users.… · `useAppT` · usa: @/i18n

### i18n/frontDesk

- **frontDesk.en.ts** — Front desk: the walk-in queue (Calendar), kiosks (Settings) and the kiosk screen. · `frontDeskEn`
- **frontDesk.es.ts** — Recepción: la fila sin cita (Calendario), los kioscos (Configuración) y la pantalla del kiosco. · `frontDeskEs`

### i18n/legal

- **legal.en.ts** · `legalEn`
- **legal.es.ts** — Los documentos legales (`/legal`), la aceptación del acuerdo de encargo y los enlaces del registro. · `legalEs`

### layouts

- **AgentButton.tsx** — El agente de IA en la cabecera de todas las pantallas: un botón del mismo tamaño que las demás acciones, con… · `AgentButton` · piezas: AiSparkGlyph, Button, useRailVisible · usa: @/app/i18n
- **AppLayout.tsx** · `AppLayout` · piezas: AdminShell, AiSparkGlyph, ChatPanel, ChatProvider, ChatScreen, ChatVoiceMode, ClipperIcon, PageHeaderExtrasProvider, PersonalizationMenu, RailAgentProvider · usa: @/features/access, @/features/auth, @/features/branches, @/features/branding, @/features/calendar, @/features/clipper, @/features/feedback, @/features/legal, @/features/settings, @/features/team, @/help/HelpGuidesDrawer, @/help/content, @/i18n, @/lib/api, @/lib/chat, @/themes

- **lazyPages.ts** — Cada pantalla se carga en diferido: el primer render solo trae el shell. · `DashboardPage`, `CalendarPage`, `CustomersPage`, `CustomerProfilePage`, `ServicesPage`, `ServiceProfilePage`, `ServiceOrderPage`, `ProductsPage`, `ProductProfilePage`, `TransactionsPage`, `ExpensesPage`, `PayrollPage`, `MyPayPage`, `MemberProfilePage`, `MemberWizardPage`, `WorkHoursPage`, `LevelsPage`, `BarberOrderPage`, `LineupPage`, `AbsencesPage`, `MetricsPage`, `TeamHomePage`, `UsersPage`, `DocsApp`, `BookingPage`, `LegalPage`, `TurnBoardPage`, `KioskPage`, `ConfirmAppointmentPage`, `HelpApp`, `SettingsPage`, `SettingsSectionPage`, `SectionPlaceholderPage`
- **navigation.ts** — El árbol con los rótulos ya traducidos. · `buildAppNavigation`, `APP_NAVIGATION`, `findActiveNavId`, `showsLegalFooter` · usa: @/features/access
- **notifications.ts** — Los avisos como los pinta la campana: el texto en el idioma de quien lee y, al tocarlo, leído y abierto. · `NotificationKind`, `AppNotification`, `NOTIFICATION_KEYS`, `useNotifications`, `useMarkNotificationsRead`, `ShellNotificationDeps`, `toShellNotifications` · llama: GET /notifications, POST /notifications/read · usa: @/app/i18n, @/lib/api
- **providers.tsx** — Los providers globales, en el orden en que dependen unos de otros: la caché de datos primero, el idioma y el… · `AppProviders` · piezas: ThemaToaster, TooltipProvider · usa: @/features/auth, @/i18n, @/lib/query, @/themes
- **router.tsx** · `router` · usa: @/features/access, @/features/auth, @/features/sections

### pages

- **ForbiddenPage.tsx** · `ForbiddenPage` · piezas: Button, EmptyState
- **NotFoundPage.tsx** · `NotFoundPage` · piezas: Button, EmptyState

## Dominios · `src/features`

Una carpeta por dominio: pantalla, tipos, api, queries.

### access

- **AccessContext.tsx** — Lo monta el layout de la app con el rol efectivo (el propio o el de «Ver como»). · `AccessProvider`, `RequireArea`, `RoleHome`
- **access.ts** — Todo lo de la sucursal o solo lo suyo (su columna, sus clientes, sus cifras). · `AccessScope`, `AccessMember`, `Access`, `TEAM_ROLES`, `isBarberRole`, `ROLE_HOME`, `teamRoleFromSession`, `canViewAs`, `DEMO_MEMBER`, `buildAccess`, `AccessArea`, `canOpen` · usa: @/features/team
- **useAccess.ts** · `AccessContext`, `useAccess`
- **viewAs.ts** · `readViewAs`, `writeViewAs` · usa: @/features/team

### auth

- **AuthProvider.tsx** — Sesión de la aplicación. · `AuthProviderProps`, `AuthProvider` · usa: @/lib/api
- **LockedPanel.tsx** — Tras varios intentos fallidos seguidos el celular queda bloqueado; la salida es un ticket a soporte. · `LockedPanelProps`, `LockedPanel` · piezas: Button, Heading, Text · usa: @/app/i18n, @/icons
- **LoginForm.tsx** — Entrar en dos pasos: el celular pide el código por SMS y el código abre la sesión. · `LoginFormProps`, `LoginForm` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, InputOtp, Label, PhoneInput, Separator, Text · usa: @/app/i18n, @/icons, @/lib/api
- **LoginHeroImage.tsx** — La foto de portada del login, servida desde `public/`. · `LOGIN_HERO_IMAGE`, `LoginHeroImage`
- **LoginPage.tsx** — Entrada a la aplicación en dos mitades. · `LoginPage` · piezas: BarberlyticsLogo, Enter, Foil, Grain, HairCanvas, Halo, Heading, Text, Vignette · usa: @/app/i18n, @/i18n, @/lib/utils, @/themes
- **RecoveryPanel.tsx** — Olvidé mi número: se escribe el correo registrado y el celular llega allí. · `RecoveryPanelProps`, `RecoveryPanel` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, Input, Label, Separator, Text · usa: @/app/i18n, @/icons, @/lib/api
- **RequireAuth.tsx** — Guarda de ruta. · `RequireAuthProps`, `RequireAuth` · usa: @/app/components
- **SignupPanel.tsx** · `SignupPanelProps`, `SignupPanel` · piezas: Button, Checkbox, Heading, Input, NumberField, PHONE_COUNTRIES, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/features/legal, @/icons, @/lib/api
- **StepUpHost.tsx** — El diálogo que pide el código cuando el servidor responde `step_up_required`. · `StepUpHost` · piezas: Alert, AlertDescription, Button, Field, Input, ModalShell · usa: @/app/i18n, @/lib/api
- **SupportTicketPanel.tsx** — De dónde viene la persona: prellena lo que ya se sabe. · `TicketContext`, `SupportTicketPanelProps`, `SupportTicketPanel` · piezas: Button, Heading, Input, PhoneInput, Text, Textarea · usa: @/app/i18n, @/icons, @/lib/api
- **api.ts** · `authApi` · llama: POST /auth/otp/request, POST /auth/otp/verify, POST /auth/oauth, GET /auth/me, POST /auth/logout, POST /auth/recovery/request, GET /auth/backup-email, POST /auth/backup-email, POST /auth/backup-email/verify, DELETE /auth/backup-email, POST /auth/signup, POST /auth/signup/code, POST /support/tickets · usa: @/features/legal, @/lib/api
- **authContext.ts** · `AuthContextValue`, `AuthContext`
- **authErrors.ts** — Pinta en su campo los errores `fields` del servidor. · `applyServerFieldErrors`, `isLockedError`, `attemptsLeftFrom` · usa: @/lib/api
- **authFormParts.tsx** — Etiqueta, control y mensaje de error enlazados por `id`. · `FieldControlProps`, `AuthField`, `FormErrorAlert`, `BackButton` · piezas: Alert, AlertDescription, AlertTitle, Button, Label, Text · usa: @/icons
- **backupEmailQueries.ts** — El correo de respaldo de quien tiene la sesión. · `backupEmailKeys`, `useBackupEmailQuery`, `useBackupEmailMutations`
- **phoneLabel.ts** — «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. · `describePhone` · piezas: formatNational, parseE164
- **providers.ts** — Pide al proveedor (Google Identity Services, MSAL para Outlook) la credencial con la que el backend abre la s… · `requestProviderCredential` · usa: @/lib/api
- **stepUp.ts** · `stepUpToken`, `clearStepUp`, `stepUpApi` · llama: POST /auth/step-up/request, POST /auth/step-up/verify · usa: @/lib/api
- **timezones.ts** — Zonas IANA de cada país que ofrece `PhoneInput`; la primera es la más poblada. · `COUNTRY_TIMEZONES`, `describeTimezone`, `timezonesFor`
- **tokenStorage.ts** — Dónde vive el token de acceso en el navegador. · `TokenStorage`, `sessionTokenStorage`, `createMemoryTokenStorage`
- **types.ts** — Celular en E.164 tal como lo emite `PhoneInput`, completo según el país: un celular de Colombia tiene 10 dígi… · `userRoleSchema`, `UserRole`, `phoneSchema`, `authUserSchema`, `AuthUser`, `sessionSchema`, `Session`, `otpChannelSchema`, `OtpChannel`, `otpRequestSchema`, `OtpRequest`, `OTP_LENGTH`, `otpVerifySchema`, `OtpVerify`, `authProviderSchema`, `AuthProvider`, `recoveryRequestSchema`, `RecoveryRequest`, `signupRequestSchema`, `SignupRequest`, `backupEmailSchema`, `BackupEmail`, `backupEmailRequestSchema`, `BackupEmailRequest`, `backupEmailVerifySchema`, `BackupEmailVerify`, `ticketReasonSchema`, `TicketReason`, `supportTicketSchema`, `SupportTicketRequest`, `supportTicketResponseSchema`, `SupportTicketResponse`, `AuthStatus` · piezas: parseE164
- **useAuth.ts** — El usuario autenticado; lanza si se usa fuera de una ruta protegida. · `useAuth`, `useCurrentUser`

### booking

- **BookingFlow.tsx** · `BookingFlowProps`, `BookingFlow` · piezas: Grain, Halo, PortalContainerProvider, Skeleton, ThemaToaster · usa: @/app/i18n, @/lib/query, @/lib/utils
- **BookingPage.tsx** — «Agendamiento online»: la reserva que ve el cliente de la barbería. · `BookingPage` · piezas: Badge, Button, CommentLayer, CommentsPanel, CommentsProvider, CommentsToggle, Grain, SegmentedControl, Text · usa: @/app/i18n, @/icons, @/themes/ThemeSelector
- **ConfirmAppointmentPage.tsx** — Lo que abre el botón «Confirmar» del WhatsApp: confirma la cita con el token del enlace, sin pedir código ni… · `ConfirmAppointmentPage` · llama: POST /booking/confirm · piezas: EmptyState, Spinner, Text · usa: @/app/i18n, @/i18n, @/lib/api
- **api.ts** — Contrato de la reserva en línea; ver docs/API_CONTRACT.md. · `bookingApi` · llama: GET /booking/shop, GET /booking/branches/${branchId}, GET /booking/catalog, GET /booking/availability, GET /booking/alternatives, GET /booking/earliest, POST /booking/waitlist, DELETE /booking/waitlist/${id}, GET /booking/me/suggestion, POST /booking/customers, PATCH /booking/me/cards/${id}, DELETE /booking/me/cards/${id}, POST /booking/promo, POST /booking/reservations, POST /booking/phone/check, POST /booking/otp/request, POST /booking/otp/verify, GET /booking/me/appointments, PATCH /booking/appointments/${id}, GET /booking/barbers/${barberId}/reviews, POST /booking/appointments/${id}/review, POST /booking/events, GET /booking/funnel, POST /booking/packages/buy, POST /booking/gift-cards/check, POST /booking/gift-cards, POST /booking/appointments/${id}/repeat, POST /booking/appointments/${id}/cancel, POST /booking/reservations/${reservationId}/details, POST /booking/reservations/${reservationId}/receipt · usa: @/lib/api
- **bookingFormat.ts** — Una fecha como «AAAA-MM-DDTHH:mm». · `dayKeyOf`, `toStart`, `parseStart`, `clockMinutes`, `BookingFormatters`, `useBookingFormat`, `buildIcs`, `CalendarProvider`, `calendarUrl`, `downloadIcs`, `initialsOf`, `isTodayOver`, `firstBookableDay`, `isSameDayAs`, `formatPhone`, `DayHours`, `OpenState`, `openStateOf`, `WEEK_ORDER` · usa: @/i18n, @/lib/time
- **bookingState.ts** — El recorrido de la reserva como datos: en qué paso está, quién reserva, la cita que se está armando y las que… · `BookingStep`, `BookingPerson`, `DraftItem`, `WaitlistEntry`, `BookingState`, `PendingProfile`, `BookingAction`, `initialBookingState`, `previousPartIndex`, `bookingReducer`, `PROGRESS_STEPS`, `ProgressStep`, `progressSteps`, `progressIndex`, `personName`, `defaultBranchId`
- **funnel.ts** — Dónde se abre la reserva: el enlace público, el widget en su sitio o la vista previa del panel. · `BookingSurface`, `BookingUtm`, `utmFrom`, `useFunnelTracking`
- **pricing.ts** — Los cupones que acepta la demo. · `TipKind`, `TipOption`, `Promo`, `PROMOS`, `OwnedPackageLike`, `coverByPackages`, `FIRST_VISIT_PROMO`, `PromoProblem`, `PromoContext`, `findPromo`, `promoDiscount`, `tipAmount`, `CardFeeRule`, `TotalsInput`, `Totals`, `chargesCardFee`, `computeTotals`, `depositOf`, `feeLabel`, `CancellationInput`, `CancellationTerms`, `cancellationTerms`, `renderPolicy` · usa: @/features/branches
- **queries.ts** — Claves jerárquicas: reservar o cancelar invalida la disponibilidad y «Mis citas» sin tocar el catálogo. · `bookingKeys`, `CODE_REUSE_MS`, `useBookingShopQuery`, `useBranchDetailQuery`, `useBookingCatalogQuery`, `AvailabilityParams`, `useAvailabilityQuery`, `useAlternativesQuery`, `useEarliestQuery`, `useJoinWaitlistMutation`, `useLeaveWaitlistMutation`, `useVisitSuggestionQuery`, `useCheckPhoneMutation`, `useRequestCodeMutation`, `useRecentCode`, `useVerifyCodeMutation`, `useCreateCustomerMutation`, `useUpdateCardMutation`, `useRemoveCardMutation`, `useReserveMutation`, `useRepeatMutation`, `useBarberReviewsQuery`, `useReviewMutation`, `useBuyPackageMutation`, `useBuyGiftMutation`, `useBookingFunnelQuery`, `useMyAppointmentsQuery`, `useRescheduleMutation`, `useCancelMutation`, `useReservationDetailsMutation`, `useSendReceiptMutation`
- **rebookLink.ts** — El enlace para que el cliente reagende él mismo: la barbería se lo manda desde la agenda (por SMS o correo) c… · `RebookPrefill`, `buildRebookLink`, `readRebookLink`, `prefillAsLastVisit`
- **types.ts** — El contrato de la reserva en línea (docs/API_CONTRACT.md, «Reserva en línea»). · `tipOptionSchema`, `bookingBranchSchema`, `BookingBranch`, `bookingShopSchema`, `BookingShop`, `branchDetailSchema`, `BranchDetail`, `bookingServiceSchema`, `BookingService`, `bookingBarberSchema`, `BookingBarber`, `bookingProductSchema`, `BookingProduct`, `bookingCatalogSchema`, `BookingCatalog`, `bookingGuestSchema`, `BookingGuest`, `lastVisitSchema`, `LastVisit`, `savedCardSchema`, `SavedCard`, `SavedCardInput`, `ownedPackageSchema`, `OwnedPackage`, `bookingCustomerSchema`, `BookingCustomer`, `visitSuggestionSchema`, `VisitSuggestion`, `suggestionResponseSchema`, `phoneCheckSchema`, `PhoneCheck`, `otpSentSchema`, `OtpSent`, `slotSchema`, `Slot`, `availabilitySchema`, `Availability`, `alternativeSchema`, `Alternative`, `alternativesSchema`, `Alternatives`, `earliestSchema`, `Earliest`, `barberReviewSchema`, `BarberReview`, `barberReviewsSchema`, `reviewSavedSchema`, `packagePurchasedSchema`, `PackagePurchased`, `PackagePurchaseInput`, `giftCheckSchema`, `GiftCheck`, `giftPurchasedSchema`, `GiftPurchased`, `GiftPurchaseInput`, `funnelSchema`, `BookingFunnel`, `waitlistWindowSchema`, `WaitlistWindow`, `waitlistJoinedSchema`, `WaitlistJoined`, `WaitlistInput`, `bookedStatusSchema`, `BookedStatus`, `bookedAppointmentSchema`, `BookedAppointment`, `repeatResultSchema`, `RepeatResult`, `totalsSchema`, `payMethodSchema`, `PayMethod`, `reservationSchema`, `Reservation`, `myAppointmentsSchema`, `MyAppointments`, `otpVerifySchema`, `OtpVerify`, `cancelResultSchema`, `CancelResult`, `receiptSentSchema`, `ReceiptSent`, `NewCustomerInput`, `ReservationItemInput`, `ReservationInput`, `RescheduleInput` · usa: @/features/payments, @/features/settings
- **useBookingEngine.ts** — El motor de la reserva, sin interfaz: la barbería, el catálogo de la sede, el estado (quién reserva, el carri… · `useBookingEngine`
- **useBookingTotals.ts** — Lo que vale una cita: con barbero elegido (o, sin preferencia, el que la agenda asigna a esa hora), su precio… · `itemPrice`, `fromPrice`, `itemDuration`, `packageCoverage`, `activeBranch`, `useBookingTotals`, `DraftOrderLine`, `draftOrderLines` · usa: @/features/branches
- **versions.ts** — Las maneras de reservar que se pueden ver en la vista previa. · `BookingVersion`, `BOOKING_VERSIONS`, `isBookingVersion`, `HIDDEN_BOOKING_VERSIONS`, `DEFAULT_BOOKING_VERSION`, `isOfferedBookingVersion`
- **visit.ts** — Quién va a la cita: una misma persona no puede estar en dos sillas a la vez. · `personKey`, `BusyRange`, `busyRanges`, `overlapsBusy`, `CartGroup`, `cartGroups`, `visitPartOf`

### booking/comments

- **ReviewerNameDialog.tsx** — Se pide una vez, al abrir los comentarios: es la firma de lo que esa persona escribe en la hoja. · `ReviewerNameDialog` · piezas: Button, Field, Input, ModalShell · usa: @/app/i18n
- **commentEvents.ts** — Los comentarios de revisión se guardan como un registro de acciones, no como el estado final: cada comentario… · `COMMENT_ACTIONS`, `CommentAction`, `MAX_COMMENT_BODY`, `commentEventSchema`, `CommentEvent`, `commentEventsRequestSchema`, `reduceEvents`, `CommentActor`, `newEventId`, `diffThreads`, `FreshThreads`, `freshThreadIds`
- **useSharedComments.ts** — Quién comenta. · `MAX_REVIEWER_NAME`, `useReviewer`, `useSharedComments`

### booking/flow

- **AddCard.tsx** — Las tarjetas que suman algo a la reserva («Agregar otra cita», «Agregar productos»): secundarias, sin botón,… · `AddCard` · piezas: ActionTile, IconTile · usa: @/icons
- **AgendaCover.tsx** — La portada de la reserva: `CoverHero` del sistema con la foto de la barbería y el ancho de columna de los pas… · `AgendaCover`, `AgendaCoverTitle` · piezas: CoverHero, CoverTitle
- **AlternativeBarbers.tsx** — Cuando el barbero elegido no tiene horas ese día: otros que hacen los mismos servicios, ordenados por cuánto… · `AlternativeBarbers` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, Button, Heading, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AppointmentCard.tsx** — Una cita como la lee el cliente, la misma en el resumen, en la confirmación y en «Mis citas». · `AppointmentCardData`, `AppointmentCard` · piezas: Avatar, AvatarFallback, AvatarImage, Button, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AppointmentDetailSheet.tsx** — «Ver detalle»: la cita como una ficha — el día grande, la hora de inicio a fin, y debajo qué, con quién, para… · `AppointmentDetailSheet` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, Button, Heading, IconTile, Text · usa: @/app/i18n, @/icons
- **BarberProfileDrawer.tsx** — El perfil de un barbero: quién es, sus trabajos y lo que cobra por cada servicio. · `BarberProfileDrawer`, `BarberAvatar`, `BarberProfileBody` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Chip, Heading, Rating, Text · usa: @/app/i18n, @/icons
- **BookingContext.ts** — Lo que comparten los pasos de la reserva: el estado, la barbería, el catálogo de la sede elegida, los formato… · `BookingLayout`, `BookingFlowValue`, `BookingFlowProvider`, `useBookingFlow`
- **BookingHeader.tsx** — La cabecera de la reserva: quién es la barbería (solo la marca, sin la sede), volver y cuánto falta. · `BookingHeader` · piezas: Button, Progress, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **BookingOverlay.tsx** — Las ventanas de la reserva (elegir sede, barbero o servicios, el perfil de un barbero, los productos, cambiar… · `BookingOverlayProps`, `BookingOverlay` · piezas: Dialog, DialogContent, DialogDescription, DialogTitle, DrawerShell · usa: @/lib/utils
- **BookingSheet.tsx** — Las decisiones cortas de la reserva (cambiar de sede, para quién es, cancelar, enviar el recibo): en celular,… · `BookingSheet`
- **BookingSummaryAside.tsx** — En monitor, la reserva que se va armando queda a la derecha todo el tiempo: la sede, cada cita y el total. · `BookingSummaryAside` · piezas: Heading, IconTile, NumberField, Text · usa: @/app/i18n, @/icons
- **BranchChange.tsx** — La sede de la reserva, en el resumen: dónde será y un botón para cambiarla. · `BranchChange` · piezas: Alert, AlertDescription, Button, IconTile, OptionTile, Text · usa: @/app/i18n, @/icons
- **BranchProfileSheet.tsx** — El perfil de una sede, para decidir dónde reservar: fotos, si está abierta ahora, cómo llegar, el horario de… · `BranchProfileSheet`, `BranchProfileBody` · piezas: Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Badge, Button, Heading, IconTile, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **CalendarSheet.tsx** — «Agregar al calendario»: se elige cuál. · `CalendarSheet` · piezas: Chip, IconTile, ListItem, ListItemGroup, Text · usa: @/app/i18n, @/icons
- **CancelDialog.tsx** — Cancelar, con las cuentas a la vista antes de confirmar: si todavía es gratis, hasta cuándo; si no, cuánto se… · `CancelDialog` · piezas: Alert, AlertDescription, Button, OptionTile, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **CardBrandMark.tsx** — La marca de la red como se reconoce de un vistazo: el nombre en su estilo o, en Mastercard, los dos círculos. · `CardBrandMark`, `CardBrandTile` · usa: @/lib/utils
- **CardForm.tsx** — Una tarjeta nueva: la tarjeta dibujada arriba refleja lo que se escribe y marca dónde va cada dato (el CVC la… · `CardForm` · piezas: Checkbox, Field, Input, Text · usa: @/app/i18n, @/lib/utils
- **CardPreview.tsx** — La tarjeta dibujada mientras se escribe, como en las apps de pago: el número se va llenando, se reconoce la m… · `CardField`, `CardPreview` · usa: @/app/i18n, @/lib/utils
- **ChatTrigger.tsx** — «Agenda con Clipper»: el botón de IA (secundario) de la primera pantalla que lleva a Clipper con la voz ya ab… · `ChatTrigger` · piezas: AIButton · usa: @/app/i18n
- **CheckoutRecap.tsx** — En el cierre, los productos que se lleva: junto a la cita, en la parte de arriba del panel. · `CheckoutProducts`, `CheckoutSummary`, `OrderEstimate` · piezas: Text · usa: @/app/i18n, @/icons
- **ConfirmedActions.tsx** — Lo que se hace con la cita ya confirmada: enviar el recibo, agregarla al calendario, dejarla fija y ver su de… · `ConfirmedActions` · piezas: ActionTile, IconTile · usa: @/app/i18n, @/icons
- **ConfirmedBarberNote.tsx** — Nota y foto para el barbero, ya con la cita confirmada: se escriben aquí y se mandan a la reserva. · `ConfirmedBarberNote` · piezas: Button, Field, Text, Textarea · usa: @/app/i18n, @/icons
- **ConsentFields.tsx** — El permiso de promociones y el aviso de privacidad con el texto del país de la sede: la casilla empieza sin m… · `ConsentFieldsProps`, `ConsentFields` · piezas: Checkbox, Collapsible, CollapsibleContent, CollapsibleTrigger, Label, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **EarliestSlot.tsx** — «Lo antes posible»: deshabilitado por requerimiento de diseño. · `EarliestSlot`
- **GalleryViewer.tsx** — La galería a pantalla completa: la foto ocupa el dispositivo, se pasa con el dedo (o con las flechas y el tec… · `GalleryViewer` · piezas: Button, Carousel, CarouselContent, CarouselItem, Dialog, DialogContent, DialogDescription, DialogTitle, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **GiftCardField.tsx** — Usar una tarjeta de regalo: se valida el código en el servidor y su saldo paga primero. · `GiftCardField` · piezas: Button, Chip, Field, Input, Text · usa: @/app/i18n, @/lib/api
- **HeldCards.tsx** — Las citas ya apartadas, cada una en su tarjeta (y su «Editar»): la hoja de «las que ya apartaste» (Agenda y P… · `HeldCards` · piezas: Button · usa: @/app/i18n, @/icons
- **InPlaceIdentity.tsx** — El celular, el código y la ficha (`AgendaIdentity`) resueltos dentro de una hoja: la pantalla de detrás (las… · `InPlaceIdentity`
- **ManageSignIn.tsx** — Entrar a «Mis citas»: el celular y un código por SMS. · `ManageSignIn` · piezas: Button, Field, InputOtp, PhoneInput, Spinner, Text · usa: @/app/i18n, @/lib/api
- **MembershipPerk.tsx** — La membresía del cliente, en el pago: cada tantas visitas gana un servicio de cortesía. · `MembershipPerk` · piezas: ProgressRing, Switch, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **NewCardSheet.tsx** — Agregar una tarjeta en su propia hoja, como el catálogo de productos o el perfil del barbero: la tarjeta dibu… · `NewCardSheet` · piezas: Button · usa: @/app/i18n, @/icons
- **NextToPart.tsx** — Al separar un servicio, lo natural es encadenarlo: justo después (o justo antes) de la otra parte de la visit… · `NextToPart` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/icons
- **OrderSummary.tsx** — «Tu orden»: lo comprado, el descuento, el impuesto, la propina, los cargos (recargo por tarjeta) y el total,… · `OrderLine`, `OrderSummary` · piezas: Separator, Text · usa: @/app/i18n
- **PackagesToggle.tsx** — En el pago: si sus paquetes cubren algo de esta reserva, lo dice y deja usarlos o guardarlos para otra vez. · `PackagesToggle` · piezas: Switch, Text · usa: @/app/i18n, @/icons
- **PayIdentity.tsx** — Quién paga, justo antes de pagar: el código y, si es la primera vez, su ficha. · `PayIdentity` · piezas: Button, Field, InputOtp, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **PaymentPanel.tsx** — El botón que cobra: dice exactamente lo que va a pasar («Pagar $64»). · `PayButton`, `PaymentPanel`, `PaymentSheets` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, ModalShell, OptionTile, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/utils
- **PersonPicker.tsx** — La hoja de «¿Para quién más?»: la gente ya ligada a su perfil (su hijo, su pareja, un amigo que trajo antes)… · `PersonSheet`, `PersonPicker` · piezas: Avatar, AvatarFallback, Button, Chip, Field, Heading, Input, ListItem, ListItemGroup, Text · usa: @/app/i18n, @/icons
- **PhotoStrip.tsx** — Una tira de fotos que se recorre arrastrando —con el dedo o con el mouse— o con las flechas, sin tener que ab… · `PhotoStrip` · piezas: Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious · usa: @/app/i18n, @/icons, @/lib/utils
- **PickedProducts.tsx** — Lo que ya va en la reserva, se haya sumado desde el carrusel o desde el catálogo completo: una fila por produ… · `PickedProducts` · piezas: IconTile, NumberField, Text · usa: @/app/i18n, @/icons
- **ProductCard.tsx** — Un producto de la tienda, con su foto y el botón para sumarlo; ya en la reserva, el mismo hueco se vuelve un… · `ProductCard` · piezas: Button, IconTile, NumberField, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ProductCatalogDrawer.tsx** — Toda la tienda de la sede, ordenada como en el módulo de Productos: por categoría (Styling, Barba, Cuidado…),… · `ProductCatalogDrawer` · piezas: Button, Chip, EmptyState, Heading, Input, Text · usa: @/app/i18n, @/icons
- **PromoField.tsx** — El cupón: se valida en el servidor y, si aplica, queda como un chip que se puede quitar, con lo que ahorra. · `PromoField` · piezas: Button, Chip, Field, Input, Text · usa: @/app/i18n, @/lib/api
- **QuickActions.tsx** — Lo que se puede hacer además de reservar (ver tus citas, llamar, paquetes, regalar), para que no compita con… · `QuickAction`, `QuickActions` · piezas: IconTile, Text · usa: @/icons, @/lib/utils
- **ReceiptView.tsx** — El recibo de una reserva: número, lo cobrado por cita y producto, y con qué se pagó. · `ReceiptView` · piezas: Badge, Heading, Text · usa: @/app/i18n
- **ReferencePhotoField.tsx** — «Agregar foto del corte que quieres»: hasta tres imágenes de referencia que le llegan al barbero con la cita… · `ReferencePhotoField` · piezas: Button, Text · usa: @/app/i18n, @/icons
- **RepeatSheet.tsx** — «Fijar la cita»: cada cuánto y cuántas más, con las fechas que quedarían a la vista antes de confirmar (mismo… · `RepeatSheet` · piezas: Alert, AlertDescription, AlertTitle, Button, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/utils
- **RescheduleDrawer.tsx** — Cambiar la hora sin llamar: las horas libres para el mismo barbero (o para cualquiera, si lo prefiere) y un b… · `RescheduleDrawer` · piezas: Alert, AlertDescription, Button, Label, Spinner, Switch, Text, TimeSlotPicker · usa: @/app/i18n, @/icons, @/lib/api, @/lib/useResetOnChange
- **ReservedHairBurst.tsx** · `ReservedHairBurst` · piezas: HairBurst
- **ReviewSheet.tsx** — Calificar una cita que ya pasó: las estrellas (obligatorias) y un comentario opcional. · `ReviewSheet` · piezas: Button, Field, Rating, Textarea · usa: @/app/i18n, @/lib/api
- **SavedCardPicker.tsx** — Cómo paga con tarjeta: las que ya guardó (marca, •••• últimos 4, vence), la nueva que acaba de agregar y «Agr… · `NEW_CARD`, `SavedCardPicker` · piezas: Badge, Button, Input, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **SavedCardSheets.tsx** — Editar una tarjeta guardada: solo el titular y el vencimiento, que es lo que la pasarela deja cambiar del tok… · `EditSavedCardSheet`, `RemoveSavedCardSheet` · piezas: Button, Field, Input, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **ScheduleParts.tsx** — «¿Qué día y a qué hora?» y el día que se mira: el título del calendario, el mismo en todas las experiencias. · `ScheduleHeading`, `CallCard` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/icons
- **SendReceiptDialog.tsx** — Un canal: se marca y, marcado, muestra a dónde va. · `ChannelCard`, `SendReceiptDialog` · piezas: Button, Checkbox, Field, Input, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/useResetOnChange, @/lib/utils
- **SeparateServicesSwitch.tsx** — «Cada servicio con su barbero u hora»: con dos o más servicios, en vez de ir seguidos con el mismo barbero, c… · `SeparateServicesSwitch` · piezas: Switch, Text · usa: @/app/i18n
- **ShopBrand.tsx** — La marca de la barbería en la reserva: la misma pieza del menú lateral de la app. · `ShopBrand` · piezas: BrandSlot
- **StepLayout.tsx** — El molde de cada paso: título que dice qué se decide aquí, el contenido y un pie pegado abajo con el botón pr… · `StepLayout` · piezas: Heading, Text · usa: @/lib/utils
- **VisitGroup.tsx** — Las partes de una misma visita (un servicio separado para otro barbero u otra hora), juntas y unidas por una… · `VisitGroup` · piezas: Button, Text · usa: @/app/i18n, @/icons
- **VisitPartNote.tsx** — Al armar una parte de una visita, un `TicketCard` del sistema: qué parte es («2 de 3»), de qué servicio, qué… · `VisitPartNote` · piezas: Button, Text, TicketCard · usa: @/app/i18n, @/icons
- **WaitlistCard.tsx** — La lista de espera: siempre a mano, haya horas o no —puede que ninguna de las libres le sirva—. · `WaitlistCard` · piezas: ActionTile, Button, Heading, IconTile, SegmentedControl, Text · usa: @/app/i18n, @/icons
- **WaitlistSignIn.tsx** — La lista de espera en Paso a paso, igual que en la Agenda: con cuenta, la tarjeta para apuntarse; sin confirm… · `WaitlistSignIn` · piezas: Button · usa: @/app/i18n, @/icons
- **asideSlot.ts** — Lo que va al pie del cierre: con panel lateral se lleva a él (`portal`) y la página queda sin barra; sin pane… · `AsideSlotProvider`, `useAsideFooter`
- **bookingSkin.ts** — Con qué cara se pintan los pasos: «guided» (Paso a paso) o «agenda» (la de Agenda en lista: foto arriba con e… · `BookingSkin`, `BookingSkinContext`, `useBookingSkin`
- **bookingToast.ts** — Los avisos de la reserva salen dentro de su propia pantalla (el marco del celular, la tablet o el monitor de… · `BOOKING_TOASTER_ID`, `toast`
- **cardToken.ts** — La tarjeta nueva, lista para el cobro: la pasarela la convierte en token y solo eso viaja al servidor. · `newCardToken` · usa: @/app/i18n, @/features/payments
- **cardValidation.ts** — La tarjeta escrita a mano: cómo se agrupa mientras se teclea y qué le falta para poder cobrarse. · `digitsOf`, `groupCard`, `groupExpiry`, `CardBrand`, `cardBrandOf`, `brandFromName`, `cvcLengthOf`, `CardValues`, `savedCardExpiry`, `firstUsableCard`, `expiryOk`, `cardErrors`, `isCardComplete`, `isCvcComplete`
- **consentPack.ts** — El texto del consentimiento para la sede por la que entra el cliente (o la primera), en su idioma. · `useConsentPack`, `useConsentBranchId` · usa: @/features/legal, @/i18n
- **drawerFit.ts** — El drawer de abajo se limita por defecto al alto de la ventana (`100dvh`). · `DRAWER_FIT_STYLE`, `overlayKind`, `HIDE_SCROLLBAR`
- **missingData.ts** — Lo que falta para seguir, dicho en un toast, además del error en su campo. · `toastMissing`, `cardMissing` · usa: @/app/i18n
- **referencePhoto.ts** — La foto de referencia del corte, preparada en el celular antes de subirla: se reduce a 1024 px por el lado la… · `MAX_PHOTO_SIDE`, `MAX_REFERENCE_PHOTOS`, `MAX_PHOTO_CHARS`, `PHOTO_PATTERN`, `fitWithin`, `prepareReferencePhoto`
- **stepWidth.ts** — El ancho de lectura de un paso: la columna del contenido, no la de la barra del pie, que va de lado a lado. · `STEP_WIDTH`
- **usePaymentController.ts** — El cobro de la reserva, sin la pantalla alrededor: la propina, los descuentos, cómo se paga, la tarjeta y el… · `usePaymentController`, `PaymentController` · usa: @/app/i18n, @/lib/api
- **useSavedCardManager.tsx** — Editar y quitar tarjetas desde el selector, igual en Pagar y en Regalar: las dos hojas, qué queda elegido des… · `useSavedCardManager`
- **versionSwitch.ts** — De qué experiencia se llegó con la voz pedida, o `null`. · `SwitchToChatProvider`, `useSwitchToChat`, `requestVoiceOnArrival`, `peekVoiceOnArrival`, `clearVoiceOnArrival`
- **waitlist.ts** — El nombre de cada franja de la lista de espera, para la tarjeta y su confirmación. · `WINDOW_KEYS` · usa: @/app/i18n

### booking/preview

- **DemoHints.tsx** — Los datos para probar la demo, agrupados: los celulares de cada tipo de cliente y el código, las tarjetas, y… · `DemoHints` · piezas: Button, Popover, PopoverContent, PopoverTrigger, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **DemoSite.tsx** — Un sitio de barbería de ejemplo con el widget puesto: el botón flotante abajo a la derecha abre la reserva en… · `DemoSite` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Grain, Halo, Heading, IconTile, Text, agentPanelTransition · usa: @/app/i18n, @/icons, @/lib/utils
- **DeviceFrame.tsx** · `PreviewDevice`, `DeviceFrame` · piezas: Text · usa: @/icons, @/lib/utils
- **portalSlot.tsx** — Pinta `children` dentro del nodo de `usePortalNode`, esté donde esté. · `PortalContent`, `PortalSlot`
- **usePortalNode.ts** — Un nodo del DOM propio y estable: lo que se pinta en él con `createPortal` sigue en el mismo lugar del árbol… · `usePortalNode`

### booking/steps

- **BarberStep.tsx** — El barbero: «Sin preferencia» primero —es el que más horas abre— y luego cada uno con su foto, su nivel, lo q… · `BarberStep` · piezas: Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Button, IconTile, MagicCard, SelectMark, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **BlockedStep.tsx** — El número está bloqueado por la barbería: no se explica por qué, se ofrece el teléfono. · `BlockedStep` · piezas: Button, EmptyState · usa: @/app/i18n, @/icons
- **BranchStep.tsx** — La sede, con foto: se reconoce el local antes que la dirección. · `BranchStep` · piezas: Alert, AlertDescription, Button, IconTile, MagicCard, SelectMark, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ConfirmedStep.tsx** — Hecho. · `ConfirmedStep` · piezas: Badge, Button, Heading, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **GiftStep.tsx** — Regalar una tarjeta: el monto, para quién (nombre y WhatsApp, a donde le llega el código) y un mensaje; se pa… · `GiftStep` · piezas: Button, Field, Heading, IconTile, Input, NumberField, PhoneInput, Spinner, Text, Textarea · usa: @/app/i18n, @/icons, @/lib/api
- **ManageStep.tsx** — «Mis citas»: lo que viene (cambiar la hora o cancelar, con la política a la vista), lo que ya pasó (volver a… · `ManageStep` · piezas: Badge, Button, EmptyState, IconTile, ListItem, ListItemGroup, Rating, Skeleton, Text, ThemaTabs · usa: @/app/i18n, @/icons
- **PackagesStep.tsx** — Paquetes prepagados: N visitas de un servicio por menos de lo que valen sueltas. · `PackagesStep` · piezas: Badge, Button, Heading, IconTile, MagicCard, SelectMark, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/utils
- **PaymentStep.tsx** — Pagar: la propina para el barbero, un cupón y cómo se paga. · `PaymentStep` · piezas: Text · usa: @/app/i18n
- **PhoneStep.tsx** — La puerta: el celular. · `PhoneStep`
- **ProfileStep.tsx** — Quien reserva por primera vez: lo justo para su ficha en la barbería. · `ProfileStep` · piezas: Button, Field, Input, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **ReviewStep.tsx** — El carrito: cada cita en su tarjeta (con cambiar y quitar), sumar otra —para la misma persona otro día o para… · `ReviewStep` · piezas: Button, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Collapsible, CollapsibleContent, CollapsibleTrigger, EmptyState, Heading, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ServicesStep.tsx** — Los servicios: varios en la misma cita (corte + barba), con foto, cuánto duran y desde cuánto. · `ServicesStep` · piezas: Badge, Button, Chip, EmptyState, IconTile, Input, MagicCard, SelectMark, Skeleton, Text · usa: @/app/i18n, @/hooks/useDragScroll, @/icons, @/lib/utils
- **TimeStep.tsx** — Cuándo: el día en una tira y solo las horas libres de ese día, para el barbero elegido o para cualquiera. · `TimeStep` · piezas: Avatar, AvatarFallback, AvatarImage, Button, DayStrip, EmptyState, IconTile, Skeleton, Text, TimeSlotPicker · usa: @/app/i18n, @/icons
- **VerifyStep.tsx** — El código que llegó al celular. · `VerifyStep` · piezas: Button, Field, InputOtp, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **WaitlistedStep.tsx** — El final de quien no apartó hora pero se apuntó en la lista de espera: la certeza de que quedó apuntado, en q… · `WaitlistedStep` · piezas: Button, Heading, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **WelcomeStep.tsx** — El cliente que vuelve, pensado para el pulgar: arriba su ritmo; en medio, lo de siempre en una fila y las hor… · `WelcomeStep` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Heading, IconTile, MagicCard, SelectMark, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **useWelcomeData.ts** — Lo que necesita la bienvenida del cliente que vuelve: su última visita (servicios, barbero, sede y precio), l… · `useWelcomeData`, `WelcomeData`

### booking/steps/entry

- **CoverEntry.tsx** — Entrada «Portada»: la foto de la barbería arriba, como la vitrina, y encima una tarjeta con su marca y el cel… · `CoverEntry` · piezas: Heading, Text · usa: @/app/i18n, @/lib/utils
- **EntryShortcuts.tsx** — El atajo de la entrada que no pasa por el código: ver las citas que ya tiene. · `EntryShortcuts` · usa: @/app/i18n
- **PhoneEntryParts.tsx** — El campo del celular, igual en los tres diseños. · `PhoneEntryField`, `PhoneEntryActions` · piezas: Button, Field, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons
- **ShopBranchesCard.tsx** — Las sedes en la portada, agrupadas en una sola tarjeta: el logo de la barbería, dónde queda y a qué hora atie… · `ShopBranchesCard` · piezas: ActionTile, Button, IconTile, Text · usa: @/app/i18n, @/icons
- **usePhoneEntry.ts** — Lo que comparten los diseños de la entrada: el celular y su validación. · `usePhoneEntry`, `PhoneEntry` · usa: @/app/i18n, @/lib/api

### booking/variants/agenda

- **AgendaBarberField.tsx** — «¿Con quién?» en la Agenda, debajo de lo que se va a hacer: el mismo campo y la misma ventana que la sede. · `AgendaBarberField` · piezas: Badge, Button, Text · usa: @/app/i18n
- **AgendaBoard.tsx** — El tablero de la Agenda: sede, servicios y barbero arriba, como campos que abren su lista; el día en una tira… · `AgendaBoard` · piezas: Alert, AlertDescription, Button, DayStrip, EmptyState, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaBranchField.tsx** — La sede en la Agenda: el mismo campo que los servicios (foto del local, nombre y dirección) y la lista de sed… · `AgendaBranchField` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/icons
- **AgendaCart.tsx** — Las citas apartadas, una por fila: quién, qué, con quién y cuándo, con cambiar y quitar. · `AgendaCartLines`, `AgendaCartBar` · piezas: Avatar, AvatarFallback, AvatarImage, Button, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaCheckout.tsx** — Una parte del cierre: número, título y lo que va dentro. · `CheckoutSection`, `CheckoutFooter`, `AgendaCheckout` · piezas: Button, Heading, IconTile, Text · usa: @/app/i18n, @/icons
- **AgendaFlow.tsx** — Agenda: la reserva que parte del «¿cuándo?». · `AgendaFlow` · piezas: Button · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaHeader.tsx** — La cabecera de la agenda: la barbería, «Agenda con Clipper», entrar como cliente (no hace falta para mirar ho… · `AgendaHeader` · piezas: Button, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaIdentity.tsx** — Primera vez: lo justo para su ficha. · `ProfileForm`, `AgendaIdentity` · piezas: Alert, AlertDescription, AlertTitle, Button, Field, Input, InputOtp, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **AgendaLanes.tsx** — Las horas del día sin pensar en quién: `TimeSlotGroups` del sistema, con las caras de quienes pueden a la der… · `TimeWindows` · piezas: Avatar, AvatarFallback, AvatarGroup, AvatarImage, TimeSlotGroups · usa: @/app/i18n, @/icons
- **AgendaPicker.tsx** — Se abre donde se siente nativa en cada pantalla: en celular y en el widget sube desde abajo, al alcance del p… · `PickerField`, `PickerOverlay`, `PickerSearch`, `PickerRow` · piezas: Button, IconTile, Input, SelectableRow, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaProductField.tsx** — Lo que se lleva de la tienda en la Agenda: el mismo campo y la misma ventana que los servicios. · `AgendaProductField` · piezas: ActionTile, Button, IconTile, NumberField, Text · usa: @/app/i18n, @/icons
- **AgendaSelectCheckout.tsx** — «Confirma tu cita» en la Agenda: solo lo de la cita. · `AgendaSelectCheckout`, `AgendaSelectPay` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/icons
- **AgendaSelectFields.tsx** — Las preguntas de la Agenda, en filas y de a una: dónde, qué y con quién. · `AgendaSelectFields` · piezas: Button, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AgendaServicePicker.tsx** — «Qué te vas a hacer» en la Agenda: un campo que se lee como un select —lo elegido, cuánto dura y desde cuánto… · `AgendaServiceField` · piezas: Badge, Button, EmptyState, Skeleton, Text · usa: @/app/i18n, @/lib/utils
- **HeldAppointments.tsx** — Las citas ya apartadas mientras se arma otra: una tarjeta que dice cuántas hay y cuándo es la última, y al to… · `HeldAppointments` · piezas: IconTile, Text · usa: @/app/i18n, @/icons
- **agendaModel.ts** — Las cuentas de la agenda, sin interfaz: qué horas tiene cada barbero el día que se mira, cómo se reparten en… · `DayWindow`, `DAY_WINDOWS`, `windowOf`, `defaultServiceId`, `ableBarbers`, `TimeOption`, `timesByWindow`
- **pickerSearch.ts** — Desde cuántas opciones la lista de una hoja lleva buscador. · `PICKER_SEARCH_FROM`, `plainText`
- **useInlineLists.ts** — ¿Las listas se abren en su sitio? Fuera del celular y el widget: debajo de su fila, en vez de en una hoja o u… · `useInlineLists`

### booking/variants/chat

- **BookingVoice.tsx** — Hablar con Clipper: el modo voz de la app (las ondas, «Di lo que necesitas y haz una pausa…») como una llamad… · `BookingVoice` · piezas: ChatVoiceMode · usa: @/app/i18n, @/i18n, @/lib/chat
- **ChatCardSheets.tsx** — Las hojas de la tarjeta que abre la conversación: tarjeta nueva o el CVC de una guardada. · `ChatCardSheets` · piezas: Button, Input, Text · usa: @/app/i18n, @/icons
- **ChatFlow.tsx** — Conversación: se reserva hablando con el asistente de la barbería, como por WhatsApp. · `ChatFlow` · piezas: Button, ChatComposer, ChatMarkdown, ChatQuestionCard, ChatThinking, ChatUserMessage, ClipperOrb, Heading, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/utils
- **ChatHome.tsx** — La portada de Clipper, antes del chat: su orbe (un poste de barbería hecho esfera, con el gradiente de IA) so… · `ChatHome` · piezas: BorderBeam, Button, ChatComposer, ClipperOrb, Heading, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **chatCard.ts** — `canSave`: sin perfil no se ofrece guardarla. · `ChatCardSheet`, `CardKit`, `useChatNewCard`, `ChatCardController` · usa: @/app/i18n
- **chatCheckout.ts** — Lo que la conversación le presta al cobro: cómo hablar, el estado al día y a dónde volver. · `CheckoutKit`, `adjustmentRows`, `useChatCheckout` · usa: @/app/i18n, @/lib/api
- **chatExtras.ts** — Lo que se suma a la reserva después de apartar: productos de la tienda (cada uno con su cantidad, − 1 + en la… · `ExtrasKit`, `useChatExtras` · usa: @/app/i18n, @/lib/chat
- **chatIdentity.ts** — Quién es, conversando: el celular (solo números) al empezar. · `IdentityKit`, `useChatIdentity` · usa: @/app/i18n, @/features/legal, @/lib/api
- **chatIntents.ts** — Lo que se pide «de pasada» en cualquier momento de la conversación, como se le hablaría a una persona: volver… · `ChatAside`, `detectAside`, `IntentsKit`, `useChatIntents` · usa: @/app/i18n
- **chatKit.ts** — Lo que se pide desde la cabecera de la conversación. · `ChatReplyId`, `ChatTurn`, `Message`, `MessageInput`, `Expecting`, `PaymentEvent`, `TYPING_MS`, `DAYS_OFFERED`, `PHONE_DIGITS`, `EMAIL`, `RELATIONS`, `reducedMotion`, `capitalize`, `firstName`, `nextId`, `activeQuestionTurn`, `isKnownAnswer`, `Handlers` · usa: @/app/i18n, @/lib/chat
- **chatProfiles.ts** — Si lo escrito pide conocer a un barbero o una sede antes de elegir. · `looksLikeDetail`, `ProfilesKit`, `useChatProfiles` · usa: @/app/i18n, @/lib/api
- **chatQuestions.ts** — Las preguntas de la conversación como datos: lo que se lee (las opciones y su detalle) y lo que significa cad… · `QuestionKind`, `BookingQuestion`, `QuestionEntry`, `makeQuestion`, `matchOption`, `matchOptionLoosely`, `orderLine` · usa: @/lib/chat
- **chatReceipt.ts** — Lo que se va armando: a dónde va el recibo y qué falta que escriba. · `ReceiptPlan`, `ReceiptStep`, `isReceiptStep`, `ReceiptKit`, `createChatReceipt` · usa: @/app/i18n, @/lib/api, @/lib/chat
- **parseBookingText.ts** — Lo que se entiende de una frase del cliente en la conversación: qué se quiere hacer, con quién, qué día y a q… · `ChatIntent`, `ParsedRequest`, `parseBookingText`, `phoneFromText`, `codeFromText`
- **spokenNumbers.ts** — Cambia por cifras los celulares, códigos y horas dichos con palabras; lo demás queda igual. · `numberWordsToDigits`
- **useChatBooking.ts** — La conversación de la reserva. · `useChatBooking`, `ChatEngine` · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/chat
- **useVoiceBridge.ts** — De qué experiencia llega la voz: Paso a paso pide quién eres; el resto, qué quieres hacer. · `VoiceOrigin`, `useVoiceBridge` · usa: @/app/i18n, @/i18n, @/lib/chat
- **voiceReply.ts** — El texto de Clipper como se dice en una llamada: «Dime tu número» en vez de «Escríbeme tu número», y las fech… · `VoiceReplyLabels`, `forVoice`, `fromVoice`, `matchSpokenOption`, `saysOnlyOption`, `voiceReplyFromTurns` · usa: @/lib/chat

### branches

- **branches.ts** — Las sucursales del negocio. · `BRANCHES`, `DEFAULT_BRANCH_ID`
- **tax.ts** — El impuesto de una cuenta, igual en la reserva en línea, en el cobro de la agenda y en Transacciones. · `TaxedLine`, `linePercent`, `blendedPercent`, `taxOn`, `CartTotals`, `cartTotals`
- **useBranchCurrency.ts** — La moneda de la sucursal activa (la de la cabecera). · `useBranchCurrency` · piezas: useShellConfig · usa: @/features/settings
- **useBranches.ts** — Las sucursales activas de Configuración, en la forma que espera el shell. · `toCompany`, `useBranches` · usa: @/features/settings

### branding

- **BrandIdentitySettings.tsx** — Ajuste «Identidad de marca»: la empresa sube su logo y su nombre, y el menú lateral los encaja con `BrandSlot… · `BrandIdentitySettings` · piezas: Alert, AlertDescription, Button, Card, Field, FormSection, Heading, Input, Text, UploadZone, logoShape · usa: @/icons, @/lib/query
- **BrandLogoSection.tsx** — «Logo» dentro de Personalización: el isologo actual y la puerta para cambiarlo. · `BrandLogoSectionProps`, `BrandLogoSection` · piezas: BrandSlot, Button, Text · usa: @/icons
- **BrandMenuPreview.tsx** — El menú lateral en miniatura, con los tokens del modo pedido: cuadro del rail y fila del panel. · `BrandMenuPreview` · piezas: BrandSlot, Text · usa: @/themes
- **api.ts** — Contrato de identidad de la empresa; ver docs/API_CONTRACT.md. · `brandingApi` · llama: GET /company/branding, PUT /company/branding · usa: @/lib/api
- **logoFile.ts** — Alto mínimo de un PNG/JPG/WebP para que se vea nítido a 32px en pantallas retina. · `MIN_RASTER_HEIGHT`, `LogoFile`, `readLogoFile`, `logoQualityWarning`
- **queries.ts** · `brandingKeys`, `useBrandingQuery`, `useSaveBranding` · usa: @/lib/api
- **types.ts** — Identidad de la empresa; ver docs/API_CONTRACT.md → `/company/branding`. · `brandingSchema`, `Branding`, `BrandingInput`, `LOGO_ACCEPT`, `LOGO_MAX_MB`, `BRAND_NAME_MAX`
- **useLogoEditor.tsx** — Elegir un logo pasa siempre por el recortador: cuadrado, con zoom y giro, y la vista previa del menú real en… · `AppliedLogo`, `UseLogoEditorOptions`, `LogoEditor`, `useLogoEditor` · piezas: ImageCropDialog

### calendar

- **AppointmentDrawer.tsx** — El panel de una cita. · `AppointmentDrawerProps`, `AppointmentDrawer` · piezas: IconTile, SidePanelShell, calendarLocale, formatClock · usa: @/app/i18n, @/i18n, @/icons
- **BlockDrawer.tsx** — Crear bloqueo: una franja del barbero que deja de estar disponible — almuerzo, reunión, enfermedad, vacacione… · `BlockDrawerProps`, `BlockDrawer` · piezas: Button, DatePicker, DrawerSection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Text, Textarea, parseClock · usa: @/app/i18n, @/i18n, @/lib/api
- **BlockOptionsDialog.tsx** — Lo que se hace al tocar un bloqueo, para quien agenda sin las reglas de la casa (dueño, administrador, recepc… · `BlockOptionsDialogProps`, `BlockOptionsDialog` · piezas: ActionTile, IconTile, ModalShell, Text · usa: @/app/i18n
- **CalendarAgendaView.tsx** — La vista Agenda: las citas del día una debajo de otra, repartidas en mañana, tarde y noche, con el cliente, e… · `CalendarAgendaViewProps`, `CalendarAgendaView` · piezas: Button, EmptyState, ListItem, ListItemGroup, RowContextMenu, ScheduleColorDot, ScheduleMarkers, Text, minutesOfDay, scheduleColorClass · usa: @/app/i18n, @/i18n, @/lib/utils
- **CalendarAssistantDrawer.tsx** — El asistente del día: lo que la agenda pide mirar, como tarjetas de IA del sistema con su acción, y un campo… · `CalendarAssistantDrawerProps`, `CalendarAssistantDrawer` · piezas: AIButton, AIInsightCard, AIPanel, Field, SidePanelShell, Text, Textarea, formatClock · usa: @/app/i18n, @/i18n
- **CalendarDayView.tsx** — La vista Día: la rejilla por barbero con lo que se puede hacer desde ella —agendar en un hueco, abrir una cit… · `CalendarDayViewProps`, `CalendarDayView` · piezas: Button, Chip, EmptyState, ResourceDayGrid, calendarLocale, minutesOfDay, parseClock · usa: @/app/i18n, @/i18n
- **CalendarFilters.tsx** — El control de filtros de la agenda: qué citas se miran —en qué estado están, de qué servicio son y qué tipo d… · `ServiceFilterOption`, `ResourceFilterOption`, `ClientTypeFilterOption`, `CalendarFilterSelection`, `CalendarFiltersProps`, `CalendarFilters` · piezas: Button, MultiSelect, Popover, PopoverContent, PopoverTrigger, ScheduleColorDot, Switch, Text · usa: @/app/i18n
- **CalendarMonthView.tsx** — La vista Mes: la ocupación de un barbero (o del equipo) día por día, con tres cifras arriba —citas del mes, o… · `CalendarMonthViewProps`, `CalendarMonthView` · piezas: KpiCard, MonthOccupancyGrid, Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/query
- **CalendarPage.tsx** · `CalendarPageProps`, `CalendarPage` · piezas: Breadcrumbs, Button, ConfirmDialog, DataListActionRail, ScreenHeaderActions, ShellHeaderSlot, ShellRailSlot, Skeleton, Text, atMinutes, formatClock, formatClockRange, minutesOfDay, parseClock, useActionsPlacement, usePageHeaderExtras, useShellConfig · usa: @/app/i18n, @/features/access, @/features/branches, @/features/frontDesk, @/features/services, @/features/team, @/i18n, @/lib/api, @/lib/query
- **CalendarSearch.tsx** · `CalendarSearchProps`, `CalendarSearch` · piezas: Button, Input, Popover, PopoverAnchor, PopoverContent, Text, Tooltip, TooltipContent, TooltipTrigger, calendarLocale, formatClock · usa: @/app/i18n, @/i18n, @/lib/utils
- **CalendarToolbar.tsx** — La barra del calendario y, a la vez, su cabecera: no hay título encima —las migas ya dicen dónde estás— para… · `CalendarToolbarProps`, `CalendarToolbar` · piezas: Button, Calendar, DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuTrigger, Popover, PopoverContent, PopoverTrigger, calendarLocale · usa: @/app/i18n, @/i18n
- **CalendarViewOptions.tsx** — Cómo se ve la agenda, separado de qué se ve (eso es `CalendarFilters`). · `CalendarViewOptionsProps`, `CalendarViewOptions` · piezas: Button, Popover, PopoverContent, PopoverTrigger, SegmentedControl, Switch, scheduleColorClass · usa: @/app/i18n, @/lib/utils
- **CalendarWeekView.tsx** — La vista Semana: una fila por barbero y una columna por día, con cuánto de su jornada tiene reservado y cuánt… · `CalendarWeekViewProps`, `CalendarWeekView` · piezas: Button, Progress, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/i18n, @/lib/query, @/lib/utils
- **CheckoutDrawer.tsx** — Cobrar, con la cara del panel de la cita: el avance de la cita arriba y una tarjeta teñida con «Cobrar US$ …»… · `CheckoutDrawerProps`, `CheckoutDrawer` · piezas: Button, Field, Heading, ModalShell, NumberField, Separator, SidePanelShell, Spinner, Stepper, Text, formatClock · usa: @/app/i18n, @/icons
- **CheckoutPrice.tsx** — El precio de una línea del cobro. · `CheckoutPrice` · piezas: Button, NumberField · usa: @/app/i18n
- **CollectionsDrawer.tsx** — La lista de cobros: las citas del día que faltan por pagar y las que ya se cobraron, con el total de cada pes… · `CollectionsDrawerProps`, `CollectionsDrawer` · piezas: Button, EmptyState, ListItem, ListItemGroup, SidePanelShell, Text, ThemaTabs, calendarLocale · usa: @/app/i18n, @/i18n, @/lib/query
- **CreateAppointmentDrawer.tsx** — Crear cita: cliente, servicio (uno o varios), barbero y fecha & hora, el interruptor de «cliente sin cita pre… · `CreateAppointmentInitial`, `CreateAppointmentDraft`, `CreateAppointmentDrawerProps`, `CreateAppointmentDrawer` · piezas: Alert, AlertDescription, Button, Chip, DrawerSection, Field, MultiSelect, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Switch, Text, Textarea, TimeSlotPicker, atMinutes, formatClock, formatClockRange, isWorkingAt, minutesOfDay · usa: @/app/i18n, @/lib/api
- **DayWeightBadge.tsx** · `DayWeightBadgeProps`, `DayWeightBadge` · piezas: Text, Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n, @/lib/utils
- **GapsDrawer.tsx** — Los huecos del día en un panel junto a la agenda: cuánto tiempo libre queda, cuánto se podría vender todavía… · `GapsDrawerProps`, `GapsDrawer` · piezas: Button, Chip, EmptyState, ListItem, ListItemGroup, SegmentedControl, SidePanelShell, Text, formatClockRange · usa: @/app/i18n
- **QuickSaleDrawer.tsx** — Venta rápida de productos: para quien se lleva una cera sin tener cita. · `QuickSaleDrawerProps`, `QuickSaleDrawer` · piezas: Button, DrawerSection, Field, Input, ListItem, ListItemGroup, NumberField, RadioCardGroup, SegmentedControl, SidePanelShell, Text · usa: @/app/i18n, @/lib/api
- **ReflowBanner.tsx** — La franja que acompaña a un plan de reacomodo mientras se ve en la agenda: cuántas citas se corren, cuánto, s… · `ReflowBannerProps`, `ReflowBanner` · piezas: AttentionStrip, Button, formatClock · usa: @/app/i18n
- **TeamPicker.tsx** — A quién se ve en la agenda: los que trabajan ese día, todo el equipo, o los barberos que se marquen —uno o va… · `TeamPickerProps`, `TeamPicker` · piezas: Button, Checkbox, Popover, PopoverContent, PopoverTrigger · usa: @/app/i18n, @/icons/ThemaIcon, @/lib/utils
- **WaitlistDrawer.tsx** — La lista de espera: quién espera un hueco, para qué servicio, con quién y en qué franjas le sirve. · `WaitlistDrawerProps`, `WaitlistDrawer` · piezas: Badge, Button, DatePicker, DrawerSection, EmptyState, Field, ListItem, ListItemGroup, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Text, formatClock · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/query
- **WalkInSaleDrawer.tsx** — Venta sin cita: registrar un servicio que ya se hizo sin agendar —fecha, hora, cliente, servicio y barbero— p… · `WalkInSaleDrawerProps`, `WalkInSaleDrawer` · piezas: Button, DatePicker, DrawerSection, Field, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, atMinutes, formatClock, minutesOfDay · usa: @/app/i18n, @/features/team, @/i18n, @/lib/api
- **api.ts** — Contrato del calendario; ver docs/API_CONTRACT.md. · `calendarApi` · llama: GET /calendar/catalog, GET /calendar/day, GET /calendar/appointments, GET /calendar/month, GET /calendar/rhythm, POST /appointments, POST /booking/gift-cards/check, POST /appointments/${id}/refund, POST /appointments/${id}/void-payment, PATCH /customers/${clientId}, PATCH /appointments/${id}, POST /appointments/${id}/checkout, POST /clients/${clientId}/notes, PATCH /clients/${clientId}/notes/${noteId}, DELETE /clients/${clientId}/notes/${noteId}, POST /blocks, DELETE /blocks/${id}, PATCH /blocks/${id}, GET /calendar/blocks, POST /blocks/${id}/approve, GET /waitlist, POST /waitlist, DELETE /waitlist/${id}, POST /sales · usa: @/lib/api
- **appointmentActions.ts** — El icono y el texto de cada acción de una cita, los mismos en botones y menús. · `ACTION_ICON`, `ACTION_LABEL` · usa: @/app/i18n
- **appointmentInsights.ts** — Las sugerencias de una cita: lo que conviene saber antes de atender, sacado del historial del cliente y de la… · `InsightTone`, `InsightAction`, `AppointmentInsight`, `NO_SHOW_RISK_RATE`, `appointmentInsights` · usa: @/app/i18n
- **appointmentPlaybook.ts** — Qué toca hacer con una cita según dónde va: la acción principal, las que la acompañan y las que quedan en el… · `AppointmentStage`, `AppointmentActionId`, `AppointmentPlaybook`, `appointmentStage`, `appointmentPlaybook`
- **bookingText.ts** — Entender una cita escrita como se dice en recepción —«corte para Martín mañana a las 4 con Nicolás»— y dejarl… · `ParsedBooking`, `parseBookingText` · piezas: atMinutes
- **calendarAccess.ts** — Lo que el rol deja hacer en el calendario, decidido una vez desde `useAccess()` y repartido por el `ModelCont… · `CalendarAccess`, `FULL_CALENDAR_ACCESS`, `followsAgendaRules`, `calendarAccess`, `canRemoveBlock`, `scopeCatalog`, `scopeDay`, `waitlistInScope` · usa: @/features/access
- **calendarCardPrefs.ts** — Qué cuenta cada tarjeta de la agenda. · `CalendarCardPrefs`, `CalendarCardPref`, `DEFAULT_CARD_PREFS`, `setCalendarCardPref`, `resetCalendarCardPrefs`, `useCalendarCardPrefs`
- **calendarColumnWidths.ts** — El ancho de cada columna de barbero en la vista Día, cuando alguien lo ajusta desde el borde de la cabecera. · `CalendarColumnWidths`, `parseColumnWidths`, `withColumnWidth`, `setCalendarColumnWidth`, `resetCalendarColumnWidths`, `useCalendarColumnWidths` · piezas: clampColumnWidth
- **calendarContextActions.tsx** — El clic derecho de la agenda: lo que se puede hacer con una cita o un bloqueo sin abrirlos. · `AppointmentContextHandlers`, `appointmentContextActions`, `blockContextActions`
- **calendarDensity.ts** — Cuánto ocupa cada media hora en la rejilla del día. · `DEFAULT_DENSITY`, `DENSITY_OPTIONS`, `setCalendarDensity`, `useCalendarDensity` · piezas: SCHEDULE_DENSITIES
- **calendarFormat.ts** — Dinero de la sucursal activa, en su moneda y con la convención del idioma activo. · `useMoney`, `halfHourOptions`, `useOpenKey`, `clockLabel` · piezas: atMinutes, formatClock, parseClock · usa: @/features/branches, @/i18n
- **calendarModel.ts** — Del dominio a lo que se ve: convierte barberos y citas en recursos y eventos de la rejilla, decide el siguien… · `Translate`, `ModelContext`, `CalendarColorBy`, `CALENDAR_COLOR_BY`, `parseLocal`, `toLocalIso`, `appointmentStart`, `appointmentEnd`, `findClient`, `findBarber`, `priceFor`, `servicesOf`, `servicesPrice`, `servicesMinutes`, `workingHoursOn`, `applyDayHours`, `isWorkingOn`, `teamIds`, `visibleBarbers`, `isActive`, `isUnpaid`, `statusTone`, `clientTypeTone`, `CLIENT_TYPE_ORDER`, `JOURNEY`, `NextStep`, `nextStep`, `appointmentWarning`, `LATE_AFTER_MINUTES`, `lateMinutes`, `durationLabel`, `nextFreeMinute`, `clashingAppointments`, `clashingBlocks`, `PlacementProblem`, `placementProblem`, `placementReason`, `blockClashes`, `barberLoad`, `toResource`, `STAGES`, `AppointmentStage`, `appointmentStage`, `STAGE_TONE`, `STAGE_FILL`, `stageBadge`, `AgendaFilters`, `appointmentClientType`, `matchesFilters`, `hasFilters`, `productCount`, `appointmentTotal`, `serviceCategories`, `categoryTone`, `serviceColor`, `appointmentCategory`, `FIRST_VISIT_MAX_VISITS`, `isFirstVisit`, `appointmentMarkers`, `cardMarkers`, `isFlexible`, `appointmentGroups`, `visitContinuations`, `serviceSlots`, `linkedOf`, `newLinkId`, `toEvent`, `blockToEvent`, `appointmentRange`, `historyLabel`, `monthKey` · piezas: atMinutes, formatClock, formatClockRange, minutesOfDay, parseClock, rangesOverlap, workingMinutes · usa: @/app/i18n, @/i18n
- **calendarRailActions.tsx** — Lo que se puede hacer desde el calendario, declarado una vez con su peso. · `CalendarRailHandlers`, `calendarRailActions` · piezas: ClipperIcon · usa: @/app/i18n
- **calendarShared.tsx** — El avatar de un cliente: su foto o sus iniciales. · `AppointmentStatusBadge`, `ClientTypeBadge`, `PersonAvatar`, `ClientAvatar`, `ServiceThumb`, `ProductThumb`, `DetailRow` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, IconTile, StatusBadge, initialsOf · usa: @/app/i18n
- **checkoutMath.ts** — Las cuentas del cobro, sin interfaz: cuánto es una propina sugerida, cuánto recarga la tarjeta y cuánto se de… · `TipChoice`, `CardSurcharge`, `FALLBACK_TIPS`, `tipAmount`, `surchargeAmount`, `changeDue`, `AppointmentBill`, `PriceOverrides`, `discountAmount`, `equalParts`, `appointmentBill`, `sumBills`, `splitAcross` · usa: @/features/branches
- **dayBrief.ts** — Lo que el día pide mirar, en pocas líneas: quién va tarde, a quién le sobra agenda, quién ya no da abasto y a… · `BriefLine`, `IDLE_LOAD`, `FULL_LOAD`, `dayBrief`, `WaitlistMatch`, `waitlistMatch` · piezas: atMinutes, minutesOfDay, parseClock, workingMinutes · usa: @/app/i18n
- **dayWeight.ts** — Si un día suele ser suave o pesado, según el historial de la barbería: el promedio de citas de ese día de la… · `DayWeightLevel`, `HEAVY_FROM`, `LIGHT_UNTIL`, `DayWeight`, `dayWeightOf`, `bookedShare`
- **gapsModel.ts** — Los huecos del día: los ratos libres de cada barbero dentro de su jornada, desde ahora. · `DayGap`, `DayGapsOptions`, `DEFAULT_MIN_GAP_MINUTES`, `dayGaps`, `GapsSummary`, `gapsSummary` · piezas: atMinutes, minutesOfDay, parseClock
- **messages.ts** — Los mensajes de una cita (confirmación, recordatorios, hueco liberado, y lo que el equipo manda desde su pane… · `messageKindSchema`, `MessageKind`, `MESSAGE_KIND_KEYS`, `appointmentMessageSchema`, `AppointmentMessage`, `replyIntentSchema`, `ReplyIntent`, `appointmentReplySchema`, `AppointmentReply`, `REPLY_INTENT_KEYS`, `SendChannel`, `SendToClientInput`, `messagesApi`, `useSimulateReply`, `useAppointmentMessages`, `useSendToClient`, `useMessageDispatcher` · llama: GET /appointments/${appointmentId}/messages, POST /appointments/${appointmentId}/messages, POST /appointments/${appointmentId}/simulate-reply, POST /messages/dispatch · usa: @/app/i18n, @/lib/api
- **pulseModel.ts** — En qué va cada cita ahora mismo y cuánto dinero lleva la jornada. · `PULSE_FOCUSES`, `PulseFocus`, `pulseGroup`, `DayPulse`, `dayPulse`
- **queries.ts** — Claves jerárquicas: invalidar `days()` refresca cualquier día abierto sin tocar el catálogo, y `month()` se r… · `calendarKeys`, `useCatalogQuery`, `useDayQuery`, `useRangeQuery`, `useMonthQuery`, `useRhythmQuery`, `useWaitlistQuery`, `useRestrictClient`, `useRefundAppointment`, `useVoidPayment`, `useCreateAppointment`, `useUpdateAppointment`, `useCheckoutAppointment`, `useAddClientNote`, `useUpdateClientNote`, `useRemoveClientNote`, `useUpdateBlock`, `useCreateBlock`, `useBlocksQuery`, `useApproveBlock`, `useRemoveBlock`, `useAddToWaitlist`, `useRemoveFromWaitlist`, `useCreateSale`
- **reflowModel.ts** — Reacomodar la cola de un barbero cuando algo se alarga: la cita que viene después se corre hasta donde termin… · `ReflowMove`, `ReflowPlan`, `isMovable`, `reflowPlan`, `planShiftMinutes`, `moveStart` · piezas: atMinutes, minutesOfDay, parseClock
- **resourceModel.ts** — Lo que la agenda necesita de un recurso (el de Servicios trae más). · `AgendaResource`, `ResourceCandidate`, `ResourceCatalog`, `ResourceUse`, `ResourceClash`, `ResourceDay`, `resourceUses`, `resourceClashes`, `resourceDay`, `ResourceConflict`, `resourceConflict`, `resourceReason`, `resourceSelected`, `toggleResource` · piezas: formatClock
- **searchModel.ts** — Sin tildes ni mayúsculas: «Ingresó» y «ingreso» son lo mismo. · `normalizeSearch`, `SearchIndexEntry`, `SearchIndexInput`, `buildSearchIndex`, `MAX_SEARCH_RESULTS`, `SearchResult`, `searchAppointments` · piezas: formatClock · usa: @/app/i18n
- **slotSuggestions.ts** — Los huecos que conviene ofrecer para una cita: dónde cabe el servicio y, de esos sitios, cuáles dejan la agen… · `SlotSuggestion`, `SuggestSlotsOptions`, `SUGGESTION_STEP_MINUTES`, `suggestSlots` · piezas: atMinutes, minutesOfDay, parseClock · usa: @/app/i18n
- **types.ts** — El contrato del calendario (docs/API_CONTRACT.md, «Calendario»): lo que el backend manda y lo que la pantalla… · `workingRangeSchema`, `WorkingRange`, `barberSchema`, `Barber`, `clientTypeSchema`, `ClientType`, `noteKindSchema`, `NoteKind`, `clientNoteSchema`, `ClientNote`, `clientSchema`, `Client`, `serviceSchema`, `Service`, `productSchema`, `Product`, `catalogSchema`, `CalendarCatalog`, `appointmentStatusSchema`, `AppointmentStatus`, `appointmentSourceSchema`, `repeatRuleSchema`, `RepeatRule`, `paymentMethodSchema`, `PaymentMethod`, `historyEntrySchema`, `HistoryEntry`, `paymentSchema`, `Payment`, `PaymentPart`, `onlineSettlementSchema`, `OnlineSettlement`, `refundItemSchema`, `RefundItem`, `refundSchema`, `Refund`, `productLineSchema`, `ProductLine`, `appointmentSchema`, `Appointment`, `blockCategorySchema`, `BlockCategory`, `blockRepeatSchema`, `BlockRepeat`, `timeBlockSchema`, `TimeBlock`, `calendarDaySchema`, `CalendarDay`, `monthDaySchema`, `calendarMonthSchema`, `calendarRangeSchema`, `CalendarRange`, `CalendarMonth`, `dayRhythmSchema`, `DayRhythm`, `waitlistEntrySchema`, `WaitlistEntry`, `waitlistSchema`, `saleSchema`, `Sale`, `appointmentInputSchema`, `AppointmentInput`, `ClientRestriction`, `AppointmentPatch`, `CheckoutInput`, `blockInputSchema`, `BlockInput`, `WaitlistInput`, `SaleInput`, `NoteInput`, `CalendarView`, `CALENDAR_VIEWS`, `TeamFilter`, `STATUS_KEYS`, `CLIENT_TYPE_KEYS`, `REPEAT_KEYS`, `BLOCK_CATEGORY_KEYS`, `BLOCK_REPEAT_KEYS`, `PAYMENT_METHOD_KEYS`, `NOTE_KIND_KEYS` · usa: @/app/i18n
- **useCalendarShortcuts.ts** — Los atajos de una letra del calendario, los de cualquier calendario rápido: C crea una cita, T vuelve a hoy,… · `CalendarShortcutHandlers`, `useCalendarShortcuts`
- **useCalendarState.ts** — Lo que se puede ver a solas en la rejilla: las ausencias (vacaciones, incapacidades) o los bloqueos. · `TimeOffKind`, `TIME_OFF_KINDS`, `TimeOffShown`, `toDateKey`, `fromDateKey`, `useCalendarState`
- **weekModel.ts** — Las cuentas de la vista Semana, sin interfaz. · `WEEK_DAYS`, `weekStartOf`, `WeekCell`, `weekCell`

### calendar/appointmentPanel

- **AfterVisit.tsx** — La cita ya cerrada —cobrada, o que no se atendió—. · `AfterVisitProps`, `AfterVisit` · piezas: Button, IconTile, Popover, PopoverAnchor, PopoverContent, Text, formatClock · usa: @/app/i18n, @/features/access, @/icons, @/lib/api, @/lib/utils
- **AppointmentFields.tsx** · `AppointmentFieldsProps`, `AppointmentFields` · piezas: Button, SelectableRow, Text, TimeSlotPicker, calendarLocale, formatClock · usa: @/app/i18n, @/i18n
- **BarberRequest.tsx** — «Comentarios y foto del corte»: lo que llega con la cita para el barbero, como una tarjeta más de la cita, de… · `BarberRequestProps`, `BarberRequestField` · piezas: Button, Field, Text, Textarea · usa: @/app/i18n, @/features/booking, @/icons
- **CareAlerts.tsx** · `CareAlerts` · piezas: Text, Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n, @/lib/utils
- **ClientField.tsx** · `ClientFieldProps`, `ClientField` · piezas: Button, Input, SelectableRow, Text · usa: @/app/i18n, @/i18n, @/icons
- **ClientPage.tsx** — La fila del cliente: tipo, visita de la membresía y ritmo; lleva a su página. · `ClientSummaryRow`, `Fact`, `ClientPageContent` · piezas: Button, ProgressRing, Stepper, Text · usa: @/app/i18n, @/i18n
- **ConfirmationBadge.tsx** · `ConfirmationBadge` · piezas: StatusBadge, Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n
- **HistoryTimeline.tsx** — La visita contada con horas reales: lo hecho, lo que va ahora y lo que falta. · `HistoryTimeline` · piezas: Text, Timeline, TimelineItem, formatClock · usa: @/app/i18n, @/i18n
- **NextVisitBooker.tsx** · `NextVisitBooker` · piezas: Button, SegmentedControl, Switch, Text, TimeSlotPicker, calendarLocale, formatClock · usa: @/app/i18n, @/features/booking, @/i18n, @/icons, @/lib/api
- **PanelBody.tsx** — El cuerpo del panel de una cita («Tarjeta + Arma la cita», la que eligió el usuario el 2026-10-18; las demás… · `PanelBodyProps`, `PanelPage`, `AppointmentPanelBody` · piezas: Popover, PopoverAnchor, PopoverContent · usa: @/app/i18n, @/lib/utils
- **PanelParts.tsx** — Las piezas del panel de una cita: las etiquetas del cliente, las alertas, la membresía, las fotos del corte y… · `ClientTags`, `CriticalAlerts`, `LoyaltyStrip`, `ReferencePhotos`, `ActionButtonProps`, `ActionButton`, `MenuExtra`, `MoreActionsMenu` · piezas: Alert, AlertDescription, AlertTitle, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, ProgressRing, Tag, Text · usa: @/app/i18n, @/lib/utils
- **PanelShared.tsx** — El avance arriba (como en el panel de siempre) con la hora real de cada paso, y el bloque de las citas enlaza… · `PanelStepper`, `LinkedField`, `LinkPickerField` · piezas: Button, Stepper, formatClock · usa: @/app/i18n, @/icons
- **PinSeries.tsx** · `PinSeries` · piezas: Alert, AlertDescription, AlertTitle, Button, Text, calendarLocale, formatClock · usa: @/app/i18n, @/i18n, @/icons, @/lib/api, @/lib/utils
- **RefundPage.tsx** · `RefundPage` · piezas: Button, Field, Input, NumberField, SegmentedControl, SelectableRow, Text · usa: @/app/i18n, @/lib/api
- **SendReceiptPage.tsx** — Enviar el recibo, como una página del panel: lo cobrado línea por línea en el texto, y Correo y SMS para marc… · `SendReceiptPage` · piezas: calendarLocale · usa: @/app/i18n, @/i18n
- **SendToClient.tsx** — Mandarle al cliente su recibo o el enlace para reagendar, como el recibo de la reserva en línea: Correo y SMS… · `SendToClientProps`, `SendToClient` · piezas: Button, Field, Input, PhoneInput, Spinner, Text · usa: @/app/i18n, @/features/booking, @/icons, @/lib/api
- **SourceLine.tsx** — De dónde salió la cita y cuándo: «Reservó en línea hace 2 días». · `SourceLine` · piezas: Text, calendarLocale · usa: @/app/i18n, @/i18n, @/icons
- **StageParts.tsx** — El titular del momento y su línea: «Va 12 min tarde · Llámalo o escríbele». · `StageHeading`, `TicketSummary`, `PanelHeaderActions`, `QuickTilesProps`, `Tile`, `QuickTiles`, `TileRow` · piezas: Button, ClipperIcon, Heading, Popover, PopoverContent, PopoverTrigger, Text, Tooltip, TooltipContent, TooltipTrigger, formatClock · usa: @/app/i18n, @/features/booking, @/icons, @/lib/utils
- **StatusConfirm.tsx** — Confirmar que se cancela la cita o que no asistió, en un popover junto al botón que lo pidió: un modal encima… · `ClosingAction`, `ConfirmContent`, `StatusConfirmContent`, `VoidSaleContent` · piezas: Button, Input, PopoverDescription, PopoverHeader, PopoverTitle · usa: @/app/i18n, @/lib/api
- **WriteMenu.tsx** — El menú de canales bajo lo que lo abre (un atajo o un botón). · `LinkMenu` · piezas: DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
- **appointmentAgent.ts** — El foco que el panel de una cita le pasa a Clipper al abrirlo. · `topicOf`, `AppointmentAgentInput`, `appointmentAgentFocus` · piezas: formatClock · usa: @/app/i18n, @/lib/chat
- **bookingStyle.tsx** — El campo de la reserva: foto, nombre del campo, lo elegido y un detalle; abre su lista. · `PanelFieldProps`, `PanelField`, `InlineList`, `PanelQuestion`, `NavRow`, `PanelSubpage`, `NavRowLink` · piezas: ActionTile, Button, Heading, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **confirmation.ts** — Si el cliente confirmó que viene, en una palabra para el badge junto al título de la cita, y cómo (para su to… · `ConfirmationKind`, `ConfirmationState`, `confirmationOf` · usa: @/app/i18n
- **panelHooks.ts** — Abre el panel de Clipper hablando de esta cita y este cliente. · `useAskClipper`, `PanelPages`, `usePanelPages` · usa: @/app/i18n, @/i18n, @/lib/chat
- **panelLogic.ts** — Las etiquetas que van pegadas al nombre (SevenRooms, Mariana Tek): las que se calculan solas a partir de dato… · `TagTone`, `ClientTag`, `clientTags`, `clockRelation`, `previousStatus`, `restActions`, `mainAction`, `QuickId`, `quickActions`, `showsRequest`, `StageTitle`, `stageTitle`, `TRACK`, `trackIndexOf`, `isClosed` · usa: @/app/i18n
- **pinPlan.ts** — Una fecha: la misma hora si está libre; si no, la más cercana (a igual distancia, la más temprana). · `PinStop`, `pinDates`, `planStop`, `bookableStops` · piezas: isWorkingAt, minutesOfDay
- **sendTarget.ts** — A quién se manda algo desde el panel: la cita (donde queda el mensaje) y su correo y celular, ya puestos y ed… · `SendTarget`, `targetOf`
- **useAppointmentModel.ts** — Lo que todas las versiones del panel de una cita saben de ella: quién es, qué se hace, cuánto vale, qué alert… · `AppointmentHandlers`, `LOYALTY_EVERY`, `AppointmentModel`, `WriteDraft`, `WriteLink`, `StepTimes`, `useAppointmentModel` · piezas: formatClock · usa: @/app/i18n
- **useFreeSlots.ts** — Las horas libres de un barbero en un día, para el selector de día y hora: pide la agenda de ese día y apaga l… · `FreeSlots`, `useFreeSlots` · piezas: isWorkingAt, minutesOfDay
- **writeChannels.tsx** — Por dónde escribirle al cliente: SMS si hay celular, correo si lo dejó. · `MenuLink`, `writeMenu` · usa: @/app/i18n

### calendar/appointmentTabs

- **AppointmentLinkSection.tsx** — Lo que el panel de una cita necesita para sus citas enlazadas. · `AppointmentLinkProps`, `AppointmentLinkSectionProps`, `AppointmentLinkSection`, `LinkPickerProps`, `LinkPicker` · piezas: Button, ListItem, ListItemGroup, SearchableSelect, Text · usa: @/app/i18n
- **AppointmentMessages.tsx** — Lo que se habló con el cliente sobre la cita, como una tarjeta más: lo que respondió al mensaje y los mensaje… · `AppointmentMessagesProps`, `AppointmentMessages` · piezas: Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Text, Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n, @/i18n, @/lib/api
- **AppointmentNotesTab.tsx** — Notas: las del cliente filtradas por tipo —Notas, Medicamento, Alergias— con chips y su contador, el formular… · `AppointmentNotesTabProps`, `AppointmentNotesTab` · piezas: Button, DrawerSection, EmptyState, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea · usa: @/app/i18n, @/lib/api

### calendar/checkout

- **BillSection.tsx** — Vender una tarjeta de regalo en el mismo cobro: el monto y para quién (le llega el código). · `BillSection`, `GiftSaleField`, `DiscountField` · piezas: ActionTile, Button, Chip, Field, IconTile, Input, ListItem, ListItemGroup, NumberField, SearchableSelect, SegmentedControl, Text
- **PaySection.tsx** — «¿Cómo paga?», con las tarjetas del panel de la cita: una por forma de pago, con lo que se sabe de ella debaj… · `PayPage`, `PayMethods`, `PayPageContent` · piezas: Alert, AlertDescription, Button, Chip, Field, IconTile, Input, NumberField, OptionTile, SegmentedControl, Text · usa: @/icons, @/lib/utils
- **allocate.ts** — Reparte `parts` entre cuentas de `dues` (lo que cobra cada cita). · `AllocatedPayment`, `allocateParts`, `paymentOf`
- **useCheckout.ts** — Cómo paga: los métodos de siempre más «en partes» (cada parte con el suyo). · `PayChoice`, `DiscountType`, `GiftSaleDraft`, `UseCheckoutOptions`, `useCheckout`, `CheckoutController` · usa: @/app/i18n, @/features/settings, @/lib/api

### calendar/clientNotes

- **ClientNotes.tsx** — Las notas de un cliente, iguales en la cita y en su ficha: el filtro por tipo (chips con su contador) y la li… · `MIN_NOTE_LENGTH`, `NoteKindChipsProps`, `NoteKindChips`, `ClientNoteListProps`, `ClientNoteList` · piezas: Button, Chip, ConfirmDialog, Field, RowActionsMenu, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea · usa: @/app/i18n, @/i18n, @/lib/api

### calendar/dayPanel

- **DayPanel.tsx** — El día de un vistazo, en el panel de la derecha, sin dejar la Semana o el Mes: si suele ser pesado o suave, c… · `DayPanelProps`, `DayPanel` · piezas: Button, Progress, SidePanelShell, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Text · usa: @/app/i18n, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **DayPanelLists.tsx** · `DayAppointments`, `DayClients`, `DayBlocks`, `DayAbsences` · piezas: Button, EmptyState, IconTile, ListItem, ListItemGroup, StatusBadge, atMinutes, formatClockRange, parseClock · usa: @/app/i18n, @/features/team
- **dayPanelModel.ts** — Lo que el panel del día cuenta, sin interfaz. · `DayClient`, `clientsOf`

### calendar/timeOff

- **TimeOffDrawer.tsx** — Las ausencias y los bloqueos del equipo en un panel junto a la agenda, como los huecos: arriba lo que falta a… · `TimeOffFocus`, `TimeOffDrawerProps`, `TimeOffDrawer` · piezas: Button, Chip, DateRangePicker, EmptyState, Field, IconTile, Input, ListItem, ListItemGroup, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, StatusBadge, Text, calendarLocale · usa: @/app/i18n, @/features/team, @/i18n, @/lib/api
- **TimeOffReview.tsx** — Un bloqueo que puso un barbero y espera aprobación: qué, cuándo y quién lo pidió. · `AbsenceReview`, `BlockReview` · piezas: Alert, AlertDescription, Button, Heading, IconTile, Input, ListItem, ListItemGroup, StatusBadge, Text, calendarLocale · usa: @/app/i18n, @/features/team, @/i18n, @/lib/api
- **timeOffModel.ts** — Una ausencia como la ve la agenda (la de Equipo trae más campos). · `TimeOffAbsence`, `daysOf`, `DayCoverage`, `coverageFor`, `isShortHanded`, `ABSENCE_BLOCK_PREFIX`, `isAbsenceBlock`, `blockAppliesOn`

### catalog

- **CatalogPhotoField.tsx** — La foto de una ficha del catálogo —un servicio, un producto—: la miniatura como se verá en la lista, el botón… · `CatalogPhotoFieldProps`, `CatalogPhotoField` · piezas: Button, Field, IconTile, ImageCropDialog · usa: @/app/i18n
- **CategoriesDrawer.tsx** — Las categorías de un catálogo —servicios, productos— en un solo panel: la lista con cuántos registros tiene c… · `CategoryVisibility`, `CatalogCategory`, `CategoryDraft`, `CategoriesDrawerMessages`, `CategoriesDrawerProps`, `CategoriesDrawer` · piezas: Button, ConfirmDialog, DrawerShell, Field, Input, ListItem, Switch, Text, Textarea · usa: @/lib/api
- **catalogAccess.ts** — Qué deja hacer el rol con un catálogo —servicios o productos— y si ve sus cifras de negocio. · `CatalogKind`, `CatalogAccess`, `catalogAccess` · usa: @/features/access

### clipper

- **clipperBackend.ts** — Clipper con modelo detrás del chat. · `ClipperBackendContext`, `ClipperBackendOptions`, `sendClipperFeedback`, `resetClipperAvailability`, `toModelMessages`, `createClipperBackend` · usa: @/lib/api, @/lib/chat
- **proposals.ts** — Las propuestas de Clipper (docs/API_CONTRACT.md, «Clipper»): mover, crear o cancelar una cita, bloquear un ra… · `Translate`, `ProposalContext`, `Proposer`, `ProposalError`, `PROPOSERS`, `ProposalName`, `isProposalName`, `proposalSummary`, `runClipperAction` · usa: @/app/i18n, @/features/calendar, @/i18n, @/lib/chat
- **tools.ts** — Lo que hace cada herramienta de Clipper (el catálogo está en `src/lib/clipper/toolCatalog.ts`). · `ClipperToolContext`, `weekOf`, `TOOL_LABEL_KEYS`, `isToolName`, `runClipperTool` · llama: GET /reports/week, GET /customers/${id}/next-visit, GET /customers/reactivation, GET /reports/menu, GET /team/lineup/turn · usa: @/features/calendar, @/features/customers, @/features/payroll, @/features/review, @/features/transactions, @/help/content, @/lib/api, @/lib/chat, @/lib/clipper, @/lib/help

### clipper/evals

- **questions.ts** — El conjunto de evaluación de Clipper (informe 11, P0 «Evaluaciones y registro»): preguntas como las hace el e… · `EvalVariant`, `EvalExpect`, `EvalQuestion`, `CLIPPER_EVALS` · usa: @/lib/clipper

### customers

- **CustomerFormDrawer.tsx** — Crear o editar un cliente sin salir de donde se está. · `CustomerFormDrawerProps`, `CustomerFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, PhoneInput, Switch, Text · usa: @/app/i18n, @/lib/api, @/lib/utils
- **CustomerHistoryTabs.tsx** · `CustomerAppointmentsTab`, `CustomerPaymentsTab`, `CustomerProductsTab`, `CustomerGuestsTab` · piezas: Badge, Button, ConfirmDialog, DrawerShell, EmptyState, Field, IconTile, Input, ListItem, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell · usa: @/app/i18n, @/i18n, @/lib/api
- **CustomerImportDrawer.tsx** — Traer los clientes de otro software sin pedírselos a soporte: se sube el CSV, se revisa qué columna es cada d… · `CustomerImportDrawerProps`, `CustomerImportDrawer` · piezas: Alert, AlertDescription, Button, DrawerShell, Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/lib/api, @/lib/csvParse
- **CustomerNextVisit.tsx** — Cuándo le toca volver según su frecuencia, y los huecos reales con su barbero (a su hora de siempre) para age… · `CustomerNextVisit` · piezas: Button, Skeleton, Text · usa: @/app/i18n, @/features/team, @/i18n
- **CustomerNoteDrawer.tsx** — Una nota nueva del cliente: qué tipo es —una alergia no se lee igual que una preferencia— y el texto. · `CustomerNoteDrawerProps`, `CustomerNoteDrawer` · piezas: Alert, AlertDescription, Button, DrawerShell, Field, Textarea, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api
- **CustomerOverview.tsx** — El resumen de un cliente: lo que hay que saber antes de atenderle arriba —alergias y medicamentos—, cuánto va… · `CustomerOverviewProps`, `CustomerOverview` · piezas: Alert, AlertDescription, AlertTitle, Button, MetricCard, StatusBadge, Text · usa: @/app/i18n, @/features/calendar, @/features/team, @/i18n
- **CustomerPrivacy.tsx** — Los datos del cliente y sus derechos, en su ficha: el permiso aparte para anotar alergias y medicamentos (dat… · `CustomerPrivacy`, `RequestItem` · piezas: Badge, Button, ConfirmDialog, Field, ModalShell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea · usa: @/app/i18n, @/features/legal, @/features/team, @/i18n, @/lib/api
- **CustomerProfilePage.tsx** · `CustomerProfilePage` · piezas: Alert, AlertDescription, AlertTitle, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api, @/lib/query
- **CustomerRelationship.tsx** — Lo que el cliente tiene a su favor: cuánto le falta para la cortesía de la membresía, sus paquetes, el saldo… · `CustomerWallet`, `CustomerContactLog` · piezas: Badge, Button, ConfirmDialog, ProgressRing, Skeleton, Text · usa: @/app/i18n, @/features/calendar, @/features/legal, @/features/team, @/i18n, @/lib/api
- **CustomerWhatsAppDialog.tsx** — Escribirle a un cliente por WhatsApp sin copiar ni pegar: se elige para qué, se ajusta el texto y se abre Wha… · `CustomerWhatsAppDialogProps`, `CustomerWhatsAppDialog` · piezas: Alert, AlertDescription, Button, Field, ModalShell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/i18n, @/lib/api
- **CustomersPage.tsx** — La lista de clientes. · `CustomersPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/api, @/lib/query
- **PrivacyRequestsDrawer.tsx** — Todas las solicitudes de datos de la barbería, las abiertas primero: qué pidió cada cliente y hasta cuándo ha… · `PrivacyRequestsDrawer` · piezas: DrawerShell, Skeleton, Text, ThemaTabs · usa: @/app/i18n
- **ReactivationDrawer.tsx** — Reactivar a los que ya se pasaron de su ritmo. · `ReactivationDrawerProps`, `ReactivationDrawer` · piezas: Alert, AlertDescription, Button, Checkbox, DrawerShell, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de clientes; ver docs/API_CONTRACT.md. · `customersApi` · llama: GET /customers, GET /customers/${id}, POST /customers, PATCH /customers/${id}, DELETE /customers/${id}, POST /clients/${id}/notes, POST /customers/${id}/guests, DELETE /customers/${id}/guests/${guestId} · usa: @/features/calendar, @/lib/api
- **customerAccess.ts** — Si quien mira puede ver a ese cliente: todo, o solo los suyos. · `isOwnCustomer`, `canSeeCustomer`, `CustomerPermissions`, `customerPermissions`, `useCustomerPermissions` · usa: @/features/access
- **customerActions.tsx** — Las acciones de la lista; cada una aparece solo si su casilla de la matriz está marcada. · `CustomerListHandlers`, `customerListActions` · usa: @/app/i18n
- **customersHome.tsx** — Qué columnas existen según quién mira (ver `customerAccess.ts`). · `ALL_SEGMENTS`, `SegmentFilter`, `parseSegment`, `countBySegment`, `CustomerColumnOptions`, `customerColumns`, `CustomerCellFormatters`, `customerCells`, `customersCsvRows`, `CustomerAlertId`, `CustomerAlertPreset`, `BIRTHDAY_WINDOW_DAYS`, `UNRELIABLE_MISSES`, `CUSTOMER_ALERTS`, `CustomerPulse`, `customerPulse` · piezas: Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n
- **customersShared.tsx** — Las piezas chicas del módulo de clientes: el segmento con su color y su icono, y el avatar. · `SegmentBadge`, `CustomerAvatar` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, initialsOf · usa: @/app/i18n
- **customersUtils.ts** — Un color por momento de la relación: del más valioso al que ya no está. · `SEGMENT_STYLE`, `APPOINTMENT_STATUS_BADGE`, `branchName`, `daysSince`, `maskPhone`, `daysToBirthday`, `formatAgo`, `downloadCsv` · usa: @/features/branches, @/features/payroll
- **importApi.ts** · `ImportReason`, `ImportResult`, `useImportCustomers`, `useUndoImport` · llama: POST /customers/import, DELETE /customers/import/${batchId} · usa: @/lib/api
- **importColumns.ts** — Qué columna del archivo es cada dato: se adivina por el nombre de la cabecera (en español o inglés, con o sin… · `IMPORT_FIELDS`, `ImportField`, `ColumnMap`, `guessColumns`, `toIsoDate`, `ImportRow`, `rowsFrom`
- **overdue.ts** · `OverdueFacts`, `isOverdue`
- **privacy.ts** — Los derechos del cliente sobre sus datos (docs/API_CONTRACT.md, «Clientes › Datos y privacidad»): la copia de… · `PRIVACY_REQUEST_TYPES`, `PRIVACY_CHANNELS`, `PrivacyRequestType`, `PrivacyChannel`, `PRIVACY_TYPE_KEYS`, `PRIVACY_CHANNEL_KEYS`, `privacyRequestSchema`, `PrivacyRequest`, `privacyApi`, `usePrivacyRequests`, `useLogPrivacyRequest`, `useClosePrivacyRequest`, `downloadJson`, `useExportCustomerData`, `useEraseCustomer` · llama: GET /privacy-requests${query ? `?${query}` : ""}, POST /customers/${clientId}/privacy-requests, POST /privacy-requests/${id}/done, GET /customers/${clientId}/export?channel=${channel}, POST /customers/${clientId}/erase · usa: @/lib/api
- **queries.ts** · `customerKeys`, `useCustomersQuery`, `useCustomerQuery`, `useCreateCustomer`, `useUpdateCustomer`, `useSetCustomerBlocked`, `useDeleteCustomer`, `useAddCustomerNote`, `useAddGuest`, `useRemoveGuest` · usa: @/features/calendar
- **relationship.ts** — Volver y cumpleaños son promoción: piden el permiso del cliente. · `relationshipSchema`, `CustomerRelationship`, `MarketingConsent`, `HealthConsent`, `MESSAGE_PURPOSES`, `MessagePurpose`, `isPromotional`, `whatsappLink`, `relationshipApi`, `useCustomerRelationship`, `useLogMessage`, `useSetMarketingConsent`, `useSetHealthConsent` · llama: GET /customers/${id}/relationship, POST /customers/${id}/messages, PATCH /customers/${id}/consent · usa: @/features/calendar, @/lib/api
- **rhythm.ts** — Se le puede escribir: aceptó promociones, no se le escribió hace poco, tiene celular y hay hueco que ofrecer. · `NextVisit`, `ReactivationCandidate`, `skipReasonSchema`, `SkipReason`, `canReactivate`, `useNextVisit`, `useReactivationCandidates`, `useApproveReactivation` · llama: GET /customers/${customerId}/next-visit, GET /customers/reactivation, POST /customers/reactivation · usa: @/lib/api
- **types.ts** — En qué momento de la relación está un cliente. · `customerSegmentSchema`, `CustomerSegment`, `customerSchema`, `Customer`, `customersResponseSchema`, `CustomersResponse`, `customerAppointmentStatusSchema`, `CustomerAppointmentStatus`, `customerAppointmentSchema`, `CustomerAppointment`, `customerPaymentSchema`, `CustomerPayment`, `customerGuestSchema`, `CustomerGuest`, `customerProductSchema`, `CustomerProduct`, `customerDetailSchema`, `CustomerDetail`, `customerInputSchema`, `CustomerInput`, `EMPTY_CUSTOMER_INPUT`, `GuestInput`, `SEGMENT_KEYS`, `SEGMENT_HINT_KEYS`, `APPOINTMENT_STATUS_KEYS`, `APPOINTMENT_SOURCE_KEYS`, `PAYMENT_METHOD_KEYS`, `splitName`, `inputFromDetail` · usa: @/app/i18n, @/features/calendar
- **whatsappTemplates.ts** — El texto de partida para cada propósito; «libre» arranca con el saludo. · `PURPOSE_KEYS`, `TemplateContext`, `templateBody` · usa: @/app/i18n

### dashboard

- **DashboardPage.tsx** — El home, como plantilla. · `DashboardPage` · piezas: AttentionAction, AttentionStrip, Badge, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, TemplateCatalogDrawer, TemplateTile, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **api.ts** · `dashboardApi` · llama: GET /dashboard/summary · usa: @/lib/api
- **homeTemplate.tsx** — Los datos de la plantilla del home. · `ProcessStatus`, `ProcessRow`, `PROCESS_ROWS`, `offsetToDate`, `formatRowDate`, `STATUS_KEYS`, `processColumns`, `processCells`, `buildTemplates`, `buildTemplateGroups`, `PulseMetric`, `PULSE_METRICS`, `AlertId`, `AlertPreset`, `CLOSING_SOON_DAYS`, `ALERT_PRESETS` · piezas: Progress, StatusBadge · usa: @/app/i18n
- **queries.ts** · `dashboardKeys`, `useDashboardSummary`
- **types.ts** · `dashboardSummarySchema`, `DashboardSummary`

### expenses

- **ExpenseFormDrawer.tsx** — Registrar o editar un gasto sin salir de la lista. · `ExpenseFormDrawerProps`, `ExpenseFormDrawer` · piezas: Alert, AlertDescription, Button, CardSelection, DrawerShell, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/features/calendar, @/lib/api
- **ExpensesPage.tsx** — Los gastos de la sucursal. · `ExpensesPage` · piezas: Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/api, @/lib/csv, @/lib/query
- **IncomeStatementView.tsx** — ¿Cuánto me gané? El mes de la sucursal en un estado de resultados —lo que entró, lo que costó ganarlo y lo fi… · `IncomeStatementViewProps`, `IncomeStatementView` · piezas: Button, MetricCard, Progress, Skeleton, Text · usa: @/app/i18n, @/features/calendar, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **api.ts** — Contrato de gastos; ver docs/API_CONTRACT.md. · `expensesApi` · llama: GET /expenses, POST /expenses, PATCH /expenses/${id}, DELETE /expenses/${id}, POST /expenses/${id}/end · usa: @/lib/api
- **expensesHome.tsx** — La categoría de la URL, si es una de las conocidas. · `ALL`, `KindFilter`, `parseKind`, `parseCategory`, `expensesCsvRows`, `expenseColumns`, `ExpenseCellContext`, `expenseCells` · piezas: Badge · usa: @/app/i18n
- **expensesShared.tsx** — Las piezas chicas del módulo de gastos: el icono y la insignia por tipo. · `ExpenseGlyph`, `ExpenseKindBadge` · piezas: Badge, IconTile · usa: @/app/i18n
- **expensesUtils.ts** — Cuántas veces al año se paga cada frecuencia. · `PAYMENTS_PER_YEAR`, `monthlyEquivalent`, `ExpensesSummary`, `summarizeExpenses`
- **income.ts** — El estado de resultados del mes de una sucursal y su punto de equilibrio. · `incomeStatementSchema`, `IncomeStatement`, `monthKey`, `shiftMonth`, `changePercent`, `useIncomeStatement` · llama: GET /reports/income?branchId=${encodeURIComponent(branchId)}&month=${month} · usa: @/lib/api
- **queries.ts** — `ownerMemberId`: los gastos de ese barbero de renta; `null`, los de la sucursal. · `expenseKeys`, `useExpensesQuery`, `useCreateExpense`, `useUpdateExpense`, `useEndExpense`, `useRemoveExpense`
- **types.ts** — Un gasto fijo se repite con una frecuencia; uno variable pasó una vez. · `expenseKindSchema`, `ExpenseKind`, `expenseFrequencySchema`, `ExpenseFrequency`, `expenseCategorySchema`, `ExpenseCategory`, `expensePaymentMethodSchema`, `ExpensePaymentMethod`, `expenseAttachmentSchema`, `ExpenseAttachment`, `MAX_EXPENSE_ATTACHMENTS`, `expenseSchema`, `Expense`, `expensesResponseSchema`, `ExpensesResponse`, `expenseInputSchema`, `ExpenseInput`, `expenseDateOf`, `isEnded`, `emptyExpenseInput`, `inputFromExpense`, `CATEGORY_KEYS`, `PAYMENT_METHOD_KEYS`, `EXPENSE_KIND_KEYS`, `FREQUENCY_KEYS` · usa: @/app/i18n

### feedback

- **FeedbackHost.tsx** — Monta la campaña activa sobre la app: añade a cada comentario la campaña, la página y la persona, y lo envía… · `FeedbackHostProps`, `FeedbackHost` · piezas: FeedbackCampaign, FeedbackDialog, publishProcess, updateProcess · usa: @/app/i18n, @/features/auth, @/lib/api
- **api.ts** — `POST /feedback`: en producción lo atiende la función de servidor `api/feedback` (guarda el comentario en la… · `feedbackApi` · llama: POST /feedback, POST /feedback/attachments · usa: @/lib/api
- **buildSubmission.ts** — Arma la fila que se envía: lo que escribió la persona más lo que la app ya sabe (campaña, página, quién). · `SubmissionContext`, `buildSubmission`
- **campaignRegistry.ts** — Las campañas de feedback, como datos planos: sin React, sin alias `@/` y sin nada del navegador, porque las l… · `CampaignSection`, `CampaignDefinition`, `REDESIGN_DEFINITION`, `ACTIVE_CAMPAIGN_DEFINITION`
- **campaigns.ts** — La campaña activa con su recorrido, o `null` si no se está escuchando. · `REDESIGN_CAMPAIGN`, `ACTIVE_FEEDBACK_CAMPAIGN` · piezas: FEEDBACK_LAUNCHER_TARGET
- **pageLabel.ts** — El rótulo de menú de la entrada activa, buscado en los tres niveles. · `findNavLabel`
- **queries.ts** · `useSubmitFeedback`
- **types.ts** — Largo máximo de un comentario; el panel corta ahí y el backend lo vuelve a comprobar. · `FEEDBACK_MAX_LENGTH`, `FEEDBACK_MIN_LENGTH`, `FEEDBACK_MAX_ATTACHMENTS`, `FEEDBACK_TYPES`, `FEEDBACK_NO_PAGE`, `FEEDBACK_ATTACHMENT_LIMITS`, `FeedbackAttachmentType`, `feedbackUploadRequestSchema`, `FeedbackUploadRequest`, `feedbackUploadTicketSchema`, `FeedbackUploadTicket`, `feedbackUploadedFileSchema`, `feedbackSubmissionSchema`, `FeedbackSubmission`, `feedbackReceiptSchema`, `FeedbackReceipt`

### frontDesk

- **KioskDevicesPanel.tsx** · `KioskDevicesPanel` · piezas: Badge, Button, Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/features/branches, @/i18n, @/lib/api
- **KioskPage.tsx** · `Pairing`, `KioskPage` · piezas: Button, Heading, Input, PhoneInput, Text · usa: @/app/i18n, @/i18n, @/lib/utils
- **TurnBoardPage.tsx** · `TurnBoardPage` · piezas: Heading, Text · usa: @/app/i18n, @/i18n
- **WalkInQueueDrawer.tsx** — La fila de quien llega sin cita, en recepción: quién espera, en qué orden, cuánto le falta (aprox.) y con qui… · `WalkInQueueDrawerProps`, `WalkInQueueDrawer` · piezas: Badge, Button, DrawerSection, EmptyState, Field, Input, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Text · usa: @/app/i18n, @/features/calendar, @/lib/api
- **api.ts** — Recepción para el equipo: los kioscos de cada sede (Configuración) y la fila de quien llega sin cita (Calenda… · `kioskDeviceSchema`, `KioskDevice`, `queueEntrySchema`, `QueueEntry`, `queueSchema`, `WalkInQueue`, `JoinQueueInput`, `frontDeskApi`, `useKioskDevices`, `useKioskDeviceActions`, `useWalkInQueue`, `useQueueActions` · llama: GET /front-desk/devices, POST /front-desk/devices, POST /front-desk/devices/${id}/code, DELETE /front-desk/devices/${id}, GET /front-desk/queue, POST /front-desk/queue, POST /front-desk/queue/${id}/call, POST /front-desk/queue/${id}/leave · usa: @/features/calendar, @/lib/api
- **kioskApi.ts** · `kioskToken`, `KioskError`, `KioskInfo`, `KioskAppointment`, `KioskCheckIn`, `KioskJoined`, `TurnBoard`, `kioskApi` · usa: @/lib/api

### legal

- **DpaCard.tsx** — El acuerdo de encargo de datos de la barbería: si se aceptó, quién, cuándo y qué versión; si hay una nueva, s… · `DpaCard` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/features/access, @/i18n, @/lib/api
- **LegalPage.tsx** · `LegalPage` · piezas: Alert, AlertDescription, Badge, BarberlyticsLogo, Heading, PageShell, Text · usa: @/app/i18n, @/i18n, @/lib/utils
- **acceptances.ts** · `acceptancesSchema`, `LegalAcceptances`, `useLegalAcceptances`, `useAcceptDpa` · llama: GET /legal/acceptances, POST /legal/dpa/accept · usa: @/lib/api
- **consent.ts** — Los textos del consentimiento según el país de la sucursal (docs/API_CONTRACT.md, «Clientes»). · `ConsentCountry`, `ConsentLocale`, `ConsentPack`, `consentCountryOf`, `consentPack`, `consentVersionOf`, `HEALTH_CONSENT_VERSION`, `HealthConsentTexts`, `healthConsentTexts`
- **sendWindow.ts** — Cuándo se puede mandar una promoción, a la hora del cliente (la de la sede). · `SendCountry`, `SendPlace`, `usHolidays`, `mexicanHolidays`, `colombianHolidays`, `isPromoAllowed`, `nextPromoSlot`, `promoWeek`
- **useConsentPack.ts** — El texto del consentimiento para una sucursal de la barbería (su país), en el idioma de la app. · `useBranchConsentPack`, `useHealthConsentTexts` · usa: @/features/settings, @/i18n

### legal/documents

- **dataPolicy.ts** · `DATA_POLICY`
- **dpa.ts** — Acuerdo de encargo de datos (DPA): la barbería es responsable (controller) de los datos de sus clientes y de… · `DPA`
- **index.ts** — Los documentos en el orden en que se listan. · `LEGAL_DOCS`, `legalDocBySlug`, `legalDoc`, `legalHref`, `legalVersion`
- **privacy.ts** — Política de privacidad de Barberlytics. · `PRIVACY`
- **subprocessors.ts** — Los subencargados: los proveedores que tratan datos para dar el servicio. · `SUBPROCESSORS`
- **terms.ts** — Términos de servicio: lo que acepta la barbería (y quien la administra) al registrarse. · `TERMS`
- **types.ts** — Los documentos legales de Barberlytics, como datos: cada uno con su versión (la que se guarda cuando alguien… · `LegalDocId`, `LegalLocale`, `LegalSection`, `LegalDoc`, `LEGAL_ENTITY`, `DRAFT_NOTICE`, `both`, `titled`

### metrics

- **MetricsFilters.tsx** — La fila de filtros del tablero: el periodo y el barbero. · `MetricsFilters` · piezas: PeriodNavigator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n, @/i18n
- **MetricsPage.tsx** — Métricas: cómo le fue a la barbería, en cinco pestañas. · `MetricsPage` · piezas: Breadcrumbs, PageHeader, ShellHeaderSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/onboarding, @/features/team, @/lib/query
- **WeekNarrative.tsx** — «Cómo te fue»: los últimos 7 días contados en palabras para el dueño, con las cifras a la vista. · `WeekNarrative` · llama: GET /reports/week · usa: @/app/i18n, @/features/calendar, @/features/narrative, @/i18n, @/lib/api
- **api.ts** · `metricsApi` · llama: GET /metrics/business, GET /metrics/customers, GET /metrics/barbers, GET /metrics/marketing, GET /metrics/insights · usa: @/lib/api
- **metricsFormat.ts** — Cómo se escriben las cifras del tablero, con la convención del idioma activo. · `MetricsFormatters`, `useMetricsFormatters` · usa: @/features/branches, @/i18n
- **queries.ts** · `metricsKeys`, `useBusinessMetrics`, `useCustomersMetrics`, `useBarbersMetrics`, `useMarketingMetrics`, `useInsightsMetrics`
- **types.ts** · `Compared`, `periodGranularitySchema`, `MetricsGranularity`, `incomeLineSchema`, `IncomeLine`, `appointmentStatusSchema`, `AppointmentStatus`, `bookingMethodSchema`, `BookingMethod`, `daypartSchema`, `Daypart`, `paymentMethodSchema`, `PaymentMethod`, `CatalogRow`, `metricsBusinessSchema`, `MetricsBusiness`, `clientTypeSchema`, `ClientType`, `visitFrequencySchema`, `VisitFrequency`, `metricsCustomersSchema`, `MetricsCustomers`, `metricsBarbersSchema`, `MetricsBarbers`, `metricsMarketingSchema`, `MetricsMarketing`, `suggestionGroupSchema`, `SuggestionGroup`, `suggestionTypeSchema`, `metricsInsightsSchema`, `MetricsInsights`, `MetricsParams`, `ALL_BARBERS`
- **useMetricsFilters.ts** — Las pestañas que ve cada rol (docs/roles/02-metricas-caja-nomina.md): - el barbero por comisión, como en prod… · `METRICS_TABS`, `MetricsTab`, `metricsTabsFor`, `useMetricsFilters` · piezas: fromIsoDate, toIsoDate · usa: @/features/access, @/features/team

### metrics/sections

- **AppointmentsSection.tsx** — Las citas del periodo: en qué acabaron, cómo se pagaron y por dónde entraron (tres repartos), y cuándo llegan… · `AppointmentsSection` · piezas: ChartCard, CompositionDonut, DistributionBar, useChartPalette · usa: @/app/i18n
- **CatalogSection.tsx** — Qué se vendió: servicios y productos, por unidades y con su importe al lado. · `CatalogSection` · piezas: BarList, EmptyState · usa: @/app/i18n
- **MetricsAlerts.tsx** — Lo que del periodo pide una mano: cobros abiertos, cancelaciones y no-shows. · `MetricsAlerts` · piezas: AttentionAction, AttentionStrip · usa: @/app/i18n
- **MetricsPulse.tsx** — Las cuatro lecturas de arriba: cuánto se vendió, a cuánto el ticket, cuántas citas y cuántas se perdieron. · `MetricsPulse` · piezas: MetricCard, MetricRing, SparklineChart, useChartPalette · usa: @/app/i18n
- **SalesSection.tsx** — Cuánto se vendió y de dónde salió: la serie del periodo a la izquierda y el desglose del ingreso a la derecha… · `SalesSection` · piezas: BarList, ChartCard, MetricCard, useChartPalette · usa: @/app/i18n

### metrics/tabs

- **BarbersDashboard.tsx** — Barberos: lo que ganó el equipo y cómo se reparte, con la ocupación, la cancelación y las propinas de cada un… · `BarbersDashboard` · piezas: BarList, MetricCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell · usa: @/app/i18n
- **CustomersDashboard.tsx** — Clientes: cuántos vuelven, cuánto deja cada uno, por dónde reservan y qué tipo de cliente llena la agenda. · `CustomersDashboard` · piezas: BarList, CompositionDonut, DistributionBar, MetricCard · usa: @/app/i18n
- **InsightsDashboard.tsx** — IA: un diagnóstico de los últimos tres meses. · `InsightsDashboard` · piezas: AIInsightCard, AttentionAction, AttentionStrip, Card, ClipperIcon, HeatmapMatrix, MetricCard, MetricDial, PanelHeading · usa: @/app/i18n
- **MarketingDashboard.tsx** — Marketing: por dónde llegan las reservas en línea (el `utm_source` con que se reservó cada cita), cuánto conv… · `MarketingDashboard` · piezas: BarList, EmptyState, MetricCard · usa: @/app/i18n

### narrative

- **NarrativeCard.tsx** — Un resumen en palabras de unas cifras, con las cifras a la vista para comprobarlo. · `NarrativeCardProps`, `NarrativeCard` · piezas: Skeleton, Text · usa: @/app/i18n, @/features/team, @/i18n
- **narrative.ts** — Hechos → narración en la app: las cifras ya calculadas van a `/api/narrative`, que las redacta con Claude sin… · `Fact`, `Facts`, `Narrative`, `useNarrative` · usa: @/lib/api

### onboarding

- **OnboardingChecklist.tsx** — Lo que le falta a la barbería para operar, en orden y con un toque a cada pantalla. · `OnboardingChecklist` · piezas: Button, Progress, Text · usa: @/app/i18n, @/features/team, @/lib/utils
- **onboarding.ts** — «Ocultar por ahora» es una preferencia del navegador; si falla el almacenamiento, se vuelve a ver. · `OnboardingStepId`, `Onboarding`, `STEP_KEYS`, `useOnboarding`, `readHidden`, `writeHidden` · llama: GET /onboarding · usa: @/app/i18n, @/lib/api

### payments

- **gateway.ts** — El número de prueba que el banco «rechaza» (como `4000 0000 0000 0002` en Stripe). · `DECLINED_TEST_CARD`, `SIMULATED_TOKEN`, `CardFields`, `CardToken`, `CardTokenInput`, `tokenizeCard`

### payroll

- **MyPayPage.tsx** — El pago del propio barbero, sobre la nómina recortada a su ficha: - «Lo que llevo» (comisión): cuánto lleva g… · `MyPayPage` · piezas: Alert, AlertDescription, AlertTitle, Breadcrumbs, Button, DataListBlock, EmptyState, ListItem, MetricCard, PageHeader, PeriodNavigator, ShellHeaderSlot, Skeleton · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **MyPayStatus.tsx** — ¿Ya me pagaron? El estado del periodo dicho al barbero (provisional, aprobado o pagado y con qué), y lo que m… · `MyPayStatusProps`, `MyPayStatus` · piezas: StatusBadge, Text · usa: @/app/i18n, @/features/team, @/i18n
- **PayNarrative.tsx** — «¿Por qué esta cifra?»: la nómina del barbero contada en palabras, con las mismas cifras que la página (lo qu… · `PayNarrative` · usa: @/app/i18n, @/features/narrative, @/i18n
- **PayrollAdjustments.tsx** — Lo que no sale de las citas: un bono, un descuento (un faltante de caja, producto que usó) o un adelanto que… · `PayrollAdjustmentsProps`, `PayrollAdjustments` · piezas: Button, Field, Input, NumberField, SegmentedControl, Text · usa: @/app/i18n, @/i18n
- **PayrollMemberDrawer.tsx** — Cómo se llega al pago de un barbero: su forma de pago y sus reglas, la cuenta —lo que suma y lo que resta— y… · `PayrollMemberDrawerProps`, `PayrollMemberDrawer` · piezas: Badge, Button, DrawerShell, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/i18n
- **PayrollPage.tsx** — La nómina del periodo: cuánto se le paga a cada barbero y cuánto le deben a la barbería los que rentan su pue… · `PayrollPage` · piezas: Breadcrumbs, Button, DataListBlock, ListItem, MetricCard, PageHeader, PeriodNavigator, ShellHeaderSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/csv, @/lib/query, @/lib/utils
- **PayrollRunBar.tsx** — El estado del periodo y lo siguiente que toca: abierto → aprobar; aprobado → marcar pagado (o reabrir con mot… · `PayrollRunBarProps`, `PayrollRunBar` · piezas: Button, Field, Input, ModalShell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge, Text, Textarea · usa: @/app/i18n, @/features/calendar, @/features/review, @/i18n
- **RentPayments.tsx** — Lo que el barbero de renta le entregó a la barbería en el periodo. · `RentPaymentsProps`, `RentPayments` · piezas: Button, Field, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/i18n
- **api.ts** — Contrato de nómina; ver docs/API_CONTRACT.md. · `payrollApi` · llama: GET /payroll, POST /payroll/adjustments, DELETE /payroll/adjustments/${id}, POST /payroll/runs, POST /payroll/runs/${id}/pay, POST /payroll/runs/${id}/reopen, POST /payroll/rent-payments, DELETE /payroll/rent-payments/${id} · usa: @/lib/api
- **myPayHome.tsx** · `myPayColumns`, `MyPayCellContext`, `myPayCells` · usa: @/app/i18n
- **payrollHome.tsx** — El valor numérico de una columna, para la tabla y para exportar. · `columnIdsFor`, `columnLabel`, `payrollColumns`, `columnValue`, `PayrollCellContext`, `payrollCells` · piezas: Avatar, AvatarFallback, AvatarImage, initialsOf · usa: @/app/i18n
- **payrollUtils.ts** — Las ayudas sin JSX de la nómina: el resumen y la exportación. · `PayrollSummary`, `summarizePayroll`, `countByPayout`
- **queries.ts** · `payrollKeys`, `usePayrollQuery`, `useAddAdjustment`, `useRemoveAdjustment`, `useApprovePayroll`, `usePayPayroll`, `useReopenPayroll`, `useAddRentPayment`, `useRemoveRentPayment` · usa: @/lib/api
- **types.ts** — Cómo se le paga a cada barbero: comisión por servicio, renta de su puesto o salario. · `payoutSchema`, `Payout`, `ruleSchema`, `CommissionRule`, `payrollLineSchema`, `PayrollLine`, `commissionRulesSchema`, `CommissionRules`, `adjustmentKindSchema`, `AdjustmentKind`, `adjustmentSchema`, `PayrollAdjustment`, `payrollMemberSchema`, `PayrollMember`, `runStatusSchema`, `RunStatus`, `payrollRunSchema`, `PayrollRun`, `payrollHistorySchema`, `payrollResponseSchema`, `PayrollResponse`, `PayrollParams`, `PAYOUT_KEYS`, `PAYOUT_HINT_KEYS`, `RULE_KEYS`, `AdjustmentInput`, `ADJUSTMENT_KEYS`, `PAY_METHODS`, `PayMethod`, `PAY_METHOD_KEYS`, `RentPaymentInput` · usa: @/app/i18n
- **usePayrollFilters.ts** — Lo que decide qué nómina se ve, en la URL: el periodo, la forma de pago y el barbero abierto en el panel. · `usePayrollFilters` · piezas: fromIsoDate, periodRange, toIsoDate · usa: @/features/settings

### products

- **InventoryView.tsx** — Las existencias de la sucursal. · `InventoryViewProps`, `InventoryView` · piezas: AttentionAction, AttentionStrip, DataListActionRail, DataListBlock, ListItem, ShellRailSlot, Skeleton · usa: @/app/i18n, @/features/customers, @/i18n, @/lib/query
- **ProductCategoriesDrawer.tsx** — Las categorías de productos: el panel compartido del catálogo, con sus textos y sus mutaciones. · `ProductCategoriesDrawerProps`, `ProductCategoriesDrawer` · usa: @/app/i18n, @/features/catalog
- **ProductFormDrawer.tsx** — Crear o editar un producto sin salir de la lista. · `ProductFormDrawerProps`, `ProductFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text, Textarea · usa: @/app/i18n, @/features/calendar, @/features/catalog, @/features/services, @/lib/api, @/lib/utils
- **ProductProfilePage.tsx** · `ProductProfilePage` · piezas: Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, MetricCard, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, Text · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/services, @/features/team, @/i18n, @/lib/api, @/lib/query
- **ProductsPage.tsx** — El catálogo de productos. · `ProductsPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **StockBadge.tsx** — Disponible, por reponer o agotado, con el tono de su estado. · `StockBadge` · piezas: Badge
- **StockHistoryDialog.tsx** — De dónde salen las existencias de un producto: cada venta, entrada, conteo y merma, con quién y cuándo. · `StockHistoryDialogProps`, `StockHistoryDialog` · piezas: Button, Field, Input, ModalShell, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/utils
- **StockMovementDialog.tsx** — Lo que mueve el inventario a mano: llegó mercancía, se contó la estantería, se dañó algo o se usó en la barbe… · `StockMovementDialogProps`, `StockMovementDialog` · piezas: Button, Field, Input, ModalShell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/lib/api
- **api.ts** — Contrato de productos; ver docs/API_CONTRACT.md. · `productsApi` · llama: GET /products, GET /products/${id}, POST /products, PATCH /products/${id}, DELETE /products/${id}, PUT /products/activation, POST /product-categories, PATCH /product-categories/${id}, DELETE /product-categories/${id} · usa: @/lib/api
- **inventory.ts** — El inventario ligero de una sucursal: existencias, mínimo, ritmo de venta y movimientos. · `stockStatusSchema`, `StockStatus`, `stockItemSchema`, `StockItem`, `Inventory`, `MANUAL_KINDS`, `ManualKind`, `StockReason`, `StockMovement`, `STOCK_STATUS_KEYS`, `STOCK_REASON_KEYS`, `inventoryApi`, `useInventory`, `useStockMovements`, `useMoveStock`, `useSetStockMin` · llama: GET /inventory?branchId=${encodeURIComponent(branchId)}, POST /inventory/movements, PATCH /inventory/${productId}, GET /inventory/${productId}/movements?branchId=${encodeURIComponent(branchId)} · usa: @/app/i18n, @/lib/api
- **inventoryHome.tsx** · `inventoryColumns`, `inventoryCells` · usa: @/app/i18n, @/lib/utils
- **productsHome.tsx** — La categoría de la URL, si existe; si no, todas. · `ALL`, `parseCategory`, `categoryName`, `profitOf`, `productColumns`, `ProductCellContext`, `productCells`, `ProductAlertId`, `ProductAlertPreset`, `PRODUCT_ALERTS`, `ProductsPulse`, `productsPulse` · usa: @/app/i18n, @/features/services
- **productsShared.tsx** — La foto del producto y, mientras no hay o no carga, el icono. · `ProductGlyph`, `ProductActiveBadge`, `SellableBadge`, `ProductVisibilityBadge` · piezas: Badge, IconTile, StatusBadge · usa: @/app/i18n
- **queries.ts** · `productKeys`, `useProductsQuery`, `useProductQuery`, `useCreateProduct`, `useUpdateProduct`, `useRemoveProduct`, `useSetProductsActive`, `useSaveProductCategory`, `useRemoveProductCategory`
- **types.ts** — La categoría a la que caen los productos cuando se borra la suya. · `productVisibilitySchema`, `ProductVisibility`, `productCategorySchema`, `ProductCategory`, `catalogProductSchema`, `CatalogProduct`, `productsCatalogSchema`, `ProductsCatalog`, `UNCATEGORIZED_PRODUCT_ID`, `productInputSchema`, `ProductInput`, `emptyProductInput`, `inputFromProduct`, `ProductCategoryInput`, `PRODUCT_VISIBILITY_KEYS` · usa: @/app/i18n

### review

- **ReviewFindings.tsx** — Lo que conviene mirar antes de aprobar o cerrar, de lo grave a lo informativo. · `ReviewFindingsProps`, `ReviewFindings` · piezas: Badge, Checkbox, Skeleton, Text · usa: @/app/i18n
- **review.ts** — Revisión antes de cerrar: lo raro de una nómina o de una caja frente al historial y a las reglas, para mirarl… · `findingSchema`, `Finding`, `Severity`, `reviewApi`, `usePayrollReview`, `useRegisterReview`, `needsAcknowledge`, `SEVERITY_KEYS`, `KIND_KEYS`, `MONEY_PARAMS`, `ADJUSTMENT_KIND_KEYS` · llama: GET /payroll/review?${new URLSearchParams(period)}, GET /register/review?${new URLSearchParams({ branchId, date })} · usa: @/app/i18n, @/lib/api

### sections

- **SectionPlaceholderPage.tsx** — Una sección del menú que todavía no tiene pantalla. · `SectionPlaceholderPageProps`, `SectionPlaceholderPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/icons

### services

- **CategoriesDrawer.tsx** — Las categorías de servicios: el panel compartido del catálogo, con sus textos y sus mutaciones. · `CategoriesDrawerProps`, `CategoriesDrawer` · usa: @/app/i18n, @/features/catalog
- **MenuEngineeringView.tsx** — Qué servicio deja más por cada hora de silla, con la agenda real: precio cobrado menos insumos y comisión, di… · `MenuEngineeringView` · piezas: Badge, MetricCard, SegmentedControl, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, Text · usa: @/app/i18n, @/features/calendar, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **ResourcesDrawer.tsx** — Los recursos especiales del local —un sillón de lavado, el vaporizador de toallas, una silla de color—: lo qu… · `ResourcesDrawerProps`, `ResourcesDrawer` · piezas: Button, ConfirmDialog, DrawerShell, EmptyState, Field, IconTile, Input, ListItem, MultiSelect, NumberField, Skeleton, Textarea · usa: @/app/i18n, @/lib/api, @/lib/query
- **ServiceFormDrawer.tsx** — Crear o editar un servicio —o un combo— sin salir de la lista. · `ServiceFormDrawerProps`, `ServiceFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, MultiSelect, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text, Textarea, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/features/catalog, @/lib/api, @/lib/utils
- **ServiceOrderPage.tsx** — El orden en que el cliente ve el catálogo al reservar en línea: primero las categorías y, dentro de cada una,… · `ServiceOrderPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, ShellRailSlot, Sortable, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/lib/api, @/lib/query
- **ServiceProfilePage.tsx** · `ServiceProfilePage` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, ListItem, MetricCard, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, Switch, Text, ThemaTabs, initialsOf · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **ServicesPage.tsx** — El catálogo de servicios. · `ServicesPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de servicios; ver docs/API_CONTRACT.md. · `servicesApi` · llama: GET /services, GET /services/${id}, POST /services, PATCH /services/${id}, DELETE /services/${id}, PUT /services/activation, PUT /services/${id}/team, PUT /services/order, POST /service-categories, PATCH /service-categories/${id}, DELETE /service-categories/${id}, GET /service-resources, POST /service-resources, PATCH /service-resources/${id}, DELETE /service-resources/${id} · usa: @/lib/api
- **menu.ts** — Margen por hora de silla y matriz del catálogo. · `quadrantSchema`, `Quadrant`, `MenuEngineering`, `MenuItem`, `QUADRANTS`, `QUADRANT_KEYS`, `useMenuEngineering` · llama: GET /reports/menu · usa: @/app/i18n, @/lib/api
- **queries.ts** — Los recursos especiales; también los lee la agenda para filtrar por ellos. · `serviceKeys`, `useResourcesQuery`, `useServicesQuery`, `useServiceQuery`, `useCreateService`, `useUpdateService`, `useRemoveService`, `useSetServicesActive`, `useSetServiceTeam`, `useSaveServiceOrder`, `useSaveCategory`, `useRemoveCategory`, `useSaveResource`, `useRemoveResource`
- **servicesHome.tsx** — La categoría de la URL, si existe; si no, todas. · `ALL`, `KindFilter`, `parseKind`, `parseCategory`, `serviceColumns`, `ServiceCellContext`, `serviceCells`, `ServiceAlertId`, `ServiceAlertPreset`, `SERVICE_ALERTS`, `ServicesPulse`, `servicesPulse` · piezas: Badge · usa: @/app/i18n
- **servicesShared.tsx** — La foto del servicio y, mientras no hay o no carga, el icono de su tipo. · `ServiceGlyph`, `ActiveBadge`, `VisibilityBadge` · piezas: Badge, IconTile, StatusBadge · usa: @/app/i18n
- **servicesUtils.ts** — Lo que queda del precio tras el costo, en porcentaje; `null` si no hay costo registrado o el precio es cero. · `marginOf`, `formatDuration`, `categoryName`, `comboTotals`, `groupByCategory`
- **types.ts** — Un recurso especial: algo del local que no es un barbero pero limita la agenda —un sillón de lavado, el vapor… · `serviceKindSchema`, `ServiceKind`, `visibilitySchema`, `Visibility`, `prepPositionSchema`, `PrepPosition`, `serviceCategorySchema`, `ServiceCategory`, `catalogServiceSchema`, `CatalogService`, `servicesCatalogSchema`, `ServicesCatalog`, `serviceTeamRowSchema`, `ServiceTeamRow`, `serviceDetailSchema`, `ServiceDetail`, `serviceResourceSchema`, `ServiceResource`, `serviceResourcesSchema`, `MAX_RESOURCE_UNITS`, `resourceInputSchema`, `ResourceInput`, `UNCATEGORIZED_ID`, `MIN_DURATION_MIN`, `MAX_DURATION_MIN`, `MAX_PREP_MIN`, `MIN_COMBO_SERVICES`, `serviceInputSchema`, `ServiceInput`, `emptyServiceInput`, `inputFromService`, `categoryInputSchema`, `CategoryInput`, `ServiceOrderInput`, `KIND_KEYS`, `VISIBILITY_KEYS` · usa: @/app/i18n

### settings

- **SettingsFormParts.tsx** — Las piezas que comparten todos los ajustes: la tarjeta de un bloque, la fila con interruptor, la barra de gua… · `SettingsCard`, `SwitchRowProps`, `SwitchRow`, `FieldErrors`, `SettingsDocumentContext`, `SettingsDocumentProps`, `SettingsDocument` · piezas: Button, SectionHeader, Skeleton, Switch, Text · usa: @/app/i18n, @/lib/api, @/lib/query, @/lib/utils
- **SettingsListParts.tsx** — Un ajuste que es una lista —sucursales, cierres, impuestos, datáfonos—: las filas, el alta y la edición en un… · `ListFormContext`, `SettingsListMessages`, `SettingsListProps`, `SettingsList` · piezas: Button, ConfirmDialog, DrawerShell, EmptyState, ListItem, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/query
- **SettingsPage.tsx** — Todo lo que se ajusta, en una sola pantalla. · `SettingsPage` · piezas: Breadcrumbs, IconTile, ListItem, ListItemGroup, PageHeader, SectionHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/access
- **SettingsSectionPage.tsx** — Un ajuste concreto. · `SettingsSectionPage` · piezas: Alert, AlertDescription, AlertTitle, Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/access, @/features/branding
- **gatewayProviders.ts** — Las pasarelas de pago que se pueden conectar y lo que cada una deja cobrar en la reserva en línea. · `GATEWAY_PROVIDERS`, `GatewayProvider`, `ONLINE_METHODS`, `OnlineMethod`, `GatewayProviderSpec`, `GATEWAY_SPECS`, `isGatewayProvider`, `keyLooksValid`, `keyPlaceholder`
- **personalPreferences.ts** — Las preferencias de cada persona, no de la empresa: por ahora, el formato de hora con el que ve su calendario… · `PersonalTimeFormat`, `readPersonalTimeFormat`, `writePersonalTimeFormat`, `usePersonalTimeFormat`
- **settingsApi.ts** — Contrato de configuración; ver docs/API_CONTRACT.md. · `settingsApi` · llama: GET /settings/${id}, PUT /settings/${id}, GET /settings/lists/${id}, POST /settings/lists/${id}, PATCH /settings/lists/${id}/${itemId}, DELETE /settings/lists/${id}/${itemId}, POST /settings/gateways/test, POST /account/delete · usa: @/lib/api
- **settingsCatalog.ts** — Lo que se puede hacer con un ajuste: cambiarlo o solo consultarlo. · `SettingsLevel`, `SETTINGS_BASE_PATH`, `settingsLevel`, `buildSettingsGroups`, `SETTINGS_ALL`, `findSettingsItem` · usa: @/app/i18n, @/features/access
- **settingsIcons.ts** — El icono y el color de cada ajuste. · `SETTINGS_ICONS`, `SETTINGS_GROUP_TONES`
- **settingsQueries.ts** — Un ajuste que es un solo documento. · `settingsKeys`, `useSettingsSection`, `useSaveSettingsSection`, `useSettingsList`, `useSettingsListMutations`
- **settingsTypes.ts** — Las formas de cada ajuste. · `SettingsSectionId`, `SettingsListId`, `businessSchema`, `BusinessSettings`, `bookingSchema`, `BookingSettings`, `pricingSchema`, `PricingSettings`, `tipOptionSchema`, `TipOption`, `tipsSchema`, `TipsSettings`, `cardFeeSchema`, `CardFeeSettings`, `gatewaySchema`, `Gateway`, `GatewayInput`, `paymentsTestSchema`, `commissionsSchema`, `CommissionSettings`, `payrollCycleSchema`, `PayrollCycleSettings`, `MAX_REMINDERS`, `DEFAULT_REMINDER_HOURS`, `notificationsSchema`, `NotificationSettings`, `companySchema`, `CompanySettings`, `billingSchema`, `BillingSettings`, `branchSchema`, `Branch`, `BranchInput`, `closureSchema`, `Closure`, `ClosureInput`, `taxGroupSchema`, `TaxGroup`, `TaxGroupInput`, `deviceSchema`, `Device`, `DeviceInput`, `CURRENCIES`

### settings/sections

- **BillingSettings.tsx** — Plan y facturación: qué plan tiene la barbería, a nombre de quién salen las facturas, con qué tarjeta se paga… · `BillingSettings` · piezas: Badge, Button, Field, IconTile, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/features/calendar, @/features/legal, @/i18n
- **BookingFunnelCard.tsx** — Cómo convierte la reserva en línea: de cuántos que abren el enlace, cuántos llegan a cada paso y reservan, dó… · `BookingFunnelCard` · piezas: Badge, Progress, Skeleton, Text · usa: @/app/i18n, @/features/booking, @/i18n
- **BookingSettings.tsx** — Reservas online, en dos vistas: las **reglas** —con cuánta anticipación se reserva, cuándo se puede cancelar,… · `BookingSettings` · piezas: Button, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea, ThemaTabs · usa: @/app/i18n, @/features/frontDesk
- **BranchesSettings.tsx** — Sucursales: los locales del negocio. · `BranchesSettings` · piezas: Field, IconTile, Input, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge, Textarea · usa: @/app/i18n, @/i18n
- **BusinessSettings.tsx** — Perfil del negocio: cómo se cuenta el tiempo —zona, formato, semana y horario— y dónde encuentra el cliente a… · `BusinessSettings` · piezas: Field, Input, MultiSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ThemaTabs · usa: @/app/i18n
- **CardFeeSettings.tsx** — Recargo por tarjeta: si se cobra, cómo se llama en el recibo y cuánto es —un porcentaje o un monto fijo—. · `CardFeeSettings` · piezas: Field, Input, NumberField, ThemaTabs · usa: @/app/i18n, @/features/calendar
- **ClosuresSettings.tsx** — Horarios y cierres: los días en que la barbería no atiende. · `ClosuresSettings` · piezas: Badge, Field, IconTile, Input, MultiSelect, Textarea · usa: @/app/i18n, @/features/branches, @/i18n
- **CommissionSettings.tsx** — Comisiones: qué se le resta al precio antes de calcular la comisión del barbero. · `CommissionSettings` · piezas: Text · usa: @/app/i18n, @/features/calendar
- **CompanySettings.tsx** — Datos legales: la empresa dueña de las sucursales, tal como sale en facturas y recibos. · `CompanySettings` · piezas: Field, Input, PhoneInput · usa: @/app/i18n
- **DeleteAccountSettings.tsx** — Eliminar cuenta. · `DeleteAccountSettings` · piezas: Alert, AlertDescription, AlertTitle, Button, Field, Input, ModalShell, Skeleton · usa: @/app/i18n, @/features/access, @/features/auth, @/lib/api, @/lib/query
- **DevicesSettings.tsx** — Datáfonos: las terminales que cobran en caja. · `DevicesSettings` · piezas: Badge, Field, IconTile, Input · usa: @/app/i18n
- **GatewaysSettings.tsx** — Pasarelas de pago: las cuentas con las que se cobra en línea. · `GatewaysSettings` · piezas: Alert, AlertDescription, Button, Field, IconTile, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge · usa: @/app/i18n, @/lib/api
- **LoginSettings.tsx** — Inicio de sesión: cómo entra cada persona. · `LoginSettings` · piezas: Badge, Button, ConfirmDialog, Field, IconTile, Input, InputOtp, Skeleton, StatusBadge, Text · usa: @/app/i18n, @/features/auth, @/lib/api, @/lib/query
- **NotificationSettings.tsx** — Recordatorios y avisos: a cada quien —dueño, administrador, recepción, barberos y clientes— qué se le avisa y… · `NotificationSettings` · piezas: Button, NumberField, Switch, Text, ThemaTabs · usa: @/app/i18n, @/icons/ThemaIcon
- **PayrollCycleSettings.tsx** — Ciclo de nómina: cada cuánto se le liquida al equipo y qué día arranca el ciclo. · `PayrollCycleSettings` · piezas: CardSelection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n
- **PersonalSettings.tsx** — Mis preferencias: lo que cada persona ajusta para sí y no toca a nadie más. · `PersonalSettings` · piezas: Field, ThemaTabs · usa: @/app/i18n
- **PricingSettings.tsx** — Precios y moneda: en qué moneda se cobra y si el precio que se escribe ya lleva el impuesto dentro. · `PricingSettings` · piezas: CardSelection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n
- **RolePermissionsSettings.tsx** — Permisos por rol: la matriz de fábrica con la que nace cada persona, una pestaña por rol, como en producción. · `RolePermissionsSettings` · piezas: ThemaTabs · usa: @/app/i18n, @/features/team
- **TaxesSettings.tsx** — Impuestos: los grupos de tasas que se aplican al cobrar. · `TaxesSettings` · piezas: Button, Field, IconTile, Input, NumberField, Text · usa: @/app/i18n
- **TipsSettings.tsx** — Propinas: las opciones que se ofrecen al cobrar, cuál sale marcada y qué ve el cajero. · `TipsSettings` · piezas: Button, CardSelection, Field, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, ThemaTabs · usa: @/app/i18n
- **bookingUtils.ts** — Las ayudas sin JSX de Reservas online: el enlace con seguimiento, la política con sus valores y el fragmento… · `UtmParams`, `buildBookingUrl`, `PolicyValues`, `renderPolicy`, `WidgetOptions`, `widgetSnippet`
- **notificationCatalog.ts** — El catálogo de avisos: a quién le llegan, de qué avisan y por qué canal. · `NotificationChannel`, `NotificationAudience`, `NotificationEvent`, `NotificationGroup`, `NOTIFICATION_CATALOG`, `AUDIENCES`, `toggleKey`, `thresholdKey`, `ALL_EVENT_IDS`, `ALL_GROUP_IDS`, `AUDIENCE_OF_ROLE`, `eventOfNotification` · usa: @/app/i18n
- **settingsMath.ts** — Cuántos días dura un cierre, contando el primero y el último. · `closureDays`, `taxTotal`, `tipLabel`

### team

- **AbsenceRequestDrawer.tsx** — Pedir (o registrar) vacaciones, una incapacidad o un permiso. · `AbsenceRequestDrawerProps`, `AbsenceRequestDrawer` · piezas: Button, DrawerShell, Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/lib/api
- **AbsencesPage.tsx** — Las ausencias del equipo. · `AbsencesPage` · piezas: Breadcrumbs, Button, EmptyState, Field, ModalShell, PageHeader, ShellHeaderSlot, Skeleton, StatusBadge, Text, Textarea, ThemaTabs · usa: @/app/i18n, @/features/access, @/i18n, @/lib/api, @/lib/query
- **ActivateTeamDrawer.tsx** — Activar equipo dentro de esta sucursal: un interruptor por persona de toda la barbería. · `ActivateTeamDrawerProps`, `ActivateTeamDrawer` · piezas: Button, DrawerShell, ListItem, ListItemGroup, SegmentedControl, Switch, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **BarberOrderPage.tsx** — Ordenar barberos: el orden de las columnas del calendario, arrastrando desde el asa o con las flechas del tec… · `BarberOrderPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, ListItem, ListItemGroup, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/lib/api, @/lib/query
- **CreateMemberDrawer.tsx** · `CreateMemberDrawer` · piezas: Button, CardSelection, DrawerShell, Text · usa: @/app/i18n, @/features/access
- **EditShiftDrawer.tsx** — Editar este día: la fecha, la persona y las dos horas del turno de ese día concreto. · `EditShiftDrawerProps`, `EditShiftDrawer` · piezas: Button, DrawerSection, DrawerShell, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, calendarLocale, formatClock, parseClock · usa: @/app/i18n, @/features/calendar, @/i18n
- **ImportMembersDrawer.tsx** — Sumar a varias personas de una vez: se pega la lista (o se sube un CSV), se ve qué entra y qué no, y entran c… · `ImportMembersDrawerProps`, `ImportMembersDrawer` · piezas: Alert, AlertDescription, AlertTitle, Button, DrawerShell, Field, Text, Textarea · usa: @/app/i18n, @/lib/api
- **LevelsPage.tsx** · `LevelsPage` · piezas: AvatarGroup, AvatarGroupCount, Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, Field, IconTile, Input, ListItem, ListItemGroup, ModalShell, PageHeader, RowActionsMenu, ShellHeaderSlot, ShellRailSlot · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **LineupPage.tsx** · `LineupPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Switch, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/lib/api, @/lib/query, @/lib/utils
- **MemberPerformance.tsx** — Cómo va un barbero en los últimos 90 días, con su agenda y sus reseñas: ocupación, cuántos clientes dejan su… · `MemberPerformance` · piezas: MetricCard, Skeleton, Text · usa: @/app/i18n, @/features/calendar, @/i18n, @/lib/query
- **MemberProfilePage.tsx** · `MemberProfilePage` · piezas: Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **MemberTabEditor.tsx** — Una pestaña de la ficha, en modo lectura o en modo edición. · `MemberTabFormProps`, `MemberTabForm`, `MemberTabViewProps`, `MemberTabView` · usa: @/features/calendar
- **MemberWizardPage.tsx** — Crear un miembro del equipo: el rol viene elegido en el panel anterior y aquí se llena la ficha paso a paso. · `MemberWizardPage` · piezas: Breadcrumbs, Button, ConfirmDialog, PageHeader, ShellHeaderSlot, Stepper, Text · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api
- **TeamHeaderActions.tsx** — Las acciones de la pantalla cuando no manda la barra flotante. · `TeamHeaderActionsProps`, `TeamHeaderActions` · piezas: Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, railScreenTiers
- **TeamHomePage.tsx** — El home de equipo. · `TeamHomePage` · piezas: Alert, AlertDescription, AlertTitle, AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, Progress, ScreenHeaderActions, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/branches, @/i18n, @/lib/api
- **WorkHoursPage.tsx** · `WorkHoursPage` · piezas: Breadcrumbs, Button, EmptyState, PageHeader, ShellHeaderSlot, ShiftWeekGrid, Skeleton, calendarLocale · usa: @/app/i18n, @/features/access, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Una fila de «Cargar miembros». · `RemindResult`, `DeactivateResult`, `ImportMembersResult`, `MemberImportRow`, `teamApi` · llama: GET /team/members, GET /team/members/${id}, POST /team/members, PATCH /team/members/${id}, DELETE /team/members/${id}, POST /team/members/remind, POST /team/members/deactivate, POST /team/members/import, GET /team/members/${id}/bank, PUT /team/activation, GET /team/levels, POST /team/levels, PATCH /team/levels/${id}, DELETE /team/levels/${id}, GET /team/order, PUT /team/order, GET /team/schedule, PUT /team/schedule/override, DELETE /team/schedule/override · usa: @/lib/api
- **memberDraft.ts** — El borrador de una persona: lo que se llena al crearla, pestaña por pestaña, y lo que se manda al guardar una… · `emptyProfile`, `defaultCompensation`, `defaultPayments`, `defaultOptions`, `defaultSchedule`, `draftFromRole`, `profileFromMember`, `draftFromMember`, `patchForTab`, `validateTab`, `serverFieldErrors` · usa: @/lib/api
- **memberImport.ts** — «Cargar miembros»: una lista pegada o un CSV con nombre, apellido, celular, correo y rol (con o sin encabezad… · `MAX_IMPORT_ROWS`, `roleFrom`, `ParsedImport`, `parseMemberList` · usa: @/lib/csvParse
- **permissionsCatalog.ts** — La matriz de permisos tal como se lee: los bloques, las filas con las columnas que existen en cada una y los… · `PERMISSION_COLUMNS`, `PERMISSION_COLUMN_KEYS`, `PermissionRowSpec`, `PermissionBlockSpec`, `PERMISSION_BLOCKS`, `ROLE_DEFAULT_PERMISSIONS`, `permissionSummary`, `visibleSections` · usa: @/app/i18n
- **queries.ts** — Claves jerárquicas del equipo. · `teamKeys`, `useMembersQuery`, `useMemberQuery`, `useLevelsQuery`, `useOrderQuery`, `useWeekQuery`, `useCreateMember`, `useUpdateMember`, `useRemoveMember`, `useSetActivation`, `useCreateLevel`, `useUpdateLevel`, `useRemoveLevel`, `useSaveOrder`, `useSetOverride`, `useClearOverride`, `useRemindMembers`, `useDeactivateMembers`, `useImportMembers`, `useRevealBank` · usa: @/features/calendar
- **teamAccess.ts** — Si quien mira gestiona a alguien de ese rol: el dueño a todos; el resto, a los de debajo. · `managesRole`, `creatableRoles`, `seesBarberMoney`, `seesManagers`, `MemberAccess`, `memberAccess` · usa: @/features/access
- **teamHome.tsx** — Los datos del home de equipo. · `TeamRoleId`, `PayoutKind`, `TeamRoleSpec`, `ALL_ROLES`, `TeamRoleFilter`, `isManagerRole`, `TEAM_ROLES`, `ROLE_BY_ID`, `PAYOUT_KEYS`, `TeamStatus`, `TEAM_STATUS_KEYS`, `TeamMember`, `TEAM_MEMBERS`, `branchName`, `isWorkingBarber`, `offsetToDate`, `formatRowDate`, `teamColumns`, `TeamCellFormatters`, `teamCells`, `OpenShift`, `OPEN_SHIFTS`, `TeamSnapshot`, `demoSnapshot`, `TeamMetric`, `membersOfRole`, `teamMetrics`, `TeamAlertId`, `TeamAlertPreset`, `IDLE_OCCUPANCY`, `TEAM_ALERTS`, `alertsForRole` · piezas: Progress, StatusBadge · usa: @/app/i18n, @/features/branches
- **teamShared.tsx** — Las piezas chicas del módulo de equipo: la sucursal activa, el avatar, el rol y el estado de una persona, y l… · `MemberAvatar`, `TeamPersonAvatar`, `MemberStatusBadge`, `RoleBadge`, `InfoCard`, `InfoRow`, `Stat` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, SectionHeader, StatusBadge, initialsOf · usa: @/app/i18n, @/lib/utils
- **teamUtils.ts** — Las ayudas sin JSX del módulo de equipo. · `useBranchId`, `branchName`, `WEEKDAYS`, `halfHours`, `orderedBarbers`, `orderedWeekdays`, `weekdayLabel`, `weeklyHours`, `overrideFor` · piezas: parseClock, useShellConfig · usa: @/features/branches
- **types.ts** — El contrato del equipo (docs/API_CONTRACT.md, «Equipo»): la ficha completa de cada persona, los niveles, el o… · `teamRoleSchema`, `TeamRole`, `memberStatusSchema`, `MemberStatus`, `workingRangeSchema`, `WorkingRange`, `levelSchema`, `Level`, `serviceOverrideSchema`, `ServiceOverride`, `compensationTypeSchema`, `CompensationType`, `compensationSchema`, `Compensation`, `paymentsSchema`, `Payments`, `permissionColumnSchema`, `PermissionColumn`, `permissionsSchema`, `Permissions`, `reminderChannelSchema`, `ReminderChannel`, `memberOptionsSchema`, `MemberOptions`, `weekScheduleSchema`, `WeekSchedule`, `memberSchema`, `TeamMember`, `membersResponseSchema`, `MembersResponse`, `levelsResponseSchema`, `lineupEntrySchema`, `LineupEntry`, `branchOrderSchema`, `BranchOrder`, `scheduleDaySchema`, `ScheduleDay`, `weekResponseSchema`, `WeekResponse`, `WeekRow`, `scheduleOverrideSchema`, `ProfileInput`, `MemberDraft`, `MemberPatch`, `profileInputSchema`, `TEAM_ROLE_KEYS`, `ROLE_PITCH_KEYS`, `MEMBER_STATUS_KEYS`, `COMPENSATION_TYPE_KEYS`, `CHANNEL_KEYS`, `isBarberRole`, `attendsChair`, `memberName`, `MemberTab`, `memberTabs`, `MEMBER_TAB_KEYS` · usa: @/app/i18n
- **workforce.ts** · `LineupTurn`, `absenceKindSchema`, `AbsenceKind`, `Absence`, `MemberPerformance`, `TeamHomeData`, `ABSENCE_KIND_KEYS`, `ABSENCE_STATUS_KEYS`, `useLineupTurn`, `useTeamHome`, `useMemberPerformance`, `useAbsences`, `AbsenceInput`, `useRequestAbsence`, `useDecideAbsence`, `useCancelAbsence` · llama: GET /team/lineup/turn, GET /team/home, GET /team/members/${memberId}/performance, GET /team/absences, POST /team/absences, POST /team/absences/${id}/${decision}, DELETE /team/absences/${id} · usa: @/app/i18n, @/features/calendar, @/lib/api

### team/forms

- **CompensationForm.tsx** — La pestaña Compensación de un barbero por comisión: cómo se le paga cada servicio (comisión fija, de escala o… · `CompensationFormProps`, `CompensationForm`, `CompensationView` · piezas: Button, Field, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n
- **OptionsForm.tsx** — La pestaña Opciones: los interruptores que cambian cómo se agenda con esta persona, el intervalo, los recorda… · `OptionsFormProps`, `OptionsForm`, `OptionsView` · piezas: Button, Checkbox, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text · usa: @/app/i18n
- **PaymentsForm.tsx** — La pestaña Pagos de un barbero de renta: la base de la renta, las tres deducciones por los clientes que le pu… · `PaymentsFormProps`, `PaymentsForm`, `PaymentsView` · piezas: Button, Field, Input, NumberField, Text · usa: @/app/i18n, @/features/branches, @/i18n, @/lib/api
- **PermissionsForm.tsx** — La pestaña Permisos: la matriz de esa persona. · `PermissionsFormProps`, `PermissionsForm` · piezas: Badge, Button, PermissionMatrix, Text · usa: @/app/i18n
- **ProfileForm.tsx** — La pestaña Perfil: la foto, los datos de contacto, la descripción, si se puede agendar, el nivel, las habilid… · `ProfileFormProps`, `ProfileForm`, `ProfileView` · piezas: Button, Field, ImageCropDialog, Input, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tag, Text, Textarea, UploadZone · usa: @/app/i18n, @/i18n
- **ScheduleForm.tsx** — La pestaña Calendario de la ficha: el horario fijo de la semana, una fila por día con su casilla y sus horas. · `ScheduleFormProps`, `ScheduleForm`, `ScheduleView` · piezas: Button, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, calendarLocale, formatClock, parseClock · usa: @/app/i18n, @/i18n
- **ServicesForm.tsx** — La pestaña Servicios: qué hace esta persona y, por servicio, sus valores propios (precio, precio para cliente… · `ServicesFormProps`, `ServicesForm`, `ServicesView` · piezas: Badge, Button, Checkbox, Field, IconTile, ListItem, ListItemGroup, ModalShell, NumberField, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/features/calendar

### transactions

- **AccountDrawer.tsx** — El detalle de una cuenta, en un panel: qué se cobró línea por línea, las cuentas —subtotal, impuesto, total,… · `AccountDrawerProps`, `AccountDrawer` · piezas: Button, DrawerShell, IconTile, Text · usa: @/app/i18n, @/features/calendar, @/features/customers, @/features/services, @/i18n
- **LedgerDrawer.tsx** — El libro de pagos del periodo: lo que entró y salió por cada medio y cada movimiento con quién lo hizo. · `LedgerDrawerProps`, `LedgerDrawer` · piezas: Badge, Button, DrawerShell, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/csv, @/lib/query, @/lib/utils
- **RefundDialog.tsx** — Devolver una cuenta cobrada, entera o en parte: cuánto, a dónde vuelve (efectivo o la tarjeta) y por qué. · `RefundDialogProps`, `RefundDialog` · piezas: Button, Field, Input, ModalShell, NumberField, SegmentedControl · usa: @/app/i18n
- **RegisterCloseDrawer.tsx** — Cerrar la caja del día: lo que entró por cada medio según las cuentas y, en efectivo, lo que debería haber co… · `RegisterCloseDrawerProps`, `RegisterCloseDrawer` · piezas: Button, DrawerShell, Field, NumberField, Skeleton, Text, Textarea · usa: @/app/i18n, @/features/review, @/i18n, @/lib/query
- **TransactionsPage.tsx** — Las transacciones: las cuentas de un periodo, con lo que se facturó, lo que ya entró y lo que falta por cobra… · `TransactionsPage` · piezas: Breadcrumbs, Button, DataListBlock, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, PeriodNavigator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, Skeleton, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/customers, @/features/team, @/i18n, @/lib/csv, @/lib/query, @/lib/utils
- **api.ts** — Contrato de transacciones; ver docs/API_CONTRACT.md. · `RefundInput`, `transactionsApi` · llama: GET /transactions, POST /appointments/${appointmentId}/refund · usa: @/features/calendar, @/lib/api
- **ledger.ts** — El libro de pagos: cada movimiento de dinero del periodo, en orden y sin borrar nada (ver docs/API_CONTRACT.m… · `ledgerKindSchema`, `LedgerKind`, `Ledger`, `LedgerEntry`, `useLedgerQuery`, `LEDGER_KIND_KEYS`, `methodKey` · llama: GET /payments · usa: @/app/i18n, @/lib/api
- **queries.ts** — Devolver: vuelve a pedir las cuentas, la agenda y la nómina, que cuentan lo devuelto. · `transactionKeys`, `useTransactionsQuery`, `useRefundAccount` · usa: @/lib/api
- **register.ts** — El cierre de caja: lo que debía haber en efectivo al final del día (según las cuentas) frente a lo que se con… · `registerExpectedSchema`, `RegisterExpected`, `registerClosureSchema`, `RegisterClosure`, `registerDaySchema`, `RegisterDay`, `RegisterCloseInput`, `registerApi`, `useRegisterDay`, `useCloseRegister`, `expectedInDrawer` · llama: GET /register, POST /register/close · usa: @/lib/api
- **transactionsAccess.ts** — Las cuentas que le tocan a quien mira: todas, o solo las que atendió el barbero. · `accountsFor`, `showsPeriodTotals` · usa: @/features/access
- **transactionsHome.tsx** — Qué se cobró, en una línea: «2 servicios · 1 producto». · `TransactionsSummary`, `summarize`, `countByStatus`, `transactionColumns`, `TransactionCellContext`, `describeLines`, `transactionCells` · usa: @/app/i18n, @/features/calendar, @/features/customers
- **transactionsShared.tsx** — El estado de una cuenta, con su color y su icono. · `AccountStatusBadge` · piezas: Badge · usa: @/app/i18n
- **transactionsStyle.ts** — Un color y un icono por estado de cuenta: lo pendiente avisa, lo cobrado tranquiliza, lo anulado se apaga. · `STATUS_STYLE`
- **types.ts** — Una «cuenta» es lo que se le cobra a alguien: cada cita es una y cada venta de mostrador es otra. · `accountStatusSchema`, `AccountStatus`, `accountLineSchema`, `AccountLine`, `accountSchema`, `Account`, `transactionsResponseSchema`, `TransactionsResponse`, `TransactionsParams`, `ACCOUNT_STATUS_KEYS`, `ACCOUNT_STATUS_HINT_KEYS`, `METHOD_KEYS`, `ONLINE_METHOD_KEYS`, `REFUND_TO_KEYS`, `refundableOf` · usa: @/app/i18n, @/features/calendar
- **useTransactionsFilters.ts** — Lo que decide qué cuentas se ven, en la URL: el periodo (día, semana o mes alrededor de una fecha), el estado… · `ALL`, `StatusFilter`, `AppointmentFilter`, `useTransactionsFilters` · piezas: fromIsoDate, periodRange, toIsoDate · usa: @/features/calendar

### users

- **UserFormDrawer.tsx** — Crear o editar una persona. · `UserFormDrawerProps`, `UserFormDrawer` · piezas: Alert, AlertDescription, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle · usa: @/app/i18n, @/lib/api
- **UserStatusBadge.tsx** · `UserStatusBadge` · piezas: StatusBadge · usa: @/app/i18n
- **UsersPage.tsx** · `UsersPage` · piezas: AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Breadcrumbs, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, EmptyState, Input, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow · usa: @/app/i18n, @/features/auth, @/i18n, @/lib/query, @/lib/utils
- **api.ts** — Contrato de personas; ver docs/API_CONTRACT.md. · `usersApi` · llama: GET /users, GET /users/${id}, POST /users, PATCH /users/${id}, DELETE /users/${id} · usa: @/lib/api
- **queries.ts** — Claves de caché jerárquicas: invalidar `lists()` refresca todos los listados sin tocar los detalles, y `detai… · `userKeys`, `useUsersQuery`, `useUserQuery`, `useCreateUser`, `useUpdateUser`, `useDeleteUser` · usa: @/lib/api
- **types.ts** — Lo que el formulario captura y el backend valida. · `userStatusSchema`, `UserStatus`, `userRoleSchema`, `UserRole`, `userSchema`, `User`, `usersPageSchema`, `UsersPage`, `userInputSchema`, `UserInput`, `UsersListParams`, `USER_STATUS_KEYS`, `USER_ROLE_KEYS`, `AREA_KEYS`, `AREAS`, `areaKey` · usa: @/app/i18n, @/lib/api
- **useUsersListState.ts** — El estado del listado vive en la URL (búsqueda, estado, orden, página): copiar el enlace reproduce la misma v… · `useUsersListState` · usa: @/hooks/useDebouncedValue, @/lib/api

## Lib · `src/lib`

Cliente de API, consultas y utilidades sin interfaz.

### api

- **client.ts** — Cliente HTTP mínimo y tipado sobre `fetch`. · `QueryParams`, `RequestOptions`, `ApiAuthBridge`, `ApiClientOptions`, `buildUrl`, `ApiClient`, `createApiClient`
- **env.ts** · `env`
- **errors.ts** — Un único tipo de error para todo lo que sale de la API. · `ApiErrorCode`, `ApiErrorShape`, `ApiError`, `isApiError`, `codeFromStatus`, `describeError`
- **index.ts** — Puente entre el cliente HTTP y la sesión. · `apiAuth`, `api`
- **pagination.ts** — Sobre de paginación que devuelve cualquier listado de la API. · `paginationMetaSchema`, `PaginationMeta`, `paginatedSchema`, `Paginated`, `PageParams`, `DEFAULT_PAGE_SIZE`
- **serverSession.ts** — La sesión firmada que piden las funciones que cuestan dinero (`/api/tts`, `/api/clipper`, `/api/narrative`, `… · `ServerScope`, `clearServerSession`, `serverToken`, `obtainStaffSession`, `ServerFetchOptions`, `serverFetch`

- **cascadeAnimation.ts** — Shared cascade reveal for accordion content: each line comes in on its own, not the whole block at once. · `CASCADE_EASE`, `CASCADE_ITEM_DURATION`, `CASCADE_STAGGER`, `CASCADE_DELAY_CHILDREN`, `CASCADE_CONTENT_GAP`, `cascadeContainer`, `cascadeItem`, `cascadeItemSettleTime`
- **csv.ts** — Filas a CSV, con la cabecera primero. · `toCsv`, `downloadCsv`
- **csvParse.ts** · `parseCsv`
- **reorder.ts** — Returns a new array with the item at `from` moved to `to`. · `moveItem`, `moveItemById`
- **sanitizeHtml.ts** — Whether the content is empty once markup is discounted. · `sanitizeHtml`, `isHtmlBlank`
- **tone.ts** — The app's accent palette, as five named tones. · `Tone`, `NEUTRAL_ACCENT`, `toneAccent`, `toneText`, `toneChip`, `toneSolid`, `toneWash`, `ToneGradientOptions`, `toneGradient`, `toneBar`, `toneBorder`, `toneSelected`, `TONE_CYCLE`, `toneForIndex`
- **useAnimatedValue.ts** · `useAnimatedValue`
- **useElementHeight.ts** — El alto de un elemento, medido en vivo. · `useElementHeight`
- **useFillHeight.ts** · `useFillHeight`
- **useResetOnChange.ts** — Resets local state when the thing it belongs to changes. · `useResetOnChange`
- **utils.ts** · `cn`
- **zip.ts** — Un `.zip` sin compresión (método "store"), para empaquetar descargas que ya vienen comprimidas, como PNG. · `ZipEntry`, `crc32`, `createZip`

### chat

- **agentFocus.ts** — De qué está hablando el agente cuando una pantalla lo abre con algo en la mano: una cita, un cliente. · `AgentFocus`, `agentFocus`, `withAgentFocus`
- **demoBackend.ts** — Respuestas de ejemplo mientras no hay un modelo detrás. · `DemoBackendOptions`, `createDemoBackend` · usa: @/lib/help
- **history.ts** — Las conversaciones por cuándo se tocaron: Hoy, Ayer, Últimos 7 días, Anteriores. · `ConversationGroupKey`, `ConversationGroup`, `groupConversations`
- **question.ts** — Con `ChatQuestion.multiple`, la respuesta une las opciones elegidas con esto. · `CHAT_MULTIPLE_SEPARATOR`, `splitMultipleAnswer`, `CHAT_QUANTITY_MARK`, `splitQuantity`, `withQuantity`
- **speech.ts** — Un reconocedor continuo con resultados parciales; `null` si el navegador no puede. · `isSpeechRecognitionSupported`, `Recognizer`, `RecognizerOptions`, `createRecognizer`, `isSpeechSynthesisSupported`, `VoiceLike`, `VoiceGender`, `pickVoice`, `toSpeech`, `loadVoices`, `SpeakOptions`, `speak` · usa: @/lib/api
- **store.ts** — Las conversaciones, en un solo sitio. · `ChatPersistence`, `ChatStoreOptions`, `createChatStore`, `ChatStore`
- **types.ts** — El modelo de una conversación con el agente. · `ChatRole`, `ChatSource`, `ChatQuestion`, `ChatQuestionChoice`, `ChatCard`, `ChatAction`, `ChatLink`, `ChatMessageStatus`, `ChatMessage`, `Conversation`, `ChatReply`, `ChatBackend`, `ChatState`

### clipper

- **toolCatalog.ts** — Las herramientas de Clipper: qué puede consultar y proponer, y quién. · `ClipperRole`, `ClipperToolSpec`, `CLIPPER_TOOLS`, `ClipperToolName`, `isClipperRole`, `toolsFor`

### help

- **answer.ts** — La respuesta que el chat de ayuda saca de un artículo. · `HelpAnswer`, `answerFromArticle`, `isConfidentAnswer`
- **groups.ts** — Los artículos de una sección repartidos en sus subgrupos, en el orden que declara el contenido. · `HelpArticleGroup`, `groupSectionArticles`
- **highlight.ts** — Parte un texto en tramos normales y tramos que coinciden con alguno de los términos (ya plegados), para pinta… · `HighlightPart`, `splitHighlights`
- **screens.ts** — La ruta del rediseño en su equivalente de producción; las demás pasan igual. · `toProductionRoute`, `screenMatches`, `articlesForScreen`
- **search.ts** — Distancia de edición con transposición (Damerau-Levenshtein, alineación óptima), acotada: en cuanto supera `m… · `editDistance`, `HelpSearchHit`, `HelpSearchCorrection`, `HelpSearchResult`, `HelpSearchOptions`, `searchHelpDetailed`, `searchHelp`
- **text.ts** — Sin tildes y en minúsculas: «Código» → «codigo». · `fold`, `slugify`, `tokenize`, `stems`
- **types.ts** — Lo que publica el repo del centro de ayuda (`centro-de-ayuda`, `dist/`). · `HelpStatus`, `HelpRole`, `HelpHeading`, `HelpArticleMeta`, `HelpSection`, `HelpIndex`, `HelpSearchDoc`

### query

- **ErrorState.tsx** — Estado de error uniforme: título y descripción humanos más reintento. · `ErrorStateProps`, `ErrorState` · piezas: Button · usa: @/lib/api, @/lib/utils
- **QueryBoundary.tsx** — El patrón único de carga → error → vacío → datos. · `QueryBoundaryProps`, `QueryBoundary` · piezas: EmptyState, Skeleton
- **queryClient.ts** — Política global de caché y reintentos. · `createQueryClient`, `queryClient` · usa: @/lib/api

### time

- **zoned.ts** — La hora de pared en esa zona para un instante: «AAAA-MM-DDTHH:mm». · `wallClock`, `offsetMinutes`, `instantOf`, `offsetLabel`, `isTimeZone`

## Hooks · `src/hooks`

Hooks compartidos entre dominios.

- **useAnchorOffset.ts** — Marks the element a floating rail should line up with. · `ANCHOR_ATTRIBUTE`, `AnchorOffset`, `useAnchorOffset`
- **useAutosave.ts** — Autosave status for a document that persists itself on every change. · `AutosaveStatus`, `AutosaveState`, `useAutosave`
- **useClickOutside.ts** — Calls `onClose` when a press lands outside `ref`. · `useClickOutside`
- **useDebouncedValue.ts** — Retrasa el valor devuelto hasta que pase `delayMs` sin que `value` cambie. · `useDebouncedValue`
- **useDragReorder.ts** · `useDragReorder`
- **useDragScroll.ts** — Una tira que se desliza de lado también con ratón. · `useDragScroll`
- **useDraggablePosition.ts** — Lets a `position: fixed` card be picked up by a grip and dropped anywhere on screen, falling back to its own… · `DraggablePosition`, `useDraggablePosition`
- **useReducedMotion.ts** — `true` cuando el sistema pide menos movimiento. · `useReducedMotion`
- **useReveal.ts** — Marca el elemento con `data-revealed="true"` la primera vez que entra en pantalla, para que la clase `reveal`… · `useReveal`
- **useScrollbarGutter.ts** — Width the scrollbar takes from a scrolling element, in px — 0 when it isn't scrolling or the platform uses ov… · `useScrollbarGutter`
- **useTilt.ts** — Inclina el elemento hacia el puntero (rotateX/rotateY con perspectiva). · `useTilt`

## Config · `src/config`

Configuración de la aplicación.

- **navigation.ts** · `NavItemConfig`, `navigationConfig` · piezas: ClipperIcon

## Mocks · `src/mocks`

MSW: implementa docs/API_CONTRACT.md.

### booking

- **alternatives.ts** — Qué servicios cubre cada habilidad. · `SKILL_SERVICES`, `Alternative`, `alternatives`, `earliest`, `WaitlistWindow`, `joinWaitlist`
- **dispatch.ts** — El outbox de la app y la cola de WhatsApp del servidor (`/api/whatsapp/queue`, ver server/whatsapp/queue). · `WhatsAppPayload`, `QueueRequest`, `QueueView`, `EnqueueResult`, `Queue`, `httpQueue`, `payloadOf`, `SyncCounts`, `syncOutbox`, `messagesOf` · usa: @/features/legal, @/lib/api
- **funnel.ts** — El embudo de la reserva en línea: cada vez que alguien llega a un paso se guarda un evento anónimo (sesión, p… · `FUNNEL_STEPS`, `FunnelStep`, `recordEvent`, `sessionsBySource`, `funnelSummary`
- **giftCards.ts** — Tarjetas de regalo: se compran con tarjeta para alguien (llega su código por WhatsApp) y se usan al pagar una… · `DEMO_GIFT_CODE`, `findGiftCard`, `createGiftCard`, `spendGiftCard`
- **handlers.ts** — Para las pruebas: cada prueba empieza sin intentos acumulados. · `resetBookingLimits`, `bookingHandlers`, `bookingServiceName` · usa: @/features/booking, @/features/payments, @/lib/time
- **logic.ts** — Los barberos que el cliente puede elegir en una sucursal, en el orden del calendario. · `bookingRules`, `tipOptions`, `bookableBarbers`, `barberPrice`, `publicServicesIn`, `serviceName`, `durationOf`, `branchHoursToday`, `shop`, `cardFeeRule`, `catalog`, `barberFree`, `availability`, `clientByPhone`, `isBlockedPhone`, `customerOf`, `depositAmount`, `loyaltyOf`, `redeemLoyalty`, `cardsOf`, `saveCard`, `updateCard`, `removeCard`, `bookedOf`, `reservationView`, `myAppointments`, `findReservationLine`, `visitSuggestion`, `branchDetail`, `reservationTaxPercent` · usa: @/features/booking, @/features/legal
- **packages.ts** — Paquetes prepagados: la barbería los ofrece en Ajustes (N visitas de un servicio con descuento y vencimiento)… · `PackageOffer`, `packageOffers`, `activePackages`, `buyPackage`, `spendPackages`
- **recurring.ts** — Dejar una cita fija («cada 3 semanas»): las próximas con el mismo barbero y a la misma hora. · `REPEAT_WEEKS`, `RepeatWeeks`, `MAX_REPEATS`, `repeatAppointment`
- **reminders.ts** — Los recordatorios que tocan: las horas de Configuración, sin repetir, de la más lejana a la más cercana. · `reminderPlan`, `scheduleMessages`, `cancelMessages`, `rescheduleMessages`, `offerFreedSlot`, `newConfirmToken`
- **replies.ts** — Las respuestas de los clientes por WhatsApp, aplicadas a la cita y a su ficha. · `InboxEvent`, `applyReply`, `repliesOf`
- **reviews.ts** — Todas las reseñas de un barbero, de la más nueva a la más vieja. · `reviewsOf`, `ratingOf`, `reviewOfAppointment`, `addReview`
- **settlement.ts** · `SettlementInput`, `settlementsOf` · usa: @/features/booking
- **state.ts** — Lo que la reserva en línea guarda además de las citas (que viven en la agenda, `db.calendar.appointments`, co… · `MockBookingLine`, `MockReservation`, `MockSavedCard`, `MockInboundReply`, `MockOutboxMessage`, `MockReview`, `MockGiftCard`, `MockFunnelEvent`, `MockOwnedPackage`, `MockBookingState`, `emptyBooking`, `DEMO_PHONES`, `DEMO_GUESTS`, `DEMO_GUESTS_CLIENT`, `DEMO_CARDS`, `BLOCKED_PHONE`, `DEMO_OTP`

- **browser.ts** — Service worker para el navegador; se arranca desde `main.tsx` cuando `env.useMocks`. · `worker`
- **catalogPrices.ts** — El precio de un servicio en una sucursal: el suyo de esa sucursal o el general. · `servicePriceIn`, `productPriceIn`, `barberServicePrice`, `withBranchPrice`
- **db.ts** — El rol en la barbería y la ficha de equipo de quien entra: con ellos el servidor recorta lo que ve. · `MockUserStatus`, `MockUserRole`, `MockUser`, `MockAuthProvider`, `MockAccount`, `MockTeamRole`, `seededRandom`, `seedUsers`, `ACCOUNTS`, `MockBranding`, `MockCalendarState`, `MockTeamState`, `MockDb`, `createDb`, `db`
- **handlers.ts** — Código por SMS del backend simulado; en producción cada envío genera uno distinto. · `OTP_CODE`, `MAX_LOGIN_FAILURES`, `handlers` · usa: @/features/legal
- **media.ts** — El retrato de cada persona del equipo. · `TEAM_PHOTOS`, `galleryFor`, `REFERENCE_PHOTO_NOTE`, `referencePhotosFor`, `SERVICE_PHOTOS`, `PRODUCT_PHOTOS`, `clientPhoto`, `userPhoto`, `ACCOUNT_PHOTOS`, `imageOrNull`
- **metrics.ts** — Lo que el tablero sabe de un servicio o producto. · `CatalogItem`, `barbersOfBranch`, `resolveMetricsBarber`, `daysOf`, `sum`, `round2`, `Appointment`, `DayRecord`, `dayRecord`, `PeriodTotals`, `totalsOf`, `countBy`, `daypartOf`, `MetricsQuery`, `SimulatedPeriod`, `simulatePeriod`, `periodOf`, `previousOf`, `buildBusinessMetrics` · piezas: fromIsoDate, periodRange, previousPeriodRange, toIsoDate · usa: @/features/metrics
- **metricsTabs.ts** · `buildCustomersMetrics`, `buildBarbersMetrics`, `buildMarketingMetrics`, `buildInsightsMetrics` · piezas: periodRange, toIsoDate · usa: @/features/customers, @/features/metrics
- **random.ts** — Generador pseudoaleatorio con semilla (mulberry32): la misma semilla, la misma serie. · `seededRandom`
- **sampleData.ts** — Los datos de ejemplo de la demo (reseñas de barberos, el embudo de la reserva) se ven solo mientras esto esté… · `sampleDataOn`
- **server.ts** — Servidor para Vitest (Node/jsdom); ver `src/test/setup.ts`. · `server`
- **session.ts** — Quién llama, visto por el servidor: la cuenta de la sesión con su rol en la barbería y su ficha de equipo. · `MockSession`, `sessionOf`, `isManager`, `isBarber`, `unauthorized`, `forbidden`, `hasStepUp`, `stepUpRequired`

### calendar

- **account.ts** — La cuenta de una cita, igual para el cobro de la agenda y para Transacciones: lo que vale (con el impuesto de… · `AppointmentAccount`, `barberServicePrice`, `appointmentAccount` · usa: @/features/branches
- **checkoutExtras.ts** — Lo que el cobro de la caja trae además de la cuenta: un descuento, la tarjeta de regalo con que paga (o una q… · `CheckoutPartMethod`, `CheckoutPart`, `CheckoutExtras`, `discountOf`, `parseExtras`, `splitOfParts`
- **handlers.ts** — Las franjas de una persona un día concreto: la excepción de esa fecha o su horario fijo. · `hoursOn`, `barbersIn`, `appointmentsOn`, `RHYTHM_WEEKS`, `rhythmOf`, `blocksOn`, `clashMessage`, `resourceMessage`, `catalogServices`, `calendarHandlers`, `workingClock` · usa: @/features/booking, @/features/branches, @/features/calendar
- **risk.ts** — Riesgo de que el cliente no venga (docs/API_CONTRACT.md, «Calendario»). · `RiskReason`, `NoShowRisk`, `noShowRisk`, `withRisk`
- **scope.ts** — La ficha del barbero que llama, o `null` si no es barbero (dueño, administrador, recepción). · `barberOf`, `ownClientIds`, `redactClient`, `ownAppointments`, `ownBlocks`
- **seed.ts** — Los datos del calendario del backend simulado: el equipo con su horario, los clientes, el catálogo y una agen… · `MockWorkingRange`, `MockBarber`, `MockClientType`, `MockNoteKind`, `MockClientNote`, `MockClient`, `MockService`, `MockProduct`, `MockAppointmentStatus`, `MockAppointmentSource`, `MockRepeatRule`, `MockPaymentMethod`, `MockHistoryEntry`, `MockPayment`, `MockRefund`, `MockOnlineSettlement`, `MockAppointment`, `MockBlockCategory`, `MockBlockRepeat`, `MockTimeBlock`, `MockWaitlistEntry`, `MockSale`, `SERVICES`, `PRODUCTS`, `WALK_IN_CLIENT`, `seedClients`, `dateKey`, `localIso`, `parseClock`, `clockOf`, `MockUtm`, `SeedDayOptions`, `seedDay`, `seedBlocks`, `blockAppliesOn`

### customers

- **handlers.ts** — Por cliente, los barberos con los que tiene una cita viva en la agenda real del último año (o por venir). · `profileOf`, `barberName`, `AgendaBarbers`, `agendaBarbers`, `isOwnClient`, `saveProfile`, `findByPhone`, `customersHandlers`
- **import.ts** — «300 123 4567», «(617) 555-0100», «+57 300…» → E.164; `null` si no parece un celular. · `toE164`, `customerImportHandlers`
- **privacy.ts** — El plazo para responder según el país de la sede del cliente: Colombia 10 días hábiles para consultas (ver, e… · `dueDateOf`, `logPrivacyRequest`, `exportOf`, `eraseClient`, `privacyHandlers` · usa: @/features/legal
- **promoCap.ts** — La promoción más cercana a `at` (antes o después) a menos de 30 días, si la hay. · `PROMO_CAP_DAYS`, `promoNear`
- **relationship.ts** · `relationshipOf`, `relationshipHandlers` · usa: @/features/legal
- **rhythm.ts** — Cuándo le toca y los huecos que se le pueden ofrecer (con su barbero si puede). · `nextVisitOf`, `reactivationCandidates`, `rhythmHandlers` · usa: @/features/customers, @/features/legal
- **seed.ts** — Los clientes del backend simulado. · `MockSegment`, `MockGuest`, `MockCustomerProfile`, `MockPrivacyRequest`, `MockCustomersState`, `emptyCustomers`, `hashOf`, `deriveProfile`, `lifecycleOf`, `MockCustomerAppointment`, `MockCustomerPayment`, `MockCustomerProduct`, `ticketOf`, `historyOf`, `paymentsOf`, `productsOf` · usa: @/features/legal

### expenses

- **handlers.ts** · `expensesHandlers`
- **seed.ts** — Los gastos del backend simulado: lo que sale de caja en cada sucursal. · `MockExpenseKind`, `MockExpenseFrequency`, `EXPENSE_CATEGORY_IDS`, `MockExpenseCategory`, `EXPENSE_PAYMENT_METHODS`, `MockExpensePaymentMethod`, `MockExpenseAttachment`, `MockExpense`, `expenseDate`, `fixedActiveIn`, `seedExpenses`

### frontDesk

- **estimate.ts** — La espera de cada persona que sigue en la fila, en su orden. · `QueueEstimate`, `estimateQueue`, `estimateIfJoined`
- **handlers.ts** — Para las pruebas: cada una empieza sin consultas acumuladas. · `resetKioskLimits`, `frontDeskHandlers` · usa: @/features/legal
- **state.ts** — Una tablet de recepción atada a una sede. · `MockKioskDevice`, `MockQueueStatus`, `MockQueueEntry`, `MockFrontDeskState`, `emptyFrontDesk`

### inventory

- **handlers.ts** · `inventoryHandlers`
- **state.ts** — El estado del inventario ligero; la lógica está en `stock.ts`. · `MockStockReason`, `MockStockMovement`, `MockInventoryState`, `emptyInventory`
- **stock.ts** — Lo que hay: lo guardado o, la primera vez, una cifra fija por sucursal y producto (alguno bajo o agotado, par… · `stockLevel`, `stockStatus`, `setMin`, `moveStock`, `syncAppointmentStock`, `releaseAppointmentStock`, `soldByProduct`

### legal

- **handlers.ts** · `MockLegalAcceptance`, `legalHandlers` · usa: @/features/legal

### messages

- **handlers.ts** — Todo SMS dice cómo dejar de recibirlos (CTIA): STOP y BAJA funcionan en cualquier idioma. · `SMS_FOOTER`, `messagesHandlers`

### notifications

- **handlers.ts** — Los avisos de una sucursal para ese rol (y, si es barbero, solo los suyos). · `NotificationKind`, `MockNotification`, `notificationsFor`, `notificationsHandlers` · usa: @/features/settings

### onboarding

- **handlers.ts** · `onboardingOf`, `onboardingHandlers`

### payroll

- **compute.ts** — El cálculo de la nómina, sin HTTP. · `Rule`, `Payout`, `cycleWindow`, `payrollOf`
- **handlers.ts** · `payrollHandlers`
- **state.ts** — Lo que la nómina guarda. · `MockAdjustmentKind`, `MockPayrollAdjustment`, `MockRunStatus`, `MockPayrollRun`, `MockPayrollHistoryEntry`, `MockRentPayment`, `MockPayrollState`, `emptyPayroll`

### products

- **handlers.ts** · `productsHandlers`
- **seed.ts** — El catálogo de productos del backend simulado. · `MockProductVisibility`, `MockProductCategory`, `MockCatalogProduct`, `MockProductsState`, `UNCATEGORIZED_PRODUCT_ID`, `seedProducts`

### register

- **handlers.ts** — Lo que debió moverse en la caja ese día, por medio de pago. · `RegisterExpected`, `expectedOf`, `registerHandlers`
- **state.ts** — Un cierre de caja: lo que se contó al final del día frente a lo que debía haber. · `MockRegisterClosure`, `MockRegisterState`, `emptyRegister`

### reports

- **income.ts** — El mes de una sucursal hasta hoy (o completo si ya pasó). · `incomeStatement`, `incomeHandlers`
- **menu.ts** · `Quadrant`, `menuEngineering`, `menuHandlers`
- **week.ts** · `weekFacts`, `weekHandlers`

### review

- **checks.ts** — Lo raro de una nómina antes de aprobarla. · `Severity`, `Finding`, `payrollReview`, `registerReview`, `reviewHandlers`

### services

- **handlers.ts** · `servicesHandlers`
- **seed.ts** — El catálogo de servicios del backend simulado. · `MockServiceKind`, `MockVisibility`, `MockPrepPosition`, `MockServiceCategory`, `MockCatalogService`, `MockServiceResource`, `MockServicesState`, `seedResources`, `UNCATEGORIZED_ID`, `seedServices`

### settings

- **branchRules.ts** — La zona de la sucursal (Configuración › Sucursales), o la del negocio si no tiene. · `branchOf`, `branchCurrency`, `branchTimeZone`, `startInstant`, `branchNow`, `branchCountry`, `branchSendPlace`, `promoWindowOf`, `consentProof`, `branchTaxPercent`, `taxInclusive`, `itemTaxPercent`, `TaxableAccount`, `accountTaxPercent`, `branchOnlineMethods` · usa: @/features/branches, @/features/legal, @/features/settings, @/lib/time
- **handlers.ts** · `settingsHandlers` · usa: @/features/settings
- **seed.ts** — La configuración del backend simulado. · `MockSettingsSection`, `MockSettingsList`, `MockListItem`, `MockSettingsState`, `DEFAULT_POLICY`, `seedSettings`

### team

- **handlers.ts** — Una ficha nueva con lo de su rol por defecto; entra «invitada» hasta que active su cuenta. · `validateProfile`, `buildMember`, `addMember`, `teamHandlers`
- **memberAccess.ts** — Si quien llama gestiona a alguien de ese rol (crear, editar, desactivar, recordar). · `managesMember`, `SELF_EDITABLE`, `maskAccount`, `isMaskedAccount`, `withMaskedBank`, `redactFor`
- **memberActions.ts** · `memberActionHandlers`
- **pricing.ts** — Demo: cada barbero cobra lo suyo por cada servicio, según su nivel y un matiz propio. · `withBarberPrices`
- **seed.ts** — El equipo del backend simulado: las personas de las cuatro sucursales con todo lo que guarda su ficha (perfil… · `MockTeamRole`, `MockTeamStatus`, `MockWorkingRange`, `MockLevel`, `MockServiceOverride`, `MockCompensationType`, `MockCompensation`, `MockPayments`, `MockPermissionColumn`, `MockPermissions`, `MockReminderChannel`, `MockMemberOptions`, `MockTeamMember`, `MockAbsence`, `MockLineupEntry`, `MockBranchOrder`, `MockScheduleOverride`, `PERMISSION_ROWS`, `ROLE_PERMISSION_DEFAULTS`, `LEVELS`, `seedTeam`, `isBarberRole`, `barbersOf`, `seedOrders`, `seedOverrides`, `memberName`
- **workforce.ts** — A quién le toca: los encendidos en la fila de ese tipo, en su orden; primero quien menos clientes de ese tipo… · `LineupKind`, `lineupTurn`, `lineupRank`, `onAbsence`, `memberPerformance`, `teamHome`, `workforceHandlers`

### transactions

- **handlers.ts** · `transactionsHandlers`
- **ledger.ts** — Quien cobró: la línea «cobrada» del historial (o, si no está, el barbero). · `LedgerKind`, `LedgerEntry`, `chargedBy`, `ledgerOf`, `ledgerHandlers`

## i18n · `src/i18n`

Idiomas y textos traducibles.

- **LanguageSelector.tsx** — El cuerpo del selector de idioma, sin Popover: la versión que se empotra dentro de otro menú (el «Personaliza… · `LanguageSelectorProps`, `LanguagePickerPanel`, `LanguageSelector` · piezas: Button, Popover, PopoverContent, PopoverTrigger, SegmentedGroup · usa: @/lib/utils
- **LocaleProvider.tsx** — El idioma de la interfaz, con la misma forma que `ThemeProvider`: un proveedor arriba del árbol, un hook (`us… · `LocaleProvider`
- **createLocaleValue.ts** — El valor del contexto para un idioma, con sus traducciones y sus formatos. · `createLocaleValue`, `DEFAULT_LOCALE_VALUE`
- **localeContext.ts** — Valores que se meten en una cadena: `t("table.selected", { count: 3 })`. · `MessageParams`, `TranslationKey`, `AppMessages`, `LocaleContextValue`, `LocaleContext`, `useLocale`, `useT`
- **locales.ts** — Los idiomas del sistema. · `LocaleId`, `LocaleOption`, `LOCALES`, `SOURCE_LOCALE`, `FALLBACK_LOCALE`, `DEFAULT_LOCALE`, `LOCALE_STORAGE_KEY`, `isLocaleId`, `findLocale`, `detectBrowserLocale`
- **localized.ts** — Un texto que puede estar traducido o no. · `Localized`, `resolveLocalized`
- **useLocalized.ts** — La versión hook de `resolveLocalized`: resuelve un texto traducible con el idioma activo. · `useLocalized`, `useLocalizer`

### messages

- **en.ts** — Inglés. · `en`
- **es.ts** — El diccionario fuente. · `es`
- **index.ts** — Los diccionarios por idioma. · `MESSAGES`, `es`, `en`
- **types.ts** — Toda clave del sistema, sacada del diccionario español. · `MessageKey`, `MessageCatalog`, `PartialMessageCatalog`

## Temas · `src/themes`

Presets, tokens derivados y selector.

- **ThemeProvider.tsx** · `ThemeProvider`
- **ThemeSelector.tsx** — Muestra pequeña de un preset: el primario claro y el oscuro, en diagonal. · `ThemeSwatch`, `ThemeSelectorProps`, `ThemeSelectorPanel`, `ThemeSelector`, `ThemeModeToggle` · piezas: Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Popover, PopoverContent, PopoverTrigger, SegmentedGroup, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip, TooltipContent, TooltipTrigger · usa: @/lib/utils
- **buildTokens.ts** — Mapa `--variable` → valor, listo para `style.setProperty` o para un bloque CSS. · `ThemeMode`, `ResolvedMode`, `RadiusScale`, `ThemeTokens`, `RADIUS_FACTORS`, `buildRadiusTokens`, `DensityScale`, `DENSITY_FACTORS`, `buildSpacingTokens`, `ThemeFonts`, `buildFontTokens`, `AI_DARK_INK`, `aiInk`, `buildThemeTokens`, `themeToCss`
- **color.ts** — Utilidades de color mínimas para derivar una paleta completa a partir de un único color primario. · `Hsl`, `hexToRgb`, `rgbToHex`, `hexToHsl`, `hslToHex`, `hslChannels`, `hexToChannels`, `shiftLightness`, `mix`, `relativeLuminance`, `contrastRatio`, `apcaContrast`, `readableForeground`
- **fonts.ts** — Catálogo de tipografías que un tema puede usar. · `FontId`, `HeadingFontId`, `FontSource`, `FontOption`, `FONT_OPTIONS`, `DEFAULT_BODY_FONT`, `DEFAULT_HEADING_FONT`, `findFont`, `isFontId`, `resolveHeadingFont`, `fontStylesheetUrl`, `ensureFontLoaded`
- **presets.ts** — Profundidad del modo oscuro. · `NeutralTint`, `DarkDepth`, `ThemeTier`, `ThemePreset`, `THEME_PRESETS`, `DEFAULT_THEME_ID`, `findPreset`
- **themeContext.ts** · `THEME_STORAGE_KEY`, `ThemeContextValue`, `ThemeContext`, `useTheme`
- **useForcedPreset.ts** — Fuerza un preset mientras la pantalla está montada, sin tocar el que la persona eligió: no se guarda y al des… · `useForcedPreset`
