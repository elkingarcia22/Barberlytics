# Avatar

Imagen circular que representa a una persona o equipo, con iniciales de respaldo mientras carga o si la imagen falla. Úsalo en listas de usuarios, comentarios, asignaciones y cabeceras de perfil.

Familia: Primitivos · Doc: `/docs#/components/avatar` · Fuente: `src/components/ui/avatar.tsx`

```ts
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
```

## Props

| Prop | Tipo | Default | Qué hace |
|---|---|---|---|
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | 24, 32 o 40px. Badge y contador del grupo se ajustan al tamaño. |
| `AvatarImage.src / alt` | `string` |  | Imagen del usuario. Mientras carga o si falla, se muestra el fallback. |
| `AvatarFallback.delayMs` | `number` |  | Retrasa el fallback para evitar parpadeos con imágenes rápidas. |
| `AvatarBadge` | `React.ComponentProps<"span">` |  | Punto de estado en la esquina inferior derecha; el color va en `className`. |
| `AvatarGroup` | `React.ComponentProps<"div">` |  | Solapa los avatares hijos con un anillo del color de fondo. |
| `AvatarGroupCount` | `React.ComponentProps<"div">` |  | Círculo final del grupo para «+N» o un icono de acción. |

## Guías

- Sí: Usa siempre un `AvatarFallback` con iniciales (máximo dos letras).
- Sí: Incluye `alt` descriptivo en la imagen.
- Sí: Limita el grupo a 3-4 avatares visibles y agrupa el resto en el contador.
- No: No mezcles tamaños dentro del mismo grupo.
- No: No uses el badge para más de un estado; un color, un significado.
- No: No lo uses como botón sin envolverlo en un control accesible.

Relacionados: badge, hover-card, card

## Ejemplos

### Tamaños

24, 32 y 40px. El fallback ajusta su tipografía automáticamente.

```tsx
<Avatar size="sm"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
<Avatar size="lg"><AvatarImage src="…" alt="Ana" /><AvatarFallback>AT</AvatarFallback></Avatar>
```

### Iniciales de respaldo

Sin `src` (o si la imagen falla) se muestran las iniciales; `delayMs` evita el parpadeo cuando la imagen carga rápido.

```tsx
<Avatar>
  <AvatarFallback>MG</AvatarFallback>
</Avatar>
<Avatar>
  <AvatarImage src="/ruta-rota.png" alt="Carlos Ruiz" />
  <AvatarFallback delayMs={300}>CR</AvatarFallback>
</Avatar>
```

### Badge de estado

`AvatarBadge` se ancla abajo a la derecha y escala con el tamaño; el color se pasa por `className`.

```tsx
const [online, setOnline] = React.useState(true);

<Avatar size="lg">
  <AvatarImage src="…" alt="Ana Torres" />
  <AvatarFallback>AT</AvatarFallback>
  <AvatarBadge className={online ? "bg-success" : "bg-muted-foreground"} />
</Avatar>
```

### Grupo con contador

`AvatarGroup` solapa los avatares y `AvatarGroupCount` cierra la pila con los que faltan o una acción.

```tsx
<AvatarGroup>
  <Avatar><AvatarImage src="…" /><AvatarFallback>AT</AvatarFallback></Avatar>
  <Avatar><AvatarImage src="…" /><AvatarFallback>LP</AvatarFallback></Avatar>
  <Avatar><AvatarFallback>MG</AvatarFallback></Avatar>
  <AvatarGroupCount>+8</AvatarGroupCount>
</AvatarGroup>

<AvatarGroup>
  <Avatar size="sm"><AvatarFallback>AT</AvatarFallback></Avatar>
  <Avatar size="sm"><AvatarFallback>LP</AvatarFallback></Avatar>
  <AvatarGroupCount><Plus /></AvatarGroupCount>
</AvatarGroup>
```
