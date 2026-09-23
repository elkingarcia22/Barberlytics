/**
 * Un `.zip` sin compresión (método "store"), para empaquetar descargas que
 * ya vienen comprimidas, como PNG. Sin dependencias: cabecera local por
 * archivo, directorio central y registro de cierre, con nombres en UTF-8.
 */

export interface ZipEntry {
  /** Ruta dentro del zip, con `/` para carpetas. */
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

const UTF8_FLAG = 0x0800;
const LOCAL_HEADER = 30;
const CENTRAL_HEADER = 46;
const END_RECORD = 22;

export function createZip(entries: readonly ZipEntry[], date: Date = new Date()): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(date);
  const files = entries.map((entry) => ({ name: encoder.encode(entry.name), data: entry.data, crc: crc32(entry.data) }));

  const localSize = files.reduce((sum, file) => sum + LOCAL_HEADER + file.name.length + file.data.length, 0);
  const centralSize = files.reduce((sum, file) => sum + CENTRAL_HEADER + file.name.length, 0);
  const bytes = new Uint8Array(new ArrayBuffer(localSize + centralSize + END_RECORD));
  const view = new DataView(bytes.buffer);
  let at = 0;
  const u16 = (value: number) => {
    view.setUint16(at, value, true);
    at += 2;
  };
  const u32 = (value: number) => {
    view.setUint32(at, value, true);
    at += 4;
  };
  const put = (chunk: Uint8Array) => {
    bytes.set(chunk, at);
    at += chunk.length;
  };

  const offsets: number[] = [];
  for (const file of files) {
    offsets.push(at);
    u32(0x04034b50);
    u16(20);
    u16(UTF8_FLAG);
    u16(0);
    u16(time);
    u16(day);
    u32(file.crc);
    u32(file.data.length);
    u32(file.data.length);
    u16(file.name.length);
    u16(0);
    put(file.name);
    put(file.data);
  }

  const centralStart = at;
  files.forEach((file, index) => {
    u32(0x02014b50);
    u16(20);
    u16(20);
    u16(UTF8_FLAG);
    u16(0);
    u16(time);
    u16(day);
    u32(file.crc);
    u32(file.data.length);
    u32(file.data.length);
    u16(file.name.length);
    u16(0);
    u16(0);
    u16(0);
    u16(0);
    u32(0);
    u32(offsets[index]);
    put(file.name);
  });

  const centralLength = at - centralStart;
  u32(0x06054b50);
  u16(0);
  u16(0);
  u16(files.length);
  u16(files.length);
  u32(centralLength);
  u32(centralStart);
  u16(0);
  return bytes;
}
