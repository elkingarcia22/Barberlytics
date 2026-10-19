import { LEGAL_ENTITY, both, titled, type LegalDoc } from "./types";

/** Términos de servicio: lo que acepta la barbería (y quien la administra) al registrarse. */
export const TERMS: LegalDoc = {
  id: "terms",
  slug: "terminos",
  version: "terms-2026-10",
  updatedAt: "2026-10-19",
  title: titled("Términos de servicio", "Terms of service"),
  summary: titled(
    "Las reglas para usar Barberlytics: qué ofrecemos, qué le toca a la barbería, cómo se paga, qué pasa con los datos y cómo se termina.",
    "The rules for using Barberlytics: what we provide, what the shop is responsible for, how billing works, what happens to data and how it ends."
  ),
  audience: titled("Barberías que usan Barberlytics y las personas que las administran.", "Barbershops using Barberlytics and the people who manage them."),
  sections: [
    {
      id: "partes",
      title: titled("1. Quiénes son las partes", "1. The parties"),
      body: both(
        [
          `Estos términos son un acuerdo entre ${LEGAL_ENTITY.name} (${LEGAL_ENTITY.legalName}, ${LEGAL_ENTITY.address}) y la barbería que crea una cuenta («la barbería»). Quien se registra declara que puede obligar a la barbería.`,
          "Al crear la cuenta se aceptan estos términos, la Política de privacidad y el Acuerdo de encargo de datos, en la versión vigente ese día. Esa versión y la fecha quedan guardadas.",
        ],
        [
          `These terms are an agreement between ${LEGAL_ENTITY.name} (${LEGAL_ENTITY.legalName}, ${LEGAL_ENTITY.address}) and the barbershop that creates an account (“the shop”). Whoever signs up states they can bind the shop.`,
          "Creating the account accepts these terms, the Privacy policy and the Data processing agreement, in the version in force that day. That version and the date are recorded.",
        ]
      ),
    },
    {
      id: "servicio",
      title: titled("2. El servicio", "2. The service"),
      body: both(
        [
          "Barberlytics es un programa en línea para agendar y cobrar citas, gestionar clientes, equipo, catálogo, gastos y nómina, recibir reservas en línea y enviar mensajes a los clientes.",
          "Algunas funciones dependen de terceros que la barbería conecta (pasarela de pagos, WhatsApp Business, servicio de voz). Su uso se rige además por los términos de esos terceros.",
          "Clipper es un asistente de inteligencia artificial: puede equivocarse. Responde con los datos de la barbería consultados con los permisos de quien pregunta, y no cambia nada sin que una persona lo apruebe.",
        ],
        [
          "Barberlytics is online software to book and charge appointments, manage clients, staff, catalog, expenses and payroll, take online bookings and message clients.",
          "Some features depend on third parties the shop connects (payment gateway, WhatsApp Business, voice service). Their use is also governed by those third parties' terms.",
          "Clipper is an artificial intelligence assistant: it can make mistakes. It answers with the shop's data, looked up with the asking person's permissions, and changes nothing without a person approving it.",
        ]
      ),
    },
    {
      id: "cuenta",
      title: titled("3. La cuenta y el equipo", "3. The account and the team"),
      body: both(
        [
          "La barbería decide quién entra y con qué rol (dueño, administrador, recepción, barbero). Cada persona entra con su propio celular y código; no se comparten cuentas.",
          "La barbería es responsable de lo que hace su equipo en la cuenta y de mantener al día los roles. Si sospecha un acceso indebido, debe avisarnos de inmediato.",
        ],
        [
          "The shop decides who signs in and with which role (owner, admin, front desk, barber). Each person signs in with their own phone and code; accounts are not shared.",
          "The shop is responsible for what its team does in the account and for keeping roles up to date. If it suspects unauthorized access, it must tell us right away.",
        ]
      ),
    },
    {
      id: "barberia",
      title: titled("4. Lo que le toca a la barbería", "4. The shop's responsibilities"),
      body: both(
        [
          "- Usar el servicio conforme a la ley, incluidas las normas de datos personales, de mensajes comerciales y tributarias de su país.",
          "- Pedir a sus clientes las autorizaciones que la ley exige (por ejemplo, para promociones o para anotar alergias) y respetar cuando las retiran. Barberlytics trae los textos y el registro, pero quien decide y responde ante el cliente es la barbería.",
          "- No subir contenido ilegal, ajeno sin permiso o que dañe a otros, ni intentar acceder a datos de otra barbería.",
          "- Emitir sus propias facturas o documentos equivalentes cuando la ley se lo exija.",
        ],
        [
          "- Use the service lawfully, including personal data, commercial messaging and tax rules in its country.",
          "- Obtain the consents its clients must give (for example, for promotions or to record allergies) and honor withdrawals. Barberlytics provides the texts and the record, but the shop decides and answers to the client.",
          "- Not upload illegal content, others' content without permission or content that harms others, nor try to access another shop's data.",
          "- Issue its own invoices or equivalent documents when the law requires it.",
        ]
      ),
    },
    {
      id: "pagos",
      title: titled("5. Precio, cobros y pagos de clientes", "5. Price, billing and client payments"),
      body: both(
        [
          "El plan, su precio y el ciclo de cobro se ven en Configuración › Facturación. Los cambios de precio se avisan con al menos 30 días.",
          "Los pagos de los clientes de la barbería los procesa la pasarela que la barbería conecta; Barberlytics no guarda números de tarjeta: solo recibe el token de la pasarela, la marca y los últimos 4 dígitos.",
          "Los mensajes de WhatsApp o SMS y otros consumos que cobran terceros pueden tener costo aparte, según el plan.",
        ],
        [
          "The plan, its price and billing cycle are shown in Settings › Billing. Price changes are announced at least 30 days ahead.",
          "Payments from the shop's clients are processed by the gateway the shop connects; Barberlytics does not store card numbers: it only receives the gateway's token, the brand and the last 4 digits.",
          "WhatsApp or SMS messages and other third-party usage may cost extra, depending on the plan.",
        ]
      ),
    },
    {
      id: "datos",
      title: titled("6. Los datos", "6. Data"),
      body: both(
        [
          "Los datos de los clientes y del equipo son de la barbería. Barberlytics los trata por cuenta de ella, como encargado, según el Acuerdo de encargo de datos, y no los vende ni los usa para fines propios.",
          "Los datos de quienes administran la cuenta los trata Barberlytics como responsable, según su Política de privacidad.",
          "La barbería puede exportar sus datos en cualquier momento mientras la cuenta esté activa y hasta 30 días después de terminarla.",
        ],
        [
          "Client and staff data belong to the shop. Barberlytics processes them on the shop's behalf, as processor, under the Data processing agreement, and does not sell them or use them for its own purposes.",
          "Data about the people who manage the account is processed by Barberlytics as controller, under its Privacy policy.",
          "The shop may export its data at any time while the account is active and up to 30 days after it ends.",
        ]
      ),
    },
    {
      id: "disponibilidad",
      title: titled("7. Disponibilidad y soporte", "7. Availability and support"),
      body: both(
        [
          "Buscamos una disponibilidad del [99,5 %] al mes, sin contar mantenimientos avisados. El soporte atiende en [horario por completar] por [canal por completar].",
          "El servicio se entrega «tal como está». No garantizamos que esté libre de errores, pero los corregimos con diligencia y avisamos de los incidentes que afecten a la barbería.",
        ],
        [
          "We aim for [99.5%] monthly availability, excluding announced maintenance. Support is available [hours to be completed] via [channel to be completed].",
          "The service is provided “as is”. We do not guarantee it is error-free, but we fix errors diligently and report incidents that affect the shop.",
        ]
      ),
    },
    {
      id: "responsabilidad",
      title: titled("8. Responsabilidad", "8. Liability"),
      body: both(
        [
          "En lo que la ley permita, la responsabilidad de Barberlytics por daños derivados del servicio se limita a lo pagado por la barbería en los 12 meses anteriores al hecho, y no incluye lucro cesante ni daños indirectos.",
          "Nada de esto limita los derechos que la ley da a los consumidores ni la responsabilidad por dolo o culpa grave.",
        ],
        [
          "To the extent permitted by law, Barberlytics' liability for damages arising from the service is limited to the amount paid by the shop in the 12 months before the event, and excludes lost profits and indirect damages.",
          "Nothing here limits rights consumers have by law or liability for willful misconduct or gross negligence.",
        ]
      ),
    },
    {
      id: "fin",
      title: titled("9. Duración y terminación", "9. Term and termination"),
      body: both(
        [
          "La barbería puede cancelar cuando quiera desde Configuración; el servicio sigue hasta el fin del periodo pagado.",
          "Podemos suspender una cuenta por falta de pago o por un uso que ponga en riesgo a otros, avisando antes salvo urgencia.",
          "Al terminar, los datos se pueden exportar por 30 días; después se borran o anonimizan, salvo lo que la ley obligue a conservar.",
        ],
        [
          "The shop can cancel any time from Settings; the service continues until the end of the paid period.",
          "We may suspend an account for non-payment or for use that puts others at risk, with prior notice unless urgent.",
          "After termination, data can be exported for 30 days; then it is deleted or anonymized, except what the law requires to keep.",
        ]
      ),
    },
    {
      id: "cambios",
      title: titled("10. Cambios, ley y conflictos", "10. Changes, law and disputes"),
      body: both(
        [
          "Si cambiamos estos términos de forma importante, avisamos con 30 días; seguir usando el servicio después es aceptarlos. Cada versión queda publicada con su fecha.",
          "Ley aplicable y jurisdicción: [por completar según el país de la barbería: Colombia o el estado de EE. UU.].",
        ],
        [
          "If we change these terms materially, we give 30 days' notice; continuing to use the service afterwards accepts them. Each version stays published with its date.",
          "Governing law and venue: [to be completed according to the shop's country: Colombia or the U.S. state].",
        ]
      ),
    },
  ],
};
