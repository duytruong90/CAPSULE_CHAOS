import type { TimelineEvent } from '../game/timeline/eventTypes';
import type { AssetId } from './manifest';

export const cardAssetMap: Readonly<Record<string, { icon: AssetId; effect?: AssetId }>> = {
  'card.shield': { icon: 'icon_shield', effect: 'fx_shield_hit' },
  'card.second-life': { icon: 'icon_second_life', effect: 'fx_second_life' },
  'card.double-trouble': { icon: 'icon_double_trouble', effect: 'fx_particles' },
  'card.revive': { icon: 'icon_revive', effect: 'fx_revival' },
  'card.reverse': { icon: 'icon_reverse', effect: 'fx_reverse' },
  'card.lucky-escape': { icon: 'icon_lucky_escape', effect: 'fx_particles' },
  'card.mirror': { icon: 'icon_mirror', effect: 'fx_mirror' },
  'card.chaos-bomb': { icon: 'icon_chaos_bomb', effect: 'fx_chaos_bomb' },
  'card.duel': { icon: 'icon_duel', effect: 'fx_duel' },
  'card.steal': { icon: 'icon_steal', effect: 'fx_steal' },
  'card.nullify': { icon: 'icon_nullify', effect: 'fx_glitch_scan' },
  'card.final-pass': { icon: 'icon_final_pass', effect: 'fx_final_pass' },
  'card.ghost-return': { icon: 'icon_ghost_return', effect: 'fx_revival' },
  'card.fate-swap': { icon: 'icon_fate_swap', effect: 'fx_reverse' },
  'card.system-override': { icon: 'icon_override', effect: 'fx_override' },
  'card.jackpot': { icon: 'icon_jackpot', effect: 'fx_jackpot' },
};

/** Presentation-only lookup. Never influences participants, durations, or results. */
export function effectsForEvent(event: TimelineEvent): readonly AssetId[] {
  switch (event.type) {
    case 'elimination':
      return ['fx_elimination_slash'];
    case 'protection':
      return [event.payload.protection === 'shield' ? 'fx_shield_hit' : 'fx_second_life'];
    case 'revival':
      return ['fx_revival'];
    case 'duel':
      return ['fx_duel'];
    case 'safe':
      return ['fx_particles'];
    case 'phase-lock':
      return ['fx_final_pass'];
    case 'phase-transition':
      return event.payload.status === 'started' ? ['fx_transition_wipe'] : [];
    case 'fake-winner':
      return [
        event.payload.variant === 'double-reveal'
          ? 'fx_glitch_split'
          : event.payload.variant === 'recalculation'
            ? 'fx_glitch_scan'
            : 'fx_glitch',
      ];
    case 'card-reveal': {
      const effect = cardAssetMap[event.presentationKey]?.effect;
      return [
        ...(effect ? [effect] : []),
        ...(event.payload.rarity === 'legendary'
          ? (['fx_legendary_burst', 'fx_lightning'] as const)
          : []),
      ];
    }
    case 'final-chamber':
      return ['fx_smoke'];
    case 'winner':
      return ['fx_winner_confetti', 'fx_victory_rays'];
    default:
      return [];
  }
}
