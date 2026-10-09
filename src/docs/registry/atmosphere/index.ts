import type { DocEntry } from "../types";
import { hairCanvasEntry } from "./hair-canvas";
import { hairBurstEntry } from "./hair-burst";
import { barberPoleEntry } from "./barber-pole";
import { poleRingEntry } from "./pole-ring";
import { cutLineEntry } from "./cut-line";
import { marqueeEntry } from "./marquee";
import { barberGlyphEntry } from "./barber-glyph";
import { rotatingSealEntry } from "./rotating-seal";
import { foilEntry } from "./foil";
import { revealEntry } from "./reveal";
import { enterEntry } from "./enter";
import { tiltEntry } from "./tilt";
import { grainEntry } from "./grain";
import { vignetteEntry } from "./vignette";
import { haloEntry } from "./halo";

/** Entradas del grupo "atmosphere": fondos, personalidad del oficio y aparición. */
export const atmosphereEntries: readonly DocEntry[] = [
  hairCanvasEntry,
  hairBurstEntry,
  barberPoleEntry,
  poleRingEntry,
  cutLineEntry,
  marqueeEntry,
  barberGlyphEntry,
  rotatingSealEntry,
  foilEntry,
  revealEntry,
  enterEntry,
  tiltEntry,
  grainEntry,
  vignetteEntry,
  haloEntry,
];
