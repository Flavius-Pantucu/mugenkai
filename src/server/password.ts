import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt from node:crypto: memory-hard, no native dependency to install on Vercel.
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function scryptAsync(password: string, salt: Buffer, keylen: number, opts: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => scrypt(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));
}

/** Format: scrypt$N$r$p$<salt b64>$<hash b64>, so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  const hash = await scryptAsync(password, salt, keylen, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, N, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  return timingSafeEqual(actual, expected);
}
