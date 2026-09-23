// Lossy delivery encoding only; generated artwork is not redrawn or composited.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const [sharpModule, mainImage, finalImage] = process.argv.slice(2);
if (!sharpModule || !mainImage || !finalImage) {
  throw new Error(
    'Usage: node scripts/import-backgrounds.mjs <sharp module path> <main PNG> <final PNG>',
  );
}
const sharp = createRequire(import.meta.url)(sharpModule);
const directory = fileURLToPath(new URL('../public/assets/background/', import.meta.url));
await mkdir(directory, { recursive: true });
for (const [source, id] of [
  [mainImage, 'bg_arena_main'],
  [finalImage, 'bg_arena_final'],
]) {
  const info = await sharp(source)
    .webp({ quality: 84, effort: 6 })
    .toFile(path.join(directory, `${id}.webp`));
  console.log(id, info);
}
