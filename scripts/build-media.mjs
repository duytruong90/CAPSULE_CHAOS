/** Reproducible original vector artwork and PCM sound design. No gameplay inputs. */
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../public/assets/', import.meta.url));
const colors = { red: '#ff527e', blue: '#729cff', green: '#65efc4', gold: '#ffd887' };
const metal = `<linearGradient id="metal" x2="1" y2="1"><stop stop-color="#f6ddff"/><stop offset=".16" stop-color="#573975"/><stop offset=".45" stop-color="#171224"/><stop offset=".8" stop-color="#372245"/><stop offset="1" stop-color="#a486be"/></linearGradient>`;
const iconPaths = {
  shield:
    '<path d="M64 14 104 30V59Q102 93 64 114 26 93 24 59V30Z"/><path d="m44 62 14 15 28-32"/>',
  second_life:
    '<path d="M64 105 25 66C0 36 37 6 64 36 91 6 128 36 103 66Z"/><path d="M42 61h15V47h14v14h15v14H71v14H57V75H42Z"/>',
  revive: '<path d="M99 39A43 43 0 1 0 106 80M99 15v24H75"/><path d="M64 40v48M40 64h48"/>',
  duel: '<path d="M24 13 99 88 88 99 13 24ZM104 13 29 88 40 99 115 24ZM69 94l25-25M19 109l22-22M109 109 87 87M34 69l25 25"/>',
  mirror: '<path d="M34 14h60l13 50-13 50H34L21 64Z"/><path d="m46 87 36-47M41 61l25-31"/>',
  chaos_bomb:
    '<circle cx="57" cy="76" r="34"/><path d="m70 44 9-17 16 8M83 26q12-20 21-8M106 4v9M120 20h-10M115 35l-7-7"/>',
  reverse:
    '<path d="M104 51A43 43 0 0 0 26 35L15 51m0-30v30h30M24 77a43 43 0 0 0 78 16l11-16m0 30V77H83"/>',
  steal:
    '<path d="M16 64 40 40l20 5 24 25-16 23-30-2ZM70 38l21-8 24 24-18 33M44 63l26 17M72 14l-8 15M44 16l5 14"/>',
  override:
    '<rect x="33" y="33" width="62" height="62" rx="12"/><path d="M48 33V16M64 33V16M80 33V16M48 95v17M64 95v17M80 95v17M33 48H16M33 64H16M33 80H16M95 48h17M95 64h17M95 80h17m-58-6 13-26-1 23h14L59 88l2-23Z"/>',
  jackpot: '<path d="m64 12 15 32 35 5-25 25 6 35-31-17-31 17 6-35-25-25 35-5Z"/>',
  final_pass: '<path d="m64 10 46 54-46 54L18 64Z"/><path d="m41 64 16 16 31-34"/>',
  nullify: '<circle cx="64" cy="64" r="46"/><path d="m31 97 66-66"/>',
  ghost_return:
    '<path d="M29 108V52a35 35 0 0 1 70 0v56L81 95l-17 13-17-13Z"/><path d="M49 52v13M79 52v13"/>',
  fate_swap: '<path d="M16 37h91m-20-20 20 20-20 20M112 91H21m20-20L21 91l20 20"/>',
  double_trouble:
    '<path d="M22 28h34v72H22ZM73 28h34v72H73Z"/><path d="M33 47h12M84 47h12M33 63h12M84 63h12"/>',
  lucky_escape:
    '<path d="M49 73C4 70 22 26 49 40 37 9 87 9 79 40c32-14 45 30 1 33 9 25-12 40-29 26M64 76l-5 39"/>',
  crown: '<path d="m16 36 23 22 25-40 25 40 23-22-12 65H28ZM29 88h70"/>',
};

function svg(width, height, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${body}</svg>\n`;
}
async function save(category, id, content, extension = 'svg') {
  if (category === 'cards' && extension === 'svg')
    content = content.replace('viewBox=', 'preserveAspectRatio="none" viewBox=');
  await mkdir(path.join(root, category), { recursive: true });
  await writeFile(path.join(root, category, `${id}.${extension}`), content);
}
const icon = (name, color = colors.gold) =>
  `<g fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</g>`;

// Precisely registered layers share the existing machine's 470 × 650 coordinates.
await save(
  'machine',
  'gachapon_base',
  svg(
    470,
    650,
    `
  <ellipse cx="235" cy="620" rx="202" ry="22" fill="#03020a" opacity=".7"/>
  <path d="M40 427H430L417 583Q412 624 369 630H101Q58 624 53 583Z" fill="url(#metal)" stroke="#d7afff" stroke-width="3"/>
  <path d="M57 456h356l-8 102H65Z" fill="#17101e" stroke="#806198"/>
  <path d="M78 26Q80 3 113 3h244q34 0 37 23l21 48H57Z" fill="url(#metal)" stroke="#e4c7ff" stroke-width="3"/>
  <path d="M94 15h281l12 24H82Z" fill="#ce9eff" opacity=".17"/>
  <path d="M17 112Q30 61 72 56M453 112Q440 61 398 56M26 351l18 87M444 351l-18 87" fill="none" stroke="#c9a9ff" stroke-width="7"/>
  <circle cx="122" cy="500" r="44" fill="url(#metal)" stroke="#e7d3ff" stroke-width="4"/>
  <circle cx="122" cy="500" r="31" fill="#151124" stroke="#937ac2"/>
  <path d="m111 477 25 33-10 14-24-35Z" fill="#dac4fc"/>
  <path d="M83 592h304" stroke="#c8a7ff" stroke-width="3"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${170 + i * 15} 568v10" stroke="#60536d" stroke-width="4"/>`).join('')}
  <circle cx="391" cy="593" r="4" fill="#7bf6cc"/>`,
    metal,
  ),
);
await save(
  'machine',
  'gachapon_glass',
  svg(
    470,
    650,
    `
  <path d="M234 57C50 57 9 140 11 257c0 108 43 171 116 185h215c78-24 118-83 118-187C460 139 419 57 234 57Z" fill="url(#glass)" stroke="#e8d6ff" stroke-opacity=".65" stroke-width="4"/>
  <path d="M67 145Q89 92 160 87L133 110Q88 158 83 255L57 289Q40 197 67 145Z" fill="#fff" opacity=".12"/>
  <path d="M401 138q34 65 16 141" fill="none" stroke="#b7e9ff" stroke-width="6" opacity=".25"/>
  <path d="M61 388Q235 460 408 386" fill="none" stroke="#b8a3ef" stroke-width="2" opacity=".4"/>`,
    '<radialGradient id="glass"><stop stop-color="#9eb5ff" stop-opacity="0"/><stop offset=".78" stop-color="#a58dd7" stop-opacity=".04"/><stop offset="1" stop-color="#c3eaff" stop-opacity=".23"/></radialGradient>',
  ),
);
await save(
  'machine',
  'gachapon_chute',
  svg(
    470,
    650,
    '<rect x="235" y="458" width="151" height="101" rx="22" fill="url(#metal)" stroke="#c3a4e6" stroke-width="3"/><rect x="246" y="468" width="129" height="79" rx="15" fill="#06040b"/><path d="M250 527h121l-7 25H257Z" fill="#36243e" stroke="#725a86"/><path d="M253 532h113" stroke="#dfb8ff" stroke-width="2" opacity=".6"/>',
    metal,
  ),
);

for (const [name, color] of Object.entries(colors)) {
  const defs = `<radialGradient id="shell" cx=".3" cy=".22" r=".9"><stop stop-color="#fff"/><stop offset=".22" stop-color="${color}"/><stop offset=".68" stop-color="${color}"/><stop offset="1" stop-color="#24122f"/></radialGradient><linearGradient id="bottom" x2=".6" y2="1"><stop stop-color="#fff"/><stop offset=".6" stop-color="#c4c9e3"/><stop offset="1" stop-color="#505979"/></linearGradient>`;
  await save(
    'capsules',
    `capsule_${name}`,
    svg(
      180,
      180,
      '<circle cx="90" cy="90" r="84" fill="url(#shell)" stroke="#f9efff" stroke-width="3"/><path d="M6 91a84 84 0 0 0 168 0Z" fill="url(#bottom)"/><path d="M7 90Q90 100 173 90" fill="none" stroke="#b5a3cd" stroke-width="5"/><path d="M7 87Q90 97 173 87" fill="none" stroke="#f9f4ff" stroke-width="3"/><ellipse cx="57" cy="45" rx="22" ry="12" transform="rotate(-35 57 45)" fill="#fff" opacity=".6"/><path d="m126 89 12-1v9l-12 1Z" fill="#e9def9" stroke="#9280a5" stroke-width="1"/>',
      defs,
    ),
  );
}
for (const [rarity, color] of Object.entries({
  common: '#d4dbf5',
  rare: '#8ab5ff',
  epic: '#dd99ff',
  legendary: '#ffdc89',
})) {
  await save(
    'cards',
    `card_${rarity}_frame`,
    svg(
      760,
      640,
      `<rect x="3" y="3" width="754" height="634" rx="28" fill="none" stroke="${color}" stroke-width="5"/><rect x="13" y="13" width="734" height="614" rx="21" fill="none" stroke="${color}" opacity=".3"/><g stroke="${color}" stroke-width="3" fill="#18101f"><path d="M25 72V26h48M687 26h48v46M25 568v46h48M687 614h48v-46"/><path d="m380 8 20 13-20 13-20-13ZM380 606l20 13-20 13-20-13Z"/></g><g fill="${color}" opacity=".35">${Array.from({ length: 12 }, (_, i) => `<path d="m${92 + i * 48} 20 4-4 4 4-4 4Z"/>`).join('')}</g>`,
    ),
  );
}
await save(
  'cards',
  'card_back',
  svg(
    760,
    640,
    '<rect x="3" y="3" width="754" height="634" rx="28" fill="#161023" stroke="#c7a1ef" stroke-width="5"/><path d="m380 45 270 275-270 275L110 320Z" fill="#241437" stroke="#8762a8" stroke-width="3"/><path d="m380 95 220 225-220 225L160 320Z" fill="none" stroke="#cba7f2" opacity=".4"/><circle cx="380" cy="320" r="115" fill="#100c19" stroke="#e1c3ff" stroke-width="4"/><path d="M265 320h230" stroke="#e1c3ff" stroke-width="6"/><circle cx="380" cy="320" r="22" fill="#181023" stroke="#e1c3ff" stroke-width="5"/>',
  ),
);
await save(
  'cards',
  'winner_frame',
  svg(
    1120,
    610,
    '<rect x="4" y="4" width="1112" height="602" rx="40" fill="none" stroke="#ffe3a1" stroke-width="6"/><rect x="16" y="16" width="1088" height="578" rx="30" fill="none" stroke="#ffcf75" opacity=".5"/><path d="M42 115V42h88M990 42h88v73M42 495v73h88M990 568h88v-73" stroke="#fff0b7" stroke-width="5" fill="none"/>',
  ),
);
for (const name of Object.keys(iconPaths))
  await save(
    'icons',
    `icon_${name}`,
    svg(128, 128, icon(name, name === 'shield' || name === 'revive' ? colors.green : colors.gold)),
  );

// Effects are static transparent SVG plates animated by the presentation clock via CSS.
// No embedded SMIL timers, so skip/reduced-motion always affect the whole layer.
const effectIcons = {
  shield_hit: 'shield',
  revival: 'revive',
  reverse: 'reverse',
  mirror: 'mirror',
  chaos_bomb: 'chaos_bomb',
  duel: 'duel',
  steal: 'steal',
  override: 'override',
  jackpot: 'jackpot',
  final_pass: 'final_pass',
  second_life: 'second_life',
};
for (const [effect, name] of Object.entries(effectIcons)) {
  const color = ['shield_hit', 'revival', 'second_life'].includes(effect)
    ? colors.green
    : colors.gold;
  await save(
    'effects',
    `fx_${effect}`,
    svg(
      960,
      540,
      `<g opacity=".65" fill="none" stroke="${color}"><ellipse cx="480" cy="270" rx="290" ry="190" stroke-width="2"/><ellipse cx="480" cy="270" rx="310" ry="206" stroke-dasharray="6 25" stroke-width="4"/></g><g transform="translate(370 160) scale(1.72)" opacity=".8">${icon(name, color)}</g>${Array.from(
        { length: 20 },
        (_, i) => {
          const a = (i * Math.PI) / 10;
          return `<path d="M${480 + Math.cos(a) * 335} ${270 + Math.sin(a) * 225}l${Math.cos(a) * 24} ${Math.sin(a) * 14}" stroke="${color}" stroke-width="3" opacity=".6"/>`;
        },
      ).join('')}`,
    ),
  );
}
await save(
  'effects',
  'fx_elimination_slash',
  svg(
    960,
    540,
    '<path d="M50 393 872 148 935 120 91 351Z" fill="#ff5c85" opacity=".65"/><path d="M49 372 920 131 128 356Z" fill="#fff0f5"/><path d="m321 248 56-40M612 268l59 12M696 140l37-35" stroke="#ff839b" stroke-width="4"/>',
  ),
);
for (const [name, color] of [
  ['legendary_burst', colors.gold],
  ['victory_rays', colors.gold],
  ['ambient', '#9470ef'],
]) {
  await save(
    'effects',
    `fx_${name}`,
    svg(
      960,
      540,
      `<g fill="${color}" opacity=".1">${Array.from({ length: 20 }, (_, i) => `<path d="m480 270 620-26v52Z" transform="rotate(${i * 18} 480 270)"/>`).join('')}</g><ellipse cx="480" cy="270" rx="215" ry="170" fill="url(#halo)"/>`,
      `<radialGradient id="halo"><stop stop-color="${color}" stop-opacity=".2"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
    ),
  );
}
for (const name of ['glitch', 'glitch_scan', 'glitch_split'])
  await save(
    'effects',
    `fx_${name}`,
    svg(
      960,
      540,
      `<g fill="${name === 'glitch_split' ? '#e991ff' : '#73d8ff'}" opacity=".15">${Array.from({ length: 13 }, (_, i) => `<rect x="${(i * 179) % 700}" y="${(i * 73) % 500}" width="${70 + ((i * 41) % 280)}" height="${3 + ((i * 7) % 22)}"/>`).join('')}</g><path d="M0 120h960M0 390h960" stroke="#ff75bd" opacity=".45" stroke-width="3"/>`,
    ),
  );
for (const name of ['winner_confetti', 'particles'])
  await save(
    'effects',
    `fx_${name}`,
    svg(
      960,
      540,
      Array.from(
        { length: name === 'particles' ? 30 : 65 },
        (_, i) =>
          `<rect x="${(i * 163 + 23) % 945}" y="${(i * 97 + 13) % 530}" width="${3 + (i % 5)}" height="${7 + (i % 9)}" rx="1" fill="${Object.values(colors)[i % 4]}" transform="rotate(${i * 29} ${(i * 163 + 23) % 945} ${(i * 97 + 13) % 530})" opacity=".75"/>`,
      ).join(''),
    ),
  );
await save(
  'effects',
  'fx_transition_wipe',
  svg(
    960,
    540,
    '<path d="M-240 0H320L660 540H100Z" fill="#100a1d"/><path d="M320 0h9l340 540h-9Z" fill="#d1a4ff"/><path d="M350 0h25l340 540h-25Z" fill="#8157b4" opacity=".4"/>',
  ),
);
await save(
  'effects',
  'fx_smoke',
  svg(
    960,
    540,
    '<ellipse cx="250" cy="490" rx="420" ry="90" fill="url(#mist)"/><ellipse cx="760" cy="470" rx="330" ry="115" fill="url(#mist)"/>',
    '<radialGradient id="mist"><stop stop-color="#c4a5e1" stop-opacity=".22"/><stop offset="1" stop-color="#c4a5e1" stop-opacity="0"/></radialGradient>',
  ),
);
await save(
  'effects',
  'fx_lightning',
  svg(
    960,
    540,
    '<g fill="none" stroke-linejoin="round"><path d="m125 0 35 100-38 5 77 138-4-82 40-8-70-153M820 0l-50 140 42-8-75 148 6-95-45 11L783 0" stroke="#a68af1" stroke-width="13" opacity=".3"/><path d="m125 0 35 100-38 5 77 138-4-82 40-8-70-153M820 0l-50 140 42-8-75 148 6-95-45 11L783 0" stroke="#e4daff" stroke-width="3"/></g>',
  ),
);

// Small mono 24 kHz PCM files: universally decodable, original tones, no samples/licensing.
const rate = 24000;
function sound(duration, voices) {
  const samples = Math.ceil(rate * duration);
  const pcm = new Float64Array(samples);
  let noiseState = 0x51a7;
  for (const voice of voices) {
    const { at = 0, length = 0.3, hz = 440, to = hz, gain = 0.2, noise = 0 } = voice;
    for (let i = 0; i < Math.floor(length * rate); i++) {
      const index = Math.floor(at * rate) + i;
      if (index >= samples) break;
      const t = i / rate,
        u = t / length;
      const envelope = Math.min(1, t / 0.009) * Math.pow(1 - u, 2);
      noiseState = (Math.imul(noiseState, 1664525) + 1013904223) >>> 0;
      const hiss = ((noiseState / 0xffffffff) * 2 - 1) * noise;
      const phase = 2 * Math.PI * (hz * t + ((to - hz) * t * t) / (2 * length));
      pcm[index] +=
        gain * envelope * (Math.sin(phase) * (1 - noise) + hiss + Math.sin(phase * 2) * 0.12);
    }
  }
  const peak = pcm.reduce((max, value) => Math.max(max, Math.abs(value)), 0.001);
  const scale = 0.65 / Math.max(1, peak);
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    buffer.writeInt16LE(Math.round(pcm[i] * scale * 32767), 44 + i * 2);
  return buffer;
}
const notes = (frequencies, gap = 0.13, gain = 0.3) =>
  frequencies.map((hz, i) => ({ hz, at: i * gap, length: 0.65, gain }));
const cues = {
  capsule_spin: [
    1.5,
    Array.from({ length: 18 }, (_, i) => ({
      at: i * 0.075,
      length: 0.12,
      hz: 150 + i * 7,
      to: 80,
      noise: 0.3,
      gain: 0.22,
    })),
  ],
  capsule_drop: [
    0.5,
    [
      { hz: 340, to: 80, length: 0.15, gain: 0.6 },
      { at: 0.16, hz: 170, length: 0.2, gain: 0.25 },
    ],
  ],
  capsule_open: [
    0.8,
    [{ hz: 300, to: 1300, length: 0.18, noise: 0.3 }, ...notes([660, 990], 0.08, 0.2)],
  ],
  card_flip: [0.3, [{ hz: 480, to: 130, length: 0.18, noise: 0.8, gain: 0.45 }]],
  elimination: [
    0.9,
    [
      { hz: 160, to: 38, length: 0.7, gain: 0.7 },
      { hz: 1000, to: 90, length: 0.14, noise: 0.65, gain: 0.4 },
    ],
  ],
  safe: [0.8, notes([523, 784], 0.15)],
  revival: [1.5, notes([330, 440, 554, 660, 880], 0.14)],
  shield: [0.9, [{ hz: 170, to: 65, length: 0.25, gain: 0.65 }, ...notes([1047, 1568], 0.06, 0.2)]],
  duel: [
    1.1,
    [
      { hz: 1700, to: 220, length: 0.23, noise: 0.35, gain: 0.5 },
      { at: 0.25, hz: 1300, to: 110, length: 0.4, noise: 0.4, gain: 0.5 },
    ],
  ],
  heartbeat: [
    2.6,
    [0, 0.18, 0.85, 1.03, 1.7, 1.88].map((at) => ({
      at,
      hz: 65,
      to: 38,
      length: 0.22,
      gain: 0.55,
    })),
  ],
  glitch: [
    0.7,
    Array.from({ length: 9 }, (_, i) => ({
      at: i * 0.06,
      hz: 180 + ((i * 193) % 1500),
      to: 80,
      length: 0.05,
      noise: 0.4,
      gain: 0.3,
    })),
  ],
  winner: [
    3.4,
    [
      ...notes([523, 659, 784, 1047], 0.21, 0.35),
      ...[523, 659, 784, 1047].map((hz) => ({ at: 1.1, hz, length: 2.1, gain: 0.2 })),
    ],
  ],
  rare_charge: [0.9, notes([440, 660], 0.16, 0.2)],
  rare_impact: [0.8, notes([660, 990], 0.05, 0.35)],
  epic_charge: [
    1.4,
    [{ hz: 80, to: 440, length: 1.2, gain: 0.4 }, ...notes([440, 554, 660], 0.16, 0.15)],
  ],
  epic_impact: [
    1.1,
    [{ hz: 100, to: 38, length: 0.7, gain: 0.65 }, ...notes([660, 880], 0.08, 0.25)],
  ],
  legendary_charge: [
    2.3,
    [{ hz: 45, to: 220, length: 2.1, gain: 0.4 }, ...notes([330, 440, 554, 660], 0.22, 0.2)],
  ],
  legendary_impact: [
    1.8,
    [{ hz: 110, to: 35, length: 1, gain: 0.6 }, ...notes([523, 659, 784, 1047], 0.05, 0.25)],
  ],
};
for (const [name, [duration, voices]] of Object.entries(cues))
  await save('audio', `sfx_${name}`, sound(duration, voices), 'wav');
console.log(
  `Built registered vector layers, ${Object.keys(iconPaths).length} icons, Priority 1–3 effects, and ${Object.keys(cues).length} original sound cues in ${root}`,
);

// Standalone review artifact; Vite serves this in development, not in the app bundle.
const sections = [];
for (const category of [
  'background',
  'machine',
  'capsules',
  'cards',
  'effects',
  'icons',
  'audio',
]) {
  const files = (await readdir(path.join(root, category))).sort();
  sections.push(
    `<section><h2>${category}</h2><div class="grid">${files.map((file) => `<article><div class="media">${category === 'audio' ? `<audio controls preload="none" src="/assets/${category}/${file}"></audio>` : `<img loading="lazy" src="/assets/${category}/${file}" alt="${file}"/>`}</div><p>${file}</p></article>`).join('')}</div></section>`,
  );
}
const docs = fileURLToPath(new URL('../docs/', import.meta.url));
await mkdir(docs, { recursive: true });
await writeFile(
  path.join(docs, 'media-preview.html'),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Capsule Chaos — Media Library</title><style>body{margin:0;padding:40px;background:#080611;color:#eee7ff;font:16px system-ui}h1{font-size:40px;margin:0}header p{color:#bdabc9;max-width:760px;line-height:1.6}h2{text-transform:uppercase;letter-spacing:.2em;font-size:17px;color:#d6b5ff;margin:40px 0 18px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}article{min-width:0;background:#171021;border:1px solid #463252;border-radius:16px;overflow:hidden}.media{height:210px;display:grid;place-items:center;background:repeating-conic-gradient(#14121d 0% 25%,#1b1726 0% 50%) 50%/20px 20px}.media img{width:100%;height:100%;object-fit:contain}audio{max-width:95%}article p{padding:0 14px;font:12px monospace;color:#cec0df;overflow-wrap:anywhere}a{color:#adedd9}</style><header><h1>CAPSULE CHAOS / MEDIA LIBRARY</h1><p>Installed Priority 1–3 artwork and original sound cues. Transparent effect plates animate through the game's presentation clock. Audio previews play only when you press their controls.</p><a href="/setup">Open the game</a></header>${sections.join('')}</html>\n`,
);
