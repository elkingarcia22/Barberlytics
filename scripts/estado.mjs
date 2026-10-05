#!/usr/bin/env node
/**
 * Dónde hay trabajo que `main` todavía no tiene: cambios sin commit y commits sin
 * fusionar en cada worktree del repo, y lo que `main` no ha subido a GitHub.
 *
 *   npm run estado                 tabla para leer (-- --detalle: qué archivos faltan)
 *   node scripts/estado.mjs --session-start   hook SessionStart: avisa a Claude solo si hay algo
 *   node scripts/estado.mjs --stop            hook Stop: no deja cerrar con cambios sin guardar
 *
 * Nació el 2026-10-05: el trabajo de dos sesiones quedó sin commit en dos worktrees y
 * ningún localhost tenía todo. Ver CLAUDE.md → «Cómo cerrar un trabajo».
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const MAIN = "main";
const MAX_FILES_STATED = 300;
const MAX_ROWS_IN_HOOK = 8;

const mode = process.argv.includes("--stop") ? "stop" : process.argv.includes("--session-start") ? "session-start" : "report";
/** La comparación fina (fusión por archivo) tarda; al arrancar sesión basta con comparar contenido. */
const PRECISE = mode === "report";
const DETAIL = process.argv.includes("--detalle");

function git(args, cwd = process.cwd(), input) {
  try {
    return execFileSync("git", args, { cwd, input, stdio: [input === undefined ? "ignore" : "pipe", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

let mainBlobs;
/** Ruta → blob de cada archivo en `main`; se lee una vez. */
function blobsInMain(cwd) {
  mainBlobs ??= new Map(
    git(["ls-tree", "-r", "-z", MAIN], cwd)
      .split("\0")
      .filter(Boolean)
      .map((entry) => {
        const [meta, file] = entry.split("\t");
        return [file, meta.split(" ")[2]];
      }),
  );
  return mainBlobs;
}

const scratch = mkdtempSync(join(tmpdir(), "estado-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));

/**
 * Si el cambio de la copia ya está en `main`: se aplica a `main` (fusión a tres bandas con
 * la base de la copia) y no cambia nada. Cubre el caso de que `main` haya seguido avanzando.
 */
function changeAlreadyInMain(path, file) {
  const base = join(scratch, "base");
  const current = join(scratch, "main");
  writeFileSync(base, git(["show", `HEAD:${file}`], path));
  const mainText = git(["show", `${MAIN}:${file}`], path);
  writeFileSync(current, mainText);
  try {
    const merged = execFileSync("git", ["merge-file", "-p", current, base, join(path, file)], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
    return merged.toString().trim() === mainText;
  } catch {
    return false; // choques: la copia tiene algo que `main` no
  }
}

/** Cuáles de esos cambios sin commit no están todavía en `main`. */
function listNotInMain(path, files, cwd) {
  const inMain = blobsInMain(cwd);
  const onDisk = files.filter((file) => {
    try {
      return statSync(join(path, file)).isFile();
    } catch {
      return false;
    }
  });
  const hashes = onDisk.length ? git(["hash-object", "--stdin-paths"], path, onDisk.join("\n")).split("\n") : [];
  const differs = onDisk.filter((file, i) => inMain.get(file) !== hashes[i] && !(PRECISE && inMain.has(file) && changeAlreadyInMain(path, file)));
  const deleted = files.filter((file) => !onDisk.includes(file) && inMain.has(file));
  return [...differs, ...deleted];
}

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

/** Ficheros con cambios sin commit (incluye los nuevos sin seguimiento). */
function dirtyFiles(path) {
  return git(["status", "--porcelain", "-uall"], path)
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());
}

function lastEdit(path, files) {
  let newest = 0;
  for (const file of files.slice(0, MAX_FILES_STATED)) {
    try {
      newest = Math.max(newest, statSync(join(path, file)).mtimeMs);
    } catch {
      /* borrado: no tiene fecha */
    }
  }
  return newest ? new Date(newest) : null;
}

function worktrees(cwd) {
  const out = git(["worktree", "list", "--porcelain"], cwd);
  return out
    .split("\n\n")
    .map((block) => {
      const path = block.match(/^worktree (.+)$/m)?.[1];
      const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1] ?? "(sin rama)";
      return path ? { path, branch } : null;
    })
    .filter(Boolean);
}

function inspect({ path, branch }, cwd) {
  const files = dirtyFiles(path);
  const ahead = branch === MAIN || branch === "(sin rama)" ? 0 : Number(git(["rev-list", "--count", `${MAIN}..${branch}`], cwd) || 0);
  const behind = Number(git(["rev-list", "--count", `HEAD..${MAIN}`], path) || 0);
  const missing = files.length ? listNotInMain(path, files, cwd) : [];
  return { name: basename(path), path, branch, dirty: files.length, notInMain: missing.length, missing, ahead, behind, edited: missing.length ? lastEdit(path, files) : null };
}

const fmtDate = (date) => (date ? date.toLocaleString("es-CO", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
/** Pendiente = algo que `main` no tiene; cambios sin commit idénticos a `main` ya están a salvo. */
const pending = (row) => row.notInMain > 0 || row.ahead > 0;

function unpushed(cwd) {
  const remote = git(["rev-parse", "--verify", "--quiet", `origin/${MAIN}`], cwd);
  if (!remote) return null;
  return Number(git(["rev-list", "--count", `origin/${MAIN}..${MAIN}`], cwd) || 0);
}

function describe(row) {
  const parts = [];
  if (row.notInMain) parts.push(`${row.notInMain} archivo(s) que ${MAIN} no tiene${row.edited ? ` (último cambio ${fmtDate(row.edited)})` : ""}`);
  if (row.ahead) parts.push(`${row.ahead} commit(s) sin fusionar en ${MAIN}`);
  return `${row.name} [${row.branch}]: ${parts.join(", ")}`;
}

const cwd = process.cwd();
const top = resolve(cwd, git(["rev-parse", "--show-toplevel"], cwd) || ".");

if (mode === "stop") {
  const input = readStdin();
  if (input.stop_hook_active) process.exit(0);
  const here = { name: basename(top), branch: git(["branch", "--show-current"], top) || "(sin rama)", dirty: dirtyFiles(top).length };
  if (!here.dirty) process.exit(0);
  const merge = here.branch === MAIN ? "" : ` y fusiónalo en ${MAIN}`;
  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        `Hay ${here.dirty} archivo(s) sin commit en ${here.name}. Si lo que pidió el usuario quedó terminado: ` +
        `npm run verify, commit${merge} (así la próxima sesión arranca con esto). ` +
        `Si sigue a medias, dilo en una línea («queda sin guardar: …») y termina.`,
    }),
  );
  process.exit(0);
}

const rows = worktrees(top).map((wt) => inspect(wt, top));
const notPushed = unpushed(top);

if (mode === "session-start") {
  const others = rows.filter((row) => pending(row) && resolve(row.path) !== top);
  const here = rows.find((row) => resolve(row.path) === top);
  const lines = [];
  if (here?.behind) lines.push(`Esta copia va ${here.behind} commit(s) por detrás de ${MAIN}: trae ${MAIN} antes de tocar nada.`);
  if (others.length) {
    lines.push(`Hay trabajo que ${MAIN} no tiene en otras copias (worktrees):`);
    for (const row of others.slice(0, MAX_ROWS_IN_HOOK)) lines.push(`- ${describe(row)}`);
    if (others.length > MAX_ROWS_IN_HOOK) lines.push(`- …y ${others.length - MAX_ROWS_IN_HOOK} más (npm run estado).`);
    lines.push(`Si el usuario pide algo que pueda depender de eso, avísale antes de empezar; no escribas en esas copias.`);
  }
  if (notPushed) lines.push(`${MAIN} lleva ${notPushed} commit(s) sin subir a GitHub.`);
  if (lines.length) process.stdout.write(`[estado del repo]\n${lines.join("\n")}\n`);
  process.exit(0);
}

console.log(`\nCopias del repo (${rows.length}) — ${MAIN} en ${git(["rev-parse", "--short", MAIN], top)}\n`);
for (const row of rows) {
  const flag = pending(row) ? "●" : "·";
  const detail = pending(row) ? describe(row).split(": ").slice(1).join(": ") : row.dirty ? `ya en ${MAIN} (${row.dirty} sin commit, se puede limpiar)` : "al día";
  const lag = row.behind ? `  (${row.behind} por detrás de ${MAIN})` : "";
  console.log(`${flag} ${row.name.padEnd(45)} ${detail}${lag}`);
  if (DETAIL) for (const file of row.missing) console.log(`    ${file}`);
}
const waiting = rows.filter(pending).length;
console.log(`\n${waiting ? `● ${waiting} copia(s) con trabajo que ${MAIN} no tiene.` : `Todo está en ${MAIN}.`}`);
if (notPushed === null) console.log(`Sin origin/${MAIN}: no sé qué hay en GitHub.`);
else if (notPushed) console.log(`${MAIN} lleva ${notPushed} commit(s) sin subir a GitHub.`);
console.log(`Repo: ${dirname(git(["rev-parse", "--path-format=absolute", "--git-common-dir"], top))}\n`);
