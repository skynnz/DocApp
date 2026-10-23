import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pagedEntry = require.resolve("pagedjs");
const source = path.join(
  path.dirname(pagedEntry),
  "..",
  "dist",
  "paged.polyfill.js",
);
const targetDirectory = path.join(process.cwd(), "public", "vendor");
const target = path.join(targetDirectory, "paged.polyfill.js");

await mkdir(targetDirectory, { recursive: true });
await copyFile(source, target);
console.log(`Paged.js copiado a ${path.relative(process.cwd(), target)}`);
