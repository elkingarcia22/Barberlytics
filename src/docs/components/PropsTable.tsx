import type { DocProp } from "../registry/types";

export function PropsTable({ props }: { props: DocProp[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-text-muted">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Prop</th>
            <th className="px-4 py-2.5 font-semibold">Tipo</th>
            <th className="px-4 py-2.5 font-semibold">Default</th>
            <th className="px-4 py-2.5 font-semibold">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-t border-border/50 align-top">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-primary">{prop.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{prop.type}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-text-muted">{prop.default ?? "—"}</td>
              <td className="px-4 py-2.5 text-text-secondary">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
