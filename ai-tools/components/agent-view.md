# AgentView (beta)

La pantalla inicial del Agente IA que AdminShell muestra en modo «agent»: saludo con el nombre de la persona, la tarjeta de prompt con el borde animado de IA y cuatro sugerencias que rellenan el campo. No tiene props: lee `user`, `agentSuggestions` y `onAgentPrompt` de ShellConfig, y de momento es solo la portada, sin hilo de conversación.

Familia: Layout y shell · Doc: `/docs#/components/agent-view` · Fuente: `src/components/app-shell/AgentView.tsx`

```ts
import { AgentView } from "@/components/app-shell/AgentView"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `config.user` | `ShellUser` |  | Vía ShellConfig. Del `name` se toma el primer nombre para el saludo. |
| `config.agentSuggestions` | `readonly string[]` |  | Vía ShellConfig. Las tarjetas de sugerencia; al pulsarlas rellenan el prompt y enfocan el campo. |
| `config.onAgentPrompt` | `(prompt: string) => void` |  | Vía ShellConfig. Se llama con el texto recortado al pulsar «Enviar»; un prompt vacío no dispara nada. |

## Guías

- Sí: Conecta `onAgentPrompt` en el `config` de AdminShell; la vista se encarga de vaciar el campo.
- Sí: Mantén las sugerencias en cuatro y escritas como peticiones completas: son el prompt tal cual.
- Sí: Móntala dentro de un contenedor con altura definida; se centra con `h-full`.
- No: No le añadas estado de conversación: para el hilo de chat está AiAgentDrawer o el panel del agente.
- No: No la uses fuera del modo «agent» del shell; su saludo y su borde de IA presuponen ese contexto.

Relacionados: admin-shell, app-sidebar, ai-agent-drawer

## Ejemplos

### Portada del agente

Con el ShellConfig por defecto saluda a Carolina y ofrece las `AGENT_SUGGESTIONS` de demostración. Enviar limpia el campo y dispara `onAgentPrompt` con el texto recortado.

```tsx
// AdminShell la monta cuando mode === "agent":
<AdminShell config={{ onAgentPrompt: (prompt) => askAgent(prompt) }}>…</AdminShell>

// Suelta, dentro de un contenedor con altura:
<div className="h-full bg-background">
  <AgentView />
</div>
```

### Persona y sugerencias propias

Todo lo que muestra sale de ShellConfig: el primer nombre del `user`, las `agentSuggestions` y el callback. Aquí un provider local sustituye los datos de demostración.

```tsx
const config = resolveShellConfig({
  user: { name: "Andrés Malo", email: "andres@ejemplo.com" },
  agentSuggestions: [
    "¿Qué vacantes llevan más de 30 días abiertas?",
    "Resume el desempeño del equipo de Ventas.",
    "¿Quién no ha terminado el onboarding?",
    "Prepara el informe de clima para liderazgo.",
  ],
  onAgentPrompt: (prompt) => askAgent(prompt),
});

<ShellConfigContext.Provider value={config}>
  <AgentView />
</ShellConfigContext.Provider>
```

### En poco alto

El contenido se centra verticalmente y hace scroll si no cabe; las sugerencias pasan de cuatro columnas a dos y a una según el ancho.

```tsx
<div className="h-[360px] bg-background">
  <AgentView />
</div>
```
