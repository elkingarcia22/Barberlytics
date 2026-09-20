import { describe, expect, test } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { renderWithProviders, screen, userEvent } from "@/test/render";
import { ApiError } from "@/lib/api";
import { QueryBoundary } from "./QueryBoundary";

function Demo({ fn }: { fn: () => Promise<string[]> }) {
  const query = useQuery({ queryKey: ["demo", fn], queryFn: fn });
  return (
    <QueryBoundary query={query} empty={{ when: (d) => d.length === 0, render: <p>vacío</p> }}>
      {(data) => <ul>{data.map((item) => <li key={item}>{item}</li>)}</ul>}
    </QueryBoundary>
  );
}

describe("QueryBoundary", () => {
  test("muestra carga, luego datos", async () => {
    renderWithProviders(<Demo fn={async () => ["a", "b"]} />);
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    expect(await screen.findByText("a")).toBeInTheDocument();
  });

  test("muestra el estado vacío", async () => {
    renderWithProviders(<Demo fn={async () => []} />);
    expect(await screen.findByText("vacío")).toBeInTheDocument();
  });

  test("muestra el error con reintento", async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls === 1) throw new ApiError({ status: 500, code: "server", message: "Explotó" });
      return ["ok"];
    };
    renderWithProviders(<Demo fn={fn} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Explotó");
    await userEvent.setup().click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("ok")).toBeInTheDocument();
  });
});
