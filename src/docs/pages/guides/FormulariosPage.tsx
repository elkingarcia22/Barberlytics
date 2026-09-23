import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/Field";
import { FormSection } from "@/components/forms/FormSection";
import { CodeBlock } from "../../components/CodeBlock";
import { DocSection, PageIntro } from "../../components/PageIntro";
import { Decision, Demo, DoDont } from "./GuideBits";

const FIELD_CODE = `<Field label="Nombre del cargo" description="Así lo verá quien se postule." required>
  <Input placeholder="Analista de datos" />
</Field>

<Field label="Correo de contacto" error="Revisa el correo: parece que le falta algo.">
  <Input defaultValue="renata@" aria-invalid />
</Field>`;

const FORM_CODE = `// react-hook-form + zod: el esquema es el contrato; Field pinta el error
const form = useForm({ resolver: zodResolver(vacanteSchema) });

<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
  <FormSection title="Datos del cargo" description="Lo que ve quien se postula.">
    <Field label="Nombre del cargo" required error={form.formState.errors.nombre?.message}>
      <Input {...form.register("nombre")} />
    </Field>
  </FormSection>
  <div className="flex justify-end gap-2">
    <Button variant="outline" type="button">Cancelar</Button>
    <Button type="submit">Publicar vacante</Button>
  </div>
</form>`;

const DECISION = [
  { when: "el formulario tiene hasta 6 u 8 campos", use: "Una sola columna en un drawer o en la página (ancho narrow, 720px)" },
  { when: "tiene más de 8 campos con temas distintos", use: "FormSection por tema, en la misma página", href: "#/components/form-section" },
  { when: "los pasos dependen entre sí o hay que revisar antes de enviar", use: "Stepper con un paso por pantalla y un resumen al final", href: "#/components/stepper" },
  { when: "un campo solo aplica si se eligió algo", use: "Muéstralo debajo del que lo activa; no lo deshabilites" },
  { when: "elegir entre menos de 8 opciones", use: "Select o RadioGroup", href: "#/components/select" },
  { when: "elegir entre muchas opciones", use: "SearchableSelect o MultiSelect", href: "#/components/searchable-select" },
];

/**
 * Cómo se arma un campo, cuándo avisar de un error y cómo organizar
 * formularios largos.
 */
export function FormulariosPage() {
  return (
    <div className="cascade-enter space-y-section">
      <PageIntro
        eyebrow="Patrones"
        title="Formularios"
        description="Cómo se arma un campo, cuándo avisar de un error y cómo organizar formularios largos: por secciones, por pasos, con campos que aparecen según lo elegido y con un resumen antes de enviar."
      />

      <DocSection id="anatomia" title="Cómo se arma un campo" description="Etiqueta arriba, campo, y debajo el texto de ayuda o el mensaje de error. Nunca los dos a la vez: cuando hay error, el error reemplaza a la ayuda.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Las cuatro partes" hint="Etiqueta, campo, ayuda y error. La ayuda explica qué esperamos; el error dice qué hacer para arreglarlo.">
            <div className="space-y-4">
              <Field label="Nombre del cargo" description="Así lo verá quien se postule." required>
                <Input placeholder="Analista de datos" />
              </Field>
              <Field label="Correo de contacto" error="Revisa el correo: parece que le falta algo.">
                <Input defaultValue="renata@" aria-invalid />
              </Field>
            </div>
          </Demo>
          <Demo title="Obligatorio y opcional" hint="Marca solo lo que corresponde. Si casi todo es obligatorio, marca lo opcional con la ayuda y no llenes la pantalla de asteriscos.">
            <div className="space-y-4">
              <Field label="Nombre del cargo" required>
                <Input />
              </Field>
              <Field label="Descripción" description="Opcional.">
                <Textarea rows={2} />
              </Field>
            </div>
          </Demo>
        </div>
        <CodeBlock code={FIELD_CODE} language="tsx" />
      </DocSection>

      <DocSection id="orientacion" title="Orientación y estados" description="Vertical por defecto. Horizontal solo para interruptores y casillas, donde la etiqueta es corta y el control pequeño.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Demo title="Interruptores en horizontal">
            <div className="divide-y divide-border/60">
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label htmlFor="pub">Publicar en el portal de empleo</Label>
                  <p className="text-[12px] text-text-secondary">La vacante será visible para cualquiera.</p>
                </div>
                <Switch id="pub" defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label htmlFor="notif">Avisarme de cada postulación</Label>
                  <p className="text-[12px] text-text-secondary">Un correo por persona, sin resumen diario.</p>
                </div>
                <Switch id="notif" />
              </div>
            </div>
          </Demo>
          <Demo title="Deshabilitado y solo lectura">
            <div className="space-y-4">
              <Field label="Sede" description="Se habilita al elegir un área." disabled>
                <Input />
              </Field>
              <Field label="Código de la vacante" description="Lo genera el sistema, no se edita.">
                <Input readOnly defaultValue="VAC-2026-0418" />
              </Field>
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection id="agrupar" title="Agrupar campos" description="Cuando varios campos responden a la misma pregunta, van juntos bajo un título. FormSection para bloques; RadioGroup para opciones excluyentes.">
        <Demo title="Cómo quieres recibir las postulaciones">
          <FormSection title="Cómo quieres recibir las postulaciones" description="Puedes cambiarlo después desde la vacante.">
            <RadioGroup defaultValue="una">
              {[
                ["una", "Una por una", "Un correo cada vez que alguien se postula."],
                ["resumen", "Resumen diario", "Un solo correo cada mañana."],
                ["no", "No avisarme", "Las reviso yo desde el panel."],
              ].map(([value, title, hint]) => (
                <label key={value} htmlFor={`rx-${value}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-surface px-4 py-3 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5">
                  <RadioGroupItem id={`rx-${value}`} value={value} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-medium text-text-primary">{title}</span>
                    <span className="block text-[12px] text-text-secondary">{hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </FormSection>
        </Demo>
      </DocSection>

      <DocSection id="largos" title="Formularios largos" description="Secciones, pasos o campos dependientes según el tamaño y las dependencias.">
        <Decision rows={DECISION} />
      </DocSection>

      <DocSection id="validar" title="Validación" description="El esquema de Zod es el contrato; react-hook-form lo aplica; Field muestra el error debajo del campo. Se valida al salir del campo y al enviar, nunca mientras se escribe la primera vez.">
        <CodeBlock code={FORM_CODE} language="tsx" />
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Publicar vacante</Button>
        </div>
      </DocSection>

      <DocSection id="reglas" title="Reglas">
        <DoDont
          dos={[
            "Siempre Field: etiqueta, campo, ayuda y error van juntos y accesibles (aria-describedby).",
            "El error dice cómo arreglarlo: «Con al menos 3 letras se entiende mejor», no «Inválido».",
            "Vertical por defecto; horizontal solo para interruptores y casillas.",
            "Pie con Cancelar como secundario y el primario al final.",
          ]}
          donts={[
            "No uses Label suelto con un Input suelto: se pierde el enlace y la ayuda.",
            "No marques todo con asterisco; marca lo opcional si es la excepción.",
            "No muestres la ayuda y el error a la vez.",
            "No valides mientras la persona escribe la primera vez.",
          ]}
        />
      </DocSection>
    </div>
  );
}
