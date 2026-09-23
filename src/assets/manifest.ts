export type AssetKind = 'image' | 'video' | 'audio';
export type AssetCategory =
  'background' | 'machine' | 'capsules' | 'cards' | 'effects' | 'icons' | 'audio';
export type AssetId =
  | 'bg_arena_main'
  | 'bg_arena_final'
  | 'gachapon_base'
  | 'gachapon_glass'
  | 'gachapon_chute'
  | 'capsule_red'
  | 'capsule_blue'
  | 'capsule_green'
  | 'capsule_gold'
  | 'card_back'
  | 'card_common_frame'
  | 'card_rare_frame'
  | 'card_epic_frame'
  | 'card_legendary_frame'
  | 'fx_elimination_slash'
  | 'fx_shield_hit'
  | 'fx_revival'
  | 'fx_reverse'
  | 'fx_glitch'
  | 'fx_legendary_burst'
  | 'fx_winner_confetti'
  | 'icon_shield'
  | 'icon_second_life'
  | 'icon_revive'
  | 'icon_duel'
  | 'sfx_capsule_spin'
  | 'sfx_capsule_drop'
  | 'sfx_capsule_open'
  | 'sfx_card_flip'
  | 'sfx_elimination'
  | 'sfx_safe'
  | 'sfx_revival'
  | 'sfx_glitch'
  | 'sfx_winner';

export interface AssetDefinition {
  id: AssetId;
  category: AssetCategory;
  kind: AssetKind;
  src: string;
  fallbackSrc?: string;
  critical?: boolean;
}

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
function image(id: AssetId, category: AssetCategory, critical = false): AssetDefinition {
  return {
    id,
    category,
    kind: 'image',
    src: `/assets/${category}/${id}.${category === 'icons' ? 'svg' : 'webp'}`,
    fallbackSrc: transparentPixel,
    critical,
  };
}
function video(id: AssetId, critical = false): AssetDefinition {
  return { id, category: 'effects', kind: 'video', src: `/assets/effects/${id}.webm`, critical };
}
function audio(id: AssetId, critical = false): AssetDefinition {
  return { id, category: 'audio', kind: 'audio', src: `/assets/audio/${id}.ogg`, critical };
}

const definitions: AssetDefinition[] = [
  image('bg_arena_main', 'background', true),
  image('bg_arena_final', 'background', true),
  image('gachapon_base', 'machine', true),
  image('gachapon_glass', 'machine', true),
  image('gachapon_chute', 'machine', true),
  image('capsule_red', 'capsules', true),
  image('capsule_blue', 'capsules'),
  image('capsule_green', 'capsules'),
  image('capsule_gold', 'capsules', true),
  image('card_back', 'cards', true),
  image('card_common_frame', 'cards', true),
  image('card_rare_frame', 'cards', true),
  image('card_epic_frame', 'cards', true),
  image('card_legendary_frame', 'cards', true),
  video('fx_elimination_slash', true),
  video('fx_shield_hit'),
  video('fx_revival'),
  video('fx_reverse'),
  video('fx_glitch', true),
  video('fx_legendary_burst'),
  video('fx_winner_confetti', true),
  image('icon_shield', 'icons'),
  image('icon_second_life', 'icons'),
  image('icon_revive', 'icons'),
  image('icon_duel', 'icons'),
  audio('sfx_capsule_spin', true),
  audio('sfx_capsule_drop', true),
  audio('sfx_capsule_open', true),
  audio('sfx_card_flip'),
  audio('sfx_elimination', true),
  audio('sfx_safe'),
  audio('sfx_revival'),
  audio('sfx_glitch', true),
  audio('sfx_winner', true),
];

export const assetManifest: Readonly<Record<AssetId, Readonly<AssetDefinition>>> = Object.freeze(
  Object.fromEntries(
    definitions.map((definition) => [definition.id, Object.freeze(definition)]),
  ) as Record<AssetId, AssetDefinition>,
);
export function getAsset(id: AssetId) {
  return assetManifest[id];
}
export function getCriticalAssets() {
  return Object.values(assetManifest).filter((asset) => asset.critical);
}
