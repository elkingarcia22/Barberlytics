import { LEGAL_ENTITY, both, titled, type LegalDoc } from "./types";

/**
 * Acuerdo de encargo de datos (DPA): la barbería es responsable (controller) de los datos de sus clientes
 * y de su equipo; Barberlytics es su encargado (processor / service provider). Lo acepta el dueño o un
 * administrador en Configuración; la versión y la fecha quedan guardadas.
 */
export const DPA: LegalDoc = {
  id: "dpa",
  slug: "encargo",
  version: "dpa-2026-10",
  updatedAt: "2026-10-19",
  title: titled("Acuerdo de encargo de datos", "Data processing agreement"),
  summary: titled(
    "Cómo trata Barberlytics los datos de los clientes y del equipo por cuenta de la barbería: solo con sus instrucciones, con seguridad, con subencargados conocidos y devolviéndolos al terminar.",
    "How Barberlytics processes client and staff data on the shop's behalf: only on its instructions, securely, with known subprocessors and returning them at the end."
  ),
  audience: titled("La barbería (responsable) y Barberlytics (encargado).", "The shop (controller) and Barberlytics (processor)."),
  sections: [
    {
      id: "objeto",
      title: titled("1. Objeto y roles", "1. Purpose and roles"),
      body: both(
        [
          `La barbería es la responsable de los datos personales de sus clientes y de su equipo. ${LEGAL_ENTITY.name} los trata como encargado (en EE. UU., «service provider» o «processor») solo para prestar el servicio descrito en los Términos.`,
          "Este acuerdo complementa los Términos y prevalece sobre ellos en lo que toca a datos personales.",
        ],
        [
          `The shop is the controller of its clients' and staff's personal data. ${LEGAL_ENTITY.name} processes them as processor (in the U.S., “service provider” or “processor”) only to provide the service described in the Terms.`,
          "This agreement supplements the Terms and prevails over them regarding personal data.",
        ]
      ),
    },
    {
      id: "instrucciones",
      title: titled("2. Instrucciones", "2. Instructions"),
      body: both(
        [
          "Barberlytics trata los datos solo según las instrucciones de la barbería, que son el uso del servicio y su configuración (por ejemplo, qué mensajes se envían y a quién). No los vende, no los comparte para publicidad, no los combina con datos de otras barberías y no los usa para entrenar modelos de IA.",
          "Si una instrucción le parece contraria a la ley, Barberlytics avisa a la barbería.",
        ],
        [
          "Barberlytics processes the data only on the shop's instructions, which are its use and configuration of the service (for example, which messages are sent and to whom). It does not sell them, share them for advertising, combine them with other shops' data or use them to train AI models.",
          "If an instruction appears unlawful, Barberlytics notifies the shop.",
        ]
      ),
    },
    {
      id: "confidencialidad",
      title: titled("3. Confidencialidad", "3. Confidentiality"),
      body: both(
        ["Solo acceden las personas de Barberlytics que lo necesitan para el servicio o el soporte, con obligación de confidencialidad. Cada acceso de soporte a una cuenta queda registrado."],
        ["Only Barberlytics personnel who need it for the service or support have access, under confidentiality obligations. Every support access to an account is logged."]
      ),
    },
    {
      id: "seguridad",
      title: titled("4. Medidas de seguridad", "4. Security measures"),
      body: both(
        [
          "- Separación por barbería en cada consulta y permisos por rol aplicados en el servidor.",
          "- Acceso con código al celular, bloqueo por intentos y confirmación de identidad para lo sensible.",
          "- Tarjetas solo como token de la pasarela; claves de terceros y secretos solo en el servidor; cifrado en tránsito [y en reposo, por confirmar con el proveedor de base de datos].",
          "- Copias de seguridad y recuperación a un punto en el tiempo [por completar]; registro de errores sin datos personales.",
        ],
        [
          "- Per-shop separation in every query and role permissions enforced on the server.",
          "- Sign-in by code to the phone, lockout on failed attempts and identity confirmation for sensitive actions.",
          "- Cards only as gateway tokens; third-party keys and secrets only on the server; encryption in transit [and at rest, to be confirmed with the database provider].",
          "- Backups and point-in-time recovery [to be completed]; error logging without personal data.",
        ]
      ),
    },
    {
      id: "subencargados",
      title: titled("5. Subencargados", "5. Subprocessors"),
      body: both(
        [
          "La barbería autoriza los subencargados de la página Subencargados. Barberlytics avisa con 30 días cualquier cambio; la barbería puede oponerse con razones y, si no hay solución, terminar el servicio sin penalidad.",
          "Barberlytics firma con cada subencargado obligaciones equivalentes a las de este acuerdo y responde por ellos.",
        ],
        [
          "The shop authorizes the subprocessors on the Subprocessors page. Barberlytics gives 30 days' notice of any change; the shop may object on reasonable grounds and, if unresolved, end the service without penalty.",
          "Barberlytics binds each subprocessor to obligations equivalent to this agreement and is responsible for them.",
        ]
      ),
    },
    {
      id: "transferencias",
      title: titled("6. Transferencias internacionales", "6. International transfers"),
      body: both(
        ["Los datos se alojan en Estados Unidos. Para datos de titulares en Colombia, esta transmisión se hace bajo este contrato de encargo, conforme a la Ley 1581 de 2012 y sus decretos."],
        ["Data is hosted in the United States. For data subjects in Colombia, this transfer is made under this processing contract, in accordance with Law 1581 of 2012 and its decrees."]
      ),
    },
    {
      id: "derechos",
      title: titled("7. Ayuda con los derechos de los titulares", "7. Help with data subject rights"),
      body: both(
        ["El servicio permite a la barbería consultar, corregir, exportar y borrar los datos de un cliente [exportar y borrar por completar en el producto]. Si un titular escribe a Barberlytics, se lo hacemos llegar a la barbería en 2 días hábiles y la ayudamos a responder en plazo."],
        ["The service lets the shop look up, correct, export and delete a client's data [export and delete to be completed in the product]. If a data subject writes to Barberlytics, we forward it to the shop within 2 business days and help it answer on time."]
      ),
    },
    {
      id: "incidentes",
      title: titled("8. Incidentes de seguridad", "8. Security incidents"),
      body: both(
        ["Barberlytics avisa a la barbería sin demora indebida y a más tardar en 72 horas desde que confirma un incidente que afecte sus datos, con lo que se sabe, lo que se hizo y lo que sigue, para que la barbería cumpla sus propios avisos a la autoridad y a los titulares."],
        ["Barberlytics notifies the shop without undue delay and no later than 72 hours after confirming an incident affecting its data, with what is known, what was done and next steps, so the shop can meet its own notices to authorities and data subjects."]
      ),
    },
    {
      id: "fin",
      title: titled("9. Al terminar", "9. On termination"),
      body: both(
        ["La barbería puede exportar sus datos durante 30 días. Después, Barberlytics los borra o anonimiza, también de las copias de seguridad al cumplirse su ciclo [por completar], salvo lo que la ley obligue a conservar."],
        ["The shop may export its data for 30 days. Afterwards, Barberlytics deletes or anonymizes it, including backups at the end of their cycle [to be completed], except what the law requires to keep."]
      ),
    },
    {
      id: "auditoria",
      title: titled("10. Auditoría", "10. Audits"),
      body: both(
        ["A pedido, Barberlytics entrega la información necesaria para demostrar que cumple este acuerdo (políticas, medidas, informes de terceros cuando existan). Una auditoría en sitio se acuerda con aviso razonable y a cargo de quien la pide."],
        ["On request, Barberlytics provides the information needed to show compliance with this agreement (policies, measures, third-party reports where available). An on-site audit is agreed with reasonable notice and at the requester's cost."]
      ),
    },
  ],
};
