# Mapa del código de producto

Generado con `npm run codemap` desde `src/`. No se edita a mano. Las piezas del sistema de diseño están en `ai-tools/CATALOG.md`; aquí está lo que se construyó con ellas.

Cada línea: archivo — qué es · lo que exporta · `llama:` endpoints · `piezas:` componentes del sistema que usa · `usa:` otros módulos. Ve directo al archivo que necesitas; no leas carpetas enteras.

## Rutas

De `src/app/router.tsx`.

- `/calendario` → pendiente (SectionPlaceholderPage)
- `/clientes` → pendiente (SectionPlaceholderPage)
- `/servicios` → pendiente (SectionPlaceholderPage)
- `/productos` → pendiente (SectionPlaceholderPage)
- `/gastos` → pendiente (SectionPlaceholderPage)
- `/nomina` → pendiente (SectionPlaceholderPage)
- `/transacciones` → pendiente (SectionPlaceholderPage)
- `/login` → LoginPage
- `/dashboard` → DashboardPage
- `/usuarios` → TeamHomePage
- `/usuarios/lista` → UsersPage
- `/configuracion` → SettingsPage
- `/configuracion/:seccion` → SettingsSectionPage
- `/403` → ForbiddenPage
- `/docs/*` → DocsApp
- `*` → NotFoundPage

## Endpoints simulados

Lo que responde MSW hoy.

- `POST /auth/otp/request` · src/mocks/handlers.ts
- `POST /auth/otp/verify` · src/mocks/handlers.ts
- `POST /auth/oauth` · src/mocks/handlers.ts
- `POST /auth/recovery/request` · src/mocks/handlers.ts
- `GET /auth/me` · src/mocks/handlers.ts
- `POST /auth/logout` · src/mocks/handlers.ts
- `GET /dashboard/summary` · src/mocks/handlers.ts
- `GET /users` · src/mocks/handlers.ts
- `GET /users/:id` · src/mocks/handlers.ts
- `POST /users` · src/mocks/handlers.ts
- `PATCH /users/:id` · src/mocks/handlers.ts
- `DELETE /users/:id` · src/mocks/handlers.ts
- `GET /company/branding` · src/mocks/handlers.ts
- `PUT /company/branding` · src/mocks/handlers.ts

## App · `src/app`

Router, providers, layout, navegación y páginas de error.

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

- **AppLayout.tsx** — El shell de administración alimentado con datos reales: la persona de la sesión, la navegación de la app con… · `AppLayout` · piezas: AdminShell, PersonalizationMenu · usa: @/features/auth, @/features/branches, @/features/branding, @/features/settings, @/themes

- **lazyPages.ts** — Cada pantalla se carga en diferido: el primer render solo trae el shell. · `DashboardPage`, `TeamHomePage`, `UsersPage`, `DocsApp`, `SettingsPage`, `SettingsSectionPage`, `SectionPlaceholderPage`
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
- **LoginForm.tsx** — Entrar en dos pasos: el celular pide el código por SMS y el código abre la sesión. · `LoginFormProps`, `LoginForm` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, InputOtp, Label, PhoneInput, Separator, Text · usa: @/app/i18n, @/icons, @/lib/api
- **LoginHeroImage.tsx** — La foto de portada del login, servida desde `public/`. · `LOGIN_HERO_IMAGE`, `LoginHeroImage`
- **LoginPage.tsx** — Entrada a la aplicación en dos mitades. · `LoginPage` · piezas: BarberlyticsLogo, Enter, Foil, Grain, HairCanvas, Halo, Heading, Text, Vignette · usa: @/app/i18n, @/i18n, @/themes
- **RecoveryPanel.tsx** — Olvidé mi número: se escribe el correo registrado y el celular llega allí. · `RecoveryPanelProps`, `RecoveryPanel` · piezas: Alert, AlertDescription, AlertTitle, Button, Heading, Input, Label, Text · usa: @/app/i18n, @/icons, @/lib/api
- **RequireAuth.tsx** — Guarda de ruta. · `RequireAuthProps`, `RequireAuth` · usa: @/app/components
- **api.ts** · `authApi` · llama: POST /auth/otp/request, POST /auth/otp/verify, POST /auth/oauth, GET /auth/me, POST /auth/logout, POST /auth/recovery/request · usa: @/lib/api
- **authContext.ts** · `AuthContextValue`, `AuthContext`
- **phoneLabel.ts** — «+573001234567» → «+57 300 123 4567», para decir a qué número se envió el código. · `describePhone` · piezas: formatNational, parseE164
- **providers.ts** — Pide al proveedor (Google Identity Services, MSAL para Outlook) la credencial con la que el backend abre la s… · `requestProviderCredential` · usa: @/lib/api
- **tokenStorage.ts** — Dónde vive el token de acceso en el navegador. · `TokenStorage`, `sessionTokenStorage`, `createMemoryTokenStorage`
- **types.ts** — Celular en E.164 tal como lo emite `PhoneInput`, completo según el país: un celular de Colombia tiene 10 dígi… · `userRoleSchema`, `UserRole`, `phoneSchema`, `authUserSchema`, `AuthUser`, `sessionSchema`, `Session`, `otpRequestSchema`, `OtpRequest`, `OTP_LENGTH`, `otpVerifySchema`, `OtpVerify`, `authProviderSchema`, `AuthProvider`, `recoveryRequestSchema`, `RecoveryRequest`, `AuthStatus` · piezas: parseE164
- **useAuth.ts** — El usuario autenticado; lanza si se usa fuera de una ruta protegida. · `useAuth`, `useCurrentUser`

### branches

- **branches.ts** — Las sucursales del negocio. · `BRANCHES`, `DEFAULT_BRANCH_ID`

### branding

- **BrandIdentitySettings.tsx** — Ajuste «Identidad de marca»: la empresa sube su logo y su nombre, y el menú lateral los encaja con `BrandSlot… · `BrandIdentitySettings` · piezas: Alert, AlertDescription, BrandSlot, Button, Card, Field, FormSection, Heading, Input, Text, UploadZone, logoShape · usa: @/lib/query, @/themes
- **api.ts** — Contrato de identidad de la empresa; ver docs/API_CONTRACT.md. · `brandingApi` · llama: GET /company/branding, PUT /company/branding · usa: @/lib/api
- **logoFile.ts** — Alto mínimo de un PNG/JPG/WebP para que se vea nítido a 32px en pantallas retina. · `MIN_RASTER_HEIGHT`, `LogoFile`, `readLogoFile`, `logoQualityWarning`
- **queries.ts** · `brandingKeys`, `useBrandingQuery`, `useSaveBranding` · usa: @/lib/api
- **types.ts** — Identidad de la empresa; ver docs/API_CONTRACT.md → `/company/branding`. · `brandingSchema`, `Branding`, `BrandingInput`, `LOGO_ACCEPT`, `LOGO_MAX_MB`, `BRAND_NAME_MAX`

### dashboard

- **DashboardPage.tsx** — El home, como plantilla. · `DashboardPage` · piezas: AttentionAction, AttentionStrip, Badge, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, TemplateCatalogDrawer, TemplateTile, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **api.ts** · `dashboardApi` · llama: GET /dashboard/summary · usa: @/lib/api
- **homeTemplate.tsx** — Los datos de la plantilla del home. · `ProcessStatus`, `ProcessRow`, `PROCESS_ROWS`, `offsetToDate`, `formatRowDate`, `STATUS_KEYS`, `processColumns`, `processCells`, `buildTemplates`, `buildTemplateGroups`, `PulseMetric`, `PULSE_METRICS`, `AlertId`, `AlertPreset`, `CLOSING_SOON_DAYS`, `ALERT_PRESETS` · piezas: Progress, StatusBadge · usa: @/app/i18n
- **queries.ts** · `dashboardKeys`, `useDashboardSummary`
- **types.ts** · `dashboardSummarySchema`, `DashboardSummary`

### sections

- **SectionPlaceholderPage.tsx** — Una sección del menú que todavía no tiene pantalla. · `SectionPlaceholderPageProps`, `SectionPlaceholderPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n

### settings

- **SettingsPage.tsx** — Todo lo que se ajusta, en una sola pantalla. · `SettingsPage` · piezas: Breadcrumbs, IconTile, ListItem, ListItemGroup, PageHeader, SectionHeader, ShellHeaderSlot · usa: @/app/i18n
- **SettingsSectionPage.tsx** — Un ajuste concreto, todavía sin formulario. · `SettingsSectionPage` · piezas: Badge, Breadcrumbs, EmptyState, PageHeader, ShellHeaderSlot · usa: @/app/i18n, @/features/branding
- **settingsCatalog.ts** — Los grupos con sus rótulos traducidos y su ruta resuelta. · `SETTINGS_BASE_PATH`, `buildSettingsGroups`, `SETTINGS_ALL`, `findSettingsItem` · usa: @/app/i18n
- **settingsIcons.ts** — El icono y el color de cada ajuste. · `SETTINGS_ICONS`, `SETTINGS_GROUP_TONES`

### team

- **TeamHeaderActions.tsx** — Las acciones de la pantalla cuando no manda la barra flotante. · `TeamHeaderActionsProps`, `TeamHeaderActions` · piezas: Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, railScreenTiers
- **TeamHomePage.tsx** — El home de equipo. · `TeamHomePage` · piezas: AttentionAction, AttentionStrip, Breadcrumbs, Button, DataListActionRail, DataListBlock, ListItem, MetricCard, MetricDial, MetricRing, OptionTile, PageHeader, Progress, ShellHeaderSlot, ShellRailSlot, Skeleton, SparklineChart, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableShell, ThemaTabs, getChartTheme · usa: @/app/i18n, @/i18n
- **teamHome.tsx** — Los datos del home de equipo. · `TeamRoleId`, `PayoutKind`, `TeamRoleSpec`, `ALL_ROLES`, `TeamRoleFilter`, `isManagerRole`, `TEAM_ROLES`, `ROLE_BY_ID`, `PAYOUT_KEYS`, `TeamStatus`, `TEAM_STATUS_KEYS`, `TeamMember`, `TEAM_MEMBERS`, `branchName`, `isWorkingBarber`, `offsetToDate`, `formatRowDate`, `teamColumns`, `TeamCellFormatters`, `teamCells`, `OpenShift`, `OPEN_SHIFTS`, `TeamMetric`, `membersOfRole`, `teamMetrics`, `TeamAlertId`, `TeamAlertPreset`, `IDLE_OCCUPANCY`, `TEAM_ALERTS`, `alertsForRole` · piezas: Progress, StatusBadge · usa: @/app/i18n, @/features/branches

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
- **db.ts** — Base de datos en memoria del backend simulado. · `MockUserStatus`, `MockUserRole`, `MockUser`, `MockAuthProvider`, `MockAccount`, `seededRandom`, `seedUsers`, `ACCOUNTS`, `MockBranding`, `MockDb`, `createDb`, `db`
- **handlers.ts** — Código por SMS del backend simulado; en producción cada envío genera uno distinto. · `OTP_CODE`, `handlers`
- **server.ts** — Servidor para Vitest (Node/jsdom); ver `src/test/setup.ts`. · `server`

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
