# MetricCard

La tarjeta de la que se hace una fila de indicadores: acento vertical del tono junto al título, icono en chip, número grande y neutro, píldora de variación al lado, pie de contexto y un gráfico pequeño —junto al número o a sangre por el borde inferior—. El color se gasta solo donde significa algo, así que cuatro tarjetas seguidas se leen tranquilas. Exporta también DeltaPill, que calcula sola su flecha y su tono con un umbral de medio punto.

Familia: Gráficos · Doc: `/docs#/components/metric-card` · Fuente: `src/components/charts/MetricCard.tsx`

```ts
import { MetricCard, DeltaPill } from "@/components/charts"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `label` | `string` |  | Qué se mide. Corto: es el título y va truncado a una línea. |
| `value` | `React.ReactNode` |  | El valor principal. Un número se formatea en es-ES; cualquier otro nodo se pinta tal cual, así que el símbolo y la unidad los pone quien llama. Siempre visible como texto. |
| `delta` | `number` |  | La variación con signo frente al periodo anterior, en su propia unidad. Si falta, no hay píldora. |
| `deltaLabel` | `string` |  | El texto de la píldora con su unidad, p. ej. «+3,2 pp». Sin él se formatea `delta` en es-ES. |
| `deltaTone` | `"positive" \| "negative" \| "neutral"` |  | Fuerza el tono de la píldora cuando el signo miente: una rotación que sube es una mala noticia. |
| `caption` | `string` |  | Una línea apagada bajo el número: sobre qué se calcula o con qué compara. |
| `hint` | `string` |  | Qué mide exactamente. Monta un icono de información con tooltip junto al título. |
| `tone` | `"brand" \| "positive" \| "warning" \| "negative" \| "neutral"` | `"brand"` | Tiñe el acento vertical, el chip del icono y el gráfico. Sale de `lib/tone`, así que sigue al tema. |
| `icon` | `IconName` |  | Icono del registro semántico, en un chip al final de la fila del título. |
| `chart` | `React.ReactNode` |  | Gráfico pequeño. Va envuelto en el color del tono, así que un SVG que dibuje con `currentColor` queda teñido solo; a `EChart` hay que pasarle el color en las opciones. |
| `chartPlacement` | `"side" \| "bottom"` | `"side"` | `side` lo mete junto al número; `bottom` lo corre a sangre por el borde inferior de la tarjeta. |
| `className` | `string` |  | Clases para la Card. |

## Guías

- Sí: Formatea el valor antes de pasarlo: «72 %», «5,1 h», «1.740». La tarjeta solo formatea si le llega un número pelado.
- Sí: Elige el tono por lo que significa el dato hoy, no por lo que mide: la misma métrica pasa de positive a warning cuando baja.
- Sí: Da a cada escala su gráfico: anillo para un reparto sobre el total, línea a sangre para una serie en el tiempo, medidor para un 0–100 por zonas.
- Sí: Usa `deltaTone` en las métricas invertidas (rotación, incidencias, bajas) para que el verde no premie una mala noticia.
- Sí: Mantén el mismo `chartPlacement` en toda una fila; mezclar `side` y `bottom` descuadra las alturas.
- No: No dejes el dato clave solo en el gráfico: el número en texto es la información y el gráfico es el contexto.
- No: No pongas un 0 donde todavía no hay medición; baja a `tone="neutral"` con una raya y quita la píldora.
- No: No pases más de cuatro o cinco tarjetas seguidas: a partir de ahí el ojo deja de priorizar.
- No: No tiñas el número con el tono. El color va en el acento, el chip, el gráfico y la píldora; el número se queda neutro.

Relacionados: kpi-card, sparkline-chart, donut-chart, chart-card, card

## Ejemplos

### Pulso de tres lecturas

Cada escala pide su gráfico: un reparto sobre el total va en anillo, algo que se sigue de un ciclo al siguiente va en línea a sangre por el borde inferior, y un 0–100 por zonas va en medidor. La misma tarjeta las tres veces, así que la fila se lee como un solo objeto.

```tsx
const cumplimientoPorCiclo = [
  { label: "2024-T1", value: 64 },
  { label: "2024-T2", value: 66 },
  { label: "2024-T3", value: 63 },
  { label: "2024-T4", value: 69 },
  { label: "2025-T1", value: 70 },
  { label: "2025-T2", value: 72 },
];

// El anillo y el medidor son opciones de EChart (`type: "pie"` y
// `type: "gauge"`), no presets: la tarjeta solo pide un nodo.
<div className="grid gap-4 sm:grid-cols-3">
  <MetricCard
    label="Avance promedio"
    value="72 %"
    delta={3.2}
    deltaLabel="+3,2 pp"
    caption="Sobre 8 ciclos iniciados"
    hint="Promedio del avance de las personas de cada ciclo ya iniciado."
    tone="positive"
    icon="analytics"
    chart={<MetricRing value={72} />}
  />
  <MetricCard
    label="Objetivos cumplidos"
    value="72 %"
    delta={2}
    deltaLabel="+2 pp"
    caption="Últimos 6 ciclos por fecha de cierre"
    tone="brand"
    icon="award"
    chartPlacement="bottom"
    chart={<SparklineChart data={cumplimientoPorCiclo} height={44} />}
  />
  <MetricCard
    label="Personas reportando"
    value="63 %"
    delta={-4.1}
    deltaLabel="-4,1 pp"
    caption="De 1.740 personas del ciclo"
    hint="El dial va de 0 a 100 %: riesgo bajo 50, en camino de 50 a 79 y en meta desde 80."
    tone="warning"
    icon="users"
    chart={<MetricDial value={63} />}
  />
</div>
```

### El tono dice qué pasa, no qué mide

Sin gráfico la tarjeta sigue en pie: acento, número, píldora y pie bastan. El tono tiñe el acento y el chip; el número se queda neutro siempre, que es lo que deja comparar cuatro tarjetas de un vistazo.

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard label="Horas de formación" value="5,1 h" delta={0.3} deltaLabel="+0,3 h" caption="Promedio por colaborador" tone="brand" icon="graduation" />
  <MetricCard label="Cursos completados" value={1284} delta={12.4} deltaLabel="+12,4 %" caption="Acumulado del trimestre" tone="positive" icon="award" />
  <MetricCard label="Evaluaciones vencidas" value={37} delta={6} deltaLabel="+6" caption="Con más de 15 días de retraso" tone="warning" deltaTone="negative" icon="warning" />
  <MetricCard label="Encuestas sin respuesta" value={214} delta={-18} deltaLabel="-18" caption="Frente al envío anterior" tone="negative" icon="survey" />
</div>
```

### Métricas invertidas y sin dato

En una rotación que sube, el signo miente: `deltaTone` separa «hacia dónde se movió» de «si eso es bueno». Y cuando todavía no hay nada que medir, la tarjeta baja a neutro con una raya en lugar del número, sin píldora y sin gráfico — nunca un cero que se lee como un dato real.

```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <MetricCard label="Rotación voluntaria" value="4,8 %" delta={1.7} deltaLabel="+1,7 pp" deltaTone="negative" caption="Acumulado del trimestre" tone="negative" icon="users" />
  <MetricCard label="Satisfacción del ciclo" value={<span className="text-text-muted">—</span>} caption="Sin ciclos cerrados todavía" tone="neutral" icon="survey" />
</div>
```

### DeltaPill por su cuenta

La píldora vale en una tabla o en una cabecera, no solo dentro de la tarjeta. Resuelve sola la flecha y el tono, y cualquier variación de menos de medio punto sale plana y en gris: un +0,2 pp de ruido no merece pintarse de verde.

```tsx
<div className="flex flex-wrap items-center gap-3">
  <DeltaPill value={3.2} label="+3,2 pp" />
  <DeltaPill value={-2.4} label="-2,4 pp" />
  <DeltaPill value={0.2} label="Sin variación relevante" />
  <DeltaPill value={1.7} tone="negative" label="+1,7 pp" />
  <DeltaPill value={8.5} size="md" label="+8,5 %" />
  <DeltaPill value={8.5} size="xs" showIcon={false} label="+8,5 %" />
</div>
```
