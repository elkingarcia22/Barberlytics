#!/usr/bin/env node
/**
 * El servidor de «lo último» (thema-dev, 5195): arranca Vite y cada 30 s trae
 * `main` de GitHub a esta carpeta, así local y GitHub no se separan. Vite ve los
 * archivos nuevos y recarga solo.
 *
 *   npm run dev:main -- --port 5195 --strictPort
 *
 * Solo avanza `main` hacia adelante (fast-forward): si la carpeta está en otra
 * rama, tiene commits sin subir o cambios que chocarían, no toca nada y lo dice.
 * Nació el 2026-10-08: el 5195 mostraba una versión vieja porque nadie hizo pull.
 */
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";

const EVERY_MS = 30_000;
const BRANCH = "main";

/** Salida de git, o null si falló (sin red, no es ancestro, chocaría…). */
function git(args, cwd = process.cwd()) {
  try {
    return execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

const root = git(["rev-parse", "--show-toplevel"]) ?? process.cwd();
let lastNotice = "";

/** Avisa una vez por problema, no cada 30 s. */
function notice(message) {
  if (message === lastNotice) return;
  lastNotice = message;
  console.log(`\n[main] ${message}`);
}

function sync() {
  if (git(["fetch", "--quiet", "origin", BRANCH], root) === null) return notice("No pude traer main de GitHub (¿sin internet?). Sigo con lo que hay.");
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], root);
  if (branch !== BRANCH) return notice(`Esta carpeta está en «${branch}», no en main: no la actualizo. Vuelve con «git checkout main».`);
  if (git(["rev-parse", "HEAD"], root) === git(["rev-parse", `origin/${BRANCH}`], root)) {
    lastNotice = "";
    return;
  }
  if (git(["merge-base", "--is-ancestor", "HEAD", `origin/${BRANCH}`], root) === null)
    return notice("main tiene commits aquí que GitHub no tiene. Súbelos con «git push origin main» y sigo actualizando.");

  const lockBefore = git(["rev-parse", "HEAD:package-lock.json"], root);
  // git no pisa cambios sin guardar: si chocarían, el merge falla y no toca nada.
  if (git(["merge", "--ff-only", "--quiet", `origin/${BRANCH}`], root) === null)
    return notice("Hay cambios sin guardar que chocan con lo nuevo de GitHub: guárdalos o descártalos y sigo actualizando.");

  lastNotice = "";
  console.log(`\n[main] Actualizado: ${git(["log", "--oneline", "-1"], root)}`);
  if (lockBefore !== git(["rev-parse", "HEAD:package-lock.json"], root))
    console.log("[main] Cambiaron las dependencias: corre «npm ci --legacy-peer-deps» y reinicia este servidor.");
}

sync();
const timer = setInterval(sync, EVERY_MS);

const vite = spawn(process.execPath, [join(root, "node_modules/vite/bin/vite.js"), ...process.argv.slice(2)], { cwd: root, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => vite.kill(signal));
vite.on("exit", (code) => {
  clearInterval(timer);
  process.exit(code ?? 0);
});
