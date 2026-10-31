// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const { readExifDate } = require("../static/exif.js");

// Build a minimal JPEG with an EXIF block containing DateTimeOriginal.
function makeJpeg({ littleEndian = true, date = "2019:07:14 16:32:10", inExifIfd = true } = {}) {
  const le = littleEndian;
  const tiff = new DataView(new ArrayBuffer(200));
  const w16 = (o, v) => tiff.setUint16(o, v, le);
  const w32 = (o, v) => tiff.setUint32(o, v, le);
  tiff.setUint16(0, le ? 0x4949 : 0x4d4d);
  w16(2, 42);
  w32(4, 8); // IFD0 at 8
  w16(8, 1); // one entry
  const text = date + "\0";
  if (inExifIfd) {
    w16(10, 0x8769); w16(12, 4); w32(14, 1); w32(18, 26); // pointer to Exif IFD at 26
    w32(22, 0);
    w16(26, 1);
    w16(28, 0x9003); w16(30, 2); w32(32, text.length); w32(36, 44);
    w32(40, 0);
  } else {
    w16(10, 0x0132); w16(12, 2); w32(14, text.length); w32(18, 44);
    w32(22, 0);
  }
  for (let i = 0; i < text.length; i++) tiff.setUint8(44 + i, text.charCodeAt(i));
  const tiffBytes = new Uint8Array(tiff.buffer, 0, 44 + text.length);
  const payload = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiffBytes];
  const len = payload.length + 2;
  const bytes = [0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...payload, 0xff, 0xd9];
  return new Uint8Array(bytes).buffer;
}

test("reads DateTimeOriginal (little endian)", () => {
  assert.strictEqual(readExifDate(makeJpeg()), "2019-07-14T16:32:10");
});

test("reads DateTimeOriginal (big endian)", () => {
  assert.strictEqual(readExifDate(makeJpeg({ littleEndian: false })), "2019-07-14T16:32:10");
});

test("falls back to IFD0 DateTime", () => {
  assert.strictEqual(readExifDate(makeJpeg({ inExifIfd: false, date: "2015:01:02 03:04:05" })), "2015-01-02T03:04:05");
});

test("returns null for non-JPEG, no EXIF and junk dates", () => {
  assert.strictEqual(readExifDate(new Uint8Array([1, 2, 3, 4, 5]).buffer), null);
  assert.strictEqual(readExifDate(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer), null);
  assert.strictEqual(readExifDate(makeJpeg({ date: "0000:00:00 00:00:00" })), null);
});

test("does not crash on truncated data", () => {
  const full = new Uint8Array(makeJpeg());
  for (const n of [4, 12, 20, 30, 50]) {
    assert.doesNotThrow(() => readExifDate(full.slice(0, n).buffer));
  }
});
