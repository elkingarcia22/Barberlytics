---
name: documentar-componente
description: Crear o documentar un componente reutilizable en el sistema Thema — archivo en src/components/<familia>, entrada defineEntry en src/docs/registry/<grupo> con playground, ejemplos, props y guías, prueba y regeneración del catálogo. Se activa al pedir "crea un componente", "añade X al sistema", "documenta X".
---

# Documentar un componente

1. **¿Ya existe?** Busca en `ai-tools/CATALOG.md` y en `src/components/`. Si existe algo cercano,
   extiende sus props antes de crear otro (dos piezas para lo mismo es la deuda más cara).
2. **Componente** en `src/components/<familia>/<Nombre>.tsx` (PascalCase; primitivos shadcn en
   `ui/` en kebab-case). Estilo: `cva` para variantes, `cn` de `@/lib/utils`, `data-slot`, foco
   `focus-visible:ring-2 focus-visible:ring-ring/50`, solo tokens semánticos, `motion-reduce:` en
   animaciones, atributos ARIA. Exporta en el `index.ts` de la familia.
3. **Prueba** `<Nombre>.test.tsx` junto al archivo (Vitest + Testing Library + user-event):
   comportamiento, no markup.
4. **Entrada de doc** `src/docs/registry/<grupo>/<id>.tsx`:
   ```ts
   export const xEntry = defineEntry({ id, name, group, description, importPath, sourcePath,
     status: "stable"|"beta", tags, playground: definePlayground({ controls, render, code }),
     examples: [{ id, title, description, code, render }], props, guidelines: { do, dont }, related });
   ```
   Súmala al `index.ts` del grupo. Textos en español, ejemplos con casos reales del producto
   (RR. HH., formación, encuestas). Modelo: `src/docs/registry/ui/badge.tsx`.
5. **Grupo nuevo** (raro): `DocGroupId` + `DOC_GROUPS` en `registry/types.ts`, import en
   `registry/index.ts`, icono en `docsNavigation.ts`.
6. `npm run catalog`, `npm run check`, `npm run verify`. Si la pieza cambia una regla general,
   actualiza la guía correspondiente en `src/docs/pages/guides/`.
