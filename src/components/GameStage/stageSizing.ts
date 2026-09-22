export interface Size {
  width: number;
  height: number;
}

export interface FittedStage extends Size {
  scale: number;
  letterboxX: number;
  letterboxY: number;
}

export const LOGICAL_STAGE = Object.freeze({
  width: 1920,
  height: 1080,
});

export function calculateFittedStage(viewport: Size, logicalStage: Size): FittedStage {
  const values = [viewport.width, viewport.height, logicalStage.width, logicalStage.height];

  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError('Stage and viewport dimensions must be positive finite numbers.');
  }

  const scale = Math.min(
    viewport.width / logicalStage.width,
    viewport.height / logicalStage.height,
  );
  const width = logicalStage.width * scale;
  const height = logicalStage.height * scale;

  return {
    width,
    height,
    scale,
    letterboxX: viewport.width - width,
    letterboxY: viewport.height - height,
  };
}
