/** Deterministic Breakout vector art and 48 kHz stereo PCM. No borrowed media. */
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

await save(
  'bg_escape_run.svg',
  svg(
    1920,
    1080,
    `<rect width="1920" height="1080" fill="#081725"/><path d="M0 0h1920v132H0zM0 916h1920v164H0z" fill="#041019"/><path d="M64 160h1432v744H64z" fill="url(#conduit)"/><g stroke="#4F7380" stroke-opacity=".18" stroke-width="4">${Array.from({ length: 17 }, (_, index) => `<path d="M${100 + index * 84} 164v736"/>`).join('')}</g><path d="M104 188h1360M104 878h1360" stroke="#65DDE1" stroke-opacity=".22" stroke-width="6"/><g opacity=".5"><path d="M0 180h58v700H0" fill="#512B2F"/><path d="M18 230h28v82H18m0 48h28v82H18m0 48h28v82H18m0 48h28v82H18m0 48h28v82H18" fill="#A85B57" opacity=".34"/><path d="M1508 150h412v766h-412" fill="#163844"/><path d="M1560 210h300v118h-300m0 62h300v118h-300m0 62h300v118h-300m0 62h300v118h-300" fill="#224E5B" stroke="#F1C76C" stroke-opacity=".22" stroke-width="4"/></g><path d="M328 160v744M1496 160v744" stroke="#F1C76C" stroke-opacity=".34" stroke-width="5" stroke-dasharray="14 16"/>`,
    '<linearGradient id="conduit" x2="1"><stop stop-color="#1F2C35"/><stop offset=".24" stop-color="#10242E"/><stop offset=".76" stop-color="#12313A"/><stop offset="1" stop-color="#224E5B"/></linearGradient>',
  ),
);

await save(
  'img_exit_gate.svg',
  svg(
    512,
    512,
    '<path d="M82 456V92q0-38 38-38h272q38 0 38 38v364h-58V118H140v338Z" fill="#224E5B" stroke="#F1C76C" stroke-width="12"/><path d="M140 118h232v338H140Z" fill="#07131C" stroke="#65DDE1" stroke-opacity=".55" stroke-width="8"/><path d="M168 150v274M344 150v274M168 286h176" stroke="#547681" stroke-width="10"/><path d="m112 82 24 24m240-24-24 24" stroke="#F1C76C" stroke-width="12"/>',
  ),
);

await save(
  'fx_capsule_exhaust.svg',
  svg(
    512,
    512,
    '<defs><linearGradient id="trail" x2="1"><stop stop-color="#65DDE1" stop-opacity="0"/><stop offset="1" stop-color="#F1C76C" stop-opacity=".85"/></linearGradient></defs><path d="M20 196h390l76 60-76 60H20l112-60Z" fill="url(#trail)"/><path d="M60 160h310l72 42H60M60 352h310l72-42H60" fill="none" stroke="#65DDE1" stroke-opacity=".52" stroke-width="14"/>',
  ),
);

await save(
  'icon_exit.svg',
  svg(
    256,
    256,
    '<path d="M36 28h116v200H36Z" fill="none" stroke="#65DDE1" stroke-width="16"/><path d="M92 128h132m-42-42 42 42-42 42" fill="none" stroke="#F1C76C" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
);

await save(
  'icon_burst.svg',
  svg(
    256,
    256,
    '<path d="M28 74h118M10 128h168M28 182h118" stroke="#F1C76C" stroke-width="20" stroke-linecap="round"/><path d="m145 42 82 86-82 86" fill="none" stroke="#65DDE1" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
);

await save(
  'icon_photo_finish.svg',
  svg(
    256,
    256,
    '<path d="M28 76h200v138H28Z" fill="#16313B" stroke="#F1C76C" stroke-width="14"/><path d="M72 76 94 42h68l22 34" fill="#224E5B" stroke="#F1C76C" stroke-width="14"/><circle cx="128" cy="145" r="46" fill="#07131C" stroke="#65DDE1" stroke-width="14"/><path d="M197 106h18" stroke="#EDC46B" stroke-width="12"/>',
  ),
);

await save(
  'bg_final_clash.svg',
  svg(
    1920,
    1080,
    '<rect width="1920" height="1080" fill="#0B0C19"/><path d="M0 0h1920v132H0zM0 916h1920v164H0z" fill="#060711"/><ellipse cx="960" cy="510" rx="300" ry="300" fill="#111329" stroke="#282A45" stroke-width="34"/><circle cx="960" cy="510" r="212" fill="#090A16" stroke="#8B9BDF" stroke-opacity=".3" stroke-width="8"/><circle cx="960" cy="510" r="126" fill="#05060D" stroke="#EDC46B" stroke-opacity=".24" stroke-width="5"/><path d="M96 790h560l76-96H208Zm1728 0h-560l-76-96h524Z" fill="#17192D" stroke="#8B9BDF" stroke-opacity=".36" stroke-width="6"/><path d="M260 0 520 420M1660 0 1400 420" stroke="#8B9BDF" stroke-opacity=".12" stroke-width="110"/><g stroke="#282A45" stroke-width="5" opacity=".8"><path d="M64 160h560M1296 160h560M64 820h560M1296 820h560"/><path d="M94 180v600M1826 180v600"/></g>',
  ),
);

await save(
  'img_clash_plate.svg',
  svg(
    256,
    320,
    '<rect x="22" y="18" width="212" height="284" rx="32" fill="#282A45" stroke="#8B9BDF" stroke-width="10"/><rect x="42" y="40" width="172" height="240" rx="22" fill="#111329" stroke="#5B648E" stroke-width="5"/><circle cx="128" cy="154" r="58" fill="#0B0C19" stroke="#8B9BDF" stroke-opacity=".45" stroke-width="8"/><path d="M100 154h56M128 126v56" stroke="#EDC46B" stroke-opacity=".5" stroke-width="8"/>',
  ),
);

await save(
  'icon_pulse.svg',
  svg(
    256,
    256,
    '<g fill="none" stroke="#F2BE65" stroke-width="15"><circle cx="128" cy="128" r="28"/><circle cx="128" cy="128" r="64"/><circle cx="128" cy="128" r="102"/></g><circle cx="128" cy="128" r="10" fill="#FFF1C8"/>',
  ),
);
await save(
  'icon_hack.svg',
  svg(
    256,
    256,
    '<path d="M38 202h62v-52h52V98h66V40" fill="none" stroke="#65DDE1" stroke-width="18" stroke-linejoin="round"/><g fill="#0B0C19" stroke="#65DDE1" stroke-width="12"><rect x="18" y="182" width="40" height="40"/><rect x="132" y="78" width="40" height="40"/><rect x="198" y="20" width="40" height="40"/></g>',
  ),
);
await save(
  'icon_barrier.svg',
  svg(
    256,
    256,
    '<path d="M128 18 224 54v72c0 62-38 96-96 116-58-20-96-54-96-116V54Z" fill="#312B49" stroke="#AE9BE8" stroke-width="15"/><path d="M128 20v216M40 80l88 48 88-48" fill="none" stroke="#D4C9F5" stroke-opacity=".62" stroke-width="9"/>',
  ),
);
await save(
  'icon_championship_point.svg',
  svg(
    256,
    256,
    '<path d="m128 22 24 64 68-20-34 60 52 44-70 8-8 70-46-54-60 34 22-68-66-24 66-24-22-68 60 34Z" fill="none" stroke="#EDC46B" stroke-width="12" stroke-linejoin="round"/>',
  ),
);
await save(
  'fx_clash_aperture.svg',
  svg(
    1920,
    1080,
    '<g transform="translate(960 510)" fill="none" stroke="#8B9BDF" stroke-opacity=".34"><circle r="310" stroke-width="7" stroke-dasharray="94 34"/><circle r="254" stroke-width="5" stroke-dasharray="38 22"/><circle r="180" stroke="#EDC46B" stroke-opacity=".24" stroke-width="6" stroke-dasharray="70 45"/></g>',
  ),
);
await save(
  'fx_clash_victory.svg',
  svg(
    1920,
    1080,
    '<defs><radialGradient id="victory"><stop stop-color="#EDC46B" stop-opacity=".42"/><stop offset=".42" stop-color="#EDC46B" stop-opacity=".08"/><stop offset="1" stop-color="#EDC46B" stop-opacity="0"/></radialGradient></defs><ellipse cx="960" cy="510" rx="780" ry="520" fill="url(#victory)"/><g stroke="#FFF0B8" stroke-opacity=".28" stroke-width="10"><path d="M960 500 220 80M960 500 520 0M960 500 1400 0M960 500 1700 80M960 500 1840 580M960 500 80 580"/></g>',
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
  sfx_race_charge: [
    1.5,
    [
      { hz: 78, to: 224, length: 1.45, gain: 0.28, sustain: true },
      { hz: 156, to: 448, length: 1.4, gain: 0.12, sustain: true },
    ],
  ],
  sfx_race_launch: [
    0.8,
    [
      { hz: 210, to: 74, length: 0.76, gain: 0.38, noise: 0.24 },
      { hz: 760, to: 210, length: 0.22, gain: 0.28 },
    ],
  ],
  sfx_exit_lock: [
    0.9,
    [
      { hz: 392, length: 0.6, gain: 0.24 },
      { at: 0.1, hz: 523, length: 0.65, gain: 0.22 },
      { at: 0.2, hz: 659, length: 0.65, gain: 0.18 },
    ],
  ],
  sfx_photo_finish: [
    0.25,
    [
      { hz: 1400, to: 280, length: 0.08, gain: 0.5, noise: 0.34 },
      { at: 0.09, hz: 860, to: 180, length: 0.14, gain: 0.26 },
    ],
  ],
  amb_escape_run: [
    10,
    [
      { hz: 54, length: 10, gain: 0.09, sustain: true },
      { hz: 108, length: 10, gain: 0.05, noise: 0.12, sustain: true },
    ],
  ],
  music_escape_run: [
    10,
    Array.from({ length: 16 }, (_, index) => ({
      at: index * 0.625,
      hz: index % 4 === 0 ? 146 : 110,
      to: 78,
      length: 0.42,
      gain: index % 4 === 0 ? 0.2 : 0.11,
    })),
  ],
  sfx_clash_charge: [
    2,
    [
      { hz: 74, to: 286, length: 1.96, gain: 0.25, sustain: true },
      { hz: 148, to: 572, length: 1.9, gain: 0.1, sustain: true },
    ],
  ],
  sfx_clash_flip: [
    0.35,
    [
      { hz: 740, to: 146, length: 0.3, gain: 0.34, noise: 0.18 },
      { at: 0.08, hz: 980, to: 210, length: 0.2, gain: 0.22 },
    ],
  ],
  sfx_pulse_overload: [
    1.2,
    [
      { hz: 220, to: 660, length: 0.8, gain: 0.22 },
      { at: 0.72, hz: 920, to: 80, length: 0.42, gain: 0.28, noise: 0.3 },
    ],
  ],
  sfx_hack_unlock: [
    1.2,
    [
      { at: 0.15, hz: 330, length: 0.18, gain: 0.25 },
      { at: 0.45, hz: 440, length: 0.18, gain: 0.25 },
      { at: 0.75, hz: 587, length: 0.3, gain: 0.28 },
    ],
  ],
  sfx_barrier_reflect: [
    1.2,
    [
      { hz: 94, to: 48, length: 0.55, gain: 0.42, noise: 0.12 },
      { at: 0.36, hz: 246, to: 520, length: 0.76, gain: 0.2 },
    ],
  ],
  sfx_clash_point: [
    0.7,
    [
      { hz: 280, to: 760, length: 0.6, gain: 0.22 },
      { at: 0.6, hz: 1240, length: 0.09, gain: 0.42 },
    ],
  ],
  sfx_clash_advance: [
    1,
    [
      { hz: 330, to: 523, length: 0.7, gain: 0.24 },
      { at: 0.2, hz: 494, to: 784, length: 0.72, gain: 0.2 },
    ],
  ],
  sfx_breakout_winner: [
    6,
    [
      { hz: 196, length: 1.8, gain: 0.2, sustain: true },
      { at: 1.5, hz: 247, length: 1.9, gain: 0.22, sustain: true },
      { at: 3.2, hz: 330, length: 2.7, gain: 0.24, sustain: true },
      { at: 3.2, hz: 494, length: 2.7, gain: 0.12, sustain: true },
    ],
  ],
  amb_final_clash: [
    8,
    [
      { hz: 38, length: 8, gain: 0.1, sustain: true },
      { hz: 76, length: 8, gain: 0.04, noise: 0.05, sustain: true },
    ],
  ],
  music_clash_semifinal: [
    9.6,
    Array.from({ length: 16 }, (_, index) => ({
      at: index * 0.6,
      hz: index % 4 === 0 ? 110 : 82,
      to: 55,
      length: 0.34,
      gain: index % 4 === 0 ? 0.18 : 0.09,
    })),
  ],
  music_clash_final: [
    12,
    Array.from({ length: 16 }, (_, index) => ({
      at: index * 0.75,
      hz: index % 4 === 0 ? 98 : 65,
      to: 44,
      length: 0.5,
      gain: index % 4 === 0 ? 0.17 : 0.08,
    })),
  ],
};

for (const [name, [duration, voices]] of Object.entries(cues)) {
  await save(`${name}.wav`, createWave(duration, voices));
}

console.log(`Built ${19 + Object.keys(cues).length} deterministic Breakout assets in ${output}`);
