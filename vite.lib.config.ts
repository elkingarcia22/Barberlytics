import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Build de la librería (`npm run build:lib`): ESM con módulos preservados para
 * que el consumidor haga tree-shaking, React y las dependencias pesadas como
 * externas, y la hoja de estilos aparte.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  build: {
    outDir: "dist-lib",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("@/") && !path.isAbsolute(id),
      output: { preserveModules: true, preserveModulesRoot: "src", entryFileNames: "[name].js" },
    },
  },
});
