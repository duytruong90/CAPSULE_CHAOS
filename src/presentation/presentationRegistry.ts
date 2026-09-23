import type { CardRarity } from '../game/cards/cardTypes';

export const RARITY_PRESENTATIONS: Readonly<Record<CardRarity, { label: string; symbol: string }>> =
  {
    common: { label: 'Common', symbol: '◇' },
    rare: { label: 'Rare', symbol: '✦' },
    epic: { label: 'Epic', symbol: '✧' },
    legendary: { label: 'Legendary', symbol: '♛' },
  };
const CARD_PRESENTATIONS: Readonly<Record<string, { symbol: string }>> = {
  'card.shield': { symbol: '⬡' },
  'card.second-life': { symbol: '♥' },
  'card.double-trouble': { symbol: '×2' },
  'card.revive': { symbol: '✚' },
  'card.reverse': { symbol: '↶' },
  'card.lucky-escape': { symbol: '✦' },
  'card.mirror': { symbol: '◫' },
  'card.chaos-bomb': { symbol: '✹' },
  'card.duel': { symbol: '⚔' },
  'card.steal': { symbol: '⌁' },
  'card.nullify': { symbol: '⊘' },
  'card.final-pass': { symbol: '◆' },
  'card.ghost-return': { symbol: '♙' },
  'card.fate-swap': { symbol: '⇄' },
  'card.system-override': { symbol: '⌘' },
  'card.jackpot': { symbol: '★' },
};
export function cardPresentation(key: string, rarity: CardRarity) {
  return { ...RARITY_PRESENTATIONS[rarity], ...(CARD_PRESENTATIONS[key] ?? {}) };
}
