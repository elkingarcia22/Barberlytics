# Mapa del código de producto

Generado con `npm run codemap` desde `src/`. No se edita a mano. Las piezas del sistema de diseño están en `ai-tools/CATALOG.md`; aquí está lo que se construyó con ellas.

Cada línea: archivo — qué es · lo que exporta · `llama:` endpoints · `piezas:` componentes del sistema que usa · `usa:` otros módulos. Ve directo al archivo que necesitas; no leas carpetas enteras.

## Rutas

De `src/app/router.tsx`.

- `/clientes` → pendiente (SectionPlaceholderPage)
- `/servicios` → pendiente (SectionPlaceholderPage)
- `/productos` → pendiente (SectionPlaceholderPage)
- `/gastos` → pendiente (SectionPlaceholderPage)
- `/nomina` → pendiente (SectionPlaceholderPage)
- `/transacciones` → pendiente (SectionPlaceholderPage)
- `/login` → LoginPage
- `/metricas` → MetricsPage
- `/dashboard` → DashboardPage
- `/calendario` → CalendarPage
- `/usuarios` → TeamHomePage
- `/usuarios/lista` → UsersPage
- `/usuarios/miembros/:id` → MemberProfilePage
- `/usuarios/nuevo` → MemberWizardPage
- `/usuarios/horarios` → WorkHoursPage
- `/usuarios/niveles` → LevelsPage
- `/usuarios/orden` → BarberOrderPage
- `/usuarios/fila` → LineupPage
- `/configuracion` → SettingsPage
- `/configuracion/:seccion` → SettingsSectionPage
- `/403` → ForbiddenPage
- `/ayuda/*` → HelpApp
- `/docs/*` → DocsApp
- `*` → NotFoundPage

## Endpoints simulados

Lo que responde MSW hoy.

- `GET /calendar/catalog` · src/mocks/calendar/handlers.ts
- `GET /calendar/day` · src/mocks/calendar/handlers.ts
- `GET /calendar/month` · src/mocks/calendar/handlers.ts
- `POST /appointments` · src/mocks/calendar/handlers.ts
- `PATCH /appointments/:id` · src/mocks/calendar/handlers.ts
- `POST /appointments/:id/checkout` · src/mocks/calendar/handlers.ts
- `POST /clients/:id/notes` · src/mocks/calendar/handlers.ts
- `POST /blocks` · src/mocks/calendar/handlers.ts
- `DELETE /blocks/:id` · src/mocks/calendar/handlers.ts
- `GET /waitlist` · src/mocks/calendar/handlers.ts
- `POST /waitlist` · src/mocks/calendar/handlers.ts
- `DELETE /waitlist/:id` · src/mocks/calendar/handlers.ts
- `POST /sales` · src/mocks/calendar/handlers.ts
- `POST /auth/otp/request` · src/mocks/handlers.ts
- `POST /auth/otp/verify` · src/mocks/handlers.ts
- `POST /auth/signup` · src/mocks/handlers.ts
- `POST /support/tickets` · src/mocks/handlers.ts
- `POST /auth/oauth` · src/mocks/handlers.ts
- `POST /auth/recovery/request` · src/mocks/handlers.ts
- `GET /auth/me` · src/mocks/handlers.ts
- `POST /auth/logout` · src/mocks/handlers.ts
- `POST /feedback` · src/mocks/handlers.ts
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

## App · `src/app`

Router, providers, layout, navegación y páginas de error.

### chat

- **index.ts** — El chat de la app: un solo almacén de conversaciones para el panel, la pantalla completa y el modo voz, y qui… · `chatStore`, `AppChatLabels`, `createAppChatBackend` · usa: @/help/chat, @/lib/chat

### components

- **PageLoader.tsx** — Loader de página completa: para rutas perezosas y la resolución de sesión. · `PageLoader`
- **RouteError.tsx** — Límite de error de las rutas: atrapa lo que reviente al renderizar una página (o al cargarla en diferido) y l… · `RouteError` · piezas: Button · usa: @/lib/api, @/lib/query

### i18n

- **en.ts** — Inglés de la aplicación. · `appEn`
- **es.ts** — El diccionario **de la aplicación**, no el del sistema de diseño. · `appEs`
- **index.ts** — El diccionario de esta aplicación, listo para `<LocaleProvider messages={…}>`. · `APP_MESSAGES`, `appEs`, `appEn` · usa: @/i18n
- **types.ts** — Toda clave de la aplicación, sacada de su diccionario español. · `AppMessageKey`, `AppMessageCatalog`
- **useAppT.ts** — `t()` con las claves de esta aplicación autocompletadas, más las del sistema: una pantalla dice tanto "users.… · `useAppT` · usa: @/i18n

### layouts

- **AppLayout.tsx** — El shell de administración alimentado con datos reales: la persona de la sesión, la navegación de la app con… · `AppLayout` · piezas: AdminShell, ChatPanel, ChatProvider, ChatScreen, ChatVoiceMode, PersonalizationMenu · usa: @/features/auth, @/features/branches, @/features/branding, @/features/feedback, @/features/settings, @/help/HelpGuidesDrawer, @/help/content, @/i18n, @/lib/chat, @/themes

- **lazyPages.ts** — Cada pantalla se carga en diferido: el primer render solo trae el shell. · `DashboardPage`, `CalendarPage`, `MemberProfilePage`, `MemberWizardPage`, `WorkHoursPage`, `LevelsPage`, `BarberOrderPage`, `LineupPage`, `MetricsPage`, `TeamHomePage`, `UsersPage`, `DocsApp`, `HelpApp`, `SettingsPage`, `SettingsSectionPage`, `SectionPlaceholderPage`
- **navigation.ts** — El árbol con los rótulos ya traducidos. · `buildAppNavigation`, `APP_NAVIGATION`, `findActiveNavId`
- **providers.tsx** — Los providers globales, en el orden en que dependen unos de otros: la caché de datos primero, el idioma y el… · `AppProviders` · piezas: ThemaToaster, TooltipProvider · usa: @/features/auth, @/i18n, @/lib/query, @/themes
- **router.tsx** · `router` · usa: @/features/auth, @/features/sections

### pages

- **ForbiddenPage.tsx** · `ForbiddenPage` · piezas: Button, EmptyState
- **NotFoundPage.tsx** · `NotFoundPage` · piezas: Button, EmptyState

## Dominios · `src/features`

Una carpeta por dominio: pantalla, tipos, api, queries.

### auth

- **AuthProvider.tsx** — Sesión de la aplicación. · `AuthProviderProps`, `AuthProvider` · usa: @/lib/api
- **LockedPanel.tsx** — Tras varios intentos fallidos seguidos el celular queda bloqueado; la salida es un ticket a soporte. · `LockedPanelProps`, `LockedPanel` · piezas: Button, Heading, Text · usa: @/app/i18n, @/icons
- **LoginForm.tsx** — Entrar en dos pasos: el celular pide el código por SMS y el código abre la sesión. · `LoginFormProps`, `LoginForm` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, InputOtp, Label, PhoneInput, Separator, Text · usa: @/app/i18n, @/icons, @/lib/api
- **LoginHeroImage.tsx** — La foto de portada del login, servida desde `public/`. · `LOGIN_HERO_IMAGE`, `LoginHeroImage`
- **LoginPage.tsx** — Entrada a la aplicación en dos mitades. · `LoginPage` · piezas: BarberlyticsLogo, Enter, Foil, Grain, HairCanvas, Halo, Heading, Text, Vignette · usa: @/app/i18n, @/i18n, @/lib/utils, @/themes
- **RecoveryPanel.tsx** — Olvidé mi número: se escribe el correo registrado y el celular llega allí. · `RecoveryPanelProps`, `RecoveryPanel` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, Input, Label, Separator, Text · usa: @/app/i18n, @/icons, @/lib/api
- **RequireAuth.tsx** — Guarda de ruta. · `RequireAuthProps`, `RequireAuth` · usa: @/app/components
- **SignupPanel.tsx** — Crear cuenta: los datos de la persona y de la barbería. · `SignupPanelProps`, `SignupPanel` · piezas: Button, Heading, Input, NumberField, PHONE_COUNTRIES, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/icons, @/lib/api
- **SupportTicketPanel.tsx** — De dónde viene la persona: prellena lo que ya se sabe. · `TicketContext`, `SupportTicketPanelProps`, `SupportTicketPanel` · piezas: Button, Heading, Input, PhoneInput, Text, Textarea · usa: @/app/i18n, @/icons, @/lib/api
- **api.ts** · `authApi` · llama: POST /auth/otp/request, POST /auth/otp/verify, POST /auth/oauth, GET /auth/me, POST /auth/logout, POST /auth/recovery/request, POST /auth/signup, POST /support/tickets · usa: @/lib/api
- **authContext.ts** · `AuthContextValue`, `AuthContext`
- **authErrors.ts** — Pinta en su campo los errores `fields` del servidor. · `applyServerFieldErrors`, `isLockedError`, `attemptsLeftFrom` · usa: @/lib/api
- **authFormParts.tsx** — Etiqueta, control y mensaje de error enlazados por `id`. · `FieldControlProps`, `AuthField`, `FormErrorAlert`, `BackButton` · piezas: Alert, AlertDescription, AlertTitle, Button, Label, Text · usa: @/icons
- **phoneLabel.ts** — «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. · `describePhone` · piezas: formatNational, parseE164
- **providers.ts** — Pide al proveedor (Google Identity Services, MSAL para Outlook) la credencial con la que el backend abre la s… · `requestProviderCredential` · usa: @/lib/api
- **timezones.ts** — Zonas IANA de cada país que ofrece `PhoneInput`; la primera es la más poblada. · `COUNTRY_TIMEZONES`, `describeTimezone`, `timezonesFor`
- **tokenStorage.ts** — Dónde vive el token de acceso en el navegador. · `TokenStorage`, `sessionTokenStorage`, `createMemoryTokenStorage`
- **types.ts** — Celular en E.164 tal como lo emite `PhoneInput`, completo según el país: un celular de Colombia tiene 10 dígi… · `userRoleSchema`, `UserRole`, `phoneSchema`, `authUserSchema`, `AuthUser`, `sessionSchema`, `Session`, `otpRequestSchema`, `OtpRequest`, `OTP_LENGTH`, `otpVerifySchema`, `OtpVerify`, `authProviderSchema`, `AuthProvider`, `recoveryRequestSchema`, `RecoveryRequest`, `signupRequestSchema`, `SignupRequest`, `ticketReasonSchema`, `TicketReason`, `supportTicketSchema`, `SupportTicketRequest`, `supportTicketResponseSchema`, `SupportTicketResponse`, `AuthStatus` · piezas: parseE164
- **useAuth.ts** — El usuario autenticado; lanza si se usa fuera de una ruta protegida. · `useAuth`, `useCurrentUser`

### branches

- **branches.ts** — Las sucursales del negocio. · `BRANCHES`, `DEFAULT_BRANCH_ID`

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

- **AppointmentDrawer.tsx** — El detalle de una cita: la cabecera con el cliente y su estado, el menú Acciones con el recorrido completo (B… · `AppointmentDrawerProps`, `AppointmentDrawer` · piezas: Button, DrawerShell, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Text, ThemaTabs · usa: @/app/i18n
- **BlockDrawer.tsx** — Crear bloqueo: una franja del barbero que deja de estar disponible — almuerzo, reunión, enfermedad, vacacione… · `BlockDrawerProps`, `BlockDrawer` · piezas: Button, DatePicker, DrawerSection, DrawerShell, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/i18n, @/lib/api
- **CalendarAgendaView.tsx** — La vista Agenda: las citas del día una debajo de otra, repartidas en mañana, tarde y noche, con el cliente, e… · `CalendarAgendaViewProps`, `CalendarAgendaView` · piezas: Button, EmptyState, ListItem, ListItemGroup, Text, minutesOfDay · usa: @/app/i18n, @/i18n
- **CalendarDayView.tsx** — La vista Día: la rejilla por barbero con lo que se puede hacer desde ella —agendar en un hueco, abrir una cit… · `CalendarDayViewProps`, `CalendarDayView` · piezas: Button, EmptyState, ResourceDayGrid, calendarLocale · usa: @/app/i18n, @/i18n
- **CalendarMonthView.tsx** — La vista Mes: la ocupación de un barbero (o del equipo) día por día, con tres cifras arriba —citas del mes, o… · `CalendarMonthViewProps`, `CalendarMonthView` · piezas: KpiCard, MonthOccupancyGrid, Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/query
- **CalendarPage.tsx** · `CalendarPageProps`, `CalendarPage` · piezas: Breadcrumbs, ConfirmDialog, DataListActionRail, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, formatClockRange, useShellConfig · usa: @/app/i18n, @/features/branches, @/i18n, @/lib/api, @/lib/query
- **CalendarToolbar.tsx** — La barra del calendario, de izquierda a derecha como en producción: el filtro Equipo, la fecha con sus flecha… · `CalendarToolbarProps`, `CalendarToolbar` · piezas: Button, Calendar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Popover, PopoverContent, PopoverTrigger, SegmentedControl, Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue, calendarLocale · usa: @/app/i18n, @/i18n, @/icons/ThemaIcon
- **CheckoutDrawer.tsx** — Cobrar una cita: los servicios y productos de la cuenta, la propina para el barbero, cómo paga el cliente y e… · `CheckoutDrawerProps`, `CheckoutDrawer` · piezas: Button, DrawerSection, DrawerShell, Field, IconTile, ListItem, ListItemGroup, NumberField, RadioCardGroup, SearchableSelect, Text · usa: @/app/i18n, @/lib/api, @/lib/utils
- **CollectionsDrawer.tsx** — La lista de cobros: las citas del día que faltan por pagar y las que ya se cobraron, con el total de cada pes… · `CollectionsDrawerProps`, `CollectionsDrawer` · piezas: Button, DrawerShell, EmptyState, ListItem, ListItemGroup, Text, ThemaTabs, calendarLocale · usa: @/app/i18n, @/i18n, @/lib/query
- **CreateAppointmentDrawer.tsx** — Crear cita: cliente, servicio, barbero y fecha & hora, el interruptor de «cliente sin cita previa» y la repet… · `CreateAppointmentInitial`, `CreateAppointmentDrawerProps`, `CreateAppointmentDrawer` · piezas: Button, DrawerSection, DrawerShell, Field, SearchableSelect, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text, Textarea, TimeSlotPicker, formatClockRange, isWorkingAt, minutesOfDay · usa: @/app/i18n, @/lib/api
- **QuickSaleDrawer.tsx** — Venta rápida de productos: para quien se lleva una cera sin tener cita. · `QuickSaleDrawerProps`, `QuickSaleDrawer` · piezas: Button, DrawerSection, DrawerShell, IconTile, ListItem, ListItemGroup, RadioCardGroup, SegmentedControl, Text · usa: @/app/i18n, @/lib/api
- **WaitlistDrawer.tsx** — La lista de espera: quién espera un hueco, para qué servicio, con quién y en qué franjas le sirve. · `WaitlistDrawerProps`, `WaitlistDrawer` · piezas: Button, DatePicker, DrawerSection, DrawerShell, EmptyState, Field, ListItem, ListItemGroup, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/query
- **WalkInSaleDrawer.tsx** — Venta sin cita: registrar un servicio que ya se hizo sin agendar —fecha, hora, cliente, servicio y barbero— p… · `WalkInSaleDrawerProps`, `WalkInSaleDrawer` · piezas: Button, DatePicker, DrawerSection, DrawerShell, Field, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n, @/i18n, @/lib/api
- **api.ts** — Contrato del calendario; ver docs/API_CONTRACT.md. · `calendarApi` · llama: GET /calendar/catalog, GET /calendar/day, GET /calendar/month, POST /appointments, PATCH /appointments/${id}, POST /appointments/${id}/checkout, POST /clients/${clientId}/notes, POST /blocks, DELETE /blocks/${id}, GET /waitlist, POST /waitlist, DELETE /waitlist/${id}, POST /sales · usa: @/lib/api
- **calendarFormat.ts** — Dinero de la sucursal, con la convención del idioma activo. · `useMoney`, `halfHourOptions`, `useOpenKey` · usa: @/i18n
- **calendarModel.ts** — Del dominio a lo que se ve: convierte barberos y citas en recursos y eventos de la rejilla, decide el siguien… · `Translate`, `ModelContext`, `parseLocal`, `toLocalIso`, `appointmentStart`, `appointmentEnd`, `findClient`, `findBarber`, `servicesOf`, `servicesPrice`, `servicesMinutes`, `workingHoursOn`, `applyDayHours`, `isWorkingOn`, `visibleBarbers`, `isActive`, `isUnpaid`, `statusTone`, `clientTypeTone`, `JOURNEY`, `NextStep`, `nextStep`, `appointmentWarning`, `toResource`, `toEvent`, `blockToEvent`, `appointmentRange`, `historyLabel`, `monthKey` · piezas: formatClockRange · usa: @/app/i18n, @/i18n
- **calendarRailActions.tsx** — Lo que se puede hacer desde el calendario, declarado una vez con su peso. · `CalendarRailHandlers`, `calendarRailActions` · usa: @/app/i18n
- **calendarShared.tsx** — Una fila «etiqueta · valor» de las fichas de los drawers. · `AppointmentStatusBadge`, `ClientTypeBadge`, `PersonAvatar`, `DetailRow` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, StatusBadge, initialsOf · usa: @/app/i18n
- **queries.ts** — Claves jerárquicas: invalidar `days()` refresca cualquier día abierto sin tocar el catálogo, y `month()` se r… · `calendarKeys`, `useCatalogQuery`, `useDayQuery`, `useMonthQuery`, `useWaitlistQuery`, `useCreateAppointment`, `useUpdateAppointment`, `useCheckoutAppointment`, `useAddClientNote`, `useCreateBlock`, `useRemoveBlock`, `useAddToWaitlist`, `useRemoveFromWaitlist`, `useCreateSale`
- **types.ts** — El contrato del calendario (docs/API_CONTRACT.md, «Calendario»): lo que el backend manda y lo que la pantalla… · `workingRangeSchema`, `WorkingRange`, `barberSchema`, `Barber`, `clientTypeSchema`, `ClientType`, `noteKindSchema`, `NoteKind`, `clientNoteSchema`, `ClientNote`, `clientSchema`, `Client`, `serviceSchema`, `Service`, `productSchema`, `Product`, `catalogSchema`, `CalendarCatalog`, `appointmentStatusSchema`, `AppointmentStatus`, `appointmentSourceSchema`, `repeatRuleSchema`, `RepeatRule`, `paymentMethodSchema`, `PaymentMethod`, `historyEntrySchema`, `HistoryEntry`, `paymentSchema`, `Payment`, `productLineSchema`, `ProductLine`, `appointmentSchema`, `Appointment`, `blockCategorySchema`, `BlockCategory`, `blockRepeatSchema`, `BlockRepeat`, `timeBlockSchema`, `TimeBlock`, `calendarDaySchema`, `CalendarDay`, `monthDaySchema`, `calendarMonthSchema`, `CalendarMonth`, `waitlistEntrySchema`, `WaitlistEntry`, `waitlistSchema`, `saleSchema`, `Sale`, `appointmentInputSchema`, `AppointmentInput`, `AppointmentPatch`, `CheckoutInput`, `blockInputSchema`, `BlockInput`, `WaitlistInput`, `SaleInput`, `NoteInput`, `CalendarView`, `CALENDAR_VIEWS`, `TeamFilter`, `STATUS_KEYS`, `CLIENT_TYPE_KEYS`, `REPEAT_KEYS`, `BLOCK_CATEGORY_KEYS`, `BLOCK_REPEAT_KEYS`, `PAYMENT_METHOD_KEYS`, `NOTE_KIND_KEYS` · usa: @/app/i18n
- **useCalendarState.ts** · `toDateKey`, `fromDateKey`, `useCalendarState`

### calendar/appointmentTabs

- **AppointmentClientTab.tsx** — Cliente: su ritmo (cada cuánto vuelve y para cuándo agendarlo), su cumplimiento, sus alertas y el enlace a la… · `AppointmentClientTabProps`, `AppointmentClientTab` · piezas: Button, DrawerSection, Text, calendarLocale · usa: @/app/i18n, @/i18n
- **AppointmentHistoryTab.tsx** — Historial: la actividad de la cita, quién hizo qué y cuándo, del más reciente al más antiguo. · `AppointmentHistoryTabProps`, `AppointmentHistoryTab` · piezas: DrawerSection, Timeline, TimelineItem · usa: @/app/i18n, @/i18n
- **AppointmentNotesTab.tsx** — Notas: las del cliente en tres pestañas —Notas, Medicamento, Alergias— con su contador, y el formulario para… · `AppointmentNotesTabProps`, `AppointmentNotesTab` · piezas: Button, DrawerSection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea, ThemaTabs · usa: @/app/i18n, @/i18n, @/lib/api
- **AppointmentSummaryTab.tsx** — Resumen: lo que toca hacer ahora, el recorrido del cliente, la cita tal cual se agendó y la fidelidad al barb… · `AppointmentSummaryTabProps`, `AppointmentSummaryTab` · piezas: Button, DrawerSection, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Stepper, Text, calendarLocale · usa: @/app/i18n, @/i18n

### dashboard

- **DashboardPage.tsx** — El home, como plantilla. · `DashboardPage` · piezas: AttentionAction, AttentionStrip, Badge, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, TemplateCatalogDrawer, TemplateTile, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **api.ts** · `dashboardApi` · llama: GET /dashboard/summary · usa: @/lib/api
- **homeTemplate.tsx** — Los datos de la plantilla del home. · `ProcessStatus`, `ProcessRow`, `PROCESS_ROWS`, `offsetToDate`, `formatRowDate`, `STATUS_KEYS`, `processColumns`, `processCells`, `buildTemplates`, `buildTemplateGroups`, `PulseMetric`, `PULSE_METRICS`, `AlertId`, `AlertPreset`, `CLOSING_SOON_DAYS`, `ALERT_PRESETS` · piezas: Progress, StatusBadge · usa: @/app/i18n
- **queries.ts** · `dashboardKeys`, `useDashboardSummary`
- **types.ts** · `dashboardSummarySchema`, `DashboardSummary`

### feedback

- **FeedbackHost.tsx** — Monta la campaña activa sobre la app: añade a cada comentario la campaña, la página y la persona, y lo envía… · `FeedbackHostProps`, `FeedbackHost` · piezas: FeedbackCampaign · usa: @/features/auth, @/lib/api
- **api.ts** — `POST /feedback`: en producción lo atiende la función de servidor `api/feedback` (guarda el comentario en la… · `feedbackApi` · llama: POST /feedback · usa: @/lib/api
- **buildSubmission.ts** — Arma la fila que se envía: lo que escribió la persona más lo que la app ya sabe (campaña, página, quién). · `SubmissionContext`, `buildSubmission`
- **campaignRegistry.ts** — Las campañas de feedback, como datos planos: sin React, sin alias `@/` y sin nada del navegador, porque las l… · `CampaignSection`, `CampaignDefinition`, `REDESIGN_DEFINITION`, `ACTIVE_CAMPAIGN_DEFINITION`
- **campaigns.ts** — La campaña activa con su recorrido, o `null` si no se está escuchando. · `REDESIGN_CAMPAIGN`, `ACTIVE_FEEDBACK_CAMPAIGN` · piezas: FEEDBACK_LAUNCHER_TARGET
- **pageLabel.ts** — El rótulo de menú de la entrada activa, buscado en los tres niveles. · `findNavLabel`
- **queries.ts** · `useSubmitFeedback`
- **types.ts** — Largo máximo de un comentario; el panel corta ahí y el backend lo vuelve a comprobar. · `FEEDBACK_MAX_LENGTH`, `FEEDBACK_MIN_LENGTH`, `feedbackSubmissionSchema`, `FeedbackSubmission`, `feedbackReceiptSchema`, `FeedbackReceipt`

### metrics

- **MetricsFilters.tsx** — La fila de filtros del tablero: el periodo y el barbero. · `MetricsFilters` · piezas: PeriodNavigator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n, @/i18n
- **MetricsPage.tsx** — Métricas: cómo le fue a la barbería, en cinco pestañas. · `MetricsPage` · piezas: Breadcrumbs, PageHeader, ShellHeaderSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/lib/query
- **api.ts** · `metricsApi` · llama: GET /metrics/business, GET /metrics/customers, GET /metrics/barbers, GET /metrics/marketing, GET /metrics/insights · usa: @/lib/api
- **metricsFormat.ts** — Cómo se escriben las cifras del tablero, con la convención del idioma activo. · `MetricsFormatters`, `useMetricsFormatters` · usa: @/i18n
- **queries.ts** · `metricsKeys`, `useBusinessMetrics`, `useCustomersMetrics`, `useBarbersMetrics`, `useMarketingMetrics`, `useInsightsMetrics`
- **types.ts** · `Compared`, `periodGranularitySchema`, `MetricsGranularity`, `incomeLineSchema`, `IncomeLine`, `appointmentStatusSchema`, `AppointmentStatus`, `bookingMethodSchema`, `BookingMethod`, `daypartSchema`, `Daypart`, `paymentMethodSchema`, `PaymentMethod`, `CatalogRow`, `metricsBusinessSchema`, `MetricsBusiness`, `clientTypeSchema`, `ClientType`, `visitFrequencySchema`, `VisitFrequency`, `metricsCustomersSchema`, `MetricsCustomers`, `metricsBarbersSchema`, `MetricsBarbers`, `metricsMarketingSchema`, `MetricsMarketing`, `suggestionGroupSchema`, `SuggestionGroup`, `suggestionTypeSchema`, `metricsInsightsSchema`, `MetricsInsights`, `MetricsParams`, `ALL_BARBERS`
- **useMetricsFilters.ts** — Lo que decide qué se ve, en la URL: la pestaña, el grano del periodo, la fecha ancla y el barbero. · `METRICS_TABS`, `MetricsTab`, `useMetricsFilters` · piezas: fromIsoDate, toIsoDate

### metrics/sections

- **AppointmentsSection.tsx** — Las citas del periodo: en qué acabaron, cómo se pagaron y por dónde entraron (tres repartos), y cuándo llegan… · `AppointmentsSection` · piezas: ChartCard, CompositionDonut, DistributionBar, useChartPalette · usa: @/app/i18n
- **CatalogSection.tsx** — Qué se vendió: servicios y productos, por unidades y con su importe al lado. · `CatalogSection` · piezas: BarList, EmptyState · usa: @/app/i18n
- **MetricsAlerts.tsx** — Lo que del periodo pide una mano: cobros abiertos, cancelaciones y no-shows. · `MetricsAlerts` · piezas: AttentionAction, AttentionStrip · usa: @/app/i18n
- **MetricsPulse.tsx** — Las cuatro lecturas de arriba: cuánto se vendió, a cuánto el ticket, cuántas citas y cuántas se perdieron. · `MetricsPulse` · piezas: MetricCard, MetricRing, SparklineChart, useChartPalette · usa: @/app/i18n
- **SalesSection.tsx** — Cuánto se vendió y de dónde salió: la serie del periodo a la izquierda y el desglose del ingreso a la derecha… · `SalesSection` · piezas: BarList, ChartCard, MetricCard, useChartPalette · usa: @/app/i18n

### metrics/tabs

- **BarbersDashboard.tsx** — Barberos: lo que ganó el equipo y cómo se reparte, con la ocupación, la cancelación y las propinas de cada un… · `BarbersDashboard` · piezas: BarList, MetricCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell · usa: @/app/i18n
- **CustomersDashboard.tsx** — Clientes: cuántos vuelven, cuánto deja cada uno, por dónde reservan y qué tipo de cliente llena la agenda. · `CustomersDashboard` · piezas: BarList, CompositionDonut, DistributionBar, MetricCard · usa: @/app/i18n
- **InsightsDashboard.tsx** — IA: un diagnóstico de los últimos tres meses. · `InsightsDashboard` · piezas: AIInsightCard, AiGeneratedBadge, AttentionAction, AttentionStrip, Card, HeatmapMatrix, MetricCard, MetricDial, PanelHeading · usa: @/app/i18n
- **MarketingDashboard.tsx** — Marketing: por dónde llegan las reservas digitales, cuánto convierte cada canal y qué trajo cada campaña. · `MarketingDashboard` · piezas: BarList, EmptyState, MetricCard · usa: @/app/i18n

### sections

- **SectionPlaceholderPage.tsx** — Una sección del menú que todavía no tiene pantalla. · `SectionPlaceholderPageProps`, `SectionPlaceholderPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n

### settings

- **SettingsPage.tsx** — Todo lo que se ajusta, en una sola pantalla. · `SettingsPage` · piezas: Breadcrumbs, IconTile, ListItem, ListItemGroup, PageHeader, SectionHeader, ShellHeaderSlot · usa: @/app/i18n
- **SettingsSectionPage.tsx** — Un ajuste concreto, todavía sin formulario. · `SettingsSectionPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/branding
- **settingsCatalog.ts** — Los grupos con sus rótulos traducidos y su ruta resuelta. · `SETTINGS_BASE_PATH`, `buildSettingsGroups`, `SETTINGS_ALL`, `findSettingsItem` · usa: @/app/i18n
- **settingsIcons.ts** — El icono y el color de cada ajuste. · `SETTINGS_ICONS`, `SETTINGS_GROUP_TONES`

### team

- **ActivateTeamDrawer.tsx** — Activar equipo dentro de esta sucursal: un interruptor por persona de toda la barbería. · `ActivateTeamDrawerProps`, `ActivateTeamDrawer` · piezas: Button, DrawerShell, ListItem, ListItemGroup, SegmentedControl, Switch, Text, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api, @/lib/query
- **BarberOrderPage.tsx** — Ordenar barberos: el orden de las columnas del calendario, arrastrando desde el asa o con las flechas del tec… · `BarberOrderPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, ListItem, ListItemGroup, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Text, ThemaTabs · usa: @/app/i18n, @/lib/api, @/lib/query
- **CreateMemberDrawer.tsx** · `CreateMemberDrawer` · piezas: Button, CardSelection, DrawerShell, Text · usa: @/app/i18n
- **EditShiftDrawer.tsx** — Editar este día: la fecha, la persona y las dos horas del turno de ese día concreto. · `EditShiftDrawerProps`, `EditShiftDrawer` · piezas: Button, DrawerSection, DrawerShell, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, calendarLocale, formatClock, parseClock · usa: @/app/i18n, @/features/calendar, @/i18n
- **LevelsPage.tsx** · `LevelsPage` · piezas: AvatarGroup, AvatarGroupCount, Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, Field, IconTile, Input, ListItem, ListItemGroup, ModalShell, PageHeader, RowActionsMenu, ShellHeaderSlot, ShellRailSlot · usa: @/app/i18n, @/features/calendar, @/lib/api, @/lib/query
- **LineupPage.tsx** · `LineupPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Switch, Text, ThemaTabs · usa: @/app/i18n, @/lib/api, @/lib/query, @/lib/utils
- **MemberProfilePage.tsx** · `MemberProfilePage` · piezas: Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api, @/lib/query
- **MemberTabEditor.tsx** — Una pestaña de la ficha, en modo lectura o en modo edición. · `MemberTabFormProps`, `MemberTabForm`, `MemberTabViewProps`, `MemberTabView` · usa: @/features/calendar
- **MemberWizardPage.tsx** — Crear un miembro del equipo: el rol viene elegido en el panel anterior y aquí se llena la ficha paso a paso. · `MemberWizardPage` · piezas: Breadcrumbs, Button, ConfirmDialog, PageHeader, ShellHeaderSlot, Stepper, Text · usa: @/app/i18n, @/features/calendar, @/lib/api
- **TeamHeaderActions.tsx** — Las acciones de la pantalla cuando no manda la barra flotante. · `TeamHeaderActionsProps`, `TeamHeaderActions` · piezas: Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, railScreenTiers
- **TeamHomePage.tsx** — El home de equipo. · `TeamHomePage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **WorkHoursPage.tsx** · `WorkHoursPage` · piezas: Breadcrumbs, Button, EmptyState, PageHeader, ShellHeaderSlot, ShiftWeekGrid, Skeleton, calendarLocale · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato del equipo; ver docs/API_CONTRACT.md. · `teamApi` · llama: GET /team/members, GET /team/members/${id}, POST /team/members, PATCH /team/members/${id}, DELETE /team/members/${id}, PUT /team/activation, GET /team/levels, POST /team/levels, PATCH /team/levels/${id}, DELETE /team/levels/${id}, GET /team/order, PUT /team/order, GET /team/schedule, PUT /team/schedule/override, DELETE /team/schedule/override · usa: @/lib/api
- **memberDraft.ts** — El borrador de una persona: lo que se llena al crearla, pestaña por pestaña, y lo que se manda al guardar una… · `emptyProfile`, `defaultCompensation`, `defaultPayments`, `defaultOptions`, `defaultSchedule`, `draftFromRole`, `profileFromMember`, `draftFromMember`, `patchForTab`, `validateTab`, `serverFieldErrors` · usa: @/lib/api
- **permissionsCatalog.ts** — La matriz de permisos tal como se lee: los bloques, las filas con las columnas que existen en cada una y los… · `PERMISSION_COLUMNS`, `PERMISSION_COLUMN_KEYS`, `PermissionRowSpec`, `PermissionBlockSpec`, `PERMISSION_BLOCKS`, `ROLE_DEFAULT_PERMISSIONS`, `permissionSummary`, `visibleSections` · usa: @/app/i18n
- **queries.ts** — Claves jerárquicas del equipo. · `teamKeys`, `useMembersQuery`, `useMemberQuery`, `useLevelsQuery`, `useOrderQuery`, `useWeekQuery`, `useCreateMember`, `useUpdateMember`, `useRemoveMember`, `useSetActivation`, `useCreateLevel`, `useUpdateLevel`, `useRemoveLevel`, `useSaveOrder`, `useSetOverride`, `useClearOverride` · usa: @/features/calendar
- **teamHome.tsx** — Los datos del home de equipo. · `TeamRoleId`, `PayoutKind`, `TeamRoleSpec`, `ALL_ROLES`, `TeamRoleFilter`, `isManagerRole`, `TEAM_ROLES`, `ROLE_BY_ID`, `PAYOUT_KEYS`, `TeamStatus`, `TEAM_STATUS_KEYS`, `TeamMember`, `TEAM_MEMBERS`, `branchName`, `isWorkingBarber`, `offsetToDate`, `formatRowDate`, `teamColumns`, `TeamCellFormatters`, `teamCells`, `OpenShift`, `OPEN_SHIFTS`, `TeamMetric`, `membersOfRole`, `teamMetrics`, `TeamAlertId`, `TeamAlertPreset`, `IDLE_OCCUPANCY`, `TEAM_ALERTS`, `alertsForRole` · piezas: Progress, StatusBadge · usa: @/app/i18n, @/features/branches
- **teamShared.tsx** — Las piezas chicas del módulo de equipo: la sucursal activa, el avatar, el rol y el estado de una persona, y l… · `MemberAvatar`, `MemberStatusBadge`, `RoleBadge`, `InfoCard`, `InfoRow`, `Stat` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, SectionHeader, StatusBadge, initialsOf · usa: @/app/i18n, @/lib/utils
- **teamUtils.ts** — Las ayudas sin JSX del módulo de equipo. · `useBranchId`, `branchName`, `WEEKDAYS`, `halfHours`, `orderedBarbers`, `orderedWeekdays`, `weekdayLabel`, `weeklyHours`, `overrideFor` · piezas: parseClock, useShellConfig · usa: @/features/branches
- **types.ts** — El contrato del equipo (docs/API_CONTRACT.md, «Equipo»): la ficha completa de cada persona, los niveles, el o… · `teamRoleSchema`, `TeamRole`, `memberStatusSchema`, `MemberStatus`, `workingRangeSchema`, `WorkingRange`, `levelSchema`, `Level`, `serviceOverrideSchema`, `ServiceOverride`, `compensationTypeSchema`, `CompensationType`, `compensationSchema`, `Compensation`, `paymentsSchema`, `Payments`, `permissionColumnSchema`, `PermissionColumn`, `permissionsSchema`, `Permissions`, `reminderChannelSchema`, `ReminderChannel`, `memberOptionsSchema`, `MemberOptions`, `weekScheduleSchema`, `WeekSchedule`, `memberSchema`, `TeamMember`, `membersResponseSchema`, `MembersResponse`, `levelsResponseSchema`, `lineupEntrySchema`, `LineupEntry`, `branchOrderSchema`, `BranchOrder`, `scheduleDaySchema`, `ScheduleDay`, `weekResponseSchema`, `WeekResponse`, `WeekRow`, `scheduleOverrideSchema`, `ProfileInput`, `MemberDraft`, `MemberPatch`, `profileInputSchema`, `TEAM_ROLE_KEYS`, `ROLE_PITCH_KEYS`, `MEMBER_STATUS_KEYS`, `COMPENSATION_TYPE_KEYS`, `CHANNEL_KEYS`, `isBarberRole`, `attendsChair`, `memberName`, `MemberTab`, `memberTabs`, `MEMBER_TAB_KEYS` · usa: @/app/i18n

### team/forms

- **CompensationForm.tsx** — La pestaña Compensación de un barbero por comisión: cómo se le paga cada servicio (comisión fija, de escala o… · `CompensationFormProps`, `CompensationForm`, `CompensationView` · piezas: Button, Field, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n
- **OptionsForm.tsx** — La pestaña Opciones: los interruptores que cambian cómo se agenda con esta persona, el intervalo, los recorda… · `OptionsFormProps`, `OptionsForm`, `OptionsView` · piezas: Button, Checkbox, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text · usa: @/app/i18n
- **PaymentsForm.tsx** — La pestaña Pagos de un barbero de renta: la base de la renta, las tres deducciones por los clientes que le pu… · `PaymentsFormProps`, `PaymentsForm`, `PaymentsView` · piezas: Field, Input, NumberField, Text · usa: @/app/i18n
- **PermissionsForm.tsx** — La pestaña Permisos: la matriz de esa persona. · `PermissionsFormProps`, `PermissionsForm` · piezas: Badge, Button, PermissionMatrix, Text · usa: @/app/i18n
- **ProfileForm.tsx** — La pestaña Perfil: la foto, los datos de contacto, la descripción, si se puede agendar, el nivel, las habilid… · `ProfileFormProps`, `ProfileForm`, `ProfileView` · piezas: Button, Field, ImageCropDialog, Input, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tag, Text, Textarea, UploadZone · usa: @/app/i18n, @/i18n
- **ScheduleForm.tsx** — La pestaña Calendario de la ficha: el horario fijo de la semana, una fila por día con su casilla y sus horas. · `ScheduleFormProps`, `ScheduleForm`, `ScheduleView` · piezas: Button, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, calendarLocale, formatClock, parseClock · usa: @/app/i18n, @/i18n
- **ServicesForm.tsx** — La pestaña Servicios: qué hace esta persona y, por servicio, sus valores propios (precio, precio para cliente… · `ServicesFormProps`, `ServicesForm`, `ServicesView` · piezas: Badge, Button, Checkbox, Field, IconTile, ListItem, ListItemGroup, ModalShell, NumberField, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/features/calendar

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

- **cascadeAnimation.ts** — Shared cascade reveal for accordion content: each line comes in on its own, not the whole block at once. · `CASCADE_EASE`, `CASCADE_ITEM_DURATION`, `CASCADE_STAGGER`, `CASCADE_DELAY_CHILDREN`, `CASCADE_CONTENT_GAP`, `cascadeContainer`, `cascadeItem`, `cascadeItemSettleTime`
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

- **demoBackend.ts** — Respuestas de ejemplo mientras no hay un modelo detrás. · `DemoBackendOptions`, `createDemoBackend` · usa: @/lib/help
- **history.ts** — Las conversaciones por cuándo se tocaron: Hoy, Ayer, Últimos 7 días, Anteriores. · `ConversationGroupKey`, `ConversationGroup`, `groupConversations`
- **speech.ts** — Un reconocedor continuo con resultados parciales; `null` si el navegador no puede. · `isSpeechRecognitionSupported`, `Recognizer`, `RecognizerOptions`, `createRecognizer`, `isSpeechSynthesisSupported`, `speak`
- **store.ts** — Las conversaciones, en un solo sitio. · `ChatPersistence`, `ChatStoreOptions`, `createChatStore`, `ChatStore`
- **types.ts** — El modelo de una conversación con el agente. · `ChatRole`, `ChatSource`, `ChatQuestion`, `ChatCard`, `ChatLink`, `ChatMessageStatus`, `ChatMessage`, `Conversation`, `ChatReply`, `ChatBackend`, `ChatState`

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

## Hooks · `src/hooks`

Hooks compartidos entre dominios.

- **useAnchorOffset.ts** — Marks the element a floating rail should line up with. · `ANCHOR_ATTRIBUTE`, `AnchorOffset`, `useAnchorOffset`
- **useAutosave.ts** — Autosave status for a document that persists itself on every change. · `AutosaveStatus`, `AutosaveState`, `useAutosave`
- **useClickOutside.ts** — Calls `onClose` when a press lands outside `ref`. · `useClickOutside`
- **useDebouncedValue.ts** — Retrasa el valor devuelto hasta que pase `delayMs` sin que `value` cambie. · `useDebouncedValue`
- **useDragReorder.ts** · `useDragReorder`
- **useDraggablePosition.ts** — Lets a `position: fixed` card be picked up by a grip and dropped anywhere on screen, falling back to its own… · `DraggablePosition`, `useDraggablePosition`
- **useReducedMotion.ts** — `true` cuando el sistema pide menos movimiento. · `useReducedMotion`
- **useReveal.ts** — Marca el elemento con `data-revealed="true"` la primera vez que entra en pantalla, para que la clase `reveal`… · `useReveal`
- **useScrollbarGutter.ts** — Width the scrollbar takes from a scrolling element, in px — 0 when it isn't scrolling or the platform uses ov… · `useScrollbarGutter`
- **useTilt.ts** — Inclina el elemento hacia el puntero (rotateX/rotateY con perspectiva). · `useTilt`

## Config · `src/config`

Configuración de la aplicación.

- **navigation.ts** · `NavItemConfig`, `navigationConfig`

## Mocks · `src/mocks`

MSW: implementa docs/API_CONTRACT.md.

- **browser.ts** — Service worker para el navegador; se arranca desde `main.tsx` cuando `env.useMocks`. · `worker`
- **db.ts** — Identidad de la empresa: su logo para fondos claros y, opcional, para oscuros. · `MockUserStatus`, `MockUserRole`, `MockUser`, `MockAuthProvider`, `MockAccount`, `seededRandom`, `seedUsers`, `ACCOUNTS`, `MockBranding`, `MockCalendarState`, `MockTeamState`, `MockDb`, `createDb`, `db`
- **handlers.ts** — Código por SMS del backend simulado; en producción cada envío genera uno distinto. · `OTP_CODE`, `MAX_LOGIN_FAILURES`, `handlers`
- **metrics.ts** — Las métricas del negocio, simuladas. · `BARBERS`, `daysOf`, `sum`, `round2`, `Appointment`, `DayRecord`, `simulateDay`, `PeriodTotals`, `totalsOf`, `countBy`, `daypartOf`, `MetricsQuery`, `SimulatedPeriod`, `simulatePeriod`, `periodOf`, `previousOf`, `buildBusinessMetrics` · piezas: fromIsoDate, periodRange, previousPeriodRange, toIsoDate · usa: @/features/metrics
- **metricsTabs.ts** · `buildCustomersMetrics`, `buildBarbersMetrics`, `buildMarketingMetrics`, `buildInsightsMetrics` · piezas: periodRange, toIsoDate · usa: @/features/metrics
- **random.ts** — Generador pseudoaleatorio con semilla (mulberry32): la misma semilla, la misma serie. · `seededRandom`
- **server.ts** — Servidor para Vitest (Node/jsdom); ver `src/test/setup.ts`. · `server`

### calendar

- **handlers.ts** — Expuesto para las pruebas: cuántos minutos dura la jornada de alguien un día. · `calendarHandlers`, `workingClock`
- **seed.ts** — Los datos del calendario del backend simulado: el equipo con su horario, los clientes, el catálogo y una agen… · `MockWorkingRange`, `MockBarber`, `MockClientType`, `MockNoteKind`, `MockClientNote`, `MockClient`, `MockService`, `MockProduct`, `MockAppointmentStatus`, `MockAppointmentSource`, `MockRepeatRule`, `MockPaymentMethod`, `MockHistoryEntry`, `MockPayment`, `MockAppointment`, `MockBlockCategory`, `MockBlockRepeat`, `MockTimeBlock`, `MockWaitlistEntry`, `MockSale`, `SERVICES`, `PRODUCTS`, `WALK_IN_CLIENT`, `seedClients`, `dateKey`, `localIso`, `parseClock`, `clockOf`, `SeedDayOptions`, `seedDay`, `seedBlocks`, `blockAppliesOn`

### team

- **handlers.ts** · `teamHandlers`
- **seed.ts** — El equipo del backend simulado: las personas de las cuatro sucursales con todo lo que guarda su ficha (perfil… · `MockTeamRole`, `MockTeamStatus`, `MockWorkingRange`, `MockLevel`, `MockServiceOverride`, `MockCompensationType`, `MockCompensation`, `MockPayments`, `MockPermissionColumn`, `MockPermissions`, `MockReminderChannel`, `MockMemberOptions`, `MockTeamMember`, `MockLineupEntry`, `MockBranchOrder`, `MockScheduleOverride`, `PERMISSION_ROWS`, `ROLE_PERMISSION_DEFAULTS`, `LEVELS`, `seedTeam`, `isBarberRole`, `barbersOf`, `seedOrders`, `seedOverrides`, `memberName`

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
- **buildTokens.ts** — Mapa `--variable` → valor, listo para `style.setProperty` o para un bloque CSS. · `ThemeMode`, `ResolvedMode`, `RadiusScale`, `ThemeTokens`, `RADIUS_FACTORS`, `buildRadiusTokens`, `DensityScale`, `DENSITY_FACTORS`, `buildSpacingTokens`, `ThemeFonts`, `buildFontTokens`, `buildThemeTokens`, `themeToCss`
- **color.ts** — Utilidades de color mínimas para derivar una paleta completa a partir de un único color primario. · `Hsl`, `hexToRgb`, `rgbToHex`, `hexToHsl`, `hslToHex`, `hslChannels`, `hexToChannels`, `shiftLightness`, `mix`, `relativeLuminance`, `contrastRatio`, `readableForeground`
- **fonts.ts** — Catálogo de tipografías que un tema puede usar. · `FontId`, `HeadingFontId`, `FontSource`, `FontOption`, `FONT_OPTIONS`, `DEFAULT_BODY_FONT`, `DEFAULT_HEADING_FONT`, `findFont`, `isFontId`, `resolveHeadingFont`, `fontStylesheetUrl`, `ensureFontLoaded`
- **presets.ts** — Profundidad del modo oscuro. · `NeutralTint`, `DarkDepth`, `ThemeTier`, `ThemePreset`, `THEME_PRESETS`, `DEFAULT_THEME_ID`, `findPreset`
- **themeContext.ts** · `THEME_STORAGE_KEY`, `ThemeContextValue`, `ThemeContext`, `useTheme`
- **useForcedPreset.ts** — Fuerza un preset mientras la pantalla está montada, sin tocar el que la persona eligió: no se guarda y al des… · `useForcedPreset`
