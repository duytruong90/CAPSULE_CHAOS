# Cards

Phase 1 definitions and handlers live in `phaseOneCards.ts`. The typed effect registry
resolves eligibility/fallback and seeded target selection. Handlers return ordered
engine actions; `simulateGame` applies them with the existing player reducer and
emits immutable audit events. React never applies card effects.

The other ten V1 effects remain reserved for Build Step 9. Epic and Legendary visual
frames already exist independently, but those rarities cannot occur in Phase 1.
