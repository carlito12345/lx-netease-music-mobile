// React Native does not provide the Web TextEncoder API, while qrcode uses it
// when converting the QR payload into UTF-8 bytes.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(value) {
      const text = String(value);
      const bytes = [];
      for (let index = 0; index < text.length; index += 1) {
        let codePoint = text.charCodeAt(index);
        if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < text.length) {
          const next = text.charCodeAt(index + 1);
          if (next >= 0xdc00 && next <= 0xdfff) {
            codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + next - 0xdc00;
            index += 1;
          }
        }
        if (codePoint < 0x80) {
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
        } else if (codePoint < 0x10000) {
          bytes.push(
            0xe0 | (codePoint >> 12),
            0x80 | ((codePoint >> 6) & 0x3f),
            0x80 | (codePoint & 0x3f)
          );
        } else {
          bytes.push(
            0xf0 | (codePoint >> 18),
            0x80 | ((codePoint >> 12) & 0x3f),
            0x80 | ((codePoint >> 6) & 0x3f),
            0x80 | (codePoint & 0x3f)
          );
        }
      }
      return Uint8Array.from(bytes);
    }
  };
}

global.Buffer = require('buffer').Buffer;
