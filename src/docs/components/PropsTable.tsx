import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocalizer } from "@/i18n";
import type { DocProp } from "../registry/types";

/**
 * Referencia de props: la `<Table>` del sistema dentro de una `<Card>`.
 *
 * La tabla ya envuelve la `<table>` en un contenedor con scroll horizontal, así
 * que una lista de props ancha no rompe el layout de la página.
 *
 * Las celdas pisan dos valores por defecto: alinean arriba y dejan que el texto
 * parta en varias líneas, porque el `whitespace-nowrap` de la tabla está
 * pensado para datos cortos y aquí la columna de descripción es prosa.
 */
export function PropsTable({ props }: { props: DocProp[] }) {
  const tr = useLocalizer();

  return (
    <Card className="overflow-hidden">
      <Table className="text-[13px]">
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Prop</TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Tipo</TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Default</TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Descripción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.map((prop) => (
            <TableRow key={prop.name} className="border-border/50">
              <TableCell className="px-4 py-2.5 align-top font-mono text-xs font-semibold text-primary">{prop.name}</TableCell>
              <TableCell className="px-4 py-2.5 align-top font-mono text-xs text-text-secondary">{prop.type}</TableCell>
              <TableCell className="px-4 py-2.5 align-top font-mono text-xs text-text-muted">{prop.default ?? "—"}</TableCell>
              <TableCell className="whitespace-normal px-4 py-2.5 align-top text-text-secondary">{tr(prop.description)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
