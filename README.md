# UBITS Thema

Sistema de diseño UBITS con temas intercambiables (estilo shadcn) y una página de documentación
donde cada componente se puede ver, probar e inspeccionar.

## Scripts

```bash
npm run dev        # documentación en http://localhost:5173
npm run build      # build de producción
npm run type-check # tsc -b
npm test           # pruebas unitarias (Vitest)
npm run lint       # eslint
```

## Qué incluye

- **131 componentes documentados** en 16 familias, cada uno con playground interactivo, ejemplos con código, tabla de props y guías de uso.
- **10 temas** (UBITS Azul, Índigo, Violeta, Esmeralda, Teal, Cian, Naranja, Rosa, Ámbar, Grafito), 4 escalas de radio y modo claro/oscuro/sistema, con exportación del tema como CSS estático.
- Páginas de fundamentos: temas, colores y tokens, tipografía, radios y sombras, iconos y motion.
- Guía de theming en [docs/THEMING.md](docs/THEMING.md).

## Estructura

- `src/styles/tokens.css` — tokens UBITS (colores, radios, sombras, fuentes).
- `src/styles/globals.css` — mapa semántico shadcn + utilidades de motion.
- `src/themes/` — presets, derivación de tokens, `ThemeProvider`, `ThemeSelector`.
- `src/components/ui/` — primitivos shadcn/Radix afinados con los tokens.
- `src/components/<familia>/` — familias de componentes del producto.
- `src/docs/` — la página de documentación (registro, shell, páginas de fundamentos).

## Añadir un tema

Añade una entrada en `src/themes/presets.ts` con el primario en claro y oscuro. Todo lo demás se deriva.

## Documentar un componente

Crea `src/docs/registry/<grupo>/<componente>.tsx` con `defineEntry({...})` y súmalo al `index.ts` del grupo.
