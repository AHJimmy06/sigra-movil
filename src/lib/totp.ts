import { hmac } from '@noble/hashes/hmac.js';
import { sha1 } from '@noble/hashes/legacy.js';

export type QrPayloadV1 = { v: 1; passId: string; token: string };

export function decodeBase32(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = value.toUpperCase().replace(/=|\s/g, '');
  let bits = '';
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Invalid base32 secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2));
  return Uint8Array.from(bytes);
}

export function generateTotp(secret: string, timeMs = Date.now(), period = 30, digits = 6): string {
  let counter = Math.floor(timeMs / 1000 / period);
  const message = new Uint8Array(8);
  for (let index = 7; index >= 0; index -= 1) {
    message[index] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  const digest = hmac(sha1, decodeBase32(secret), message);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return (binary % 10 ** digits).toString().padStart(digits, '0');
}

export function createAccessPayload(passId: string, secret: string, timeMs = Date.now(), period = 30, digits = 6) {
  const payload: QrPayloadV1 = { v: 1, passId, token: generateTotp(secret, timeMs, period, digits) };
  return JSON.stringify(payload);
}
