// Minimal EXIF reader: returns the capture date ("YYYY-MM-DDTHH:MM:SS") of a
// JPEG, or null. Works on the first bytes of the file (an ArrayBuffer).
function readExifDate(buf) {
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  while (off + 4 <= v.byteLength) {
    if (v.getUint8(off) !== 0xff) return null;
    const marker = v.getUint8(off + 1);
    if (marker === 0xda || marker === 0xd9) return null;
    const len = v.getUint16(off + 2);
    if (
      marker === 0xe1 &&
      off + 10 <= v.byteLength &&
      v.getUint32(off + 4) === 0x45786966 &&
      v.getUint16(off + 8) === 0
    ) {
      return parseTiff(v, off + 10, Math.min(off + 2 + len, v.byteLength));
    }
    off += 2 + len;
  }
  return null;
}

function parseTiff(v, base, end) {
  if (base + 8 > end) return null;
  const order = v.getUint16(base);
  const le = order === 0x4949;
  if (!le && order !== 0x4d4d) return null;
  const u16 = (o) => v.getUint16(o, le);
  const u32 = (o) => v.getUint32(o, le);
  if (u16(base + 2) !== 42) return null;

  function findTag(ifdRel, tag) {
    const p = base + ifdRel;
    if (p + 2 > end) return null;
    const n = u16(p);
    for (let i = 0; i < n; i++) {
      const e = p + 2 + i * 12;
      if (e + 12 > end) return null;
      if (u16(e) === tag) return { type: u16(e + 2), count: u32(e + 4), valOff: e + 8 };
    }
    return null;
  }

  const ifd0 = u32(base + 4);
  const exifPtr = findTag(ifd0, 0x8769);
  let ent = exifPtr ? findTag(u32(exifPtr.valOff), 0x9003) : null;
  if (!ent) ent = findTag(ifd0, 0x0132);
  if (!ent || ent.type !== 2 || ent.count < 19) return null;
  const sOff = ent.count > 4 ? base + u32(ent.valOff) : ent.valOff;
  if (sOff + 19 > end) return null;
  let s = "";
  for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(sOff + i));
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m || m[1] === "0000") return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
}

if (typeof module !== "undefined") module.exports = { readExifDate };
