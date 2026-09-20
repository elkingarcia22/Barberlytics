import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Service worker para el navegador; se arranca desde `main.tsx` cuando `env.useMocks`. */
export const worker = setupWorker(...handlers);
