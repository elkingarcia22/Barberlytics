# BarberPole

El poste de barbería girando: dos remates dorados y un cilindro con las franjas diagonales desplazándose en vertical, el giro clásico hecho con un solo translateY en bucle. La franja de marca es el primario del tema; el marfil y la tinta son materiales fijos.

Familia: Atmósfera y marca · Doc: `/docs#/components/barber-pole` · Fuente: `src/components/atmosphere/BarberPole.tsx`

```ts
import { BarberPole } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `className` | `string` |  | Alto y posición. El ancho es fijo (24px); el alto lo pone el contenedor. |

## Guías

- Sí: Uno por pantalla, de pie junto a un titular o a un panel.
- Sí: Escóndelo en pantallas angostas (`hidden xl:flex`): ahí no hay margen para él.
- No: No lo uses como icono ni como indicador de carga.
- No: No cambies el marfil ni la tinta: son los materiales del objeto, no colores de interfaz.

Relacionados: pole-ring, rotating-seal

## Ejemplos

### De pie junto al titular

En la landing acompaña al titular en pantallas `xl`; el poste estira al alto del bloque con `self-stretch`.

```tsx
<div className="flex items-stretch gap-10">
  <BarberPole className="hidden self-stretch xl:flex" />
  <div>
    <Heading level={2}>Beta privada · Solo por invitación</Heading>
    <Text variant="lead">…</Text>
  </div>
</div>
```
