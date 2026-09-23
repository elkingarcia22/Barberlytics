import { describe, expect, test } from "vitest";
import { crc32, createZip } from "./zip";

const text = (value: string) => new TextEncoder().encode(value);

/** Lee el directorio central como lo haría un descompresor. */
function readZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.length - 22;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const files: { name: string; data: string; crc: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    expect(view.getUint32(at, true)).toBe(0x02014b50);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const local = view.getUint32(at + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const localNameLength = view.getUint16(local + 26, true);
    const dataStart = local + 30 + localNameLength;
    files.push({ name, crc, data: new TextDecoder().decode(bytes.subarray(dataStart, dataStart + size)) });
    at += 46 + nameLength;
  }
  return files;
}

describe("zip", () => {
  test("crc32 coincide con el valor de referencia", () => {
    expect(crc32(text("hello"))).toBe(0x3610a686);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  test("empaqueta varios archivos y se pueden leer de vuelta", () => {
    const zip = createZip([
      { name: "logotipo/claro.png", data: text("uno") },
      { name: "isotipo/oscuro-ñ.png", data: text("dos, más largo") },
    ]);
    expect(Array.from(zip.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const files = readZip(zip);
    expect(files.map((file) => file.name)).toEqual(["logotipo/claro.png", "isotipo/oscuro-ñ.png"]);
    expect(files[1].data).toBe("dos, más largo");
    expect(files[0].crc).toBe(crc32(text("uno")));
  });

  test("un zip vacío es solo el registro de cierre", () => {
    expect(createZip([])).toHaveLength(22);
  });
});
