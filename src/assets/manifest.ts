export type AssetKind = 'image' | 'video' | 'audio';
export type AssetCategory =
  'background' | 'machine' | 'capsules' | 'cards' | 'effects' | 'icons' | 'audio' | 'breakout';
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
  | 'winner_frame'
  | 'fx_elimination_slash'
  | 'fx_shield_hit'
  | 'fx_revival'
  | 'fx_reverse'
  | 'fx_glitch'
  | 'fx_legendary_burst'
  | 'fx_winner_confetti'
  | 'fx_mirror'
  | 'fx_chaos_bomb'
  | 'fx_duel'
  | 'fx_steal'
  | 'fx_override'
  | 'fx_jackpot'
  | 'fx_final_pass'
  | 'fx_second_life'
  | 'fx_particles'
  | 'fx_transition_wipe'
  | 'fx_glitch_scan'
  | 'fx_glitch_split'
  | 'fx_smoke'
  | 'fx_lightning'
  | 'fx_ambient'
  | 'fx_victory_rays'
  | 'icon_shield'
  | 'icon_second_life'
  | 'icon_revive'
  | 'icon_duel'
  | 'icon_mirror'
  | 'icon_chaos_bomb'
  | 'icon_reverse'
  | 'icon_steal'
  | 'icon_override'
  | 'icon_jackpot'
  | 'icon_final_pass'
  | 'icon_nullify'
  | 'icon_ghost_return'
  | 'icon_fate_swap'
  | 'icon_double_trouble'
  | 'icon_lucky_escape'
  | 'icon_crown'
  | 'sfx_capsule_spin'
  | 'sfx_capsule_drop'
  | 'sfx_capsule_open'
  | 'sfx_card_flip'
  | 'sfx_elimination'
  | 'sfx_safe'
  | 'sfx_revival'
  | 'sfx_glitch'
  | 'sfx_winner'
  | 'sfx_shield'
  | 'sfx_duel'
  | 'sfx_heartbeat'
  | 'sfx_rare_charge'
  | 'sfx_rare_impact'
  | 'sfx_epic_charge'
  | 'sfx_epic_impact'
  | 'sfx_legendary_charge'
  | 'sfx_legendary_impact'
  | 'bg_faultline'
  | 'fx_floor_cracks'
  | 'fx_floor_dust'
  | 'icon_sector'
  | 'icon_conveyor'
  | 'sfx_faultline_knock'
  | 'sfx_faultline_warning'
  | 'sfx_conveyor_shift'
  | 'sfx_floor_collapse'
  | 'sfx_sector_safe'
  | 'amb_faultline'
  | 'music_faultline'
  | 'bg_escape_run'
  | 'img_exit_gate'
  | 'fx_capsule_exhaust'
  | 'icon_exit'
  | 'icon_burst'
  | 'icon_photo_finish'
  | 'sfx_race_charge'
  | 'sfx_race_launch'
  | 'sfx_exit_lock'
  | 'sfx_photo_finish'
  | 'amb_escape_run'
  | 'music_escape_run'
  | 'bg_final_clash'
  | 'img_clash_plate'
  | 'icon_pulse'
  | 'icon_hack'
  | 'icon_barrier'
  | 'icon_championship_point'
  | 'fx_clash_aperture'
  | 'fx_clash_victory'
  | 'sfx_clash_charge'
  | 'sfx_clash_flip'
  | 'sfx_pulse_overload'
  | 'sfx_hack_unlock'
  | 'sfx_barrier_reflect'
  | 'sfx_clash_point'
  | 'sfx_clash_advance'
  | 'sfx_breakout_winner'
  | 'amb_final_clash'
  | 'music_clash_semifinal'
  | 'music_clash_final';

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
    src: `${import.meta.env.BASE_URL}assets/${category}/${id}.${category === 'background' ? 'webp' : 'svg'}`,
    fallbackSrc: transparentPixel,
    critical,
  };
}
function effect(id: AssetId, critical = false): AssetDefinition {
  return image(id, 'effects', critical);
}
function audio(id: AssetId, critical = false): AssetDefinition {
  return {
    id,
    category: 'audio',
    kind: 'audio',
    src: `${import.meta.env.BASE_URL}assets/audio/${id}.wav`,
    critical,
  };
}
function breakoutAsset(
  id: AssetId,
  kind: 'image' | 'audio',
  extension: 'svg' | 'wav',
  critical = false,
): AssetDefinition {
  return {
    id,
    category: 'breakout',
    kind,
    src: `${import.meta.env.BASE_URL}assets/breakout/${id}.${extension}`,
    ...(kind === 'image' ? { fallbackSrc: transparentPixel } : {}),
    critical,
  };
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
  image('winner_frame', 'cards', true),
  effect('fx_elimination_slash', true),
  effect('fx_shield_hit'),
  effect('fx_revival'),
  effect('fx_reverse'),
  effect('fx_glitch', true),
  effect('fx_legendary_burst'),
  effect('fx_winner_confetti', true),
  ...(
    [
      'fx_mirror',
      'fx_chaos_bomb',
      'fx_duel',
      'fx_steal',
      'fx_override',
      'fx_jackpot',
      'fx_final_pass',
      'fx_second_life',
      'fx_particles',
      'fx_transition_wipe',
      'fx_glitch_scan',
      'fx_glitch_split',
      'fx_smoke',
      'fx_lightning',
      'fx_ambient',
      'fx_victory_rays',
    ] as const
  ).map((id) => effect(id)),
  image('icon_shield', 'icons'),
  image('icon_second_life', 'icons'),
  image('icon_revive', 'icons'),
  image('icon_duel', 'icons'),
  ...(
    [
      'icon_mirror',
      'icon_chaos_bomb',
      'icon_reverse',
      'icon_steal',
      'icon_override',
      'icon_jackpot',
      'icon_final_pass',
      'icon_nullify',
      'icon_ghost_return',
      'icon_fate_swap',
      'icon_double_trouble',
      'icon_lucky_escape',
      'icon_crown',
    ] as const
  ).map((id) => image(id, 'icons')),
  audio('sfx_capsule_spin', true),
  audio('sfx_capsule_drop', true),
  audio('sfx_capsule_open', true),
  audio('sfx_card_flip'),
  audio('sfx_elimination', true),
  audio('sfx_safe'),
  audio('sfx_revival'),
  audio('sfx_glitch', true),
  audio('sfx_winner', true),
  ...(
    [
      'sfx_shield',
      'sfx_duel',
      'sfx_heartbeat',
      'sfx_rare_charge',
      'sfx_rare_impact',
      'sfx_epic_charge',
      'sfx_epic_impact',
      'sfx_legendary_charge',
      'sfx_legendary_impact',
    ] as const
  ).map((id) => audio(id)),
  breakoutAsset('bg_faultline', 'image', 'svg', true),
  breakoutAsset('fx_floor_cracks', 'image', 'svg'),
  breakoutAsset('fx_floor_dust', 'image', 'svg'),
  breakoutAsset('icon_sector', 'image', 'svg'),
  breakoutAsset('icon_conveyor', 'image', 'svg'),
  breakoutAsset('sfx_faultline_knock', 'audio', 'wav'),
  breakoutAsset('sfx_faultline_warning', 'audio', 'wav'),
  breakoutAsset('sfx_conveyor_shift', 'audio', 'wav'),
  breakoutAsset('sfx_floor_collapse', 'audio', 'wav'),
  breakoutAsset('sfx_sector_safe', 'audio', 'wav'),
  breakoutAsset('amb_faultline', 'audio', 'wav'),
  breakoutAsset('music_faultline', 'audio', 'wav'),
  breakoutAsset('bg_escape_run', 'image', 'svg', true),
  breakoutAsset('img_exit_gate', 'image', 'svg'),
  breakoutAsset('fx_capsule_exhaust', 'image', 'svg'),
  breakoutAsset('icon_exit', 'image', 'svg'),
  breakoutAsset('icon_burst', 'image', 'svg'),
  breakoutAsset('icon_photo_finish', 'image', 'svg'),
  breakoutAsset('sfx_race_charge', 'audio', 'wav'),
  breakoutAsset('sfx_race_launch', 'audio', 'wav'),
  breakoutAsset('sfx_exit_lock', 'audio', 'wav'),
  breakoutAsset('sfx_photo_finish', 'audio', 'wav'),
  breakoutAsset('amb_escape_run', 'audio', 'wav'),
  breakoutAsset('music_escape_run', 'audio', 'wav'),
  breakoutAsset('bg_final_clash', 'image', 'svg', true),
  breakoutAsset('img_clash_plate', 'image', 'svg'),
  breakoutAsset('icon_pulse', 'image', 'svg'),
  breakoutAsset('icon_hack', 'image', 'svg'),
  breakoutAsset('icon_barrier', 'image', 'svg'),
  breakoutAsset('icon_championship_point', 'image', 'svg'),
  breakoutAsset('fx_clash_aperture', 'image', 'svg'),
  breakoutAsset('fx_clash_victory', 'image', 'svg'),
  breakoutAsset('sfx_clash_charge', 'audio', 'wav'),
  breakoutAsset('sfx_clash_flip', 'audio', 'wav'),
  breakoutAsset('sfx_pulse_overload', 'audio', 'wav'),
  breakoutAsset('sfx_hack_unlock', 'audio', 'wav'),
  breakoutAsset('sfx_barrier_reflect', 'audio', 'wav'),
  breakoutAsset('sfx_clash_point', 'audio', 'wav'),
  breakoutAsset('sfx_clash_advance', 'audio', 'wav'),
  breakoutAsset('sfx_breakout_winner', 'audio', 'wav'),
  breakoutAsset('amb_final_clash', 'audio', 'wav'),
  breakoutAsset('music_clash_semifinal', 'audio', 'wav'),
  breakoutAsset('music_clash_final', 'audio', 'wav'),
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
