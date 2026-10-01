# RotatingSeal

El sello de membresía: un anillo de texto girando muy despacio (36 s por vuelta) alrededor de una pieza central, por defecto la flecha del logo. Es el detalle que abre una portada o marca una invitación. Decorativo: el texto tiene que estar también como contenido real.

Familia: Atmósfera y marca · Doc: `/docs#/components/rotating-seal` · Fuente: `src/components/atmosphere/RotatingSeal.tsx`

```ts
import { RotatingSeal } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `text` | `string` | `"Beta privada · Solo por invitación · Cohorte 01 ·"` | El texto del anillo. Termina en «·» para que la vuelta no tenga costura; unos 45 caracteres llenan el carril. |
| `children` | `React.ReactNode` |  | La pieza central. Por defecto, la flecha del logo Barberlytics. |
| `size` | `number` | `128` | Lado del sello en px; el texto y el centro escalan con él. |
| `className` | `string` |  | Márgenes y posición. |

## Guías

- Sí: Uno por página, en la portada o en la invitación.
- Sí: Escribe el mismo mensaje como texto real justo debajo.
- No: No lo uses como avatar ni como botón.
- No: No cambies la velocidad: 36 s es lo que hace que se note sin distraer.

Relacionados: barberlytics-logo, enter, barber-pole

## Ejemplos

### Abriendo la portada

Centrado sobre el titular, dentro de un `Enter` para que entre con el resto del bloque.

```tsx
<Enter>
  <RotatingSeal />
</Enter>
<p>Beta privada · Solo por invitación</p>
```

### Con otra pieza en el centro

El número de la cohorte, una inicial o un icono del registro.

```tsx
<RotatingSeal text="Cohorte 02 · Cupos abiertos ·" size={112}>
  <span className="font-heading text-xl font-semibold text-text-primary">02</span>
</RotatingSeal>
```
