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
  | 'faultline.safe';

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
