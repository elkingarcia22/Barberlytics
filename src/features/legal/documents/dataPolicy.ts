import { LEGAL_ENTITY, titled, type LegalDoc } from "./types";

/**
 * Política de tratamiento de datos personales para Colombia (Ley 1581 de 2012 y Decreto 1377 de 2013,
 * hoy en el Decreto 1074 de 2015). Es la de Barberlytics como responsable de sus usuarios; cada barbería
 * colombiana necesita la suya como responsable de sus clientes (puede partir de esta).
 */
const es = (lines: readonly string[]) => ({ es: lines, en: lines });

export const DATA_POLICY: LegalDoc = {
  id: "dataPolicy",
  slug: "tratamiento-datos",
  version: "data-policy-co-2026-10",
  updatedAt: "2026-10-19",
  title: titled("Política de tratamiento de datos personales (Colombia)", "Personal data processing policy (Colombia)"),
  summary: titled(
    "Cómo trata Barberlytics los datos personales de sus usuarios en Colombia, según la Ley 1581 de 2012: responsable, finalidades, derechos y cómo ejercerlos.",
    "How Barberlytics processes its users' personal data in Colombia under Law 1581 of 2012. Available in Spanish only, as required locally."
  ),
  audience: titled("Titulares en Colombia: dueños, equipo y clientes de las barberías.", "Data subjects in Colombia: shop owners, staff and clients."),
  spanishOnly: true,
  sections: [
    {
      id: "responsable",
      title: titled("1. Responsable", "1. Controller"),
      body: es([
        `${LEGAL_ENTITY.name} (${LEGAL_ENTITY.legalName}), domiciliada en ${LEGAL_ENTITY.address}. Correo para asuntos de datos personales: ${LEGAL_ENTITY.privacyContact}.`,
        "Frente a los datos de los clientes de cada barbería, la responsable es la barbería y Barberlytics actúa como encargado, según el Acuerdo de encargo firmado con ella.",
      ]),
    },
    {
      id: "tratamiento",
      title: titled("2. Tratamiento y finalidades", "2. Processing and purposes"),
      body: es([
        "Recolectar, guardar, usar, actualizar, transmitir y suprimir datos para:",
        "- Prestar el servicio contratado por la barbería: agenda, cobros, reserva en línea, nómina, reportes y mensajes de las citas.",
        "- Atender solicitudes, soporte y reclamos.",
        "- Enviar promociones solo a quien lo autorizó, dentro de los horarios de la Ley 2300 de 2023 (lunes a viernes de 7:00 a. m. a 7:00 p. m., sábados de 8:00 a. m. a 3:00 p. m., sin domingos ni festivos).",
        "- Cumplir obligaciones legales, contables y tributarias.",
        "- Seguridad del servicio y prevención de fraude.",
      ]),
    },
    {
      id: "sensibles",
      title: titled("3. Datos sensibles y de menores", "3. Sensitive data and minors"),
      body: es([
        "Las alergias o medicamentos son datos sensibles: se piden con una autorización aparte, explícita y facultativa, y el titular no está obligado a darlos. Solo los ve quien lo atiende.",
        "Los datos de menores se tratan solo en su interés superior y con autorización de su representante.",
      ]),
    },
    {
      id: "derechos",
      title: titled("4. Derechos del titular", "4. Data subject rights"),
      body: es([
        "- Conocer, actualizar y rectificar sus datos.",
        "- Pedir prueba de la autorización dada.",
        "- Ser informado del uso que se les ha dado.",
        "- Presentar quejas ante la Superintendencia de Industria y Comercio, después de agotar el trámite ante el responsable o encargado.",
        "- Revocar la autorización o pedir la supresión cuando no haya un deber legal o contractual de conservarlos.",
        "- Acceder gratis a sus datos.",
      ]),
    },
    {
      id: "procedimiento",
      title: titled("5. Consultas y reclamos", "5. Inquiries and claims"),
      body: es([
        `Por escrito a ${LEGAL_ENTITY.privacyContact}, con nombre, identificación, la descripción de lo que pide y un medio de respuesta. Los clientes de una barbería pueden pedirlo también directamente a ella.`,
        "- Consultas: se responden en máximo 10 días hábiles; si no es posible, se avisa el motivo y se responde dentro de los 5 días hábiles siguientes.",
        "- Reclamos (corregir, actualizar, suprimir o revocar): se responden en máximo 15 días hábiles; si no es posible, se avisa y se responde dentro de los 8 días hábiles siguientes. Mientras se resuelve, el dato queda marcado «reclamo en trámite».",
        "Cada solicitud queda registrada con su fecha y respuesta.",
      ]),
    },
    {
      id: "transmision",
      title: titled("6. Transmisión internacional", "6. International transfer"),
      body: es([
        "Los datos se alojan en servidores de proveedores en Estados Unidos, país con nivel adecuado de protección según la Superintendencia de Industria y Comercio (Circular Externa 005 de 2017). Se transmiten con contrato a los subencargados listados en la página de Subencargados.",
      ]),
    },
    {
      id: "area",
      title: titled("7. Área responsable", "7. Responsible area"),
      body: es([`La atención de peticiones, consultas y reclamos está a cargo de [área por completar], en ${LEGAL_ENTITY.privacyContact}.`]),
    },
    {
      id: "vigencia",
      title: titled("8. Vigencia", "8. Effective date"),
      body: es(["Rige desde el 2026-10-19 [fecha de publicación por confirmar]. Los datos se tratan mientras dure la relación con la barbería y lo que exija la ley después. Los cambios importantes se avisan antes de aplicarse."]),
    },
  ],
};
