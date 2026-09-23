import { useMemo } from 'react';
import { AssetImage } from '../../components/AssetMedia/AssetImage';
import { getClashExchangeTiming } from '../../game/breakout/buildBreakoutTimeline';
import { CLASH_BEATS, CLASH_RELATIONSHIPS } from '../../game/breakout/finalClash';
import type {
  BreakoutEngineEvent,
  BreakoutEntry,
  ClashExchange,
  ClashMove,
  MatchId,
} from '../../game/breakout/types';
import styles from './FinalClashStage.module.css';

type ClashStageEvent = Extract<
  BreakoutEngineEvent,
  {
    type:
      'clash.bracket-ready' | 'clash.exchange-resolved' | 'clash.final-ready' | 'winner.declared';
  }
>;

interface FinalClashStageProps {
  entries: readonly BreakoutEntry[];
  event: ClashStageEvent;
  elapsedBaseMs: number;
  reducedMotion?: boolean;
}

const MOVE_LABELS: Readonly<Record<ClashMove, string>> = Object.freeze({
  pulse: 'PULSE',
  hack: 'HACK',
  barrier: 'BARRIER',
});

function scorePips(score: number, target: 2 | 3) {
  return (
    <span className={styles.pips} aria-hidden="true">
      {Array.from({ length: target }, (_, index) => (
        <i data-filled={index < score} key={index} />
      ))}
    </span>
  );
}

function winningMove(exchange: ClashExchange) {
  return CLASH_BEATS[exchange.moves[0]] === exchange.moves[1]
    ? exchange.moves[0]
    : exchange.moves[1];
}

export function FinalClashStage({
  entries,
  event,
  elapsedBaseMs,
  reducedMotion = false,
}: FinalClashStageProps) {
  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const duplicateNames = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) =>
      counts.set(entry.normalizedName, (counts.get(entry.normalizedName) ?? 0) + 1),
    );
    return new Set([...counts].filter(([, count]) => count > 1).map(([name]) => name));
  }, [entries]);
  const name = (id: string) => {
    const entry = entryById.get(id);
    if (!entry) return id;
    return duplicateNames.has(entry.normalizedName)
      ? `${entry.displayName} · TICKET ${entry.entryIndex + 1}`
      : entry.displayName;
  };

  const beforeState = event.before.currentActState;
  const afterState = event.after.currentActState;
  if (beforeState.kind !== 'clash' || afterState.kind !== 'clash') {
    throw new Error('Final Clash stage requires clash snapshots.');
  }

  if (event.type === 'clash.bracket-ready') {
    return (
      <section className={styles.stage} data-view="bracket">
        <AssetImage className={styles.background} assetId="bg_final_clash" alt="" />
        <header className={styles.heading}>
          <p>ACT 3 · FINAL CLASH</p>
          <h1>
            {event.payload.route === 'four'
              ? 'SEMIFINALS'
              : event.payload.route === 'three'
                ? 'PLAY-IN'
                : 'CHAMPIONSHIP'}
          </h1>
        </header>
        <div className={styles.bracketCards} data-count={event.payload.matchups.length}>
          {event.payload.matchups.map((matchup) => (
            <article key={matchup.matchId}>
              <small>
                {matchup.matchId === 'final'
                  ? 'CHAMPIONSHIP'
                  : matchup.matchId === 'playin'
                    ? 'PLAY-IN'
                    : matchup.matchId.toUpperCase()}
              </small>
              <strong>{name(matchup.playerIds[0])}</strong>
              <span>VS</span>
              <strong>{name(matchup.playerIds[1])}</strong>
              <em>FIRST TO {matchup.pointsToWin}</em>
            </article>
          ))}
          {event.payload.byePlayerId && (
            <article className={styles.bye}>
              <small>SEEDED BYE — AWAITS FINAL</small>
              <strong>{name(event.payload.byePlayerId)}</strong>
              <span>SEAT 1</span>
            </article>
          )}
        </div>
        <RelationshipStrip detailed={elapsedBaseMs >= 2_500} />
        <footer className={styles.caption}>
          {elapsedBaseMs >= 5_000
            ? event.payload.route === 'two'
              ? 'FIRST TO THREE WINS THE TITLE.'
              : 'FIRST TO TWO ADVANCES.'
            : 'TWO DISTINCT MOVES ARE DEALT AUTOMATICALLY EACH EXCHANGE.'}
        </footer>
      </section>
    );
  }

  if (event.type === 'clash.final-ready') {
    return (
      <section className={styles.stage} data-view="final-ready">
        <AssetImage className={styles.background} assetId="bg_final_clash" alt="" />
        <AssetImage className={styles.aperture} assetId="fx_clash_aperture" alt="" />
        <header className={styles.heading}>
          <p>THE CHAMPIONSHIP</p>
          <h1>FINALISTS LOCKED</h1>
        </header>
        <div className={styles.finalists}>
          <strong>{name(event.payload.finalistIds[0])}</strong>
          <span>0 — 0</span>
          <strong>{name(event.payload.finalistIds[1])}</strong>
        </div>
        <RelationshipStrip detailed />
        <footer className={styles.caption}>
          {elapsedBaseMs >= 6_000
            ? 'FIRST TO THREE — EVERY POINT COUNTS.'
            : 'SEMIFINAL SCORES RESET TO ZERO.'}
        </footer>
      </section>
    );
  }

  if (event.type === 'winner.declared' && event.payload.decisiveExchange === null) {
    return (
      <section className={styles.stage} data-view="winner" data-resolved="true">
        <AssetImage className={styles.background} assetId="bg_final_clash" alt="" />
        <AssetImage className={styles.victory} assetId="fx_clash_victory" alt="" />
        <div className={styles.soleWinner}>
          <p>ONLY ENTRY — OFFICIAL WINNER</p>
          <h1>{name(event.payload.winnerId)}</h1>
          <strong>WINNER</strong>
        </div>
      </section>
    );
  }

  const exchanges =
    event.type === 'winner.declared'
      ? event.payload.decisiveExchange
        ? [event.payload.decisiveExchange]
        : []
      : event.type === 'clash.exchange-resolved'
        ? event.payload.exchanges
        : [];
  const timing = getClashExchangeTiming(event);
  const resolved = elapsedBaseMs >= timing.resolution;
  const revealed = elapsedBaseMs >= timing.flip;
  const interacting = elapsedBaseMs >= timing.interaction;
  const traveling = elapsedBaseMs >= timing.pointTravel && !resolved;
  const winnerResolved = event.type === 'winner.declared' && resolved;
  const matchIds = Object.keys(beforeState.playerIdsByMatch) as MatchId[];
  const final = exchanges[0]?.matchId === 'final';

  return (
    <section
      className={styles.stage}
      data-view={final ? 'final' : 'semifinals'}
      data-resolved={resolved}
      data-last-spark={final && exchanges[0]?.scoreBefore.every((score) => score === 2)}
      data-reduced-motion={reducedMotion}
    >
      <AssetImage className={styles.background} assetId="bg_final_clash" alt="" />
      <AssetImage className={styles.aperture} assetId="fx_clash_aperture" alt="" />
      {winnerResolved && (
        <AssetImage className={styles.victory} assetId="fx_clash_victory" alt="" />
      )}
      <header className={styles.roundHeading}>
        <p>{final ? 'CHAMPIONSHIP' : beforeState.route === 'three' ? 'PLAY-IN' : 'SEMIFINALS'}</p>
        <strong>
          {winnerResolved
            ? 'OFFICIAL WINNER'
            : final && exchanges[0]?.scoreBefore.every((score) => score === 2)
              ? 'LAST SPARK — NEXT POINT WINS'
              : revealed
                ? 'REVEAL'
                : 'MOVES LOCKED'}
        </strong>
      </header>
      <div className={styles.matches} data-count={matchIds.length}>
        {matchIds.map((matchId) => {
          const playerIds = beforeState.playerIdsByMatch[matchId];
          const target = beforeState.pointsToWinByMatch[matchId];
          if (!playerIds || !target) return null;
          const exchange = exchanges.find((item) => item.matchId === matchId);
          const score =
            exchange && resolved
              ? exchange.scoreAfter
              : (beforeState.scoreByMatch[matchId] ?? [0, 0]);
          const matchComplete = beforeState.completedMatchIds.includes(matchId) && !exchange;
          return (
            <MatchPanel
              key={matchId}
              matchId={matchId}
              playerIds={playerIds}
              names={[name(playerIds[0]), name(playerIds[1])]}
              target={target}
              score={score}
              exchange={exchange}
              revealed={revealed}
              interacting={interacting}
              traveling={traveling}
              resolved={resolved}
              complete={matchComplete}
              statusById={
                beforeState === afterState
                  ? event.after.statusById
                  : resolved
                    ? event.after.statusById
                    : event.before.statusById
              }
            />
          );
        })}
      </div>
      {beforeState.byePlayerId && !final && (
        <div className={styles.byeRibbon}>
          SEEDED BYE — {name(beforeState.byePlayerId)} AWAITS FINAL
        </div>
      )}
      <RelationshipStrip detailed />
      <footer className={styles.caption} aria-live="polite">
        {winnerResolved
          ? `${name(event.payload.winnerId)} WINS ${exchanges[0]!.scoreAfter[0]}–${exchanges[0]!.scoreAfter[1]}.`
          : interacting && exchanges[0]
            ? CLASH_RELATIONSHIPS[winningMove(exchanges[0])]
            : 'PULSE BEATS HACK · HACK BEATS BARRIER · BARRIER BEATS PULSE'}
      </footer>
    </section>
  );
}

function MatchPanel({
  matchId,
  playerIds,
  names,
  target,
  score,
  exchange,
  revealed,
  interacting,
  traveling,
  resolved,
  complete,
  statusById,
}: {
  matchId: MatchId;
  playerIds: readonly [string, string];
  names: readonly [string, string];
  target: 2 | 3;
  score: readonly [number, number];
  exchange: ClashExchange | undefined;
  revealed: boolean;
  interacting: boolean;
  traveling: boolean;
  resolved: boolean;
  complete: boolean;
  statusById: Readonly<Record<string, string>>;
}) {
  const pointWinnerSeat = exchange?.pointWinnerId === playerIds[0] ? 0 : 1;
  return (
    <article className={styles.match} data-final={matchId === 'final'} data-complete={complete}>
      {([0, 1] as const).map((seat) => {
        const move = exchange?.moves[seat];
        const atMatchPoint = score[seat] === target - 1 && !complete;
        return (
          <section
            className={styles.contestant}
            data-seat={seat === 0 ? 'left' : 'right'}
            key={playerIds[seat]}
          >
            <h2 title={names[seat]}>{names[seat]}</h2>
            <div className={styles.score} aria-label={`${score[seat]} of ${target} points`}>
              <strong>{score[seat]}</strong>
              {scorePips(score[seat], target)}
            </div>
            <div className={styles.movePlate} data-revealed={revealed && Boolean(exchange)}>
              {revealed && move ? (
                <>
                  <AssetImage assetId={`icon_${move}`} alt="" />
                  <span>{MOVE_LABELS[move]}</span>
                </>
              ) : (
                <AssetImage assetId="img_clash_plate" alt="Sealed move" />
              )}
            </div>
            {atMatchPoint && (
              <small className={styles.matchPoint}>
                <AssetImage assetId="icon_championship_point" alt="" />
                {target === 3 ? 'CHAMPIONSHIP POINT' : 'ADVANCEMENT POINT'}
              </small>
            )}
            {(complete || (resolved && exchange?.matchWinnerId === playerIds[seat])) && (
              <small className={styles.advanced}>
                {matchId === 'final'
                  ? 'WINNER'
                  : statusById[playerIds[seat]] === 'qualified'
                    ? 'ADVANCED'
                    : ''}
              </small>
            )}
          </section>
        );
      })}
      {interacting && exchange && (
        <div className={styles.interaction} data-move={winningMove(exchange)}>
          <AssetImage assetId={`icon_${winningMove(exchange)}`} alt="" />
          <span>{CLASH_RELATIONSHIPS[winningMove(exchange)]}</span>
        </div>
      )}
      {traveling && exchange && (
        <span className={styles.pointToken} data-seat={pointWinnerSeat} aria-hidden="true" />
      )}
    </article>
  );
}

function RelationshipStrip({ detailed = false }: { detailed?: boolean }) {
  return (
    <div className={styles.relationshipStrip}>
      <span>
        <AssetImage assetId="icon_pulse" alt="" />
        PULSE
      </span>
      <b>BEATS</b>
      <span>
        <AssetImage assetId="icon_hack" alt="" />
        HACK
      </span>
      <b>BEATS</b>
      <span>
        <AssetImage assetId="icon_barrier" alt="" />
        BARRIER
      </span>
      <b>BEATS PULSE</b>
      {detailed && <small>Two distinct moves. One point every exchange.</small>}
    </div>
  );
}
