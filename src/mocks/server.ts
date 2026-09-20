import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Servidor para Vitest (Node/jsdom); ver `src/test/setup.ts`. */
export const server = setupServer(...handlers);
