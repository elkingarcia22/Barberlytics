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
- `/configuracion` → SettingsPage
- `/configuracion/:seccion` → SettingsSectionPage
- `/403` → ForbiddenPage
- `/reservar` → BookingPage
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
- `GET /me/suggestion` · src/mocks/booking/handlers.ts
- `POST /customers` · src/mocks/booking/handlers.ts
- `POST /promo` · src/mocks/booking/handlers.ts
- `POST /reservations` · src/mocks/booking/handlers.ts
- `POST /otp/request` · src/mocks/booking/handlers.ts
- `POST /otp/verify` · src/mocks/booking/handlers.ts
- `GET /me/appointments` · src/mocks/booking/handlers.ts
- `PATCH /appointments/:id` · src/mocks/booking/handlers.ts
- `POST /appointments/:id/repeat` · src/mocks/booking/handlers.ts
- `POST /appointments/:id/cancel` · src/mocks/booking/handlers.ts
- `POST /reservations/:id/receipt` · src/mocks/booking/handlers.ts
- `GET /calendar/catalog` · src/mocks/calendar/handlers.ts
- `GET /calendar/day` · src/mocks/calendar/handlers.ts
- `GET /calendar/month` · src/mocks/calendar/handlers.ts
- `POST /appointments` · src/mocks/calendar/handlers.ts
- `PATCH /appointments/:id` · src/mocks/calendar/handlers.ts
- `POST /appointments/:id/checkout` · src/mocks/calendar/handlers.ts
- `POST /clients/:id/notes` · src/mocks/calendar/handlers.ts
- `PATCH /clients/:id/notes/:noteId` · src/mocks/calendar/handlers.ts
- `DELETE /clients/:id/notes/:noteId` · src/mocks/calendar/handlers.ts
- `POST /blocks` · src/mocks/calendar/handlers.ts
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
- `GET /expenses` · src/mocks/expenses/handlers.ts
- `POST /expenses` · src/mocks/expenses/handlers.ts
- `PATCH /expenses/:id` · src/mocks/expenses/handlers.ts
- `DELETE /expenses/:id` · src/mocks/expenses/handlers.ts
- `POST /auth/otp/request` · src/mocks/handlers.ts
- `POST /auth/otp/verify` · src/mocks/handlers.ts
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
- `GET /payroll` · src/mocks/payroll/handlers.ts
- `GET /products` · src/mocks/products/handlers.ts
- `PUT /products/activation` · src/mocks/products/handlers.ts
- `GET /products/:id` · src/mocks/products/handlers.ts
- `POST /products` · src/mocks/products/handlers.ts
- `PATCH /products/:id` · src/mocks/products/handlers.ts
- `DELETE /products/:id` · src/mocks/products/handlers.ts
- `POST /product-categories` · src/mocks/products/handlers.ts
- `PATCH /product-categories/:id` · src/mocks/products/handlers.ts
- `DELETE /product-categories/:id` · src/mocks/products/handlers.ts
- `GET /services` · src/mocks/services/handlers.ts
- `PUT /services/order` · src/mocks/services/handlers.ts
- `PUT /services/activation` · src/mocks/services/handlers.ts
- `GET /services/:id` · src/mocks/services/handlers.ts
- `POST /services` · src/mocks/services/handlers.ts
- `PATCH /services/:id` · src/mocks/services/handlers.ts
- `DELETE /services/:id` · src/mocks/services/handlers.ts
- `PUT /services/:id/team` · src/mocks/services/handlers.ts
- `POST /service-categories` · src/mocks/services/handlers.ts
- `PATCH /service-categories/:id` · src/mocks/services/handlers.ts
- `DELETE /service-categories/:id` · src/mocks/services/handlers.ts
- `GET /settings/lists/:list` · src/mocks/settings/handlers.ts
- `POST /settings/lists/:list` · src/mocks/settings/handlers.ts
- `PATCH /settings/lists/:list/:id` · src/mocks/settings/handlers.ts
- `DELETE /settings/lists/:list/:id` · src/mocks/settings/handlers.ts
- `POST /settings/payments/test` · src/mocks/settings/handlers.ts
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
- `GET /transactions` · src/mocks/transactions/handlers.ts

## App · `src/app`

Router, providers, layout, navegación y páginas de error.

### chat

- **index.ts** — El chat de la app: un solo almacén de conversaciones para el panel, la pantalla completa y el modo voz, y qui… · `chatStore`, `AppChatLabels`, `createAppChatBackend` · usa: @/help/chat, @/help/content, @/lib/chat

### components

- **PageLoader.tsx** — Loader de página completa: para rutas perezosas y la resolución de sesión. · `PageLoader`
- **RouteError.tsx** — Límite de error de las rutas: atrapa lo que reviente al renderizar una página (o al cargarla en diferido) y l… · `RouteError` · piezas: Button · usa: @/lib/api, @/lib/query

### i18n/booking

- **en.ts** — Online booking in English. · `bookingEn`
- **es.ts** — La reserva en línea: lo que lee el cliente de la barbería, no quien la administra. · `bookingEs`

### i18n

- **en.ts** — Inglés de la aplicación. · `appEn`
- **es.ts** — El diccionario **de la aplicación**, no el del sistema de diseño. · `appEs`
- **index.ts** — El diccionario de esta aplicación, listo para `<LocaleProvider messages={…}>`. · `APP_MESSAGES`, `appEs`, `appEn` · usa: @/i18n
- **types.ts** — Toda clave de la aplicación, sacada de su diccionario español. · `AppMessageKey`, `AppMessageCatalog`
- **useAppT.ts** — `t()` con las claves de esta aplicación autocompletadas, más las del sistema: una pantalla dice tanto "users.… · `useAppT` · usa: @/i18n

### layouts

- **AgentButton.tsx** — El agente de IA en la cabecera de todas las pantallas: un botón del mismo tamaño que las demás acciones, con… · `AgentButton` · piezas: AiSparkGlyph, Button, useRailVisible · usa: @/app/i18n
- **AppLayout.tsx** · `AppLayout` · piezas: AdminShell, AiSparkGlyph, ChatPanel, ChatProvider, ChatScreen, ChatVoiceMode, PageHeaderExtrasProvider, PersonalizationMenu, RailAgentProvider · usa: @/features/access, @/features/auth, @/features/branches, @/features/branding, @/features/feedback, @/features/settings, @/features/team, @/help/HelpGuidesDrawer, @/help/content, @/i18n, @/lib/chat, @/themes

- **lazyPages.ts** — Cada pantalla se carga en diferido: el primer render solo trae el shell. · `DashboardPage`, `CalendarPage`, `CustomersPage`, `CustomerProfilePage`, `ServicesPage`, `ServiceProfilePage`, `ServiceOrderPage`, `ProductsPage`, `ProductProfilePage`, `TransactionsPage`, `ExpensesPage`, `PayrollPage`, `MyPayPage`, `MemberProfilePage`, `MemberWizardPage`, `WorkHoursPage`, `LevelsPage`, `BarberOrderPage`, `LineupPage`, `MetricsPage`, `TeamHomePage`, `UsersPage`, `DocsApp`, `BookingPage`, `HelpApp`, `SettingsPage`, `SettingsSectionPage`, `SectionPlaceholderPage`
- **navigation.ts** — El árbol con los rótulos ya traducidos. · `buildAppNavigation`, `APP_NAVIGATION`, `findActiveNavId`, `showsLegalFooter` · usa: @/features/access
- **providers.tsx** — Los providers globales, en el orden en que dependen unos de otros: la caché de datos primero, el idioma y el… · `AppProviders` · piezas: ThemaToaster, TooltipProvider · usa: @/features/auth, @/i18n, @/lib/query, @/themes
- **router.tsx** · `router` · usa: @/features/access, @/features/auth, @/features/sections

### pages

- **ForbiddenPage.tsx** · `ForbiddenPage` · piezas: Button, EmptyState
- **NotFoundPage.tsx** · `NotFoundPage` · piezas: Button, EmptyState

## Dominios · `src/features`

Una carpeta por dominio: pantalla, tipos, api, queries.

### access

- **AccessContext.tsx** — Lo monta el layout de la app con el rol efectivo (el propio o el de «Ver como»). · `AccessProvider`, `RequireArea`, `RoleHome`
- **access.ts** — Todo lo de la sucursal o solo lo suyo (su columna, sus clientes, sus cifras). · `AccessScope`, `AccessMember`, `Access`, `TEAM_ROLES`, `isBarberRole`, `ROLE_HOME`, `teamRoleFromSession`, `DEMO_MEMBER`, `buildAccess`, `AccessArea`, `canOpen` · usa: @/features/team
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
- **SignupPanel.tsx** — Crear cuenta: los datos de la persona y de la barbería. · `SignupPanelProps`, `SignupPanel` · piezas: Button, Heading, Input, NumberField, PHONE_COUNTRIES, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text · usa: @/app/i18n, @/icons, @/lib/api
- **SupportTicketPanel.tsx** — De dónde viene la persona: prellena lo que ya se sabe. · `TicketContext`, `SupportTicketPanelProps`, `SupportTicketPanel` · piezas: Button, Heading, Input, PhoneInput, Text, Textarea · usa: @/app/i18n, @/icons, @/lib/api
- **api.ts** · `authApi` · llama: POST /auth/otp/request, POST /auth/otp/verify, POST /auth/oauth, GET /auth/me, POST /auth/logout, POST /auth/recovery/request, GET /auth/backup-email, POST /auth/backup-email, POST /auth/backup-email/verify, DELETE /auth/backup-email, POST /auth/signup, POST /support/tickets · usa: @/lib/api
- **authContext.ts** · `AuthContextValue`, `AuthContext`
- **authErrors.ts** — Pinta en su campo los errores `fields` del servidor. · `applyServerFieldErrors`, `isLockedError`, `attemptsLeftFrom` · usa: @/lib/api
- **authFormParts.tsx** — Etiqueta, control y mensaje de error enlazados por `id`. · `FieldControlProps`, `AuthField`, `FormErrorAlert`, `BackButton` · piezas: Alert, AlertDescription, AlertTitle, Button, Label, Text · usa: @/icons
- **backupEmailQueries.ts** — El correo de respaldo de quien tiene la sesión. · `backupEmailKeys`, `useBackupEmailQuery`, `useBackupEmailMutations`
- **phoneLabel.ts** — «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. · `describePhone` · piezas: formatNational, parseE164
- **providers.ts** — Pide al proveedor (Google Identity Services, MSAL para Outlook) la credencial con la que el backend abre la s… · `requestProviderCredential` · usa: @/lib/api
- **timezones.ts** — Zonas IANA de cada país que ofrece `PhoneInput`; la primera es la más poblada. · `COUNTRY_TIMEZONES`, `describeTimezone`, `timezonesFor`
- **tokenStorage.ts** — Dónde vive el token de acceso en el navegador. · `TokenStorage`, `sessionTokenStorage`, `createMemoryTokenStorage`
- **types.ts** — Celular en E.164 tal como lo emite `PhoneInput`, completo según el país: un celular de Colombia tiene 10 dígi… · `userRoleSchema`, `UserRole`, `phoneSchema`, `authUserSchema`, `AuthUser`, `sessionSchema`, `Session`, `otpChannelSchema`, `OtpChannel`, `otpRequestSchema`, `OtpRequest`, `OTP_LENGTH`, `otpVerifySchema`, `OtpVerify`, `authProviderSchema`, `AuthProvider`, `recoveryRequestSchema`, `RecoveryRequest`, `signupRequestSchema`, `SignupRequest`, `backupEmailSchema`, `BackupEmail`, `backupEmailRequestSchema`, `BackupEmailRequest`, `backupEmailVerifySchema`, `BackupEmailVerify`, `ticketReasonSchema`, `TicketReason`, `supportTicketSchema`, `SupportTicketRequest`, `supportTicketResponseSchema`, `SupportTicketResponse`, `AuthStatus` · piezas: parseE164
- **useAuth.ts** — El usuario autenticado; lanza si se usa fuera de una ruta protegida. · `useAuth`, `useCurrentUser`

### booking

- **BookingFlow.tsx** — La reserva en línea entera, lista para montarse donde haga falta: a pantalla completa en una tablet del local… · `BookingFlowProps`, `BookingFlow` · piezas: Grain, Halo, PortalContainerProvider, Skeleton · usa: @/app/i18n, @/lib/query, @/lib/utils
- **BookingPage.tsx** — «Agendamiento online»: la reserva que ve el cliente de la barbería. · `BookingPage` · piezas: Badge, Button, Grain, SegmentedControl, Text · usa: @/app/i18n, @/icons, @/themes/ThemeSelector
- **api.ts** — Contrato de la reserva en línea; ver docs/API_CONTRACT.md. · `bookingApi` · llama: GET /booking/shop, GET /booking/branches/${branchId}, GET /booking/catalog, GET /booking/availability, GET /booking/alternatives, GET /booking/earliest, POST /booking/waitlist, DELETE /booking/waitlist/${id}, GET /booking/me/suggestion, POST /booking/customers, POST /booking/promo, POST /booking/reservations, POST /booking/otp/request, POST /booking/otp/verify, GET /booking/me/appointments, PATCH /booking/appointments/${id}, POST /booking/appointments/${id}/repeat, POST /booking/appointments/${id}/cancel, POST /booking/reservations/${reservationId}/receipt · usa: @/lib/api
- **bookingFormat.ts** — Una fecha como «AAAA-MM-DDTHH:mm». · `dayKeyOf`, `toStart`, `parseStart`, `clockMinutes`, `BookingFormatters`, `useBookingFormat`, `buildIcs`, `downloadIcs`, `initialsOf`, `isTodayOver`, `firstBookableDay`, `isSameDayAs`, `formatPhone`, `DayHours`, `OpenState`, `openStateOf`, `WEEK_ORDER` · usa: @/i18n
- **bookingState.ts** — El recorrido de la reserva como datos: en qué paso está, quién reserva, la cita que se está armando y las que… · `BookingStep`, `BookingPerson`, `DraftItem`, `BookingState`, `BookingAction`, `initialBookingState`, `bookingReducer`, `PROGRESS_STEPS`, `ProgressStep`, `progressSteps`, `progressIndex`, `personName`, `defaultBranchId`
- **pricing.ts** — Las cuentas de una reserva en línea, sin interfaz: cuánto suman las citas y los productos, qué descuenta un c… · `TipKind`, `TipOption`, `Promo`, `PROMOS`, `PromoProblem`, `PromoContext`, `findPromo`, `promoDiscount`, `tipAmount`, `CardFeeRule`, `TotalsInput`, `Totals`, `chargesCardFee`, `computeTotals`, `depositOf`, `feeLabel`, `CancellationInput`, `CancellationTerms`, `cancellationTerms`, `renderPolicy`
- **queries.ts** — Claves jerárquicas: reservar o cancelar invalida la disponibilidad y «Mis citas» sin tocar el catálogo. · `bookingKeys`, `useBookingShopQuery`, `useBranchDetailQuery`, `useBookingCatalogQuery`, `AvailabilityParams`, `useAvailabilityQuery`, `useAlternativesQuery`, `useEarliestQuery`, `useJoinWaitlistMutation`, `useLeaveWaitlistMutation`, `useVisitSuggestionQuery`, `useRequestCodeMutation`, `useVerifyCodeMutation`, `useCreateCustomerMutation`, `useReserveMutation`, `useRepeatMutation`, `useMyAppointmentsQuery`, `useRescheduleMutation`, `useCancelMutation`, `useSendReceiptMutation`
- **types.ts** — El contrato de la reserva en línea (docs/API_CONTRACT.md, «Reserva en línea»). · `tipOptionSchema`, `bookingBranchSchema`, `BookingBranch`, `bookingShopSchema`, `BookingShop`, `branchDetailSchema`, `BranchDetail`, `bookingServiceSchema`, `BookingService`, `bookingBarberSchema`, `BookingBarber`, `bookingProductSchema`, `BookingProduct`, `bookingCatalogSchema`, `BookingCatalog`, `bookingGuestSchema`, `BookingGuest`, `lastVisitSchema`, `LastVisit`, `savedCardSchema`, `SavedCard`, `bookingCustomerSchema`, `BookingCustomer`, `visitSuggestionSchema`, `VisitSuggestion`, `suggestionResponseSchema`, `otpSentSchema`, `OtpSent`, `slotSchema`, `Slot`, `availabilitySchema`, `Availability`, `alternativeSchema`, `Alternative`, `alternativesSchema`, `Alternatives`, `earliestSchema`, `Earliest`, `waitlistWindowSchema`, `WaitlistWindow`, `waitlistJoinedSchema`, `WaitlistJoined`, `WaitlistInput`, `bookedStatusSchema`, `BookedStatus`, `bookedAppointmentSchema`, `BookedAppointment`, `repeatResultSchema`, `RepeatResult`, `totalsSchema`, `payMethodSchema`, `PayMethod`, `reservationSchema`, `Reservation`, `myAppointmentsSchema`, `MyAppointments`, `otpVerifySchema`, `OtpVerify`, `cancelResultSchema`, `CancelResult`, `receiptSentSchema`, `ReceiptSent`, `NewCustomerInput`, `ReservationItemInput`, `ReservationInput`, `RescheduleInput`
- **useBookingTotals.ts** — Lo que vale una cita: con barbero elegido, su precio; sin preferencia, el más bajo de quienes la pueden hacer… · `itemPrice`, `itemDuration`, `useBookingTotals`, `DraftOrderLine`, `draftOrderLines`

### booking/flow

- **AlternativeBarbers.tsx** — Cuando el barbero elegido no tiene horas ese día: otros que hacen los mismos servicios, ordenados por cuánto… · `AlternativeBarbers` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, Button, Heading, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **AppointmentCard.tsx** — Una cita como la lee el cliente, la misma en el resumen, en la confirmación y en «Mis citas». · `AppointmentCardData`, `AppointmentCard` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **BarberProfileDrawer.tsx** — El perfil de un barbero: quién es, sus trabajos y lo que cobra por cada servicio. · `BarberProfileDrawer` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Chip, DrawerShell, Heading, Text · usa: @/app/i18n, @/icons
- **BookingContext.ts** — Lo que comparten los pasos de la reserva: el estado, la barbería, el catálogo de la sede elegida, los formato… · `BookingLayout`, `BookingFlowValue`, `BookingFlowProvider`, `useBookingFlow`
- **BookingHeader.tsx** — La cabecera de la reserva: quién es la barbería (y en qué sede), volver y cuánto falta. · `BookingHeader` · piezas: Button, Progress, Stepper, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **BookingSheet.tsx** — Las decisiones cortas de la reserva (cambiar de sede, para quién es, cancelar, enviar el recibo): en celular,… · `BookingSheet` · piezas: DrawerShell
- **BookingSummaryAside.tsx** — En monitor, la reserva que se va armando queda a la derecha todo el tiempo: la sede, cada cita y el total. · `BookingSummaryAside` · piezas: Heading, IconTile, Text · usa: @/app/i18n, @/icons
- **BranchChange.tsx** — La sede de la reserva, en el resumen: dónde será y un botón para cambiarla. · `BranchChange` · piezas: Alert, AlertDescription, Button, IconTile, OptionTile, Text · usa: @/app/i18n, @/icons
- **BranchProfileSheet.tsx** — El perfil de una sede, para decidir dónde reservar: fotos, si está abierta ahora, cómo llegar, el horario de… · `BranchProfileSheet` · piezas: Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Badge, Button, DrawerShell, Heading, IconTile, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **CancelDialog.tsx** — Cancelar, con las cuentas a la vista antes de confirmar: si todavía es gratis, hasta cuándo; si no, cuánto se… · `CancelDialog` · piezas: Alert, AlertDescription, Button, OptionTile, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **CardBrandMark.tsx** — La marca de la red como se reconoce de un vistazo: el nombre en su estilo o, en Mastercard, los dos círculos. · `CardBrandMark` · usa: @/lib/utils
- **CardForm.tsx** — Una tarjeta nueva: la tarjeta dibujada arriba refleja lo que se escribe y marca dónde va cada dato (el CVC la… · `CardForm` · piezas: Checkbox, Field, Input, Text · usa: @/app/i18n, @/lib/utils
- **CardPreview.tsx** — La tarjeta dibujada mientras se escribe, como en las apps de pago: el número se va llenando, se reconoce la m… · `CardField`, `CardPreview` · usa: @/app/i18n, @/lib/utils
- **EarliestSlot.tsx** — «Lo antes posible»: el primer hueco libre desde hoy, arriba de todo y en un toque, para quien quiere cortarse… · `EarliestSlot` · piezas: Button, IconTile, Skeleton, Text · usa: @/app/i18n, @/icons
- **GalleryViewer.tsx** — La galería a pantalla completa: la foto ocupa el dispositivo, se pasa con el dedo (o con las flechas y el tec… · `GalleryViewer` · piezas: Button, Carousel, CarouselContent, CarouselItem, Dialog, DialogContent, DialogDescription, DialogTitle, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ManageSignIn.tsx** — Entrar a «Mis citas»: el celular y un código por SMS. · `ManageSignIn` · piezas: Button, Field, InputOtp, PhoneInput, Spinner, Text · usa: @/app/i18n, @/lib/api
- **NewCardSheet.tsx** — Agregar una tarjeta en su propia hoja, como el catálogo de productos o el perfil del barbero: la tarjeta dibu… · `NewCardSheet` · piezas: Button · usa: @/app/i18n, @/icons
- **NextVisitSuggestion.tsx** — Lo que le toca según su frecuencia de visita: el día (su última visita más su ritmo) y la hora a la que suele… · `NextVisitSuggestion` · piezas: Button, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **OrderSummary.tsx** — «Tu orden»: lo comprado, el descuento, el impuesto, la propina, los cargos (recargo por tarjeta) y el total,… · `OrderLine`, `OrderSummary` · piezas: Separator, Text · usa: @/app/i18n
- **PersonPicker.tsx** — «¿Para quién es la cita?». · `PersonPicker` · piezas: Avatar, AvatarFallback, Button, Chip, Field, Heading, Input, ListItem, ListItemGroup, Text · usa: @/app/i18n, @/icons
- **PhotoStrip.tsx** — Una tira de fotos que se recorre arrastrando —con el dedo o con el mouse— o con las flechas, sin tener que ab… · `PhotoStrip` · piezas: Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious · usa: @/app/i18n, @/icons, @/lib/utils
- **PickedProducts.tsx** — Lo que ya va en la reserva, se haya sumado desde el carrusel o desde el catálogo completo: una fila por produ… · `PickedProducts` · piezas: IconTile, NumberField, Text · usa: @/app/i18n, @/icons
- **ProductCard.tsx** — Un producto de la tienda, con su foto y el botón para sumarlo; ya en la reserva, el mismo hueco se vuelve un… · `ProductCard` · piezas: Button, IconTile, NumberField, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ProductCatalogDrawer.tsx** — Toda la tienda de la sede, ordenada como en el módulo de Productos: por categoría (Styling, Barba, Cuidado…),… · `ProductCatalogDrawer` · piezas: Button, Chip, DrawerShell, EmptyState, Heading, Input, Text · usa: @/app/i18n, @/icons
- **PromoField.tsx** — El cupón: se valida en el servidor y, si aplica, queda como un chip que se puede quitar, con lo que ahorra. · `PromoField` · piezas: Button, Chip, Field, Input, Text · usa: @/app/i18n, @/lib/api
- **ReceiptView.tsx** — El recibo de una reserva: número, lo cobrado por cita y producto, y con qué se pagó. · `ReceiptView` · piezas: Badge, Heading, Text · usa: @/app/i18n
- **RepeatOffer.tsx** — «¿La dejamos fija?»: tras reservar, las próximas con el mismo barbero y a la misma hora, cada tantas semanas. · `RepeatOffer` · piezas: Button, Heading, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/api
- **RescheduleDrawer.tsx** — Cambiar la hora sin llamar: las horas libres para el mismo barbero (o para cualquiera, si lo prefiere) y un b… · `RescheduleDrawer` · piezas: Alert, AlertDescription, Button, DrawerShell, Label, Spinner, Switch, Text, TimeSlotPicker · usa: @/app/i18n, @/icons, @/lib/api, @/lib/useResetOnChange
- **SavedCardPicker.tsx** — Cómo paga con tarjeta: las que ya guardó (marca, •••• últimos 4, vence), la nueva que acaba de agregar y «Agr… · `NEW_CARD`, `SavedCardPicker` · piezas: Badge, Button, Input, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **SendReceiptDialog.tsx** — Reenviar el recibo a un correo o a un celular; trae los del cliente ya puestos. · `SendReceiptDialog` · piezas: Button, Field, Input, PhoneInput, SegmentedControl, Spinner · usa: @/app/i18n, @/lib/api, @/lib/useResetOnChange
- **ShopBrand.tsx** — La marca de la barbería en la reserva: la misma pieza del menú lateral de la app. · `ShopBrand` · piezas: BrandSlot
- **StepLayout.tsx** — El molde de cada paso: título que dice qué se decide aquí, el contenido y un pie pegado abajo con el botón pr… · `StepLayout` · piezas: Heading, Text · usa: @/lib/utils
- **WaitlistCard.tsx** — La lista de espera: siempre a mano, haya horas o no —puede que ninguna de las libres le sirva—. · `WaitlistCard` · piezas: Button, Heading, IconTile, SegmentedControl, Text · usa: @/app/i18n, @/icons
- **cardValidation.ts** — La tarjeta escrita a mano: cómo se agrupa mientras se teclea y qué le falta para poder cobrarse. · `digitsOf`, `groupCard`, `groupExpiry`, `CardBrand`, `cardBrandOf`, `brandFromName`, `cvcLengthOf`, `CardValues`, `cardErrors`, `isCardComplete`, `isCvcComplete`
- **drawerFit.ts** — El drawer de abajo se limita por defecto al alto de la ventana (`100dvh`). · `DRAWER_FIT_STYLE`
- **stepWidth.ts** — El ancho de lectura de un paso: la columna del contenido, no la de la barra del pie, que va de lado a lado. · `STEP_WIDTH`

### booking/preview

- **DemoHints.tsx** — Los datos para probar la demo: qué celular es un cliente que vuelve, cuál está bloqueado, la tarjeta que se r… · `DemoHints` · piezas: Button, Popover, PopoverContent, PopoverTrigger, Text · usa: @/app/i18n, @/icons
- **DemoSite.tsx** — Un sitio de barbería de ejemplo con el widget puesto: el botón flotante abajo a la derecha abre la reserva en… · `DemoSite` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Grain, Halo, Heading, IconTile, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **DeviceFrame.tsx** — La silueta de la pantalla donde el cliente ve la reserva: un celular, la tablet del local o un monitor con su… · `PreviewDevice`, `DeviceFrame` · piezas: Text · usa: @/icons, @/lib/utils

### booking/steps

- **BarberStep.tsx** — El barbero: «Sin preferencia» primero —es el que más horas abre— y luego cada uno con su foto, su nivel, lo q… · `BarberStep` · piezas: Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Button, IconTile, MagicCard, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **BlockedStep.tsx** — El número está bloqueado por la barbería: no se explica por qué, se ofrece el teléfono. · `BlockedStep` · piezas: Button, EmptyState · usa: @/app/i18n, @/icons
- **BranchStep.tsx** — La sede, con foto: se reconoce el local antes que la dirección. · `BranchStep` · piezas: Alert, AlertDescription, Button, IconTile, MagicCard, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ConfirmedStep.tsx** — Hecho. · `ConfirmedStep` · piezas: Badge, Button, Heading, Text · usa: @/app/i18n, @/icons, @/lib/utils
- **ManageStep.tsx** — «Mis citas»: lo que viene (cambiar la hora o cancelar, con la política a la vista), lo que ya pasó (volver a… · `ManageStep` · piezas: Badge, Button, EmptyState, IconTile, ListItem, ListItemGroup, Skeleton, Text, ThemaTabs · usa: @/app/i18n, @/icons
- **PaymentStep.tsx** — Pagar: la propina para el barbero, un cupón y cómo se paga. · `PaymentStep` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, OptionTile, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **PhoneStep.tsx** — La puerta: el celular. · `PhoneStep` · piezas: Button, Field, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **ProfileStep.tsx** — Quien reserva por primera vez: lo justo para crear su ficha en la barbería. · `ProfileStep` · piezas: Button, Checkbox, Field, Input, Label, PhoneInput, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **ReviewStep.tsx** — El carrito: cada cita en su tarjeta (con cambiar y quitar), sumar otra —para la misma persona otro día o para… · `ReviewStep` · piezas: Button, Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, Collapsible, CollapsibleContent, CollapsibleTrigger, EmptyState, Field, Heading, IconTile, MagicCard, Text, Textarea · usa: @/app/i18n, @/icons, @/lib/utils
- **ServicesStep.tsx** — Los servicios: varios en la misma cita (corte + barba), con foto, cuánto duran y desde cuánto. · `ServicesStep` · piezas: Badge, Button, Chip, EmptyState, IconTile, Input, MagicCard, Skeleton, Text · usa: @/app/i18n, @/hooks/useDragScroll, @/icons, @/lib/utils
- **TimeStep.tsx** — Cuándo: el día en una tira y solo las horas libres de ese día, para el barbero elegido o para cualquiera. · `TimeStep` · piezas: Avatar, AvatarFallback, AvatarImage, Button, Heading, IconTile, Text, TimeSlotPicker · usa: @/app/i18n, @/icons
- **VerifyStep.tsx** — El código que llegó al celular. · `VerifyStep` · piezas: Button, Field, InputOtp, Spinner, Text · usa: @/app/i18n, @/icons, @/lib/api
- **WelcomeStep.tsx** — El cliente que vuelve: lo más probable es que quiera lo mismo de la última vez, así que eso va primero y a un… · `WelcomeStep` · piezas: Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Button, Heading, IconTile, Separator, Skeleton, Text · usa: @/app/i18n, @/icons

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

- **AppointmentDrawer.tsx** — El panel de una cita. · `AppointmentDrawerProps`, `AppointmentDrawer` · piezas: SidePanelShell, ThemaTabs, calendarLocale · usa: @/app/i18n, @/i18n
- **BlockDrawer.tsx** — Crear bloqueo: una franja del barbero que deja de estar disponible — almuerzo, reunión, enfermedad, vacacione… · `BlockDrawerProps`, `BlockDrawer` · piezas: Button, DatePicker, DrawerSection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Text, Textarea, parseClock · usa: @/app/i18n, @/i18n, @/lib/api
- **CalendarAgendaView.tsx** — La vista Agenda: las citas del día una debajo de otra, repartidas en mañana, tarde y noche, con el cliente, e… · `CalendarAgendaViewProps`, `CalendarAgendaView` · piezas: Button, EmptyState, ListItem, ListItemGroup, RowContextMenu, ScheduleColorDot, ScheduleMarkers, Text, minutesOfDay, scheduleColorClass · usa: @/app/i18n, @/i18n, @/lib/utils
- **CalendarAssistantDrawer.tsx** — El asistente del día: lo que la agenda pide mirar, como tarjetas de IA del sistema con su acción, y un campo… · `CalendarAssistantDrawerProps`, `CalendarAssistantDrawer` · piezas: AIButton, AIInsightCard, AIPanel, Field, SidePanelShell, Text, Textarea, formatClock · usa: @/app/i18n, @/i18n
- **CalendarDayView.tsx** — La vista Día: la rejilla por barbero con lo que se puede hacer desde ella —agendar en un hueco, abrir una cit… · `CalendarDayViewProps`, `CalendarDayView` · piezas: Button, Chip, EmptyState, ResourceDayGrid, calendarLocale, minutesOfDay, parseClock · usa: @/app/i18n, @/i18n
- **CalendarFilters.tsx** — El control de filtros de la agenda: qué citas se miran —en qué estado están, de qué servicio son y qué tipo d… · `ServiceFilterOption`, `ClientTypeFilterOption`, `CalendarFilterSelection`, `CalendarFiltersProps`, `CalendarFilters` · piezas: Button, Checkbox, Popover, PopoverContent, PopoverTrigger, ScheduleColorDot, Switch, Text · usa: @/app/i18n, @/lib/utils
- **CalendarMonthView.tsx** — La vista Mes: la ocupación de un barbero (o del equipo) día por día, con tres cifras arriba —citas del mes, o… · `CalendarMonthViewProps`, `CalendarMonthView` · piezas: KpiCard, MonthOccupancyGrid, Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue, Skeleton, Text · usa: @/app/i18n, @/i18n, @/lib/query
- **CalendarPage.tsx** · `CalendarPageProps`, `CalendarPage` · piezas: Breadcrumbs, ConfirmDialog, DataListActionRail, ScreenHeaderActions, ShellHeaderSlot, ShellRailSlot, Skeleton, Text, atMinutes, formatClock, formatClockRange, minutesOfDay, useActionsPlacement, usePageHeaderExtras, useShellConfig · usa: @/app/i18n, @/features/access, @/features/branches, @/i18n, @/lib/api, @/lib/query
- **CalendarToolbar.tsx** — La barra del calendario y, a la vez, su cabecera: no hay título encima —las migas ya dicen dónde estás— para… · `CalendarToolbarProps`, `CalendarToolbar` · piezas: Button, Calendar, DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuTrigger, Popover, PopoverContent, PopoverTrigger, calendarLocale · usa: @/app/i18n, @/i18n
- **CalendarViewOptions.tsx** — Cómo se ve la agenda, separado de qué se ve (eso es `CalendarFilters`). · `CalendarViewOptionsProps`, `CalendarViewOptions` · piezas: Button, Popover, PopoverContent, PopoverTrigger, SegmentedControl, Switch, scheduleColorClass · usa: @/app/i18n, @/lib/utils
- **CalendarWeekView.tsx** — La vista Semana: una fila por barbero y una columna por día, con cuánto de su jornada tiene reservado y cuánt… · `CalendarWeekViewProps`, `CalendarWeekView` · piezas: Button, Progress, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/i18n, @/lib/query, @/lib/utils
- **CheckoutDrawer.tsx** — Cobrar una cita: los servicios y productos de la cuenta, la propina para el barbero, cómo paga el cliente y e… · `CheckoutDrawerProps`, `CheckoutDrawer` · piezas: Button, Chip, DrawerSection, Field, ListItem, ListItemGroup, NumberField, RadioCardGroup, SearchableSelect, SidePanelShell, Text · usa: @/app/i18n, @/features/settings, @/lib/api
- **CollectionsDrawer.tsx** — La lista de cobros: las citas del día que faltan por pagar y las que ya se cobraron, con el total de cada pes… · `CollectionsDrawerProps`, `CollectionsDrawer` · piezas: Button, EmptyState, ListItem, ListItemGroup, SidePanelShell, Text, ThemaTabs, calendarLocale · usa: @/app/i18n, @/i18n, @/lib/query
- **CreateAppointmentDrawer.tsx** — Crear cita: cliente, servicio (uno o varios), barbero y fecha & hora, el interruptor de «cliente sin cita pre… · `CreateAppointmentInitial`, `CreateAppointmentDraft`, `CreateAppointmentDrawerProps`, `CreateAppointmentDrawer` · piezas: AiGeneratedBadge, Button, Chip, DrawerSection, Field, MultiSelect, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Switch, Text, Textarea, TimeSlotPicker, formatClock, formatClockRange, isWorkingAt, minutesOfDay · usa: @/app/i18n, @/lib/api
- **GapsDrawer.tsx** — Los huecos del día en un panel junto a la agenda: cuánto tiempo libre queda, cuánto se podría vender todavía… · `GapsDrawerProps`, `GapsDrawer` · piezas: Button, Chip, EmptyState, ListItem, ListItemGroup, SegmentedControl, SidePanelShell, Text, formatClockRange · usa: @/app/i18n
- **QuickSaleDrawer.tsx** — Venta rápida de productos: para quien se lleva una cera sin tener cita. · `QuickSaleDrawerProps`, `QuickSaleDrawer` · piezas: Button, DrawerSection, Field, Input, ListItem, ListItemGroup, NumberField, RadioCardGroup, SegmentedControl, SidePanelShell, Text · usa: @/app/i18n, @/lib/api
- **ReflowBanner.tsx** — La franja que acompaña a un plan de reacomodo mientras se ve en la agenda: cuántas citas se corren, cuánto, s… · `ReflowBannerProps`, `ReflowBanner` · piezas: AiGeneratedBadge, AttentionStrip, Button, formatClock · usa: @/app/i18n
- **TeamPicker.tsx** — A quién se ve en la agenda: los que trabajan ese día, todo el equipo, o los barberos que se marquen —uno o va… · `TeamPickerProps`, `TeamPicker` · piezas: Button, Checkbox, Popover, PopoverContent, PopoverTrigger · usa: @/app/i18n, @/icons/ThemaIcon, @/lib/utils
- **WaitlistDrawer.tsx** — La lista de espera: quién espera un hueco, para qué servicio, con quién y en qué franjas le sirve. · `WaitlistDrawerProps`, `WaitlistDrawer` · piezas: Badge, Button, DatePicker, DrawerSection, EmptyState, Field, ListItem, ListItemGroup, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, Text, formatClock · usa: @/app/i18n, @/i18n, @/lib/api, @/lib/query
- **WalkInSaleDrawer.tsx** — Venta sin cita: registrar un servicio que ya se hizo sin agendar —fecha, hora, cliente, servicio y barbero— p… · `WalkInSaleDrawerProps`, `WalkInSaleDrawer` · piezas: Button, DatePicker, DrawerSection, Field, SearchableSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SidePanelShell, atMinutes, formatClock, minutesOfDay · usa: @/app/i18n, @/i18n, @/lib/api
- **api.ts** — Contrato del calendario; ver docs/API_CONTRACT.md. · `calendarApi` · llama: GET /calendar/catalog, GET /calendar/day, GET /calendar/month, POST /appointments, PATCH /appointments/${id}, POST /appointments/${id}/checkout, POST /clients/${clientId}/notes, PATCH /clients/${clientId}/notes/${noteId}, DELETE /clients/${clientId}/notes/${noteId}, POST /blocks, DELETE /blocks/${id}, GET /waitlist, POST /waitlist, DELETE /waitlist/${id}, POST /sales · usa: @/lib/api
- **appointmentActions.ts** — El icono y el texto de cada acción de una cita, los mismos en botones y menús. · `ACTION_ICON`, `ACTION_LABEL` · usa: @/app/i18n
- **appointmentInsights.ts** — Las sugerencias de una cita: lo que conviene saber antes de atender, sacado del historial del cliente y de la… · `InsightTone`, `InsightAction`, `AppointmentInsight`, `NO_SHOW_RISK_RATE`, `appointmentInsights` · usa: @/app/i18n
- **appointmentPlaybook.ts** — Qué toca hacer con una cita según dónde va: la acción principal, las que la acompañan y las que quedan en el… · `AppointmentStage`, `AppointmentActionId`, `AppointmentPlaybook`, `appointmentStage`, `appointmentPlaybook`
- **bookingText.ts** — Entender una cita escrita como se dice en recepción —«corte para Martín mañana a las 4 con Nicolás»— y dejarl… · `ParsedBooking`, `parseBookingText` · piezas: atMinutes
- **calendarAccess.ts** — Lo que el rol deja hacer en el calendario, decidido una vez desde `useAccess()` y repartido por el `ModelCont… · `CalendarAccess`, `FULL_CALENDAR_ACCESS`, `followsAgendaRules`, `calendarAccess`, `canRemoveBlock`, `scopeCatalog`, `scopeDay`, `waitlistInScope` · usa: @/features/access
- **calendarCardPrefs.ts** — Qué cuenta cada tarjeta de la agenda. · `CalendarCardPrefs`, `CalendarCardPref`, `DEFAULT_CARD_PREFS`, `setCalendarCardPref`, `resetCalendarCardPrefs`, `useCalendarCardPrefs`
- **calendarContextActions.tsx** — El clic derecho de la agenda: lo que se puede hacer con una cita o un bloqueo sin abrirlos. · `AppointmentContextHandlers`, `appointmentContextActions`, `blockContextActions`
- **calendarDensity.ts** — Cuánto ocupa cada media hora en la rejilla del día. · `DEFAULT_DENSITY`, `DENSITY_OPTIONS`, `setCalendarDensity`, `useCalendarDensity` · piezas: SCHEDULE_DENSITIES
- **calendarFormat.ts** — Dinero de la sucursal, con la convención del idioma activo. · `useMoney`, `halfHourOptions`, `useOpenKey`, `clockLabel` · piezas: atMinutes, formatClock, parseClock · usa: @/i18n
- **calendarModel.ts** — Del dominio a lo que se ve: convierte barberos y citas en recursos y eventos de la rejilla, decide el siguien… · `Translate`, `ModelContext`, `CalendarColorBy`, `CALENDAR_COLOR_BY`, `parseLocal`, `toLocalIso`, `appointmentStart`, `appointmentEnd`, `findClient`, `findBarber`, `servicesOf`, `servicesPrice`, `servicesMinutes`, `workingHoursOn`, `applyDayHours`, `isWorkingOn`, `teamIds`, `visibleBarbers`, `isActive`, `isUnpaid`, `statusTone`, `clientTypeTone`, `CLIENT_TYPE_ORDER`, `JOURNEY`, `NextStep`, `nextStep`, `appointmentWarning`, `LATE_AFTER_MINUTES`, `lateMinutes`, `durationLabel`, `nextFreeMinute`, `clashingAppointments`, `clashingBlocks`, `PlacementProblem`, `placementProblem`, `placementReason`, `blockClashes`, `barberLoad`, `toResource`, `STAGES`, `AppointmentStage`, `appointmentStage`, `STAGE_TONE`, `STAGE_FILL`, `stageBadge`, `AgendaFilters`, `appointmentClientType`, `matchesFilters`, `hasFilters`, `productCount`, `appointmentTotal`, `serviceCategories`, `categoryTone`, `serviceColor`, `appointmentCategory`, `FIRST_VISIT_MAX_VISITS`, `isFirstVisit`, `appointmentMarkers`, `cardMarkers`, `isFlexible`, `appointmentGroups`, `toEvent`, `blockToEvent`, `appointmentRange`, `historyLabel`, `monthKey` · piezas: atMinutes, formatClock, formatClockRange, minutesOfDay, parseClock, rangesOverlap, workingMinutes · usa: @/app/i18n, @/i18n
- **calendarRailActions.tsx** — Lo que se puede hacer desde el calendario, declarado una vez con su peso. · `CalendarRailHandlers`, `calendarRailActions` · usa: @/app/i18n
- **calendarShared.tsx** — El avatar de un cliente: su foto o sus iniciales. · `AppointmentStatusBadge`, `ClientTypeBadge`, `PersonAvatar`, `ClientAvatar`, `ServiceThumb`, `ProductThumb`, `DetailRow` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, IconTile, StatusBadge, initialsOf · usa: @/app/i18n
- **checkoutMath.ts** — Las cuentas del cobro, sin interfaz: cuánto es una propina sugerida, cuánto recarga la tarjeta y cuánto se de… · `TipChoice`, `CardSurcharge`, `FALLBACK_TIPS`, `tipAmount`, `surchargeAmount`, `changeDue`
- **dayBrief.ts** — Lo que el día pide mirar, en pocas líneas: quién va tarde, a quién le sobra agenda, quién ya no da abasto y a… · `BriefLine`, `IDLE_LOAD`, `FULL_LOAD`, `dayBrief`, `WaitlistMatch`, `waitlistMatch` · piezas: atMinutes, minutesOfDay, parseClock, workingMinutes · usa: @/app/i18n
- **gapsModel.ts** — Los huecos del día: los ratos libres de cada barbero dentro de su jornada, desde ahora. · `DayGap`, `DayGapsOptions`, `DEFAULT_MIN_GAP_MINUTES`, `dayGaps`, `GapsSummary`, `gapsSummary` · piezas: atMinutes, minutesOfDay, parseClock
- **pulseModel.ts** — En qué va cada cita ahora mismo y cuánto dinero lleva la jornada. · `PULSE_FOCUSES`, `PulseFocus`, `pulseGroup`, `DayPulse`, `dayPulse`
- **queries.ts** — Claves jerárquicas: invalidar `days()` refresca cualquier día abierto sin tocar el catálogo, y `month()` se r… · `calendarKeys`, `useCatalogQuery`, `useDayQuery`, `useMonthQuery`, `useWaitlistQuery`, `useCreateAppointment`, `useUpdateAppointment`, `useCheckoutAppointment`, `useAddClientNote`, `useUpdateClientNote`, `useRemoveClientNote`, `useCreateBlock`, `useRemoveBlock`, `useAddToWaitlist`, `useRemoveFromWaitlist`, `useCreateSale`
- **reflowModel.ts** — Reacomodar la cola de un barbero cuando algo se alarga: la cita que viene después se corre hasta donde termin… · `ReflowMove`, `ReflowPlan`, `isMovable`, `reflowPlan`, `planShiftMinutes`, `moveStart` · piezas: atMinutes, minutesOfDay, parseClock
- **slotSuggestions.ts** — Los huecos que conviene ofrecer para una cita: dónde cabe el servicio y, de esos sitios, cuáles dejan la agen… · `SlotSuggestion`, `SuggestSlotsOptions`, `SUGGESTION_STEP_MINUTES`, `suggestSlots` · piezas: atMinutes, minutesOfDay, parseClock · usa: @/app/i18n
- **types.ts** — El contrato del calendario (docs/API_CONTRACT.md, «Calendario»): lo que el backend manda y lo que la pantalla… · `workingRangeSchema`, `WorkingRange`, `barberSchema`, `Barber`, `clientTypeSchema`, `ClientType`, `noteKindSchema`, `NoteKind`, `clientNoteSchema`, `ClientNote`, `clientSchema`, `Client`, `serviceSchema`, `Service`, `productSchema`, `Product`, `catalogSchema`, `CalendarCatalog`, `appointmentStatusSchema`, `AppointmentStatus`, `appointmentSourceSchema`, `repeatRuleSchema`, `RepeatRule`, `paymentMethodSchema`, `PaymentMethod`, `historyEntrySchema`, `HistoryEntry`, `paymentSchema`, `Payment`, `productLineSchema`, `ProductLine`, `appointmentSchema`, `Appointment`, `blockCategorySchema`, `BlockCategory`, `blockRepeatSchema`, `BlockRepeat`, `timeBlockSchema`, `TimeBlock`, `calendarDaySchema`, `CalendarDay`, `monthDaySchema`, `calendarMonthSchema`, `CalendarMonth`, `waitlistEntrySchema`, `WaitlistEntry`, `waitlistSchema`, `saleSchema`, `Sale`, `appointmentInputSchema`, `AppointmentInput`, `AppointmentPatch`, `CheckoutInput`, `blockInputSchema`, `BlockInput`, `WaitlistInput`, `SaleInput`, `NoteInput`, `CalendarView`, `CALENDAR_VIEWS`, `TeamFilter`, `STATUS_KEYS`, `CLIENT_TYPE_KEYS`, `REPEAT_KEYS`, `BLOCK_CATEGORY_KEYS`, `BLOCK_REPEAT_KEYS`, `PAYMENT_METHOD_KEYS`, `NOTE_KIND_KEYS` · usa: @/app/i18n
- **useCalendarShortcuts.ts** — Los atajos de una letra del calendario, los de cualquier calendario rápido: C crea una cita, T vuelve a hoy,… · `CalendarShortcutHandlers`, `useCalendarShortcuts`
- **useCalendarState.ts** · `toDateKey`, `fromDateKey`, `useCalendarState`
- **weekModel.ts** — Las cuentas de la vista Semana, sin interfaz. · `WEEK_DAYS`, `weekStartOf`, `WeekCell`, `weekCell`

### calendar/appointmentTabs

- **AppointmentClientTab.tsx** — Cliente: su ritmo (cada cuánto vuelve y para cuándo agendarlo), su cumplimiento, sus alertas y el enlace a la… · `AppointmentClientTabProps`, `AppointmentClientTab` · piezas: Button, DrawerSection, Stepper, Text, calendarLocale · usa: @/app/i18n, @/i18n
- **AppointmentClipperTab.tsx** — Clipper: lo que el agente sugiere antes de atender, sacado del historial del cliente y de la propia cita. · `AppointmentClipperTabProps`, `AppointmentClipperTab` · piezas: AIInsightCard, AiGeneratedBadge, EmptyState, Text · usa: @/app/i18n, @/i18n
- **AppointmentEditForm.tsx** — Cambiar una cita sin salir del detalle: servicios, barbero, fecha, hora, duración y la nota para el barbero. · `AppointmentEditFormProps`, `AppointmentEditForm` · piezas: Button, DatePicker, Field, MultiSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea, atMinutes, formatClock, minutesOfDay, parseClock · usa: @/app/i18n
- **AppointmentHistoryTab.tsx** — Historial: la actividad de la cita, quién hizo qué y cuándo, del más reciente al más antiguo. · `AppointmentHistoryTabProps`, `AppointmentHistoryTab` · piezas: DrawerSection, Timeline, TimelineItem · usa: @/app/i18n, @/i18n
- **AppointmentNotesTab.tsx** — Notas: las del cliente filtradas por tipo —Notas, Medicamento, Alergias— con chips y su contador, el formular… · `AppointmentNotesTabProps`, `AppointmentNotesTab` · piezas: Button, DrawerSection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea · usa: @/app/i18n, @/lib/api
- **AppointmentPanelParts.tsx** · `StageHeadline` · piezas: Text · usa: @/lib/utils
- **AppointmentSummaryTab.tsx** — Resumen: en qué va la cita y su avance, lo que no se puede pasar por alto (alergias), la cita en filas —lo mi… · `AppointmentSummaryTabProps`, `AppointmentSummaryTab` · piezas: Alert, AlertDescription, AlertTitle, Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, ScheduleColorDot, Stepper, Text, formatClock · usa: @/app/i18n, @/lib/utils

### calendar/clientNotes

- **ClientNotes.tsx** — Las notas de un cliente, iguales en la cita y en su ficha: el filtro por tipo (chips con su contador) y la li… · `MIN_NOTE_LENGTH`, `NoteKindChipsProps`, `NoteKindChips`, `ClientNoteListProps`, `ClientNoteList` · piezas: Button, Chip, ConfirmDialog, Field, RowActionsMenu, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea · usa: @/app/i18n, @/i18n, @/lib/api

### catalog

- **CatalogPhotoField.tsx** — La foto de una ficha del catálogo —un servicio, un producto—: la miniatura como se verá en la lista, el botón… · `CatalogPhotoFieldProps`, `CatalogPhotoField` · piezas: Button, Field, IconTile, ImageCropDialog · usa: @/app/i18n
- **CategoriesDrawer.tsx** — Las categorías de un catálogo —servicios, productos— en un solo panel: la lista con cuántos registros tiene c… · `CategoryVisibility`, `CatalogCategory`, `CategoryDraft`, `CategoriesDrawerMessages`, `CategoriesDrawerProps`, `CategoriesDrawer` · piezas: Button, ConfirmDialog, DrawerShell, Field, Input, ListItem, Switch, Text, Textarea · usa: @/lib/api
- **catalogAccess.ts** — Qué deja hacer el rol con un catálogo —servicios o productos— y si ve sus cifras de negocio. · `CatalogKind`, `CatalogAccess`, `catalogAccess` · usa: @/features/access

### customers

- **CustomerFormDrawer.tsx** — Crear o editar un cliente sin salir de donde se está. · `CustomerFormDrawerProps`, `CustomerFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, PhoneInput, Switch, Text · usa: @/app/i18n, @/lib/api, @/lib/utils
- **CustomerHistoryTabs.tsx** · `CustomerAppointmentsTab`, `CustomerPaymentsTab`, `CustomerProductsTab`, `CustomerGuestsTab` · piezas: Badge, Button, ConfirmDialog, DrawerShell, EmptyState, Field, IconTile, Input, ListItem, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell · usa: @/app/i18n, @/i18n, @/lib/api
- **CustomerNoteDrawer.tsx** — Una nota nueva del cliente: qué tipo es —una alergia no se lee igual que una preferencia— y el texto. · `CustomerNoteDrawerProps`, `CustomerNoteDrawer` · piezas: Button, DrawerShell, Field, Textarea, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api
- **CustomerOverview.tsx** — El resumen de un cliente: lo que hay que saber antes de atenderle arriba —alergias y medicamentos—, cuánto va… · `CustomerOverviewProps`, `CustomerOverview` · piezas: Alert, AlertDescription, AlertTitle, Button, MetricCard, StatusBadge, Text · usa: @/app/i18n, @/features/calendar, @/features/team, @/i18n
- **CustomerProfilePage.tsx** · `CustomerProfilePage` · piezas: Alert, AlertDescription, AlertTitle, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/lib/api, @/lib/query
- **CustomersPage.tsx** — La lista de clientes. · `CustomersPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, getChartTheme · usa: @/app/i18n, @/features/calendar, @/features/team, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de clientes; ver docs/API_CONTRACT.md. · `customersApi` · llama: GET /customers, GET /customers/${id}, POST /customers, PATCH /customers/${id}, DELETE /customers/${id}, POST /clients/${id}/notes, POST /customers/${id}/guests, DELETE /customers/${id}/guests/${guestId} · usa: @/features/calendar, @/lib/api
- **customerAccess.ts** — Si quien mira puede ver a ese cliente: todo, o solo los suyos. · `isOwnCustomer`, `canSeeCustomer`, `CustomerPermissions`, `customerPermissions`, `useCustomerPermissions` · usa: @/features/access
- **customerActions.tsx** — Las acciones de la lista; cada una aparece solo si su casilla de la matriz está marcada. · `CustomerListHandlers`, `customerListActions` · usa: @/app/i18n
- **customersHome.tsx** — Qué columnas existen según quién mira (ver `customerAccess.ts`). · `ALL_SEGMENTS`, `SegmentFilter`, `parseSegment`, `countBySegment`, `CustomerColumnOptions`, `customerColumns`, `CustomerCellFormatters`, `customerCells`, `customersCsvRows`, `CustomerAlertId`, `CustomerAlertPreset`, `BIRTHDAY_WINDOW_DAYS`, `UNRELIABLE_MISSES`, `CUSTOMER_ALERTS`, `CustomerPulse`, `customerPulse` · piezas: Tooltip, TooltipContent, TooltipTrigger · usa: @/app/i18n
- **customersShared.tsx** — Las piezas chicas del módulo de clientes: el segmento con su color y su icono, y el avatar. · `SegmentBadge`, `CustomerAvatar` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, initialsOf · usa: @/app/i18n
- **customersUtils.ts** — Un color por momento de la relación: del más valioso al que ya no está. · `SEGMENT_STYLE`, `APPOINTMENT_STATUS_BADGE`, `branchName`, `daysSince`, `maskPhone`, `daysToBirthday`, `formatAgo`, `downloadCsv` · usa: @/features/branches, @/features/payroll
- **queries.ts** · `customerKeys`, `useCustomersQuery`, `useCustomerQuery`, `useCreateCustomer`, `useUpdateCustomer`, `useSetCustomerBlocked`, `useDeleteCustomer`, `useAddCustomerNote`, `useAddGuest`, `useRemoveGuest` · usa: @/features/calendar
- **types.ts** — En qué momento de la relación está un cliente. · `customerSegmentSchema`, `CustomerSegment`, `customerSchema`, `Customer`, `customersResponseSchema`, `CustomersResponse`, `customerAppointmentStatusSchema`, `CustomerAppointmentStatus`, `customerAppointmentSchema`, `CustomerAppointment`, `customerPaymentSchema`, `CustomerPayment`, `customerGuestSchema`, `CustomerGuest`, `customerProductSchema`, `CustomerProduct`, `customerDetailSchema`, `CustomerDetail`, `customerInputSchema`, `CustomerInput`, `EMPTY_CUSTOMER_INPUT`, `GuestInput`, `SEGMENT_KEYS`, `SEGMENT_HINT_KEYS`, `APPOINTMENT_STATUS_KEYS`, `APPOINTMENT_SOURCE_KEYS`, `PAYMENT_METHOD_KEYS`, `splitName`, `inputFromDetail` · usa: @/app/i18n, @/features/calendar

### dashboard

- **DashboardPage.tsx** — El home, como plantilla. · `DashboardPage` · piezas: AttentionAction, AttentionStrip, Badge, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, TemplateCatalogDrawer, TemplateTile, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **api.ts** · `dashboardApi` · llama: GET /dashboard/summary · usa: @/lib/api
- **homeTemplate.tsx** — Los datos de la plantilla del home. · `ProcessStatus`, `ProcessRow`, `PROCESS_ROWS`, `offsetToDate`, `formatRowDate`, `STATUS_KEYS`, `processColumns`, `processCells`, `buildTemplates`, `buildTemplateGroups`, `PulseMetric`, `PULSE_METRICS`, `AlertId`, `AlertPreset`, `CLOSING_SOON_DAYS`, `ALERT_PRESETS` · piezas: Progress, StatusBadge · usa: @/app/i18n
- **queries.ts** · `dashboardKeys`, `useDashboardSummary`
- **types.ts** · `dashboardSummarySchema`, `DashboardSummary`

### expenses

- **ExpenseFormDrawer.tsx** — Registrar o editar un gasto sin salir de la lista. · `ExpenseFormDrawerProps`, `ExpenseFormDrawer` · piezas: Alert, AlertDescription, Button, CardSelection, DrawerShell, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea · usa: @/app/i18n, @/features/calendar, @/lib/api
- **ExpensesPage.tsx** — Los gastos de la sucursal. · `ExpensesPage` · piezas: Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de gastos; ver docs/API_CONTRACT.md. · `expensesApi` · llama: GET /expenses, POST /expenses, PATCH /expenses/${id}, DELETE /expenses/${id} · usa: @/lib/api
- **expensesHome.tsx** · `ALL`, `KindFilter`, `parseKind`, `expenseColumns`, `ExpenseCellContext`, `expenseCells` · usa: @/app/i18n
- **expensesShared.tsx** — Las piezas chicas del módulo de gastos: el icono y la insignia por tipo. · `ExpenseGlyph`, `ExpenseKindBadge` · piezas: Badge, IconTile · usa: @/app/i18n
- **expensesUtils.ts** — Cuántas veces al año se paga cada frecuencia. · `PAYMENTS_PER_YEAR`, `monthlyEquivalent`, `ExpensesSummary`, `summarizeExpenses`
- **queries.ts** — `ownerMemberId`: los gastos de ese barbero de renta; `null`, los de la sucursal. · `expenseKeys`, `useExpensesQuery`, `useCreateExpense`, `useUpdateExpense`, `useRemoveExpense`
- **types.ts** — Un gasto fijo se repite con una frecuencia; uno variable pasó una vez. · `expenseKindSchema`, `ExpenseKind`, `expenseFrequencySchema`, `ExpenseFrequency`, `expenseSchema`, `Expense`, `expensesResponseSchema`, `ExpensesResponse`, `expenseInputSchema`, `ExpenseInput`, `emptyExpenseInput`, `inputFromExpense`, `EXPENSE_KIND_KEYS`, `FREQUENCY_KEYS` · usa: @/app/i18n

### feedback

- **FeedbackHost.tsx** — Monta la campaña activa sobre la app: añade a cada comentario la campaña, la página y la persona, y lo envía… · `FeedbackHostProps`, `FeedbackHost` · piezas: FeedbackCampaign, FeedbackDialog, publishProcess, updateProcess · usa: @/app/i18n, @/features/auth, @/lib/api
- **api.ts** — `POST /feedback`: en producción lo atiende la función de servidor `api/feedback` (guarda el comentario en la… · `feedbackApi` · llama: POST /feedback, POST /feedback/attachments · usa: @/lib/api
- **buildSubmission.ts** — Arma la fila que se envía: lo que escribió la persona más lo que la app ya sabe (campaña, página, quién). · `SubmissionContext`, `buildSubmission`
- **campaignRegistry.ts** — Las campañas de feedback, como datos planos: sin React, sin alias `@/` y sin nada del navegador, porque las l… · `CampaignSection`, `CampaignDefinition`, `REDESIGN_DEFINITION`, `ACTIVE_CAMPAIGN_DEFINITION`
- **campaigns.ts** — La campaña activa con su recorrido, o `null` si no se está escuchando. · `REDESIGN_CAMPAIGN`, `ACTIVE_FEEDBACK_CAMPAIGN` · piezas: FEEDBACK_LAUNCHER_TARGET
- **pageLabel.ts** — El rótulo de menú de la entrada activa, buscado en los tres niveles. · `findNavLabel`
- **queries.ts** · `useSubmitFeedback`
- **types.ts** — Largo máximo de un comentario; el panel corta ahí y el backend lo vuelve a comprobar. · `FEEDBACK_MAX_LENGTH`, `FEEDBACK_MIN_LENGTH`, `FEEDBACK_MAX_ATTACHMENTS`, `FEEDBACK_TYPES`, `FEEDBACK_NO_PAGE`, `FEEDBACK_ATTACHMENT_LIMITS`, `FeedbackAttachmentType`, `feedbackUploadRequestSchema`, `FeedbackUploadRequest`, `feedbackUploadTicketSchema`, `FeedbackUploadTicket`, `feedbackUploadedFileSchema`, `feedbackSubmissionSchema`, `FeedbackSubmission`, `feedbackReceiptSchema`, `FeedbackReceipt`

### metrics

- **MetricsFilters.tsx** — La fila de filtros del tablero: el periodo y el barbero. · `MetricsFilters` · piezas: PeriodNavigator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n, @/i18n
- **MetricsPage.tsx** — Métricas: cómo le fue a la barbería, en cinco pestañas. · `MetricsPage` · piezas: Breadcrumbs, PageHeader, ShellHeaderSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/lib/query
- **api.ts** · `metricsApi` · llama: GET /metrics/business, GET /metrics/customers, GET /metrics/barbers, GET /metrics/marketing, GET /metrics/insights · usa: @/lib/api
- **metricsFormat.ts** — Cómo se escriben las cifras del tablero, con la convención del idioma activo. · `MetricsFormatters`, `useMetricsFormatters` · usa: @/i18n
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
- **InsightsDashboard.tsx** — IA: un diagnóstico de los últimos tres meses. · `InsightsDashboard` · piezas: AIInsightCard, AiGeneratedBadge, AttentionAction, AttentionStrip, Card, HeatmapMatrix, MetricCard, MetricDial, PanelHeading · usa: @/app/i18n
- **MarketingDashboard.tsx** — Marketing: por dónde llegan las reservas digitales, cuánto convierte cada canal y qué trajo cada campaña. · `MarketingDashboard` · piezas: BarList, EmptyState, MetricCard · usa: @/app/i18n

### payroll

- **MyPayPage.tsx** — El pago del propio barbero, sobre la nómina recortada a su ficha: - «Lo que llevo» (comisión): cuánto lleva g… · `MyPayPage` · piezas: Alert, AlertDescription, AlertTitle, Breadcrumbs, Button, DataListBlock, EmptyState, ListItem, MetricCard, PageHeader, PeriodNavigator, ShellHeaderSlot, Skeleton · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **PayrollMemberDrawer.tsx** — Cómo se llega al pago de un barbero: su forma de pago y sus reglas, la cuenta —lo que suma y lo que resta— y… · `PayrollMemberDrawerProps`, `PayrollMemberDrawer` · piezas: Badge, Button, DrawerShell, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/i18n
- **PayrollPage.tsx** — La nómina del periodo: cuánto se le paga a cada barbero y cuánto le deben a la barbería los que rentan su pue… · `PayrollPage` · piezas: Breadcrumbs, Button, DataListBlock, ListItem, MetricCard, PageHeader, PeriodNavigator, ShellHeaderSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **api.ts** — Contrato de nómina; ver docs/API_CONTRACT.md. · `payrollApi` · llama: GET /payroll · usa: @/lib/api
- **myPayHome.tsx** · `myPayColumns`, `MyPayCellContext`, `myPayCells` · usa: @/app/i18n
- **payrollHome.tsx** — El valor numérico de una columna, para la tabla y para exportar. · `columnIdsFor`, `columnLabel`, `payrollColumns`, `columnValue`, `PayrollCellContext`, `payrollCells` · piezas: Avatar, AvatarFallback, AvatarImage, initialsOf · usa: @/app/i18n
- **payrollUtils.ts** — Las ayudas sin JSX de la nómina: el resumen y la exportación. · `PayrollSummary`, `summarizePayroll`, `countByPayout`, `toCsv`
- **queries.ts** · `payrollKeys`, `usePayrollQuery`
- **types.ts** — Cómo se le paga a cada barbero: comisión por servicio, renta de su puesto o salario. · `payoutSchema`, `Payout`, `ruleSchema`, `CommissionRule`, `payrollLineSchema`, `PayrollLine`, `commissionRulesSchema`, `CommissionRules`, `payrollMemberSchema`, `PayrollMember`, `payrollResponseSchema`, `PayrollResponse`, `PayrollParams`, `PAYOUT_KEYS`, `PAYOUT_HINT_KEYS`, `RULE_KEYS` · usa: @/app/i18n
- **usePayrollFilters.ts** — Lo que decide qué nómina se ve, en la URL: el periodo, la forma de pago y el barbero abierto en el panel. · `usePayrollFilters` · piezas: fromIsoDate, periodRange, toIsoDate

### products

- **ProductCategoriesDrawer.tsx** — Las categorías de productos: el panel compartido del catálogo, con sus textos y sus mutaciones. · `ProductCategoriesDrawerProps`, `ProductCategoriesDrawer` · usa: @/app/i18n, @/features/catalog
- **ProductFormDrawer.tsx** — Crear o editar un producto sin salir de la lista. · `ProductFormDrawerProps`, `ProductFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text, Textarea · usa: @/app/i18n, @/features/calendar, @/features/catalog, @/features/services, @/lib/api, @/lib/utils
- **ProductProfilePage.tsx** · `ProductProfilePage` · piezas: Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, MetricCard, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, Text · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/services, @/features/team, @/i18n, @/lib/api, @/lib/query
- **ProductsPage.tsx** — El catálogo de productos. · `ProductsPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de productos; ver docs/API_CONTRACT.md. · `productsApi` · llama: GET /products, GET /products/${id}, POST /products, PATCH /products/${id}, DELETE /products/${id}, PUT /products/activation, POST /product-categories, PATCH /product-categories/${id}, DELETE /product-categories/${id} · usa: @/lib/api
- **productsHome.tsx** — La categoría de la URL, si existe; si no, todas. · `ALL`, `parseCategory`, `categoryName`, `profitOf`, `productColumns`, `ProductCellContext`, `productCells`, `ProductAlertId`, `ProductAlertPreset`, `PRODUCT_ALERTS`, `ProductsPulse`, `productsPulse` · usa: @/app/i18n, @/features/services
- **productsShared.tsx** — La foto del producto y, mientras no hay o no carga, el icono. · `ProductGlyph`, `ProductActiveBadge`, `SellableBadge`, `ProductVisibilityBadge` · piezas: Badge, IconTile, StatusBadge · usa: @/app/i18n
- **queries.ts** · `productKeys`, `useProductsQuery`, `useProductQuery`, `useCreateProduct`, `useUpdateProduct`, `useRemoveProduct`, `useSetProductsActive`, `useSaveProductCategory`, `useRemoveProductCategory`
- **types.ts** — La categoría a la que caen los productos cuando se borra la suya. · `productVisibilitySchema`, `ProductVisibility`, `productCategorySchema`, `ProductCategory`, `catalogProductSchema`, `CatalogProduct`, `productsCatalogSchema`, `ProductsCatalog`, `UNCATEGORIZED_PRODUCT_ID`, `productInputSchema`, `ProductInput`, `emptyProductInput`, `inputFromProduct`, `ProductCategoryInput`, `PRODUCT_VISIBILITY_KEYS` · usa: @/app/i18n

### sections

- **SectionPlaceholderPage.tsx** — Una sección del menú que todavía no tiene pantalla. · `SectionPlaceholderPageProps`, `SectionPlaceholderPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/icons

### services

- **CategoriesDrawer.tsx** — Las categorías de servicios: el panel compartido del catálogo, con sus textos y sus mutaciones. · `CategoriesDrawerProps`, `CategoriesDrawer` · usa: @/app/i18n, @/features/catalog
- **ServiceFormDrawer.tsx** — Crear o editar un servicio —o un combo— sin salir de la lista. · `ServiceFormDrawerProps`, `ServiceFormDrawer` · piezas: Alert, AlertDescription, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DrawerShell, Field, Input, MultiSelect, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text, Textarea, ThemaTabs · usa: @/app/i18n, @/features/calendar, @/features/catalog, @/lib/api, @/lib/utils
- **ServiceOrderPage.tsx** — El orden en que el cliente ve el catálogo al reservar en línea: primero las categorías y, dentro de cada una,… · `ServiceOrderPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, ShellRailSlot, Sortable, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/lib/api, @/lib/query
- **ServiceProfilePage.tsx** · `ServiceProfilePage` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, ListItem, MetricCard, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, Switch, Text, ThemaTabs, initialsOf · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **ServicesPage.tsx** — El catálogo de servicios. · `ServicesPage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, DataListBlock, EmptyState, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/catalog, @/features/team, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato de servicios; ver docs/API_CONTRACT.md. · `servicesApi` · llama: GET /services, GET /services/${id}, POST /services, PATCH /services/${id}, DELETE /services/${id}, PUT /services/activation, PUT /services/${id}/team, PUT /services/order, POST /service-categories, PATCH /service-categories/${id}, DELETE /service-categories/${id} · usa: @/lib/api
- **queries.ts** · `serviceKeys`, `useServicesQuery`, `useServiceQuery`, `useCreateService`, `useUpdateService`, `useRemoveService`, `useSetServicesActive`, `useSetServiceTeam`, `useSaveServiceOrder`, `useSaveCategory`, `useRemoveCategory`
- **servicesHome.tsx** — La categoría de la URL, si existe; si no, todas. · `ALL`, `KindFilter`, `parseKind`, `parseCategory`, `serviceColumns`, `ServiceCellContext`, `serviceCells`, `ServiceAlertId`, `ServiceAlertPreset`, `SERVICE_ALERTS`, `ServicesPulse`, `servicesPulse` · piezas: Badge · usa: @/app/i18n
- **servicesShared.tsx** — La foto del servicio y, mientras no hay o no carga, el icono de su tipo. · `ServiceGlyph`, `ActiveBadge`, `VisibilityBadge` · piezas: Badge, IconTile, StatusBadge · usa: @/app/i18n
- **servicesUtils.ts** — Lo que queda del precio tras el costo, en porcentaje; `null` si no hay costo registrado o el precio es cero. · `marginOf`, `formatDuration`, `categoryName`, `comboTotals`, `groupByCategory`
- **types.ts** — La categoría a la que caen los servicios cuando se borra la suya. · `serviceKindSchema`, `ServiceKind`, `visibilitySchema`, `Visibility`, `prepPositionSchema`, `PrepPosition`, `serviceCategorySchema`, `ServiceCategory`, `catalogServiceSchema`, `CatalogService`, `servicesCatalogSchema`, `ServicesCatalog`, `serviceTeamRowSchema`, `ServiceTeamRow`, `serviceDetailSchema`, `ServiceDetail`, `UNCATEGORIZED_ID`, `MIN_DURATION_MIN`, `MAX_DURATION_MIN`, `MAX_PREP_MIN`, `MIN_COMBO_SERVICES`, `serviceInputSchema`, `ServiceInput`, `emptyServiceInput`, `inputFromService`, `categoryInputSchema`, `CategoryInput`, `ServiceOrderInput`, `KIND_KEYS`, `VISIBILITY_KEYS` · usa: @/app/i18n

### settings

- **SettingsFormParts.tsx** — Las piezas que comparten todos los ajustes: la tarjeta de un bloque, la fila con interruptor, la barra de gua… · `SettingsCard`, `SwitchRowProps`, `SwitchRow`, `FieldErrors`, `SettingsDocumentContext`, `SettingsDocumentProps`, `SettingsDocument` · piezas: Button, SectionHeader, Skeleton, Switch, Text · usa: @/app/i18n, @/lib/api, @/lib/query, @/lib/utils
- **SettingsListParts.tsx** — Un ajuste que es una lista —sucursales, cierres, impuestos, datáfonos—: las filas, el alta y la edición en un… · `ListFormContext`, `SettingsListMessages`, `SettingsListProps`, `SettingsList` · piezas: Button, ConfirmDialog, DrawerShell, EmptyState, ListItem, Skeleton, Text · usa: @/app/i18n, @/icons, @/lib/api, @/lib/query
- **SettingsPage.tsx** — Todo lo que se ajusta, en una sola pantalla. · `SettingsPage` · piezas: Breadcrumbs, IconTile, ListItem, ListItemGroup, PageHeader, SectionHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/access
- **SettingsSectionPage.tsx** — Un ajuste concreto. · `SettingsSectionPage` · piezas: Alert, AlertDescription, AlertTitle, Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/access, @/features/branding
- **personalPreferences.ts** — Las preferencias de cada persona, no de la empresa: por ahora, el formato de hora con el que ve su calendario… · `PersonalTimeFormat`, `readPersonalTimeFormat`, `writePersonalTimeFormat`, `usePersonalTimeFormat`
- **settingsApi.ts** — Contrato de configuración; ver docs/API_CONTRACT.md. · `settingsApi` · llama: GET /settings/${id}, PUT /settings/${id}, GET /settings/lists/${id}, POST /settings/lists/${id}, PATCH /settings/lists/${id}/${itemId}, DELETE /settings/lists/${id}/${itemId}, POST /settings/payments/test, POST /account/delete · usa: @/lib/api
- **settingsCatalog.ts** — Lo que se puede hacer con un ajuste: cambiarlo o solo consultarlo. · `SettingsLevel`, `SETTINGS_BASE_PATH`, `settingsLevel`, `buildSettingsGroups`, `SETTINGS_ALL`, `findSettingsItem` · usa: @/app/i18n, @/features/access
- **settingsIcons.ts** — El icono y el color de cada ajuste. · `SETTINGS_ICONS`, `SETTINGS_GROUP_TONES`
- **settingsQueries.ts** — Un ajuste que es un solo documento. · `settingsKeys`, `useSettingsSection`, `useSaveSettingsSection`, `useSettingsList`, `useSettingsListMutations`
- **settingsTypes.ts** — Las formas de cada ajuste. · `SettingsSectionId`, `SettingsListId`, `businessSchema`, `BusinessSettings`, `bookingSchema`, `BookingSettings`, `pricingSchema`, `PricingSettings`, `tipOptionSchema`, `TipOption`, `tipsSchema`, `TipsSettings`, `cardFeeSchema`, `CardFeeSettings`, `paymentsSchema`, `PaymentsSettings`, `paymentsTestSchema`, `commissionsSchema`, `CommissionSettings`, `payrollCycleSchema`, `PayrollCycleSettings`, `notificationsSchema`, `NotificationSettings`, `companySchema`, `CompanySettings`, `billingSchema`, `BillingSettings`, `branchSchema`, `Branch`, `BranchInput`, `closureSchema`, `Closure`, `ClosureInput`, `taxGroupSchema`, `TaxGroup`, `TaxGroupInput`, `deviceSchema`, `Device`, `DeviceInput`, `CURRENCIES`

### settings/sections

- **BillingSettings.tsx** — Plan y facturación: qué plan tiene la barbería, a nombre de quién salen las facturas, con qué tarjeta se paga… · `BillingSettings` · piezas: Badge, Button, Field, IconTile, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text · usa: @/app/i18n, @/features/calendar, @/i18n
- **BookingSettings.tsx** — Reservas online, en dos vistas: las **reglas** —con cuánta anticipación se reserva, cuándo se puede cancelar,… · `BookingSettings` · piezas: Button, Field, Input, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, Textarea, ThemaTabs · usa: @/app/i18n
- **BranchesSettings.tsx** — Sucursales: los locales del negocio. · `BranchesSettings` · piezas: Field, IconTile, Input, PhoneInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusBadge, Textarea · usa: @/app/i18n, @/i18n
- **BusinessSettings.tsx** — Perfil del negocio: cómo se cuenta el tiempo —zona, formato, semana y horario— y dónde encuentra el cliente a… · `BusinessSettings` · piezas: Field, Input, MultiSelect, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ThemaTabs · usa: @/app/i18n
- **CardFeeSettings.tsx** — Recargo por tarjeta: si se cobra, cómo se llama en el recibo y cuánto es —un porcentaje o un monto fijo—. · `CardFeeSettings` · piezas: Field, Input, NumberField, ThemaTabs · usa: @/app/i18n, @/features/calendar
- **ClosuresSettings.tsx** — Horarios y cierres: los días en que la barbería no atiende. · `ClosuresSettings` · piezas: Badge, Field, IconTile, Input, MultiSelect, Textarea · usa: @/app/i18n, @/features/branches, @/i18n
- **CommissionSettings.tsx** — Comisiones: qué se le resta al precio antes de calcular la comisión del barbero. · `CommissionSettings` · piezas: Text · usa: @/app/i18n, @/features/calendar
- **CompanySettings.tsx** — Datos legales: la empresa dueña de las sucursales, tal como sale en facturas y recibos. · `CompanySettings` · piezas: Field, Input, PhoneInput · usa: @/app/i18n
- **DeleteAccountSettings.tsx** — Eliminar cuenta. · `DeleteAccountSettings` · piezas: Alert, AlertDescription, AlertTitle, Button, Field, Input, ModalShell, Skeleton · usa: @/app/i18n, @/features/access, @/features/auth, @/lib/api, @/lib/query
- **DevicesSettings.tsx** — Datáfonos: las terminales que cobran en caja. · `DevicesSettings` · piezas: Badge, Field, IconTile, Input · usa: @/app/i18n
- **LoginSettings.tsx** — Inicio de sesión: cómo entra cada persona. · `LoginSettings` · piezas: Badge, Button, ConfirmDialog, Field, IconTile, Input, InputOtp, Skeleton, StatusBadge, Text · usa: @/app/i18n, @/features/auth, @/lib/api, @/lib/query
- **NotificationSettings.tsx** — Recordatorios y avisos: a cada quien —dueño, administrador, recepción, barberos y clientes— qué se le avisa y… · `NotificationSettings` · piezas: Button, NumberField, Switch, Text, ThemaTabs · usa: @/app/i18n
- **PaymentsSettings.tsx** — Pasarela de pago: las dos claves de Stripe para cobrar en línea. · `PaymentsSettings` · piezas: Alert, AlertDescription, Button, Field, Input, StatusBadge · usa: @/app/i18n, @/lib/api
- **PayrollCycleSettings.tsx** — Ciclo de nómina: cada cuánto se le liquida al equipo y qué día arranca el ciclo. · `PayrollCycleSettings` · piezas: CardSelection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n
- **PersonalSettings.tsx** — Mis preferencias: lo que cada persona ajusta para sí y no toca a nadie más. · `PersonalSettings` · piezas: Field, ThemaTabs · usa: @/app/i18n
- **PricingSettings.tsx** — Precios y moneda: en qué moneda se cobra y si el precio que se escribe ya lleva el impuesto dentro. · `PricingSettings` · piezas: CardSelection, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue · usa: @/app/i18n
- **RolePermissionsSettings.tsx** — Permisos por rol: la matriz de fábrica con la que nace cada persona, una pestaña por rol, como en producción. · `RolePermissionsSettings` · piezas: ThemaTabs · usa: @/app/i18n, @/features/team
- **TaxesSettings.tsx** — Impuestos: los grupos de tasas que se aplican al cobrar. · `TaxesSettings` · piezas: Button, Field, IconTile, Input, NumberField, Text · usa: @/app/i18n
- **TipsSettings.tsx** — Propinas: las opciones que se ofrecen al cobrar, cuál sale marcada y qué ve el cajero. · `TipsSettings` · piezas: Button, CardSelection, Field, NumberField, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, ThemaTabs · usa: @/app/i18n
- **bookingUtils.ts** — Las ayudas sin JSX de Reservas online: el enlace con seguimiento, la política con sus valores y el fragmento… · `UtmParams`, `buildBookingUrl`, `PolicyValues`, `renderPolicy`, `WidgetOptions`, `widgetSnippet`
- **notificationCatalog.ts** — El catálogo de avisos: a quién le llegan, de qué avisan y por qué canal. · `NotificationChannel`, `NotificationAudience`, `NotificationEvent`, `NotificationGroup`, `NOTIFICATION_CATALOG`, `AUDIENCES`, `toggleKey`, `thresholdKey`, `ALL_EVENT_IDS`, `ALL_GROUP_IDS` · usa: @/app/i18n
- **settingsMath.ts** — Cuántos días dura un cierre, contando el primero y el último. · `closureDays`, `taxTotal`, `tipLabel`

### team

- **ActivateTeamDrawer.tsx** — Activar equipo dentro de esta sucursal: un interruptor por persona de toda la barbería. · `ActivateTeamDrawerProps`, `ActivateTeamDrawer` · piezas: Button, DrawerShell, ListItem, ListItemGroup, SegmentedControl, Switch, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **BarberOrderPage.tsx** — Ordenar barberos: el orden de las columnas del calendario, arrastrando desde el asa o con las flechas del tec… · `BarberOrderPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, ListItem, ListItemGroup, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/lib/api, @/lib/query
- **CreateMemberDrawer.tsx** · `CreateMemberDrawer` · piezas: Button, CardSelection, DrawerShell, Text · usa: @/app/i18n, @/features/access
- **EditShiftDrawer.tsx** — Editar este día: la fecha, la persona y las dos horas del turno de ese día concreto. · `EditShiftDrawerProps`, `EditShiftDrawer` · piezas: Button, DrawerSection, DrawerShell, Field, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text, calendarLocale, formatClock, parseClock · usa: @/app/i18n, @/features/calendar, @/i18n
- **LevelsPage.tsx** · `LevelsPage` · piezas: AvatarGroup, AvatarGroupCount, Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, Field, IconTile, Input, ListItem, ListItemGroup, ModalShell, PageHeader, RowActionsMenu, ShellHeaderSlot, ShellRailSlot · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **LineupPage.tsx** · `LineupPage` · piezas: Badge, Breadcrumbs, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Sortable, Switch, Text, ThemaTabs · usa: @/app/i18n, @/features/access, @/lib/api, @/lib/query, @/lib/utils
- **MemberProfilePage.tsx** · `MemberProfilePage` · piezas: Badge, Breadcrumbs, Button, ConfirmDialog, DataListActionRail, EmptyState, PageHeader, ShellHeaderSlot, ShellRailSlot, Skeleton, ThemaTabs · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api, @/lib/query
- **MemberTabEditor.tsx** — Una pestaña de la ficha, en modo lectura o en modo edición. · `MemberTabFormProps`, `MemberTabForm`, `MemberTabViewProps`, `MemberTabView` · usa: @/features/calendar
- **MemberWizardPage.tsx** — Crear un miembro del equipo: el rol viene elegido en el panel anterior y aquí se llena la ficha paso a paso. · `MemberWizardPage` · piezas: Breadcrumbs, Button, ConfirmDialog, PageHeader, ShellHeaderSlot, Stepper, Text · usa: @/app/i18n, @/features/access, @/features/calendar, @/lib/api
- **TeamHeaderActions.tsx** — Las acciones de la pantalla cuando no manda la barra flotante. · `TeamHeaderActionsProps`, `TeamHeaderActions` · piezas: Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, railScreenTiers
- **TeamHomePage.tsx** — El home de equipo. · `TeamHomePage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, Progress, ScreenHeaderActions, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, ThemaTabs, getChartTheme · usa: @/app/i18n, @/features/access, @/i18n
- **WorkHoursPage.tsx** · `WorkHoursPage` · piezas: Breadcrumbs, Button, EmptyState, PageHeader, ShellHeaderSlot, ShiftWeekGrid, Skeleton, calendarLocale · usa: @/app/i18n, @/features/access, @/i18n, @/lib/api, @/lib/query
- **api.ts** — Contrato del equipo; ver docs/API_CONTRACT.md. · `teamApi` · llama: GET /team/members, GET /team/members/${id}, POST /team/members, PATCH /team/members/${id}, DELETE /team/members/${id}, PUT /team/activation, GET /team/levels, POST /team/levels, PATCH /team/levels/${id}, DELETE /team/levels/${id}, GET /team/order, PUT /team/order, GET /team/schedule, PUT /team/schedule/override, DELETE /team/schedule/override · usa: @/lib/api
- **memberDraft.ts** — El borrador de una persona: lo que se llena al crearla, pestaña por pestaña, y lo que se manda al guardar una… · `emptyProfile`, `defaultCompensation`, `defaultPayments`, `defaultOptions`, `defaultSchedule`, `draftFromRole`, `profileFromMember`, `draftFromMember`, `patchForTab`, `validateTab`, `serverFieldErrors` · usa: @/lib/api
- **permissionsCatalog.ts** — La matriz de permisos tal como se lee: los bloques, las filas con las columnas que existen en cada una y los… · `PERMISSION_COLUMNS`, `PERMISSION_COLUMN_KEYS`, `PermissionRowSpec`, `PermissionBlockSpec`, `PERMISSION_BLOCKS`, `ROLE_DEFAULT_PERMISSIONS`, `permissionSummary`, `visibleSections` · usa: @/app/i18n
- **queries.ts** — Claves jerárquicas del equipo. · `teamKeys`, `useMembersQuery`, `useMemberQuery`, `useLevelsQuery`, `useOrderQuery`, `useWeekQuery`, `useCreateMember`, `useUpdateMember`, `useRemoveMember`, `useSetActivation`, `useCreateLevel`, `useUpdateLevel`, `useRemoveLevel`, `useSaveOrder`, `useSetOverride`, `useClearOverride` · usa: @/features/calendar
- **teamAccess.ts** — Si quien mira gestiona a alguien de ese rol: el dueño a todos; el resto, a los de debajo. · `managesRole`, `creatableRoles`, `seesBarberMoney`, `seesManagers`, `MemberAccess`, `memberAccess` · usa: @/features/access
- **teamHome.tsx** — Los datos del home de equipo. · `TeamRoleId`, `PayoutKind`, `TeamRoleSpec`, `ALL_ROLES`, `TeamRoleFilter`, `isManagerRole`, `TEAM_ROLES`, `ROLE_BY_ID`, `PAYOUT_KEYS`, `TeamStatus`, `TEAM_STATUS_KEYS`, `TeamMember`, `TEAM_MEMBERS`, `branchName`, `isWorkingBarber`, `offsetToDate`, `formatRowDate`, `teamColumns`, `TeamCellFormatters`, `teamCells`, `OpenShift`, `OPEN_SHIFTS`, `TeamMetric`, `membersOfRole`, `teamMetrics`, `TeamAlertId`, `TeamAlertPreset`, `IDLE_OCCUPANCY`, `TEAM_ALERTS`, `alertsForRole` · piezas: Progress, StatusBadge · usa: @/app/i18n, @/features/branches
- **teamShared.tsx** — Las piezas chicas del módulo de equipo: la sucursal activa, el avatar, el rol y el estado de una persona, y l… · `MemberAvatar`, `TeamPersonAvatar`, `MemberStatusBadge`, `RoleBadge`, `InfoCard`, `InfoRow`, `Stat` · piezas: Avatar, AvatarFallback, AvatarImage, Badge, SectionHeader, StatusBadge, initialsOf · usa: @/app/i18n, @/lib/utils
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

### transactions

- **AccountDrawer.tsx** — El detalle de una cuenta, en un panel: qué se cobró línea por línea, las cuentas —subtotal, impuesto, total,… · `AccountDrawerProps`, `AccountDrawer` · piezas: Button, DrawerShell, IconTile, Text · usa: @/app/i18n, @/features/calendar, @/features/customers, @/features/services, @/i18n
- **TransactionsPage.tsx** — Las transacciones: las cuentas de un periodo, con lo que se facturó, lo que ya entró y lo que falta por cobra… · `TransactionsPage` · piezas: Breadcrumbs, Button, DataListBlock, ListItem, MetricCard, MetricRing, OptionTile, PageHeader, PeriodNavigator, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ShellHeaderSlot, Skeleton, getChartTheme · usa: @/app/i18n, @/features/access, @/features/calendar, @/features/customers, @/features/team, @/i18n, @/lib/query, @/lib/utils
- **api.ts** — Contrato de transacciones; ver docs/API_CONTRACT.md. · `transactionsApi` · llama: GET /transactions · usa: @/lib/api
- **queries.ts** · `transactionKeys`, `useTransactionsQuery`
- **transactionsAccess.ts** — Las cuentas que le tocan a quien mira: todas, o solo las que atendió el barbero. · `accountsFor`, `showsPeriodTotals` · usa: @/features/access
- **transactionsHome.tsx** — Qué se cobró, en una línea: «2 servicios · 1 producto». · `TransactionsSummary`, `summarize`, `countByStatus`, `transactionColumns`, `TransactionCellContext`, `describeLines`, `transactionCells` · usa: @/app/i18n, @/features/calendar, @/features/customers
- **transactionsShared.tsx** — El estado de una cuenta, con su color y su icono. · `AccountStatusBadge` · piezas: Badge · usa: @/app/i18n
- **transactionsStyle.ts** — Un color y un icono por estado de cuenta: lo pendiente avisa, lo cobrado tranquiliza, lo anulado se apaga. · `STATUS_STYLE`
- **types.ts** — Una «cuenta» es lo que se le cobra a alguien: cada cita es una y cada venta de mostrador es otra. · `accountStatusSchema`, `AccountStatus`, `accountLineSchema`, `AccountLine`, `accountSchema`, `Account`, `transactionsResponseSchema`, `TransactionsResponse`, `TransactionsParams`, `ACCOUNT_STATUS_KEYS`, `ACCOUNT_STATUS_HINT_KEYS`, `METHOD_KEYS` · usa: @/app/i18n, @/features/calendar
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
- **useDragScroll.ts** — Una tira que se desliza de lado también con ratón. · `useDragScroll`
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

### booking

- **alternatives.ts** — Qué servicios cubre cada habilidad. · `SKILL_SERVICES`, `Alternative`, `alternatives`, `earliest`, `WaitlistWindow`, `joinWaitlist`
- **handlers.ts** — Para las pruebas: cada prueba empieza sin intentos acumulados. · `resetBookingLimits`, `bookingHandlers`, `bookingServiceName` · usa: @/features/booking
- **logic.ts** — Los barberos que el cliente puede elegir en una sucursal, en el orden del calendario. · `bookingRules`, `taxPercent`, `tipOptions`, `bookableBarbers`, `barberPrice`, `publicServicesIn`, `serviceName`, `durationOf`, `branchHoursToday`, `shop`, `cardFeeRule`, `catalog`, `barberFree`, `availability`, `clientByPhone`, `isBlockedPhone`, `customerOf`, `depositAmount`, `cardsOf`, `saveCard`, `bookedOf`, `reservationView`, `myAppointments`, `findReservationLine`, `visitSuggestion`, `branchDetail` · usa: @/features/booking
- **recurring.ts** — Dejar una cita fija («cada 3 semanas»): las próximas con el mismo barbero y a la misma hora. · `REPEAT_WEEKS`, `RepeatWeeks`, `MAX_REPEATS`, `repeatAppointment`
- **reminders.ts** — Programa la confirmación y los recordatorios que aún estén en el futuro. · `scheduleMessages`, `cancelMessages`, `rescheduleMessages`
- **state.ts** — Lo que la reserva en línea guarda además de las citas (que viven en la agenda, `db.calendar.appointments`, co… · `MockBookingLine`, `MockReservation`, `MockSavedCard`, `MockOutboxMessage`, `MockBookingState`, `emptyBooking`, `DEMO_PHONES`, `DEMO_GUESTS`, `DEMO_GUESTS_CLIENT`, `DEMO_CARDS`, `BLOCKED_PHONE`, `DEMO_OTP`, `DECLINED_CARD`

- **browser.ts** — Service worker para el navegador; se arranca desde `main.tsx` cuando `env.useMocks`. · `worker`
- **db.ts** — Identidad de la empresa: su logo para fondos claros y, opcional, para oscuros. · `MockUserStatus`, `MockUserRole`, `MockUser`, `MockAuthProvider`, `MockAccount`, `seededRandom`, `seedUsers`, `ACCOUNTS`, `MockBranding`, `MockCalendarState`, `MockTeamState`, `MockDb`, `createDb`, `db`
- **handlers.ts** — Código por SMS del backend simulado; en producción cada envío genera uno distinto. · `OTP_CODE`, `MAX_LOGIN_FAILURES`, `handlers`
- **media.ts** — El retrato de cada persona del equipo. · `TEAM_PHOTOS`, `galleryFor`, `SERVICE_PHOTOS`, `PRODUCT_PHOTOS`, `clientPhoto`, `userPhoto`, `ACCOUNT_PHOTOS`, `imageOrNull`
- **metrics.ts** — Las métricas del negocio, simuladas. · `BARBERS`, `resolveMetricsBarber`, `daysOf`, `sum`, `round2`, `Appointment`, `DayRecord`, `simulateDay`, `PeriodTotals`, `totalsOf`, `countBy`, `daypartOf`, `MetricsQuery`, `SimulatedPeriod`, `simulatePeriod`, `periodOf`, `previousOf`, `buildBusinessMetrics` · piezas: fromIsoDate, periodRange, previousPeriodRange, toIsoDate · usa: @/features/metrics
- **metricsTabs.ts** · `buildCustomersMetrics`, `buildBarbersMetrics`, `buildMarketingMetrics`, `buildInsightsMetrics` · piezas: periodRange, toIsoDate · usa: @/features/metrics
- **random.ts** — Generador pseudoaleatorio con semilla (mulberry32): la misma semilla, la misma serie. · `seededRandom`
- **server.ts** — Servidor para Vitest (Node/jsdom); ver `src/test/setup.ts`. · `server`

### calendar

- **handlers.ts** — Las franjas de una persona un día concreto: la excepción de esa fecha o su horario fijo. · `hoursOn`, `barbersIn`, `appointmentsOn`, `blocksOn`, `clashMessage`, `catalogServices`, `calendarHandlers`, `workingClock`
- **seed.ts** — Los datos del calendario del backend simulado: el equipo con su horario, los clientes, el catálogo y una agen… · `MockWorkingRange`, `MockBarber`, `MockClientType`, `MockNoteKind`, `MockClientNote`, `MockClient`, `MockService`, `MockProduct`, `MockAppointmentStatus`, `MockAppointmentSource`, `MockRepeatRule`, `MockPaymentMethod`, `MockHistoryEntry`, `MockPayment`, `MockAppointment`, `MockBlockCategory`, `MockBlockRepeat`, `MockTimeBlock`, `MockWaitlistEntry`, `MockSale`, `SERVICES`, `PRODUCTS`, `WALK_IN_CLIENT`, `seedClients`, `dateKey`, `localIso`, `parseClock`, `clockOf`, `SeedDayOptions`, `seedDay`, `seedBlocks`, `blockAppliesOn`

### customers

- **handlers.ts** · `profileOf`, `saveProfile`, `customersHandlers`
- **seed.ts** — Los clientes del backend simulado. · `MockSegment`, `MockGuest`, `MockCustomerProfile`, `MockCustomersState`, `emptyCustomers`, `hashOf`, `deriveProfile`, `lifecycleOf`, `MockCustomerAppointment`, `MockCustomerPayment`, `MockCustomerProduct`, `ticketOf`, `historyOf`, `paymentsOf`, `productsOf`

### expenses

- **handlers.ts** · `expensesHandlers`
- **seed.ts** — Los gastos del backend simulado: lo que sale de caja en cada sucursal. · `MockExpenseKind`, `MockExpenseFrequency`, `MockExpense`, `seedExpenses`

### payroll

- **handlers.ts** · `payrollHandlers`

### products

- **handlers.ts** · `productsHandlers`
- **seed.ts** — El catálogo de productos del backend simulado. · `MockProductVisibility`, `MockProductCategory`, `MockCatalogProduct`, `MockProductsState`, `UNCATEGORIZED_PRODUCT_ID`, `seedProducts`

### services

- **handlers.ts** · `servicesHandlers`
- **seed.ts** — El catálogo de servicios del backend simulado. · `MockServiceKind`, `MockVisibility`, `MockPrepPosition`, `MockServiceCategory`, `MockCatalogService`, `MockServicesState`, `UNCATEGORIZED_ID`, `seedServices`

### settings

- **handlers.ts** · `settingsHandlers`
- **seed.ts** — La configuración del backend simulado. · `MockSettingsSection`, `MockSettingsList`, `MockListItem`, `MockSettingsState`, `DEFAULT_POLICY`, `seedSettings`

### team

- **handlers.ts** · `teamHandlers`
- **seed.ts** — El equipo del backend simulado: las personas de las cuatro sucursales con todo lo que guarda su ficha (perfil… · `MockTeamRole`, `MockTeamStatus`, `MockWorkingRange`, `MockLevel`, `MockServiceOverride`, `MockCompensationType`, `MockCompensation`, `MockPayments`, `MockPermissionColumn`, `MockPermissions`, `MockReminderChannel`, `MockMemberOptions`, `MockTeamMember`, `MockLineupEntry`, `MockBranchOrder`, `MockScheduleOverride`, `PERMISSION_ROWS`, `ROLE_PERMISSION_DEFAULTS`, `LEVELS`, `seedTeam`, `isBarberRole`, `barbersOf`, `seedOrders`, `seedOverrides`, `memberName`

### transactions

- **handlers.ts** · `transactionsHandlers`

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
