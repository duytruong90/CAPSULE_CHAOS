export type BreakoutCueBus = 'music' | 'ambience' | 'transient' | 'fanfare';

export type BreakoutCueId =
  | 'faultline.ambience'
  | 'faultline.music'
  | 'faultline.shell-ticks'
  | 'faultline.knock-1'
  | 'faultline.knock-2'
  | 'faultline.knock-3'
  | 'faultline.warning'
  | 'faultline.conveyor'
  | 'faultline.lock-1'
  | 'faultline.lock-2'
  | 'faultline.collapse'
  | 'faultline.safe'
  | 'race.ambience'
  | 'race.music'
  | 'race.charge'
  | 'race.ignition'
  | 'race.launch'
  | 'race.photo-finish'
  | 'race.exit-lock'
  | 'clash.ambience'
  | 'clash.semifinal-music'
  | 'clash.final-music'
  | 'clash.charge'
  | 'clash.flip'
  | 'clash.pulse-overload'
  | 'clash.hack-unlock'
  | 'clash.barrier-reflect'
  | 'clash.point'
  | 'clash.advance'
  | 'clash.winner';

export interface BreakoutCue {
  readonly cueId: BreakoutCueId;
  readonly offsetBaseMs: number;
  readonly bus: BreakoutCueBus;
}

export const BREAKOUT_BUS_GAINS = Object.freeze({
  music: 0.18,
  ambience: 0.12,
  transient: 0.45,
  fanfare: 0.55,
} as const satisfies Record<BreakoutCueBus, number>);

export function buildFaultlineCueSheet(offsets: {
  assignmentEnd: number;
  warningStart: number;
  shiftStart: number;
  braceStart: number;
  collapseStart: number;
  resolution: number;
  hasConveyor: boolean;
}): readonly BreakoutCue[] {
  const cues: BreakoutCue[] = [
    { cueId: 'faultline.ambience', offsetBaseMs: 0, bus: 'ambience' },
    { cueId: 'faultline.music', offsetBaseMs: 0, bus: 'music' },
    { cueId: 'faultline.shell-ticks', offsetBaseMs: 0, bus: 'transient' },
    { cueId: 'faultline.knock-1', offsetBaseMs: offsets.assignmentEnd, bus: 'transient' },
    { cueId: 'faultline.knock-2', offsetBaseMs: offsets.assignmentEnd + 1_000, bus: 'transient' },
    { cueId: 'faultline.knock-3', offsetBaseMs: offsets.assignmentEnd + 2_000, bus: 'transient' },
    { cueId: 'faultline.warning', offsetBaseMs: offsets.warningStart, bus: 'transient' },
    { cueId: 'faultline.lock-1', offsetBaseMs: offsets.braceStart, bus: 'transient' },
    { cueId: 'faultline.lock-2', offsetBaseMs: offsets.braceStart + 900, bus: 'transient' },
    { cueId: 'faultline.collapse', offsetBaseMs: offsets.collapseStart, bus: 'transient' },
    { cueId: 'faultline.safe', offsetBaseMs: offsets.resolution, bus: 'transient' },
  ];
  if (offsets.hasConveyor) {
    cues.push({ cueId: 'faultline.conveyor', offsetBaseMs: offsets.shiftStart, bus: 'transient' });
  }
  return Object.freeze(cues.sort((left, right) => left.offsetBaseMs - right.offsetBaseMs));
}

export function buildEscapeRunCueSheet(offsets: {
  movementReveal: number;
  movementStart: number;
  motionEnd: number;
  resolution: number;
  hasCutoffTie: boolean;
  hasQualifications: boolean;
}): readonly BreakoutCue[] {
  const cues: BreakoutCue[] = [
    { cueId: 'race.ambience', offsetBaseMs: 0, bus: 'ambience' },
    { cueId: 'race.music', offsetBaseMs: 0, bus: 'music' },
    { cueId: 'race.charge', offsetBaseMs: 0, bus: 'transient' },
    { cueId: 'race.ignition', offsetBaseMs: offsets.movementReveal, bus: 'transient' },
    { cueId: 'race.launch', offsetBaseMs: offsets.movementStart, bus: 'transient' },
  ];
  if (offsets.hasCutoffTie) {
    cues.push({ cueId: 'race.photo-finish', offsetBaseMs: offsets.motionEnd, bus: 'transient' });
  }
  if (offsets.hasQualifications) {
    cues.push({ cueId: 'race.exit-lock', offsetBaseMs: offsets.resolution, bus: 'transient' });
  }
  return Object.freeze(cues.sort((left, right) => left.offsetBaseMs - right.offsetBaseMs));
}

export function buildFinalClashCueSheet(options: {
  charge: number;
  flip: number;
  interaction: number;
  resolution: number;
  final: boolean;
  winner: boolean;
  exchanges: readonly { moves: readonly [string, string]; matchWinnerId: string | null }[];
}): readonly BreakoutCue[] {
  const cues: BreakoutCue[] = [
    { cueId: 'clash.ambience', offsetBaseMs: 0, bus: 'ambience' },
    {
      cueId: options.final ? 'clash.final-music' : 'clash.semifinal-music',
      offsetBaseMs: 0,
      bus: 'music',
    },
    { cueId: 'clash.charge', offsetBaseMs: options.charge, bus: 'transient' },
    { cueId: 'clash.flip', offsetBaseMs: options.flip, bus: 'transient' },
  ];
  options.exchanges.forEach((exchange) => {
    const [left, right] = exchange.moves;
    const winningMove =
      (left === 'pulse' && right === 'hack') ||
      (left === 'hack' && right === 'barrier') ||
      (left === 'barrier' && right === 'pulse')
        ? left
        : right;
    const cueId =
      winningMove === 'pulse'
        ? 'clash.pulse-overload'
        : winningMove === 'hack'
          ? 'clash.hack-unlock'
          : 'clash.barrier-reflect';
    cues.push({ cueId, offsetBaseMs: options.interaction, bus: 'transient' });
  });
  if (options.winner) {
    cues.push({ cueId: 'clash.winner', offsetBaseMs: options.resolution, bus: 'fanfare' });
  } else {
    const hasAdvancement = options.exchanges.some((exchange) => exchange.matchWinnerId !== null);
    const hasOrdinaryPoint = options.exchanges.some((exchange) => exchange.matchWinnerId === null);
    if (hasOrdinaryPoint) {
      cues.push({
        cueId: 'clash.point',
        offsetBaseMs: options.resolution - 600,
        bus: 'transient',
      });
    }
    if (hasAdvancement) {
      cues.push({
        cueId: 'clash.advance',
        offsetBaseMs: options.resolution,
        bus: 'transient',
      });
    }
  }
  return Object.freeze(cues.sort((left, right) => left.offsetBaseMs - right.offsetBaseMs));
}
