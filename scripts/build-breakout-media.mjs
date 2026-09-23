/** Deterministic Act 1 vector art and 48 kHz stereo PCM. No borrowed media. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const output = fileURLToPath(new URL('../public/assets/breakout/', import.meta.url));
await mkdir(output, { recursive: true });

function svg(width, height, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>\n`;
}

async function save(name, content) {
  await writeFile(path.join(output, name), content);
}

const steel =
  '<linearGradient id="steel" x2="0" y2="1"><stop stop-color="#344b5c"/><stop offset=".45" stop-color="#172633"/><stop offset="1" stop-color="#0a141e"/></linearGradient>';
const floorPanel = (x, y) =>
  `<g><rect x="${x}" y="${y}" width="700" height="330" rx="28" fill="url(#steel)" stroke="#50D8E8" stroke-opacity=".48" stroke-width="5"/><path d="M${x + 30} ${y + 52}H${x + 670}M${x + 30} ${y + 278}H${x + 670}" stroke="#7891A0" stroke-opacity=".22" stroke-width="3"/><path d="M${x + 26} ${y + 25}h90M${x + 584} ${y + 25}h90" stroke="#50D8E8" stroke-opacity=".42" stroke-width="8"/></g>`;

await save(
  'bg_faultline.svg',
  svg(
    1920,
    1080,
    `<rect width="1920" height="1080" fill="#07111E"/><path d="M0 0h1920v132H0zM0 916h1920v164H0z" fill="#040B12"/><g opacity=".4"><path d="M0 170h78v700H0M1920 170h-78v700h78" fill="#263746"/><path d="M16 220h42v84H16m0 40h42v84H16m0 40h42v84H16m0 40h42v84H16m0 40h42v84H16M1904 220h-42v84h42m0 40h-42v84h42m0 40h-42v84h42m0 40h-42v84h42m0 40h-42v84h42" fill="#405565"/></g>${floorPanel(118, 150)}${floorPanel(1102, 150)}${floorPanel(1102, 568)}${floorPanel(118, 568)}<ellipse cx="960" cy="540" rx="185" ry="155" fill="#010306" stroke="#263746" stroke-width="34"/><ellipse cx="960" cy="540" rx="126" ry="104" fill="#000"/><path d="M760 540a200 200 0 0 1 400 0M1160 540a200 200 0 0 1-400 0" fill="none" stroke="#50D8E8" stroke-opacity=".25" stroke-width="4" stroke-dasharray="20 18"/><g fill="#F0B34F" opacity=".6">${Array.from({ length: 16 }, (_, index) => `<rect x="${820 + index * 18}" y="140" width="9" height="24" transform="rotate(${index % 2 ? 28 : -28} ${824 + index * 18} 152)"/>`).join('')}</g>`,
    steel,
  ),
);

await save(
  'fx_floor_cracks.svg',
  svg(
    512,
    512,
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M251 22 238 126l-45 56 32 66-91 48 70 42-33 145M242 127l91-44-28 102 84 45-68 53 101 82M223 248l92-11M135 296l-70-49M205 338l85 65" stroke="#F0B34F" stroke-width="12" opacity=".72"/><path d="M251 22 238 126l-45 56 32 66-91 48 70 42-33 145M242 127l91-44-28 102 84 45-68 53 101 82M223 248l92-11M135 296l-70-49M205 338l85 65" stroke="#ED6A6A" stroke-width="5"/></g>',
  ),
);

await save(
  'fx_floor_dust.svg',
  svg(
    512,
    512,
    '<g fill="#9AA9AE" opacity=".16"><ellipse cx="90" cy="90" rx="72" ry="24"/><ellipse cx="222" cy="155" rx="94" ry="34"/><ellipse cx="385" cy="105" rx="108" ry="29"/><ellipse cx="142" cy="260" rx="112" ry="39"/><ellipse cx="355" cy="310" rx="128" ry="46"/><ellipse cx="244" cy="430" rx="155" ry="45"/></g><g fill="none" stroke="#B4C0C4" stroke-width="8" opacity=".15"><path d="M76 40q-22 95 16 176t-8 240M220 42q38 94-4 189t18 238M390 34q-42 102 9 184t-20 250"/></g>',
  ),
);

await save(
  'icon_sector.svg',
  svg(
    256,
    256,
    '<path d="M26 70h204l-18 129H44Z" fill="#263746" stroke="#50D8E8" stroke-width="10"/><path d="M51 96h154M60 126h136M68 156h120" stroke="#8BA1AD" stroke-width="7"/><path d="M40 199h176" stroke="#F0B34F" stroke-width="12"/>',
  ),
);

await save(
  'icon_conveyor.svg',
  svg(
    256,
    256,
    '<path d="M46 128a82 82 0 0 1 135-63" fill="none" stroke="#F1C76C" stroke-width="18" stroke-linecap="round"/><path d="m172 28 50 61-78 11Z" fill="#F1C76C"/><path d="M210 128a82 82 0 0 1-135 63" fill="none" stroke="#50D8E8" stroke-width="18" stroke-linecap="round"/><path d="m84 228-50-61 78-11Z" fill="#50D8E8"/>',
  ),
);

const sampleRate = 48_000;
const channelCount = 2;
const peakLimit = 10 ** (-3 / 20);

function createWave(durationSeconds, voices) {
  const frameCount = Math.ceil(sampleRate * durationSeconds);
  const samples = new Float64Array(frameCount);
  let noiseState = 0x4f17c2a1;
  for (const voice of voices) {
    const {
      at = 0,
      length = 0.4,
      hz = 100,
      to = hz,
      gain = 0.2,
      noise = 0,
      sustain = false,
    } = voice;
    const voiceFrames = Math.floor(length * sampleRate);
    for (let frame = 0; frame < voiceFrames; frame += 1) {
      const outputFrame = Math.floor(at * sampleRate) + frame;
      if (outputFrame >= frameCount) break;
      const t = frame / sampleRate;
      const progress = Math.min(1, t / length);
      const fadeIn = Math.min(1, t / 0.01);
      const fadeOut = Math.min(1, (length - t) / 0.01);
      const envelope = fadeIn * fadeOut * (sustain ? 1 : Math.pow(1 - progress, 1.8));
      noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
      const hiss = ((noiseState / 0xffffffff) * 2 - 1) * noise;
      const phase = 2 * Math.PI * (hz * t + ((to - hz) * t * t) / (2 * length));
      samples[outputFrame] += gain * envelope * (Math.sin(phase) * (1 - noise) + hiss);
    }
  }
  const peak = samples.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0.0001);
  const scale = Math.min(1, peakLimit / peak);
  const blockAlign = channelCount * 2;
  const buffer = Buffer.alloc(44 + frameCount * blockAlign);
  buffer.write('RIFF');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(frameCount * blockAlign, 40);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const value = Math.round(samples[frame] * scale * 32767);
    buffer.writeInt16LE(value, 44 + frame * blockAlign);
    buffer.writeInt16LE(value, 46 + frame * blockAlign);
  }
  return buffer;
}

const cues = {
  sfx_faultline_knock: [0.35, [{ hz: 92, to: 44, length: 0.34, gain: 0.72, noise: 0.16 }]],
  sfx_faultline_warning: [
    1.2,
    [
      { hz: 220, length: 0.55, gain: 0.34 },
      { at: 0.5, hz: 164, length: 0.65, gain: 0.42 },
    ],
  ],
  sfx_conveyor_shift: [
    3,
    [
      { hz: 58, to: 112, length: 2.95, gain: 0.25, noise: 0.12, sustain: true },
      { at: 2.8, hz: 620, to: 95, length: 0.18, gain: 0.4 },
    ],
  ],
  sfx_floor_collapse: [
    1.8,
    [
      { hz: 72, to: 27, length: 1.75, gain: 0.8, noise: 0.3 },
      { at: 0.15, hz: 180, to: 40, length: 1.2, gain: 0.35, noise: 0.45 },
    ],
  ],
  sfx_sector_safe: [
    0.8,
    [
      { hz: 392, to: 523, length: 0.7, gain: 0.28 },
      { at: 0.12, hz: 587, to: 784, length: 0.62, gain: 0.2 },
    ],
  ],
  amb_faultline: [
    8,
    [
      { hz: 43, length: 8, gain: 0.13, sustain: true },
      { hz: 86, length: 8, gain: 0.05, noise: 0.08, sustain: true },
    ],
  ],
  music_faultline: [
    16,
    Array.from({ length: 16 }, (_, index) => ({
      at: index,
      hz: index % 4 === 0 ? 92 : 69,
      to: 48,
      length: 0.72,
      gain: index % 4 === 0 ? 0.24 : 0.13,
    })),
  ],
};

for (const [name, [duration, voices]] of Object.entries(cues)) {
  await save(`${name}.wav`, createWave(duration, voices));
}

console.log(`Built ${5 + Object.keys(cues).length} deterministic Faultline assets in ${output}`);
