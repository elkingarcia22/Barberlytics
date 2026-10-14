# HairBurst

Pelo de barba que cae para celebrar: como el confeti, pero con los pelos finos que quedan tras un arreglo de barba, largos, con una curva suave y afinándose hacia la punta, en negros, castaños y alguna cana. Cae desde arriba del contenedor y a todo su ancho: se van soltando escalonados, cada uno con su peso, y una brisa los lleva de lado. Se apaga en unos 4,5 s. Con `scissors`, unas tijeras cruzan por arriba dando seis cortes y el pelo sale de cada corte; con `sound`, cada corte suena (un «chas» hecho con Web Audio, sin archivos). Es la celebración de la cita recién creada en la reserva en línea. Con prefers-reduced-motion no se monta.

Familia: Atmósfera y marca · Doc: `/docs#/components/hair-burst` · Fuente: `src/components/atmosphere/HairBurst.tsx`

```ts
import { HairBurst } from "@/components/atmosphere"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `density` | `number` | `10` | Pelos por cada 100 px de ancho: unos 37 en un celular y unos 120 en un monitor, entre 14 y 300. |
| `scissors` | `boolean` | `false` | Unas tijeras cruzan por arriba dando seis cortes y el pelo sale de cada corte, en vez de llover desde el borde. |
| `sound` | `boolean` | `false` | Con `scissors`, el «chas» de cada corte (Web Audio, sin archivos). Si el navegador aún no permite audio, no suena y la animación sigue. |
| `cutY` | `number` |  | Con `scissors`, la línea que cortan, en px desde arriba del contenedor (en la reserva, el borde de abajo del header): cruzan rectas sobre ella y el pelo sale de ahí. Sin ella van por arriba ondulando. |
| `onDone` | `() => void` |  | Al terminar la caída; con «reducir movimiento», enseguida. |
| `className` | `string` |  | Clases extra para el <canvas>, que ya es absolute inset-0 y no intercepta el puntero. |

## Guías

- Sí: Úsala para un logro de verdad: la cita creada, no cada paso del recorrido.
- Sí: Dale como `key` lo que celebra (el id de la reserva): así no se repite al volver a la pantalla.
- Sí: El contenedor tiene que ser `relative` y con `overflow-hidden`; el canvas mide al padre.
- No: No la dejes montada en bucle: para lluvia de fondo está HairCanvas.
- No: No la dispares dos veces seguidas en el mismo recorrido.
- No: No le des los colores del tema: son colores de pelo de verdad (más claros sobre fondo oscuro), para que se lea como pelo y no como confeti.

Relacionados: hair-canvas, halo

## Ejemplos

### Cita creada

Así sale en la reserva en línea al confirmar la cita: las tijeras cortan la línea del header con sonido, encima de todo (`z-toast`), sin interceptar el puntero, y se desmonta en `onDone`.

```tsx
<HairBurst key={reservation.id} scissors sound cutY={headerBottom} className="z-toast" onDone={() => setBurstId(null)} />
```

### Solo el pelo

Sin tijeras: el pelo cae desde el borde de arriba, a todo lo ancho.

```tsx
<HairBurst key={id} onDone={() => setBurstId(null)} />
```
