import type { CardEffectContext, CardEffectDefinition, CardEffectResolution } from './cardTypes';

export class CardEffectRegistry {
  private readonly definitions = new Map<string, CardEffectDefinition>();

  register(definition: CardEffectDefinition) {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Card effect ${definition.id} is already registered.`);
    }
    this.definitions.set(definition.id, definition);
    return this;
  }

  get(cardId: string) {
    return this.definitions.get(cardId);
  }

  getEligible(context: CardEffectContext) {
    return Array.from(this.definitions.values()).filter((definition) =>
      definition.isEligible(context),
    );
  }

  resolve(cardId: string, context: CardEffectContext): CardEffectResolution {
    const visited = new Set<string>();
    let currentCardId = cardId;

    while (!visited.has(currentCardId)) {
      visited.add(currentCardId);
      const definition = this.definitions.get(currentCardId);
      if (!definition) {
        throw new Error(`Unknown card effect: ${currentCardId}.`);
      }
      if (definition.isEligible(context)) {
        return definition.resolve(context);
      }
      if (!definition.fallbackCardId) {
        throw new Error(`Card effect ${currentCardId} is not eligible and has no fallback.`);
      }
      currentCardId = definition.fallbackCardId;
    }

    throw new Error(`Card effect fallback cycle detected at ${currentCardId}.`);
  }
}
