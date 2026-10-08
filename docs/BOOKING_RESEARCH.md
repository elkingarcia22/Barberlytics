# Reserva en línea: qué tenemos, qué hace la competencia y qué falta

Investigación del 2026-10-08. Compara el flujo de `/reservar` (código en `src/features/booking`,
mock en `src/mocks/booking`, contrato en `docs/API_CONTRACT.md` § «Reserva en línea») con Booksy,
Fresha, Squire, theCut, Square Appointments, Vagaro, Boulevard, GlossGenius, Treatwell,
Mindbody/Booker, Phorest, Timely, AgendaPro, Reservo y Reserve with Google.

Las fuentes son sobre todo páginas de producto y centros de ayuda (enlaces al final). Lo no
confirmado va marcado con (?).

## 1. Dónde estamos fuertes

| Lo nuestro | Quién más lo tiene |
|---|---|
| Propuesta de próxima visita según la frecuencia del cliente, con hora habitual y un toque para reservar | Phorest (recordatorio por patrón), Boulevard (repetir visita) |
| Varias citas en una reserva, para otras personas, con «Tu gente» guardada | Squire y Fresha (grupos) |
| Día sin horas: barberos alternativos por habilidades parecidas, con sus horas y su perfil | Nadie con este nivel; Boulevard ordena horas, no barberos |
| Lista de espera siempre a mano, por franja (mañana, tarde, noche) y conectada a la del Calendario | Fresha, Booksy, Vagaro, Boulevard |
| Pagar en la barbería como opción de primera, y «solo en línea» explicado | Treatwell (prepago o en el local) |
| Tarjetas guardadas (token), CVC otra vez, tarjeta dibujada en vivo | Booksy y Squire guardan la tarjeta; ninguno documenta la vista previa |
| Productos en el resumen y catálogo completo | Pocos en la reserva (sobre todo en caja) |
| Reprogramar o cancelar con código, política visible y reembolso a saldo a favor | Todos reprograman; el saldo a favor instantáneo es raro |
| Widget, enlace, tablet y monitor (front desk) | Square, Vagaro, Timely |
| Español e inglés y accesibilidad (roles, teclado, movimiento reducido) | Desigual en la competencia |

## 2. Lo que es estándar y nos falta

Casi todos lo tienen; sin esto el flujo se queda corto en producción.

1. **Protección contra inasistencias.** Anticipo o tarjeta en archivo, con cargo automático por
   inasistencia o cancelación tardía (Booksy, Fresha, Square, Squire, Boulevard, GlossGenius,
   AgendaPro). Hoy hay política y cargo tardío, pero quien paga en la barbería y no llega no paga
   nada. Lo mejor del mercado es **condicional**: solo clientes nuevos (GlossGenius), por servicio o
   valor de la cita (Fresha), y «cliente de confianza» exento (Booksy).
2. **Recordatorios y confirmaciones reales.** SMS y correo como mínimo; en Latinoamérica,
   **WhatsApp** con botones «Confirmo» / «Reprogramar» (AgendaPro). Hoy solo se prometen en el
   texto. El `.ics` no trae alarma (`VALARM`).
3. **Reseñas verificadas**, solo de citas completadas (Booksy las lleva también a Google). Las
   nuestras salen de un hash del id del barbero: valen para la demo, no para producción.
4. **Pagos locales** (?, sin fuente directa): en Colombia PSE, Nequi y Bancolombia mediante una
   pasarela local (Wompi, Bold, ePayco); Mercado Pago en Argentina y México, Pix en Brasil. Precios
   en la moneda local. Hoy hay tarjeta, billetera simulada, saldo y pago en la barbería, en USD.
5. **Reserve with Google e Instagram.** Botón «Reservar» en Google Search y Maps (Fresha, Square,
   Booksy, Treatwell) y en Instagram (casi todos). Tenemos el enlace y el widget, no las integraciones.
6. **Bonos de regalo, paquetes y membresías** (Square, Vagaro, AgendaPro, Fresha). Ej.: «4 cortes
   al mes». No existe en la reserva.

## 3. Diferenciales que vale la pena copiar

Ordenados por encaje con una barbería.

1. **Cita recurrente** («cada 3 semanas, el mismo barbero»), como Squire. Encaja con la propuesta
   por frecuencia que ya tenemos: el siguiente paso natural.
2. **«Lo antes posible» / «Disponible ahora»** (theCut): el primer hueco de hoy con cualquier
   barbero, arriba de todo. La cultura de barbería es de último minuto.
3. **Horas que no dejan huecos primero** (Boulevard, Precision Scheduling). El calendario ya sabe
   calcular huecos (`gapsModel`, `slotSuggestions`); se puede reutilizar para destacar 2 o 3 horas.
4. **Foto de referencia del corte** al reservar (Vagaro), junto a la nota para el barbero.
5. **Asistente de WhatsApp** que confirma, reprograma y rellena cancelaciones (AgendaPro «Sofia»,
   Mindbody Messenger[AI]). Ya hay piezas de chat y de IA en el sistema (`src/components/chat`).
6. **Lista de espera con reglas** (Fresha): primero en llegar, primero el cliente de más valor, u
   ofrecer a todos y gana el primero que reserva.
7. **Tarjeta de lealtad digital** (Phorest TreatCard) y **ofertas de primera visita** (Mindbody).
8. **Pago a cuotas** (Klarna, Afterpay): útil para paquetes caros, no para un corte. Prioridad baja.

## 4. Riesgos y deudas en lo nuestro

1. **Privacidad: el celular revela el perfil.** `POST /booking/lookup` (`handlers.ts`, «status:
   known») devuelve nombre, correo, personas guardadas, tarjetas (marca y últimos 4) y saldo a
   cualquiera que escriba un número. Debe responder solo «conocido / nuevo / bloqueado» y entregar el
   perfil tras un código por SMS o WhatsApp (o mostrar solo «Marcela G.» hasta verificar). Sin límite
   de intentos, además, permite enumerar clientes.
2. **Consentimiento de marketing.** La casilla del perfil nuevo viene marcada y el mock no la
   guarda. En Colombia (Ley 1581, habeas data) el consentimiento debe ser previo, expreso e
   informado: sin marcar y guardado con fecha.
3. **Sin límite de intentos ni captcha** en el celular y en el código de «Mis citas».
4. **Sin zona horaria**: las horas son «de la sucursal, sin zona». Quien reserva desde otra zona
   (turistas, widget en otro país) vería horas corridas.
5. **Fijo en el código lo que debería configurarse**: los cupones (`pricing.ts` `PROMOS`), los
   servicios «Popular» (`logic.ts`) y el precio por ocupación (`surge`), que se configura en Ajustes
   pero la reserva no aplica.
6. **Tarjetas guardadas sin gestión**: no se pueden quitar ni marcar una como predeterminada.
7. **Textos sin uso** en `i18n/booking` (`time.firstFree`, `time.barbersFree`, `header.call`,
   `confirmed.paid`, `payment.promoRemove`, `receipt.view`, `suggest.lastVisit`, `suggest.withUsual`,
   `welcome.repeatLead`, `branchProfile.moreBarbers`, `error.*`): limpiar o usar.

## 5. Recomendación por fases

**Fase 1 — antes de producción (riesgo y lo mínimo esperado)**
- Lookup sin datos personales + verificación por código; límite de intentos.
- Consentimiento de marketing sin marcar y guardado.
- Anticipo condicional (cliente nuevo / historial de inasistencias / servicios marcados) o tarjeta en
  archivo para «pagar en la barbería»; cliente de confianza exento. Configurable en Ajustes › Reservas.
- Recordatorios: `.ics` con alarma ya; WhatsApp/SMS de confirmación y recordatorio (24 h y 2 h) con
  confirmar o reprogramar.
- Precios y pasarela en la moneda local con PSE y Nequi.

**Fase 2 — conversión y recurrencia**
- Cita recurrente desde la confirmación y desde la propuesta por frecuencia.
- «Lo antes posible» arriba en Fecha y hora; horas que no dejan huecos destacadas.
- Reseñas verificadas tras la visita (y el promedio real en el perfil del barbero).
- Foto de referencia en la nota para el barbero.
- Embudo medido: abandono por paso, UTM que viaja hasta la reserva.

**Fase 3 — crecimiento**
- Reserve with Google, botón de Instagram.
- Bonos de regalo, paquetes y membresías.
- Asistente de WhatsApp para reservar y rellenar cancelaciones.
- Lealtad y ofertas de primera visita.

## Fuentes

- Booksy: https://biz.booksy.com/en-us/features/no-show-protection · https://biz.booksy.com/en-ie/features/marketplace
- Fresha: https://www.fresha.com/en-GB/for-business/features/scheduling · https://www.fresha.com/help-center/knowledge-base/payments/101660-set-up-payment-policies · https://www.fresha.com/help-center/knowledge-base/payments/103405-let-clients-pay-later-with-klarna
- Squire: https://www.getsquire.com/using-squire/group-appointments · https://getsquire.com/blog/cancellation-policies-good-or-bad-for-business
- theCut: https://apps.apple.com/us/app/thecut-find-book-barbers/id1101408626
- Square: https://squareup.com/help/article/6068 · https://api.squareup.com/help/ie/en/article/5676-customer-prepayment-for-square-appointments
- Vagaro: https://www.salontoday.com/articles/vagaros-new-features-bring-big-benefits-to-salons
- Boulevard: https://blvd.co/products/self-booking · https://www.authencio.com/blog/boulevard-deep-dive-client-experience-features-pricing-competitors
- GlossGenius: https://glossgenius.com/blog/does-glossgenius-let-you-take-deposits-yes
- Phorest: https://www.softwareadvice.com/salon/phorest-profile
- AgendaPro: https://agendapro.com/co/software-para-agendar-citas · https://agendapro.com/co/sofia-ia-recordatorios · https://agendapro.com/blog/pagos-online-en-tu-negocio/
- Reserve with Google: https://support.google.com/maps/answer/9322362 · https://developers.google.com/actions-center/verticals/reservations/e2e/overview
- WhatsApp y Pix: https://www.twilio.com/en-us/changelog/twilio-pay
