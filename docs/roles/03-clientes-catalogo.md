# Roles en Clientes, Servicios y Productos

Investigación del 2026-10-03. Detalla, acción por acción, lo que el resumen de `docs/ROLES_PLAN.md` (§3, filas
Clientes, Teléfonos, Servicios / Productos) deja en una línea. Solo lectura: no se tocó producción ni el código.

**Fuentes**

| Sigla | Fuente | Archivos |
|---|---|---|
| [P] | Producción vista en pantalla (solo perfiles **Business** y **Barber comission**) | `centro-de-ayuda/casos/clientes.md`, `casos/servicios-productos.md`, `casos/modelo-sucursales-roles-permisos.md` §6b, `content/es/clientes/*`, `content/es/servicios/*`, `content/es/productos/*`, `content/es/empezar/guia-*.md` |
| [M] | Matriz de permisos de fábrica de producción | `casos/modelo-sucursales-roles-permisos.md` §5, `content/es/roles-y-permisos/tabla-de-permisos-por-rol.md` y `permisos-*.md` |
| [N] | Notion (ya resumido en el encargo y en `ROLES_PLAN.md`) | propiedad híbrida del cliente, alertas del barbero, bug de contactos del de renta, dueño aprueba precios, precio por nivel, precio propio del de renta, teléfono enmascarado |
| [D] | Decisión propuesta aquí, por confirmar | — |

**Celdas**: `✅` puede · `👁` solo ver · `🔒 suyo` solo sobre lo suyo (ver §«Datos que se recortan») · `—` no aparece · `?` sin
dato. La marca de fuente va pegada a la celda. Donde producción y propuesta difieren se escribe `prod → propuesta`
(p. ej. `✅[P] → 🔒 suyo[D]`).

**Columna «Permiso»**: `bloque·fila·columna` con los ids de `src/features/team/permissionsCatalog.ts`
(`V` ver · `C` crear · `E` editar · `B` borrar · `A` activo). «nuevo» = fila que hoy no existe y se propone.

**Columna «En Thema»**: ✓ con su ruta si la acción existe en el rediseño; «parcial» si existe a medias; ✗ si no
existe. **Ninguna acción de estos tres módulos mira hoy el rol**: todo «✓» significa «existe para todos».

---

# Clientes

- **Dueño** — Todo, en todas sus sucursales: lista con LTV, contacto enmascarado [P], crear, editar, bloquear, notas,
  importar y descargar [M]. Único que decide la **propiedad** de un cliente (tienda / walk-in / barbero) [D] y
  único que borra o fusiona sin restricción [D]. Recibe las alertas de negocio (churn, VIP en riesgo) [N].
- **Administrador** — Lo mismo que el dueño **en su sucursal**, menos descargar la lista (apagado de fábrica [M]).
  Puede borrar [M] y fusionar [D]; no cambia la propiedad de un cliente de un barbero de renta [D].
- **Recepción** — Opera la clientela para agendar: ve a todos los de la sucursal, crea, edita y bloquea [M], escribe
  notas; **sin cifras** (LTV, ticket, pulso) [N→D], sin borrar [M], sin descargar [M]. Importar está activo de fábrica
  [M] pero se propone quitarlo [D].
- **Barbero por comisión** — Hoy ve la lista completa de la sucursal con el teléfono tapado [P] y puede crear [M].
  Propuesta: **sus clientes por defecto** (los que atendió, lo prefieren o trajo él), con las cifras de lo que le
  dejaron **a él**, sus alertas de recompra y riesgo [N], y un buscador de toda la sucursal solo para agendar [D].
- **Barbero de renta** — Matriz con Clientes completo + importar + descargar [M], nunca visto en pantalla. Propuesta:
  **su libreta**: solo los suyos; los que trajo él (Barber-Owned) son privados —nadie más ve su contacto— y son los
  únicos que puede descargar [N→D]; los que le mandó la barbería los atiende pero no se los lleva [D].

## Inventario de acciones — Clientes

### Lista y navegación

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| C1. «Clientes» en el menú | ✅[P] | ✅[M] | ✅[M] | ✅[P] | ✅[M] | `bookings·clients·V` | §6b; tabla de permisos | ✓ (`/clientes`, `navigation.ts:42`) sin mirar el rol |
| C2. Alcance de la lista (qué filas trae) | Todas las sucursales o la elegida [P] | Su sucursal [D] | Su sucursal [D] | Todos [P] → 🔒 suyo [D] | 🔒 suyo [D] | nuevo `scope: all\|own` | `casos/clientes.md`; `la-lista-de-clientes.md` («La lista es la de la sucursal que tienes elegida») | parcial: `GET /customers` devuelve **todas las sucursales** sin filtrar por la cabecera (`mocks/customers/handlers.ts`, `queries.ts:12`) |
| C3. Selector «Todas las sucursales» en Clientes | ✅[P] | ?→ — [D] | — [D] | — [D] | — [D] | sucursales activadas de la persona | `modelo…permisos.md` §2 | ✗ (no hay filtro por sucursal) |
| C4. Fichas de segmento con recuento (Nuevo… Bloqueado) | ✅[P] | ✅ | ✅ | 🔒 suyo[D] (recuento de los suyos) | 🔒 suyo[D] | `clients·V` | `casos/clientes.md` (pestañas por tipo) | ✓ (`CustomersPage.tsx:185`) |
| C5. Pulso: «vuelven», LTV promedio y total, «en camino» | ✅[D] | ✅[D] | — [N→D] (sin cifras) | 🔒 suyo[D] | 🔒 suyo[D] | nuevo: cifras de cliente (ver C-PRIV) | Notion: recepción sin números | ✓ (`CustomersPage.tsx:200`), sin recorte |
| C6. Aviso «En riesgo» | ✅[N] | ✅[N] (coaching) | 👁[D] (sin cifra de valor) | 🔒 suyo[N] | 🔒 suyo[N] | `clients·V` | Notion: alertas del barbero sobre los suyos | ✓ (`customersHome.tsx:143`) |
| C7. Aviso «Cumple esta semana» | ✅ | ✅ | ✅[D] (recepción felicita / ofrece cita) | 🔒 suyo[D] | 🔒 suyo[D] | `clients·V` | — | ✓ |
| C8. Aviso «Falla seguido» (cancelaciones + no-shows ≥ 3) | ✅ | ✅ | ✅[D] | 🔒 suyo[N] (no-shows de los suyos) | 🔒 suyo[N] | `clients·V` | Notion: no-shows del barbero | ✓ |
| C9. Aviso de primera visita / cliente nuevo individual | ✅[N] | ✅[N] | — | — [N] (no culparlo) | — [N] | — | `ROLES_PLAN.md` §3 nota | ✗ (no existe; no crearlo para barberos) |
| C10. Aviso «VIP en riesgo», concentración de clientela en un barbero | ✅[N] | ✅[D] | — | — | — | nuevo (alertas de negocio) | Notion | ✗ |
| C11. Buscar por nombre / correo | ✅[P] | ✅ | ✅ | 🔒 suyo[D] | 🔒 suyo[D] | `clients·V` | `buscar-un-cliente.md` | ✓ (`searchBy`, `CustomersPage.tsx:259`) |
| C12. Buscar por celular completo | ?[P] (no confirmado qué campos busca) | ✅[D] | ✅[D] (identificar a quien llama) | 🔒 suyo[D] | 🔒 suyo[D] | `clients·V` | `buscar-un-cliente.md` («todavía no está confirmado») | ✓ busca por los dígitos completos aunque la celda esté tapada |
| C13. Columna LTV | ✅[P] | ✅[M] | — [D] | 🔒 «te ha dejado» [D] | 🔒 «te ha dejado» [D] | nuevo: cifras de cliente | `casos/clientes.md` (columna LTV) | ✓ visible por defecto |
| C14. Columna Teléfono (enmascarado) | 👁 tapado[P] | 👁 tapado | 👁 tapado | 👁 tapado[P] | 👁 tapado / completo en sus Barber-Owned [D] | `client-info·A` [D] | §6b (`+57******2020`) | ✓ (`maskPhone`) |
| C15. Columna Correo | ✅ en claro[P] | ✅ | ✅ | ?[P] → tapado[D] | 🔒 suyo[D] | `client-info·A` [D] | `la-lista-de-clientes.md` | ✓ oculta por defecto, en claro |
| C16. Columna Barbero preferido | ✅ | ✅ | ✅ | — [D] (todos serían él) | — [D] | `clients·V` | — | ✓ oculta por defecto |
| C17. Columna Sucursal | ✅[P] | ✅ | ✅ | ✅ | ✅ | `clients·V` | `casos/clientes.md` | ✓ |
| C18. Columna «# Citas» / visitas | ✅[P] | ✅ | ✅ | 🔒 con él[D] | 🔒 con él[D] | `clients·V` | `casos/clientes.md` | ✓ (total en la casa) |
| C19. Configurar y ordenar columnas | ✅ | ✅ | ✅ (sin LTV en el menú) [D] | ✅ | ✅ | — (preferencia personal) | — | ✓ (`DataListBlock`, `tableId="clientes-lista"`) |
| C20. Paginación | ✅[P] | ✅ | ✅ | ✅ | ✅ | — | `casos/clientes.md` | ✓ (en memoria, sin paginar en servidor) |

### Altas, importación y descarga

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| C21. Crear cliente (botón en la lista) | ✅[P] | ✅[M] | ✅[M] | ✅[M] (artículo dice que no lo ve) → ✅[D] | ✅[M] | `clients·C` | tabla de permisos; `crear-un-cliente.md` | ✓ drawer (`CustomerFormDrawer.tsx`) |
| C22. Crear cliente desde «Crear cita» | ✅[P] | ✅ | ✅[P] | ✅[D] | ✅[D] | `clients·C` | `guia-de-recepcion.md` | ✓ (calendario) |
| C23. Origen al crear (tienda / walk-in / barbero) | Elige [D] | Elige [D] | Tienda o walk-in [D] | Barbero si lo crea él [D] | Barbero, fijo [D] | nuevo `customer.origin` | Notion: Shop-Generated, Walk-In, Barber-Owned | ✗ |
| C24. Importar clientes | ✅[M] | ✅[M] | ✅[M] → —[D] | —[M] | ✅[M] → 🔒 a su libreta[D] | `bookings·import-clients·A` | `importar-clientes.md` (sin botón en prod) | ✗ |
| C25. Descargar / exportar la lista | ✅[M] | —[M] (activable) | —[M] | —[M] | ✅[M] → 🔒 solo Barber-Owned[D] | `bookings·export-clients·A` | `descargar-clientes.md` (sin botón en prod) | ✗ |
| C26. Fusionar duplicados | ✅[D] | ✅[D] | Sugerir[D] | — | 🔒 entre los suyos[D] | nuevo `clients·E` + confirmación | `un-cliente-aparece-duplicado.md` («no hay una opción para unir») | ✗ (solo `422` si el celular se repite) |

### Ficha del cliente

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| C27. Abrir la ficha | ✅[P] | ✅ | ✅ | ✅[P] → 🔒 suyo[D] | 🔒 suyo[D] | `clients·V` | `ver-un-cliente.md` («¿Un barbero ve lo mismo? Ve la ficha») | ✓ (`/clientes/:id`) |
| C28. Abrir la ficha de un cliente ajeno por URL | ✅ | ✅ (su sucursal) | ✅ (su sucursal) | — → `403`[D] | — → `403`[D] | guarda de ruta | — | ✗ (cualquier id carga) |
| C29. Resumen: LTV y ticket promedio | ✅[P] | ✅ | — [D] | 🔒 lo suyo[D] | 🔒 lo suyo[D] | nuevo: cifras de cliente | `casos/clientes.md` (Información general) | ✓ (`CustomerOverview.tsx:63`), cifra total |
| C30. Resumen: visitas y frecuencia | ✅[P] | ✅ | ✅ | ✅ (ritmo del cliente) [D] | ✅[D] | `clients·V` | `indicadores-de-un-cliente.md` | ✓ |
| C31. Resumen: cumplimiento (asistió / canceló / no vino) | ✅[P] | ✅ | ✅[D] (decide pedir prepago) | ✅[D] | ✅[D] | `clients·V` | «Información importante» | ✓ |
| C32. Aviso «Antes de empezar» (alergias, medicamentos) | ✅ | ✅ | ✅ | ✅ (seguridad) [D] | ✅[D] | `clients·V` | `notas-del-cliente.md` | ✓ (`CustomerOverview.tsx:49`) |
| C33. Contacto: teléfono enmascarado | 👁[P] | 👁 | 👁 | 👁[P] | 👁 / completo en sus Barber-Owned[D] | `client-info·A` [D] | §6b | ✓ tapado en pantalla |
| C34. Revelar el teléfono / llamar / WhatsApp | ?→ ✅ con registro[D] | ✅ con registro[D] | ✅ con registro[D] | — [D] (escribe desde la app) | 🔒 Barber-Owned[D] | nuevo `client-info·A` | Notion: enmascarado para todos | ✗ (pero el número viaja completo, ver §Cifras y privacidad) |
| C35. Contacto: correo, dirección, cumpleaños, «solo pago en línea» | ✅[P] | ✅ | ✅ | Cumpleaños sí, resto — [D] | 🔒 suyo[D] | `client-info·A` [D] | `perfil-de-un-cliente.md` | ✓ (`CustomerOverview.tsx:102`), en claro para todos |
| C36. Notas: leer (nota / medicamento / alergia) | ✅[P] | ✅ | ✅ | ✅ de sus clientes [D] | 🔒 suyo[D] | `clients·V` | `notas-del-cliente.md` | ✓ (`CustomerOverview.tsx:203`) |
| C37. Crear nota | ✅[P] | ✅ | ✅ | ✅[D] (sobre los suyos y desde la cita) | 🔒 suyo[D] | `clients·V` (hoy no tiene fila) → `clients·E`? | `notas-del-cliente.md` («Cualquiera que… tenga el botón Acciones») | ✓ (`CustomerNoteDrawer.tsx`, `POST /clients/:id/notes`) |
| C38. Editar o borrar una nota | ?[P] | ✅[D] | Las suyas[D] | Las suyas[D] | Las suyas[D] | `clients·E` | `notas-del-cliente.md` («pendiente de confirmar») | ✗ |
| C39. Pestaña Citas (historial) | ✅[P] | ✅ | ✅ | Todas con fecha y servicio; importe solo de las suyas [D] | 🔒 con él[D] | `clients·V` | `citas-de-un-cliente.md` | ✓ (`CustomerHistoryTabs.tsx`), con importe de todas |
| C40. Pestaña Pagos («Métodos de pago») | ✅[P] | ✅[M] | 👁 sin totales[D] | 🔒 suyo[D] | 🔒 suyo[D] | nuevo: cifras de cliente | `pagos-de-un-cliente.md` (roles: owner, admin) | ✓ (`?pestana=pagos`) |
| C41. Pestaña Productos comprados | ✅[P] | ✅ | ✅ | 🔒 vendidos por él[D] | 🔒 vendidos por él[D] | `clients·V` | `productos-de-un-cliente.md` | ✓ (`?pestana=productos`) |
| C42. Familia y amigos / invitados: ver | ✅[P] | ✅ | ✅ | ✅ de sus clientes[D] | 🔒 suyo[D] | `clients·V` | `familia-y-amigos.md` | ✓ (`?pestana=invitados`) |
| C43. Agregar / quitar invitado | ?[P] (no hay botón) → ✅[D] | ✅[D] | ✅[D] | 🔒 suyo[D] | 🔒 suyo[D] | `clients·E` | `familia-y-amigos.md` | ✓ (`POST/DELETE /customers/:id/guests`) |
| C44. Barbero preferido: ver | ✅ | ✅ | ✅ | ✅ | ✅ | `clients·V` | — | ✓ (Resumen) |
| C45. Barbero preferido: cambiar | ✅[D] | ✅[D] | ✅[D] | — [D] (no se reasigna clientela solo) | — [D] | `clients·E` | — | ✗ (no está en el formulario) |
| C46. Propiedad (tienda / walk-in / barbero): ver | ✅[D] | ✅[D] | 👁[D] | 🔒 la de los suyos[D] | 🔒 la de los suyos[D] | nuevo | Notion: propiedad híbrida | ✗ |
| C47. Propiedad: cambiar | ✅[D] (con historial) | —[D] | — | — | — (puede reclamar, el dueño aprueba) [D] | nuevo, solo dueño | Notion + deducciones de renta (`casos/…` §6) | ✗ |
| C48. «Información del cliente» (fila de la matriz) | ✅[M] | ✅[M] | ✅[M] | —[M] | —[M] | `bookings·client-info·A` | §5 | ✗ sin efecto (fila existe en el catálogo, nadie la lee) |

### Acciones sobre el cliente

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| C49. Editar datos (nombre, celular, correo, dirección…) | ✅[M] | ✅[M] | ✅[M] | —[M] | ✅[M] → 🔒 suyo[D] | `clients·E` | §5; en prod no se vio el botón (`un-cliente-aparece-duplicado.md`) | ✓ (`CustomerFormDrawer`, Resumen › Editar) |
| C50. Interruptor «Reserva y pago solo online» | ✅[P] | ✅ | ✅ | — | 🔒 suyo[D] | `clients·E` | `casos/clientes.md` | ✓ (formulario) |
| C51. Bloquear (con motivo obligatorio) | ✅[P] | ✅ | ✅ | —[D] (lo pide) | 🔒 suyo[D] | `clients·E` | `bloquear-a-un-cliente.md` (roles owner, admin, recepcion) | parcial: bloquea **sin motivo** (`ConfirmDialog`, `PATCH {blocked}`) |
| C52. Desbloquear | ✅[D] | ✅[D] | ✅[D] | — | 🔒 suyo[D] | `clients·E` | prod: «el desbloqueo» no visto | ✓ |
| C53. Crear cita desde la ficha o la lista | ✅[P] | ✅ | ✅ | ✅ (consigo) [D] | ✅ (consigo) [D] | `bookings·appointments·C` | `ver-un-cliente.md` (Acciones › Crear cita) | ✓ (`/calendario?cliente=`), bloqueada si el cliente está bloqueado |
| C54. Borrar cliente | ✅[M] | ✅[M] | —[M] | —[M] | ✅[M] → 🔒 Barber-Owned sin historial con la casa[D] | `clients·B` | §5; en prod no hay botón (`un-cliente-aparece-duplicado.md`) | ✗ |
| C55. Seleccionar varios (acciones en lote) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | ✓ (selección, pero ninguna acción de clientes es en lote) |

---

# Servicios

- **Dueño** — Todo el catálogo de la empresa: crear servicio, combo y categoría, editar, borrar, activar por sucursal,
  quién lo hace, precios por barbero, orden de reserva online [P/M]. **Aprueba precios** [N]: los cambios de precio
  de otros quedan pendientes hasta que él los acepte [D]. Fija el precio por **nivel** que hereda el de comisión [N].
- **Administrador** — Matriz con Servicios y Categorías completos [M]. Propuesta: edita el catálogo de su sucursal y
  activa/desactiva, pero **propone** precios (el dueño aprueba) y no borra servicios de toda la empresa [D].
- **Recepción** — Sin el módulo en la matriz [M]; necesita ver nombre, duración y precio para agendar y cobrar, cosa
  que ya le da el calendario. Thema le da hoy «Ver» [Thema]; propuesta: sin módulo, catálogo solo dentro de la cita [D].
- **Barbero por comisión** — No ve Servicios & Productos [P]. Propuesta: **«Mis servicios»** de solo lectura —qué hace,
  a qué precio (el de su nivel [N]) y cuánto tarda—, sin costo ni margen de la casa [D].
- **Barbero de renta** — Sin bloque de Servicios [M]. Notion: en renta no aplica el precio de la tienda, fija los
  suyos [N]. Propuesta: **«Mis servicios»** editable —qué servicios del catálogo ofrece, su precio y su duración—
  sin aprobación; no crea ni borra servicios del catálogo de la casa [D].

## Inventario de acciones — Servicios

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| S1. «Servicios» en el menú | ✅[P] | ✅[M] | —[M] (Thema: 👁) | —[P] → «Mis servicios»[D] | —[M] → «Mis servicios»[D] | `services·services·V` | §6b; `como-se-organizan-tus-servicios.md` | ✓ (`/servicios`) para todos |
| S2. Lista de servicios y combos | ✅[P] | ✅ | —[D] | 🔒 los que hace[D] | 🔒 los que ofrece[D] | `services·V` | `la-lista-de-servicios.md` | ✓ (`ServicesPage.tsx`) |
| S3. Filtro por categoría y tipo | ✅[P] | ✅ | — | ✅ (sobre los suyos) | ✅ | `services·V` | `casos/servicios-productos.md` | ✓ (`?categoria=`, `?tipo=`) |
| S4. Precio básico en la lista | ✅[P] | ✅ | — | Su precio[D] | Su precio[D] | `services·V` | — | ✓ (precio del catálogo) |
| S5. Costo y margen | ✅[P] (Costo del servicio) | ✅[D] | — | —[D] | Su costo propio[D] | nuevo: cifras de catálogo | `costo-y-precio-de-un-servicio.md` | ✓ (columnas ocultas por defecto, Resumen de la ficha) |
| S6. «Lo ofrecen» (cuántos barberos) | ✅ | ✅ | — | — | — | `services·V` | — | ✓ (columna `team`) |
| S7. Avisos del catálogo (nadie lo ofrece, sin costo, fuera de la reserva) | ✅ | ✅ | — | — | Los de sus servicios[D] | `services·V` | — | ✓ (`servicesHome.tsx:119`) |
| S8. Ver ficha del servicio | ✅[P] | ✅ | — | 👁 la suya[D] | 👁 la suya[D] | `services·V` | «Ver servicio» | ✓ (`/servicios/:id`) |
| S9. Crear servicio | ✅[P] | ✅[M] | —[M] | —[M] | —[M] → ?[D] (servicio propio solo suyo) | `services·C` | `crear-un-servicio.md` | ✓ (drawer) |
| S10. Crear combo | ✅[P] | ✅[M] | — | — | — | `services·C` | `crear-un-combo.md` | ✓ |
| S11. Editar servicio (nombre, descripción, categoría, impuesto) | ✅[P] | ✅[M] | — | — | — | `services·E` | `editar-un-servicio.md` | ✓ |
| S12. Cambiar el precio básico | ✅[P] | ✅[M] → propone, dueño aprueba[N→D] | — | — | — | `services·E` + nuevo `price-approval` | Notion: dueño aprueba precios | ✓ sin aprobación |
| S13. Duración base | ✅[P] | ✅ | — | — | — | `services·E` | `crear-un-servicio.md` | ✓ (5–480 min) |
| S14. Visibilidad online (Público / Privado) | ✅[P] | ✅ | — | — | — | `services·E` | `servicio-publico-o-privado.md` | ✓ |
| S15. Multiservicio y tiempo de preparación | ✅[P] | ✅ | — | — | — | `services·E` | `crear-un-servicio-avanzado.md` | ✓ |
| S16. Restricciones de tiempo para reservas | ✅[P] | ✅ | — | — | — | `services·E` | `casos/servicios-productos.md` (Avanzado) | ✗ (quedó fuera) |
| S17. Foto del servicio | ✅[P] | ✅ | — | — | — | `services·E` | idem | ✗ |
| S18. Borrar servicio (toda la empresa) | ✅[P] | ✅[M] → —[D] (desactiva en su sucursal) | — | — | — | `services·B` | `desactivar-o-borrar-un-servicio.md` («Borrar es para toda la barbería») | ✓ (`409` si está en un combo o con citas) |
| S19. Activar / desactivar en la sucursal (lote) | ✅[P] | ✅[P] (su sucursal) | — | — | — | `services·services·A`? (hoy «Activar servicios» no tiene fila propia) | `modelo…permisos.md` §3 | ✓ (barra de acciones, `PUT /services/activation`) |
| S20. Equipo: quién hace el servicio | ✅[P] | ✅ | — | 👁 si lo hace él[D] | Elige si lo ofrece él[D] | `services·E` (renta: nuevo «mis servicios») | `crear-un-servicio-equipo.md` | ✓ (pestaña Equipo, `PUT /services/:id/team`) |
| S21. Precio por barbero (override) | ✅[P] | ✅[M] → propone[D] | — | 👁 el suyo[D] | ✅ el suyo, sin aprobación[N] | `team·E` (ficha del miembro) / nuevo | `crear-un-servicio-equipo.md`; Notion: renta fija los suyos | parcial: se edita en la ficha del miembro (`serviceOverrideSchema`), no desde el servicio |
| S22. Precio para clientes nuevos y de lealtad por barbero | ✅[P] | ✅ → propone[D] | — | 👁 el suyo[D] | ✅ el suyo[D] | idem | `precio-para-clientes-nuevos-y-de-lealtad.md` | parcial (ficha del miembro: `newClientPrice`, `loyaltyPrice`) |
| S23. Duración por barbero | ✅[P] | ✅ | — | 👁[D] | ✅ la suya[D] | idem | idem | parcial (ficha del miembro) |
| S24. Comisión dividida y extra por barbero | ✅[P] | —[M] («Sección de pagos de barberos» solo dueño) | — | 👁 la suya[D] | — (no aplica en renta) [D] | `team·barber-payments·E` | §5 y §6 | parcial (ficha del miembro: `splitCommission`, `extraCommission`) |
| S25. Precio por nivel (Master, Senior…) | ✅[N] | ✅ → propone[D] | — | 👁 el de su nivel[N] | — (no aplica) [N] | nuevo `levels·E` | Notion: el precio del de comisión sale de su nivel | ✗ (`levelSchema` solo tiene `id`, `name`) |
| S26. Aprobar o rechazar precios propuestos | ✅[N] | — | — | — | — | nuevo, solo dueño | Notion | ✗ |
| S27. Categorías: ver | ✅[P] | ✅[M] | — | — | — | `services·service-categories·V` | `crear-una-categoria-de-servicios.md` | ✓ (`CategoriesDrawer`) |
| S28. Categorías: crear / editar / borrar | ✅[P] | ✅[M] | — | — | — | `service-categories·C/E/B` | idem | ✓ (borrar manda a `cat_none`) |
| S29. Visibilidad online de la categoría | ✅[P] | ✅ | — | — | — | `service-categories·E` | idem | ✓ |
| S30. Orden de agendamiento (reserva online) | ✅[P] | ✅[M] (V E A) | — | — | — | `services·service-lineup·V/E` (inferido: «Póngase en fila» de Servicios) | `orden-de-agendamiento.md` | ✓ (`/servicios/orden`) |
| S31. Ver servicios y precios al agendar o cobrar | ✅ | ✅ | ✅ | Los suyos, a su precio[D] | Los suyos, a su precio[N] | `appointments·C`; `pos·prices·A`? | `guia-*.md` | parcial: `/calendar/catalog` da el precio del catálogo, no el del barbero |

---

# Productos

- **Dueño** — Catálogo completo: crear, editar, borrar, activar por sucursal, categorías, precio de compra y de
  venta, SKU, marca, distribuidor, público/privado y «a la venta» [P/M]. Configura la **comisión de producto** de
  cada barbero (Sección de pagos de barberos) [M].
- **Administrador** — Inventarios completos [M]; edita y activa en su sucursal. Propuesta: el precio de venta lo
  propone y el dueño aprueba, igual que en servicios [D]; no borra productos de toda la empresa [D].
- **Recepción** — Productos y Categorías solo con Ver [M]; vende en el cobro y en la venta rápida. Propuesta: ve
  precio de venta, nunca precio de compra ni margen [D].
- **Barbero por comisión** — Sin módulo [P]; vende desde el calendario los productos «a la venta» [P] y ve **su**
  comisión de producto en lo que lleva ganado [D].
- **Barbero de renta** — Sin módulo [M]. Qué vende y a nombre de quién no está definido [?]. Propuesta: vende los
  productos de la tienda a cuenta de la tienda (con la comisión que fije el dueño) y no tiene catálogo propio en la
  primera versión [D].

## Inventario de acciones — Productos

| Acción / elemento | Dueño | Admin | Recepción | Comisión | Renta | Permiso (bloque·columna) | Fuente | En Thema |
|---|---|---|---|---|---|---|---|---|
| P1. «Productos» en el menú | ✅[P] | ✅[M] | 👁[M] | —[P] | —[M] | `inventory·products·V` | §6b; `como-se-organizan-tus-productos.md` | ✓ (`/productos`) para todos |
| P2. Lista de productos | ✅[P] | ✅ | 👁[M] | — | — | `products·V` | `la-lista-de-productos.md` | ✓ (`ProductsPage.tsx`) |
| P3. Precio de venta | ✅[P] | ✅ | 👁[M] | 👁 al vender | 👁 al vender | `products·V` | `precio-de-compra-precio-de-venta-y-sku.md` | ✓ |
| P4. Precio de compra y margen | ✅[P] | ✅[D] | —[D] | — | — | nuevo: cifras de catálogo | idem | ✓ columnas **visibles por defecto** (`productsHome.tsx:39-40`) |
| P5. SKU, marca, distribuidor | ✅[P] | ✅ | 👁[D] | — | — | `products·V` | idem | ✓ (SKU y distribuidor ocultos por defecto) |
| P6. Avisos (sin costo, sin SKU, uso interno) | ✅ | ✅ | — [D] | — | — | `products·V` | — | ✓ (`productsHome.tsx:111`) |
| P7. Ver ficha del producto | ✅[P] | ✅ | 👁[M] | — | — | `products·V` | «Ver producto» | ✓ (`/productos/:id`) |
| P8. Crear producto | ✅[P] | ✅[M] | —[M] | — | — | `products·C` | `crear-un-producto.md` | ✓ (drawer) |
| P9. Editar producto | ✅[P] | ✅[M] | —[M] | — | — | `products·E` | `editar-o-borrar-un-producto.md` | ✓ |
| P10. Cambiar precio de venta | ✅[P] | ✅[M] → propone[D] | — | — | — | `products·E` + nuevo `price-approval` | Notion: dueño aprueba precios | ✓ sin aprobación |
| P11. Borrar producto (toda la empresa) | ✅[P] | ✅[M] → —[D] | —[M] | — | — | `products·B` | idem («Borrar es para toda la barbería») | ✓ (`409` si está en una cita por cobrar) |
| P12. Activar / desactivar en la sucursal (lote) | ✅[P] | ✅ (su sucursal) | — | — | — | `products·A`? (sin fila propia) | `casos/servicios-productos.md` («Activar productos de barbería») | ✓ (barra, `PUT /products/activation`) |
| P13. «A la venta» / uso interno | ✅[P] | ✅ | — | — | — | `products·E` | `producto-publico-o-privado.md` | ✓ (`sellable`) |
| P14. Público / Privado (reserva online) | ✅[P] | ✅ | — | — | — | `products·E` | idem | ✓ |
| P15. Fotos del producto (hasta 5) | ✅[P] | ✅ | — | — | — | `products·E` | `fotos-de-un-producto.md` | ✗ |
| P16. Categorías: ver | ✅[P] | ✅[M] | 👁[M] | — | — | `inventory·product-categories·V` | `crear-una-categoria-de-productos.md` | ✓ (`CategoriesDrawer` compartido) |
| P17. Categorías: crear / editar / borrar | ✅[P] | ✅[M] | —[M] | — | — | `product-categories·C/E/B` | idem | ✓ (borrar manda a `pcat_none`) |
| P18. Inventario / existencias | —[P] (no existe) | — | — | — | — | — | `inventario-y-unidades.md` | ✗ (decidido no inventarlo) |
| P19. Avisos de pocas unidades / agotado | ✅[P] (Centro de notificaciones) | ✅[P] | — | — | — | Configuración › Notificaciones | idem | ✗ |
| P20. Vender en venta rápida (sin cita) | ✅[P] | ✅[P] | ✅[M] (Precios A) | ✅[P] (Acciones del calendario) | ✅[P] | `pos·prices·A` / `appointments·C` | `vender-un-producto.md` (roles incluye barbero) | ✓ (`POST /sales`) |
| P21. Añadir producto al cobro de una cita | ✅[P] | ✅ | ✅[M] | 🔒 en sus citas[P] | 🔒 en sus citas[D] | `appointments·E` | `vender-un-producto.md` | ✓ (checkout) |
| P22. Cambiar el precio en el cobro (descuento) | ? | ? | ? | ? | ? | `pos·prices·A`? (significado sin confirmar; en Configuración «Precios» es moneda e impuestos) | `configuracion/conoce-configuracion.md` | ✗ |
| P23. Configurar comisión de producto de un barbero | ✅[P] | —[M] (sin «Sección de pagos») | — | — | — (no aplica) [D] | `team·barber-payments·E` | §6 («No se ha configurado una compensación por venta de productos») | ✓ (`compensation.productPercent` en la ficha del miembro) |
| P24. Ver su comisión de producto | ✅ (todas) | ✅ (todas, si ve nómina) | — | 🔒 la suya[D] | — | `payroll·V` / «Lo que llevo» | `nomina-*` (Venta de productos, Comisión de productos) | parcial (`payroll/types.ts:51-53`, sin vista propia) |
| P25. Productos que vendió él (por cliente y periodo) | ✅ | ✅ | — | 🔒 suyo[D] | 🔒 suyo[D] | `clients·V` / métricas | `productos-de-un-cliente.md` | parcial (por cliente, sin filtro de vendedor) |
| P26. Catálogo propio del barbero de renta | — | — | — | — | ?[D: no en v1] | — | Notion: «su propio negocio» | ✗ |

**Total mapeado: 55 acciones de Clientes + 31 de Servicios + 26 de Productos = 112.**

---

## Datos que se recortan a «lo suyo»

### Qué hay hoy para saber de quién es un cliente

| Campo | Dónde | Sirve para «suyo» | Problema |
|---|---|---|---|
| `client.preferredBarberId` | `mocks/calendar/seed.ts:51`, contrato Calendario | Sí: «lo prefiere» | En `/customers` viaja como **nombre** (`preferredBarber`), no como id (`types.ts`, `handlers.ts` `barberName`) |
| `appointment.barberId` | contrato Calendario | Sí: «lo atendió» | En la ficha (`customerDetail.appointments[].barber`) viaja como **nombre** |
| `appointment.requestedBarberId` / `requestedBarber` | contrato Calendario y Clientes | Distingue «pidió a este barbero» de «le tocó» | — |
| `appointment.source` (`internal` / `online` / `walkin`) | idem | Origen de la visita (base de las deducciones de renta: sin cita, sin preferencia, nuevo) | No dice quién **trajo** al cliente |
| `appointment.createdBy` | contrato Calendario | Quién agendó | No es propiedad |
| `customer.branchId` | `/customers` | Recorte por sucursal | La lista no filtra por la sucursal de la cabecera |
| — | — | Propiedad (Shop-Generated / Walk-In / Barber-Owned) [N] | **No existe** |

### Definición propuesta [D]

Un cliente es **suyo** para el barbero B si se cumple cualquiera de:

1. **Lo trajo él**: `ownerBarberId = B` (propiedad Barber-Owned). Nuevo campo, lo pone el alta cuando lo crea un barbero
   o una importación del de renta, y solo el dueño lo cambia.
2. **Lo prefiere**: `preferredBarberId = B`.
3. **Lo atiende**: tiene una cita con `barberId = B` **por atender** o **cobrada en los últimos 12 meses**
   (ventana configurable; 12 meses cubre a los clientes «Perdido» que todavía puede recuperar).

Y **solo eso**: un cliente que B atendió hace dos años y hoy va con otro deja de ser suyo.

Por qué así: (1) es la propiedad de Notion y la única que no se pierde aunque el cliente cambie de barbero; (2) y (3)
dan lo que Notion pide para el de comisión («ve sus clientes y las alertas de recompra/riesgo de los suyos») con datos
que ya existen; la ventana evita que un barbero acumule para siempre la clientela de la casa.

### Cómo se aplica por rol [D]

| Rol | Lista y ficha | Contacto | Descargar | Cifras |
|---|---|---|---|---|
| Comisión | Suyos (1–3) + buscador de toda la sucursal **solo en «Crear cita»**, que devuelve nombre y nada más | Tapado siempre | No | Lo que el cliente le dejó **a él** |
| Renta | Suyos (1–3) | Completo en los Barber-Owned suyos; tapado en los demás | Solo Barber-Owned suyos | Lo que le dejó a él |
| Recepción y admin | Todos los de su sucursal | Tapado; revelar con registro [D] | Admin: si se le activa | Recepción sin cifras |
| Dueño | Todos | Tapado; revelar con registro [D] | Sí | Todas |

Y la otra cara (el bug de Notion): los clientes **Barber-Owned del barbero de renta** no aparecen en la lista de los
demás barberos, y el dueño, el admin y recepción los ven con el contacto tapado y **sin poder descargarlos** [D].
Siguen pudiendo agendarlos (recepción lleva la agenda de toda la sucursal).

### Qué más se recorta

- **Servicios**: el de comisión ve los que hace (`team[].offered` con su `memberId`) a su precio efectivo; el de renta,
  los que ofrece, a su precio. Nunca el precio ni la comisión de otro.
- **Productos**: lo vendido por él (necesita guardar `soldBy` en la venta y en el cobro; `POST /sales` no lo lleva).
- **Historial de citas del cliente**: el de comisión ve fecha, servicio y estado de todas (para leer el ritmo del
  cliente) pero el importe solo de las suyas [D].

---

## Cifras y privacidad

| Dato | Hoy en producción | Hoy en Thema | Propuesta |
|---|---|---|---|
| **Teléfono** | Tapado para todos los perfiles, también el dueño, en lista y ficha [P] | Tapado en pantalla (`maskPhone`), pero **el número completo viaja en `GET /customers`**, el buscador encuentra por los dígitos completos (`CustomersPage.tsx:259`) y **Editar lo precarga entero** (`inputFromDetail`, `types.ts`) | El backend manda el número ya tapado salvo a quien tenga `client-info·A`; el formulario de edición pide el número nuevo sin enseñar el viejo; «revelar» deja registro [D] |
| **Correo** | En claro en la lista [P] | En claro (columna oculta, ficha) | Mismo trato que el teléfono [D]: es igual de contactable |
| **Dirección, cumpleaños** | En Perfil [P] | En Resumen | Barberos: solo el cumpleaños (sirve para felicitar); recepción y admin: todo [D] |
| **Notas médicas (alergias, medicamentos)** | Las ve quien abre la ficha y el detalle de la cita [P] | Aviso «Antes de empezar» y bandera en la lista (`medicalNotes`) | Visibles para quien atiende al cliente (seguridad) y para recepción; nunca en descargas ni en importaciones; no se borran sin dejar rastro [D] |
| **LTV, ticket promedio, pagos** | En la lista y en la ficha [P] (el de comisión también ve la columna LTV de toda la casa) | Igual, más el pulso (LTV promedio y total) | Recepción no ve cifras [N]; los barberos ven lo que el cliente les dejó a ellos, no el total de la casa [D] |
| **Contactos del barbero de renta** | Expuestos a todo el equipo [N, bug] | No hay propiedad: imposible protegerlos | Barber-Owned de renta privados (ver arriba) |
| **Descarga de la lista** | Permiso para dueño y renta, sin botón [M] | No existe | Dueño: todo; renta: solo Barber-Owned; nadie más por defecto. La descarga omite notas médicas y deja registro [D] |
| **Costo y margen de servicios y productos** | Visibles en el formulario para quien entra al módulo [P] | Columnas de costo y margen **visibles por defecto** en Productos | Solo dueño y admin [D] |
| **Precio y comisión de otro barbero** | En la pestaña Equipo del servicio y en la ficha del miembro (dueño) [P] | Pestaña Equipo del servicio (precio efectivo de cada uno) | Nunca a otro barbero [D] |
| **Motivo del bloqueo** | Obligatorio [P] | No existe | Obligatorio y visible para quien puede desbloquear [D] |

---

## Contradicciones y pendientes

1. **Crear cliente**: `content/es/clientes/crear-un-cliente.md` dice «El botón **Crear cliente** aparece para dueño,
   administrador y recepción. Si tu rol es barbero y no lo ves, pídeselo a recepción», pero la matriz de fábrica
   (`casos/modelo-sucursales-roles-permisos.md` §5) da **Crear** en Clientes al de comisión (VC A) y al de renta
   (VCEB A). No se entró con perfil de barbero a la lista para ver el botón. **Propuesta**: todos crean; lo que
   cambia es la propiedad que queda (C23).
2. **¿El barbero ve todos los clientes?** `la-lista-de-clientes.md`: «¿Un barbero ve la lista de clientes? Sí» y §6b
   (44 clientes con el perfil de comisión) frente a Notion («el barbero ve sus clientes») y `ROLES_PLAN.md` §4.7.
   Decisión de producto pendiente; aquí se propone «suyo por defecto».
3. **La matriz de Thema no es la de producción** (`src/features/team/permissionsCatalog.ts:106-112` frente a §5):
   - `block-calendar` está **cruzado**: Thema da completo al de comisión y solo Ver al de renta; producción, al revés
     (comisión V A, renta VCEB A). Además el calendario de Thema dice que el de comisión sigue reglas y el de renta no
     (`calendarModel.ts:403`), coherente con producción, no con la matriz.
   - Renta: Thema le da Clientes V C A; producción, VCEB A. Thema no le da `import-clients` ni `export-clients`;
     producción sí.
   - Recepción: Thema le da Clientes **completo** (con Borrar) y `export-clients`; producción, VCE A y sin descarga.
     Thema le da `services` V A; producción, nada en Servicios. Le falta `account-settings` V E.
   - Admin: Thema le da `export-clients`; producción no.
   - `permissionsCatalog` declara la fila `barber-payments` con columnas V C E A, pero en producción es solo A.
4. **Editar y borrar clientes**: la matriz da Editar y Borrar (dueño, admin, renta; Editar también a recepción), pero
   en producción **no se vio** ni el botón de editar ni el de borrar (`un-cliente-aparece-duplicado.md`: «no se vio un
   botón de editar»; «no hay una opción para unir dos fichas ni para borrar un cliente»). Thema tiene editar y no
   tiene borrar.
5. **Importar y descargar**: permisos sin botón en producción (`importar-clientes.md`, `descargar-clientes.md`).
   Que la descarga venga de fábrica para el **barbero de renta** y no para el admin es justo la puerta del bug de
   Notion si descarga a todos los clientes de la casa.
6. **Familia y amigos**: en producción es un vínculo entre dos fichas de cliente con relación y tipo, sin botón para
   crearlo (`familia-y-amigos.md`); en Thema es un «invitado» con solo nombre que se agrega y se quita, y cuya cita va
   a nombre del titular (`API_CONTRACT.md` Clientes). Son modelos distintos.
7. **Bloquear**: producción exige **Descripción** (motivo) (`bloquear-a-un-cliente.md`); Thema bloquea con una
   confirmación sin motivo y `customer` no tiene `blockReason`.
8. **Notas**: no hay fila de permiso para notas; `notas-del-cliente.md` dice «Cualquiera que abra la ficha y tenga el
   botón **Acciones**». Editar/borrar una nota: pendiente en producción, inexistente en Thema.
9. **«Información del cliente»** (`client-info`, solo Activo) existe en la matriz (dueño, admin, recepción) pero nadie
   sabe qué enciende. Aquí se propone que sea **ver el contacto completo**; está por confirmar con el equipo de
   producto.
10. **«Precios» (POS)** activo para los cinco roles: su significado no está confirmado. En Configuración, «Precios» es
    moneda e impuestos (`configuracion/conoce-configuracion.md`); no está claro si el permiso deja cambiar el precio en
    el cobro (P22).
11. **Precio del barbero**: producción guarda un precio por barbero y servicio que fija el dueño, también para el de
    renta (`casos/…permisos.md` §6, pestaña Servicios «Igual» en renta); Notion dice que el de comisión toma el precio
    de su **nivel** y que en renta **no aplica el precio de la tienda**. Tres modelos: por barbero (prod), por nivel
    (Notion, comisión) y propio (Notion, renta).
12. **Admin y precios**: la matriz da Servicios y Productos completos al admin; Notion dice que el **dueño aprueba
    precios**. No hay flujo de aprobación en ningún lado.
13. **Recepción y servicios**: la guía de recepción dice que no ve Servicios (`guia-de-recepcion.md`), pero tiene que
    ver precios para cobrar. Thema le da el módulo en solo lectura.
14. **Segmentos con definiciones distintas**: producción define Pre-perdida como 3 ciclos sin venir y Perdido como 4
    (`casos/clientes.md`); el contrato de Thema dice `atRisk` = dos ciclos y `lost` = «meses sin venir»
    (`API_CONTRACT.md` Clientes). Las alertas del barbero [N] dependen de esta cuenta.
15. **La lista de Thema no respeta la sucursal**: `GET /customers` no recibe `branchId` y devuelve todas; producción
    muestra «la de la sucursal que tienes elegida». Servicios y productos sí la respetan.
16. **Comisión de producto del barbero de renta**: la ficha de renta tiene «Pagos» (renta y deducciones), no
    «Compensación» (§6). Qué pasa con los productos que vende: sin dato.
17. **Activar por sucursal** no tiene fila propia en la matriz: no se sabe si lo gobierna «Activo», «Editar» o
    «Crear» de Servicios/Productos.
18. **Nunca se entró** con recepción, admin ni renta (`que-ve-cada-rol-en-el-menu.md`). Todo lo suyo es [M] o [D].

---

## Cambios necesarios en Thema

Ordenados como las fases de `ROLES_PLAN.md` §5. Ninguno se hizo en esta investigación.

**Fase 1 — Acceso**

- `src/features/team/permissionsCatalog.ts`: igualar `ROLE_DEFAULT_PERMISSIONS` a la matriz de producción (punto 3 de
  contradicciones) **o** documentar cada desviación como [D]; quitar `services` de recepción; `barber-payments` solo
  `active`. Añadir filas nuevas: `client-contact` (o dar significado a `client-info`), `price-approval`,
  `my-services` (catálogo propio del barbero).
- `useAccess()` (nuevo, `src/features/auth/` o `src/app/`): rol efectivo, `memberId`, `scope: "all" | "own"`, permisos;
  lo consumen las tres pantallas.

**Fase 2 — Navegación y rutas**

- `src/app/navigation.ts`: `permission` en `clientes` (`clients.view`), `servicios` (`services.view`, o «Mis
  servicios» para barberos), `productos` (`products.view`).
- `src/app/router.tsx:70-71` y las rutas de `/servicios*` y `/productos*`: guarda `RequirePermission`; `/clientes/:id`
  devuelve `403` si el cliente no es suyo.

**Fase 3 — Solo lo mío (clientes)**

- `src/features/customers/types.ts`: `preferredBarberId` (id, no nombre), `ownerBarberId`, `origin: "shop" | "walkin" |
  "barber"`, `blockReason`, `blockedAt`, `blockedBy`; en `customerAppointmentSchema`, `barberId`.
- `src/features/customers/api.ts` + `queries.ts:12`: `list({ branchId, scope })`; clave de caché con sucursal y alcance.
- `src/mocks/customers/handlers.ts`: filtrar por `branchId` y por «suyo» (definición de arriba); mandar el teléfono ya
  tapado si no hay permiso de contacto; recortar LTV, pagos y productos a lo del barbero; `DELETE /customers/:id`,
  `POST /customers/merge`, `GET /customers/export`, `POST /customers/import`; `PATCH` con `blocked` exige `reason`.
- `src/mocks/customers/seed.ts` y `src/mocks/calendar/seed.ts`: sembrar `ownerBarberId`/`origin` (algunos Barber-Owned
  del barbero de renta de la demo).
- `docs/API_CONTRACT.md` (sección Clientes): los campos y endpoints nuevos, y que el backend recorta por rol.

**Fase 5 — Acciones por rol (clientes)**

- `src/features/customers/CustomersPage.tsx:81` (`railActions`): `create` según `clients.create`; `block`/`unblock`
  según `clients.edit` y alcance; acciones nuevas `import`, `export`, `merge`, `delete` condicionadas.
- `src/features/customers/customersHome.tsx:31` (`customerColumns`): sin `ltv` ni pulso para recepción; `barber`
  oculta para barberos; `email` tapado sin permiso de contacto. `CUSTOMER_ALERTS` sobre `pool` ya recortado.
- `src/features/customers/CustomersPage.tsx:200` (pulso): no se monta sin permiso de cifras.
- `src/features/customers/CustomerProfilePage.tsx:107` (acciones de la ficha): `edit`, `block`, `note` por permiso;
  el `ConfirmDialog` de bloqueo pasa a un drawer con **motivo obligatorio**.
- `src/features/customers/CustomerOverview.tsx:62` (cifras) y `:102` (contacto): recortes por rol.
- `src/features/customers/CustomerHistoryTabs.tsx`: importes solo de las citas propias para barberos; invitados con
  permiso de edición.
- `src/features/customers/CustomerFormDrawer.tsx` + `types.ts` (`inputFromDetail`): no precargar el teléfono completo;
  campo de propiedad solo para el dueño; barbero preferido editable para dueño, admin y recepción.

**Fase 3/5 — Servicios y productos**

- `src/features/services/ServicesPage.tsx:147` y `ServiceProfilePage.tsx:134`: `create`, `create-combo`, `edit`,
  `toggle`, `delete`, `categories`, `order` por permiso; `delete` solo dueño [D].
- `src/features/services/servicesHome.tsx` (columnas `cost`, `margin`, `team`) y
  `src/features/products/productsHome.tsx:39-40` (`cost`, `margin` visibles por defecto): fuera sin permiso de cifras
  de catálogo.
- `src/features/products/ProductsPage.tsx:147` y `ProductProfilePage.tsx:111`: igual que servicios.
- `src/features/catalog/CategoriesDrawer.tsx`: recibir `canCreate/canEdit/canDelete` por props (es compartido).
- Pantalla nueva **«Mis servicios»** (`src/features/services/MyServicesPage.tsx` o pestaña en la ficha del miembro):
  lectura para comisión, edición de precio y duración para renta, sobre `serviceOverrideSchema`
  (`src/features/team/types.ts:21`).
- Precio por nivel: `levelSchema` (`src/features/team/types.ts:18`) con precios por servicio, y el precio efectivo en
  `GET /services/:id` y `/calendar/catalog` según barbero → nivel → catálogo.
- Aprobación de precios: estado `pendingPrice` en servicio, producto y override; vista de pendientes para el dueño
  (encaja con `ProcessCenter` o con la campana de notificaciones).
- `src/mocks/calendar/handlers.ts` (`/calendar/catalog`) y `POST /sales`: precio efectivo por barbero y `soldBy` en la
  venta para recortar productos y comisión.

**Pruebas**: `src/features/customers/customers.test.tsx`, `services.test.tsx`, `products.test.tsx` —un caso por rol
(«recepción no ve LTV», «comisión solo ve sus clientes», «renta descarga solo los suyos») y `permissionsCatalog` contra
la matriz de producción. Luego `npm run codemap` (endpoints nuevos) y `npm run check`.
