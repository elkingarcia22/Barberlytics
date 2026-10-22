import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { enableDemoQueue } from "./frontDesk/demoQueue";

// En la demo la fila sin cita arranca con gente (en línea y en el local); las pruebas, vacía.
enableDemoQueue();

/** Service worker para el navegador; se arranca desde `main.tsx` cuando `env.useMocks`. */
export const worker = setupWorker(...handlers);
