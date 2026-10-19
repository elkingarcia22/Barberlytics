import { LEGAL_ENTITY, both, titled, type LegalDoc } from "./types";

/**
 * Política de privacidad de Barberlytics. Cubre a quienes administran la cuenta (Barberlytics responde)
 * y explica qué pasa con los datos de los clientes de cada barbería (la barbería responde; Barberlytics
 * es su encargado).
 */
export const PRIVACY: LegalDoc = {
  id: "privacy",
  slug: "privacidad",
  version: "privacy-2026-10",
  updatedAt: "2026-10-19",
  title: titled("Política de privacidad", "Privacy policy"),
  summary: titled(
    "Qué datos tratamos, para qué, con quién los compartimos, dónde se guardan, cuánto tiempo y cómo ejercer tus derechos.",
    "What data we process, why, who we share it with, where it is stored, for how long and how to exercise your rights."
  ),
  audience: titled("Dueños y equipo de las barberías, y clientes que reservan en ellas.", "Shop owners and staff, and clients who book with them."),
  sections: [
    {
      id: "quien",
      title: titled("1. Quién responde por tus datos", "1. Who is responsible for your data"),
      body: both(
        [
          `Si administras o trabajas en una barbería que usa Barberlytics, el responsable de tus datos de cuenta es ${LEGAL_ENTITY.name} (${LEGAL_ENTITY.legalName}). Contacto: ${LEGAL_ENTITY.privacyContact}.`,
          "Si eres cliente de una barbería, la responsable de tus datos es esa barbería: ella decide para qué los usa. Barberlytics los trata por su cuenta, como encargado, y solo según sus instrucciones. Tus solicitudes van primero a la barbería; si nos escribes, se las hacemos llegar.",
        ],
        [
          `If you manage or work at a shop that uses Barberlytics, the controller of your account data is ${LEGAL_ENTITY.name} (${LEGAL_ENTITY.legalName}). Contact: ${LEGAL_ENTITY.privacyContact}.`,
          "If you are a shop's client, the controller of your data is that shop: it decides what it is used for. Barberlytics processes it on the shop's behalf, as processor, and only on its instructions. Your requests go to the shop first; if you write to us, we forward them.",
        ]
      ),
    },
    {
      id: "datos",
      title: titled("2. Qué datos", "2. What data"),
      body: both(
        [
          "- Del equipo: nombre, celular, correo, rol, sede, horarios, compensación y, si el dueño los anota, datos bancarios para pagarle.",
          "- De los clientes: nombre, celular, correo (opcional), citas, servicios, pagos (sin número de tarjeta: solo el token de la pasarela, la marca y los últimos 4), mensajes que se le enviaron y sus respuestas, permisos que dio, reseñas y notas de la barbería.",
          "- Datos sensibles: alergias o medicamentos solo si la barbería los anota con el permiso del cliente. No usamos reconocimiento facial con las fotos de referencia.",
          "- Uso del servicio: registros técnicos (fecha, acción, dispositivo) para seguridad y para corregir fallas.",
        ],
        [
          "- Staff: name, phone, email, role, location, schedule, compensation and, if the owner records it, bank details for pay.",
          "- Clients: name, phone, email (optional), appointments, services, payments (no card number: only the gateway token, brand and last 4), messages sent and their replies, consents given, reviews and the shop's notes.",
          "- Sensitive data: allergies or medication only if the shop records them with the client's permission. We do not use facial recognition on reference photos.",
          "- Service usage: technical logs (date, action, device) for security and to fix errors.",
        ]
      ),
    },
    {
      id: "para-que",
      title: titled("3. Para qué", "3. Why"),
      body: both(
        [
          "- Dar el servicio: agendar, confirmar, recordar y cobrar citas; calcular nómina y reportes; atender la reserva en línea.",
          "- Mensajes de las citas (confirmación, recordatorios, «ya casi te toca»): son parte del servicio que el cliente pidió.",
          "- Promociones: solo a quien lo autorizó, con la versión del texto que aceptó guardada; se retira respondiendo BAJA o STOP o pidiéndolo a la barbería.",
          "- Clipper (asistente de IA): para responder preguntas del equipo usa los datos que la persona puede ver; no se le envían teléfonos ni notas de salud.",
          "- Seguridad, prevención de fraude y cumplimiento legal.",
          "No vendemos datos personales ni los usamos para publicidad de terceros.",
        ],
        [
          "- Provide the service: book, confirm, remind and charge appointments; compute payroll and reports; run online booking.",
          "- Appointment messages (confirmation, reminders, “you're almost up”): part of the service the client requested.",
          "- Promotions: only to those who opted in, with the version of the text they accepted recorded; withdraw by replying STOP or asking the shop.",
          "- Clipper (AI assistant): to answer staff questions it uses the data that person can see; phone numbers and health notes are not sent to it.",
          "- Security, fraud prevention and legal compliance.",
          "We do not sell personal data or use it for third-party advertising.",
        ]
      ),
    },
    {
      id: "con-quien",
      title: titled("4. Con quién se comparten", "4. Who we share it with"),
      body: both(
        [
          "Con proveedores que nos ayudan a dar el servicio (alojamiento, mensajería, IA, voz, cola de mensajes) bajo contrato y solo para eso: la lista completa está en Subencargados, con lo que hace cada uno y dónde.",
          "Con la pasarela de pagos y la cuenta de WhatsApp Business que conecte cada barbería, para cobrar y escribir a sus clientes.",
          "Con autoridades, solo cuando la ley lo exija.",
        ],
        [
          "With providers that help us deliver the service (hosting, messaging, AI, voice, message queue) under contract and only for that: the full list is in Subprocessors, with what each does and where.",
          "With the payment gateway and WhatsApp Business account each shop connects, to charge and message its clients.",
          "With authorities, only when the law requires it.",
        ]
      ),
    },
    {
      id: "donde",
      title: titled("5. Dónde se guardan", "5. Where it is stored"),
      body: both(
        [
          "En servidores de proveedores en Estados Unidos. Para titulares en Colombia, Estados Unidos figura entre los países con nivel adecuado de protección según la Superintendencia de Industria y Comercio, y la transmisión se hace con contrato de encargo.",
        ],
        ["On provider servers in the United States. For data subjects in Colombia, the United States is among the countries with an adequate level of protection according to the Superintendencia de Industria y Comercio, and transfers are made under a processing contract."]
      ),
    },
    {
      id: "cuanto",
      title: titled("6. Cuánto tiempo", "6. How long"),
      body: both(
        [
          "Mientras la cuenta de la barbería esté activa. Al cerrarla, 30 días para exportar y luego se borran o anonimizan, salvo lo que la ley obligue a guardar (por ejemplo, soportes contables). Los registros técnicos se guardan [30 a 90] días.",
        ],
        ["While the shop's account is active. When closed, 30 days to export and then deletion or anonymization, except what the law requires to keep (such as accounting records). Technical logs are kept [30 to 90] days."]
      ),
    },
    {
      id: "derechos",
      title: titled("7. Tus derechos", "7. Your rights"),
      body: both(
        [
          "Puedes conocer, actualizar, corregir y pedir que se borren tus datos, y retirar los permisos que diste. En Colombia, además, presentar quejas ante la Superintendencia de Industria y Comercio después de agotar el trámite con el responsable.",
          `Si eres cliente de una barbería, pídelo a ella. Si administras una cuenta, escríbenos a ${LEGAL_ENTITY.privacyContact}. Respondemos consultas en 10 días hábiles y reclamos en 15 días hábiles (plazos de Colombia; en EE. UU., hasta 45 días cuando aplique).`,
        ],
        [
          "You can access, update, correct and request deletion of your data, and withdraw consents you gave. In Colombia you can also file complaints with the Superintendencia de Industria y Comercio after going through the controller.",
          `If you are a shop's client, ask the shop. If you manage an account, write to ${LEGAL_ENTITY.privacyContact}. We answer inquiries within 10 business days and claims within 15 business days (Colombian deadlines; in the U.S., up to 45 days where applicable).`,
        ]
      ),
    },
    {
      id: "seguridad",
      title: titled("8. Seguridad", "8. Security"),
      body: both(
        [
          "Acceso por código al celular con bloqueo por intentos, confirmación de identidad para lo sensible, permisos por rol aplicados en el servidor, tarjetas solo como token de la pasarela, claves de terceros solo en el servidor y cifrado en tránsito.",
          `Si hay un incidente que afecte tus datos, avisamos a la barbería y a la autoridad en los plazos de la ley. Para reportar una vulnerabilidad: ${LEGAL_ENTITY.securityContact}.`,
        ],
        [
          "Sign-in by code to the phone with lockout on failed attempts, identity confirmation for sensitive actions, role permissions enforced on the server, cards only as gateway tokens, third-party keys only on the server and encryption in transit.",
          `If an incident affects your data, we notify the shop and the authority within legal deadlines. To report a vulnerability: ${LEGAL_ENTITY.securityContact}.`,
        ]
      ),
    },
    {
      id: "menores",
      title: titled("9. Menores", "9. Minors"),
      body: both(
        ["Las cuentas son para adultos. Una cita para un menor la reserva un adulto responsable, que da sus datos."],
        ["Accounts are for adults. An appointment for a minor is booked by a responsible adult, who provides their data."]
      ),
    },
    {
      id: "cambios",
      title: titled("10. Cambios", "10. Changes"),
      body: both(
        ["Publicamos cada versión con su fecha. Si un cambio afecta para qué usamos tus datos, te lo pedimos de nuevo cuando la ley lo exija."],
        ["We publish each version with its date. If a change affects what we use your data for, we ask again where the law requires it."]
      ),
    },
  ],
};
