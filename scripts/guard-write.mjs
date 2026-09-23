#!/usr/bin/env node
/**
 * Hook PreToolUse (Write|Edit) de Claude Code: bloquea la escritura si el
 * contenido nuevo rompe una regla de AGENTS.md antes de que llegue al disco.
 * Lee el JSON del hook por stdin; sale con 2 para bloquear y explicar.
 */
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const file = String(input.tool_input?.file_path ?? "").replace(/\\/g, "/");
  const rel = file.includes("/src/") ? file.slice(file.indexOf("/src/") + 1) : file;
  if (!/^src\//.test(rel) || !/\.(tsx?|css)$/.test(rel)) process.exit(0);
  const content = String(input.tool_input?.content ?? input.tool_input?.new_string ?? "");
  const problems = [];
  if (/from\s+["'](@mui\/|@chakra-ui\/|antd|@ant-design\/|@mantine\/|@headlessui\/|react-bootstrap|@nextui|@heroui|primereact|@radix-ui\/react-)/.test(content))
    problems.push("Otra librería de interfaz. Todo sale de @/components (radix-ui es un paquete único).");
  if (/from\s+["'](react-icons|@heroicons\/|@tabler\/icons|@fortawesome\/|phosphor-react|@phosphor-icons\/)/.test(content))
    problems.push("Otra librería de iconos. Usa <ThemaIcon name=…/> del registro.");
  const isProduct = /^src\/(features|app)\//.test(rel);
  if (isProduct && /\b(?:bg|text|border|ring)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink|rose)-\d{2,3}\b/.test(content))
    problems.push("Paleta cruda de Tailwind en una pantalla. Usa tokens semánticos (bg-primary, text-text-secondary, text-success…).");
  if (isProduct && !rel.endsWith(".css") && /#[0-9a-fA-F]{6}\b/.test(content)) problems.push("Color hex a mano en una pantalla. Usa una clase del tema.");
  if (isProduct && /\btext-\[\d+(?:\.\d+)?px\]/.test(content)) problems.push("Tamaño de letra fijado. Usa <Heading level> o <Text size> de @/components/typography.");
  if (problems.length) {
    console.error(`[thema] Escritura bloqueada en ${rel}:\n- ${problems.join("\n- ")}\nLee AGENTS.md y ai-tools/CATALOG.md.`);
    process.exit(2);
  }
  process.exit(0);
});
