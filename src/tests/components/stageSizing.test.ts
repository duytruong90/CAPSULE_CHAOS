import { calculateFittedStage, LOGICAL_STAGE } from '../../components/GameStage/stageSizing';

describe('calculateFittedStage', () => {
  it.each([
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 },
    { width: 1280, height: 720 },
  ])('fills a $width × $height 16:9 viewport without distortion', (viewport) => {
    const result = calculateFittedStage(viewport, LOGICAL_STAGE);

    expect(result.width).toBe(viewport.width);
    expect(result.height).toBe(viewport.height);
    expect(result.width / result.height).toBeCloseTo(16 / 9);
    expect(result.letterboxX).toBe(0);
    expect(result.letterboxY).toBe(0);
  });

  it('centers a 16:9 stage with horizontal letterboxing on ultrawide displays', () => {
    const result = calculateFittedStage({ width: 3440, height: 1440 }, LOGICAL_STAGE);

    expect(result.width).toBe(2560);
    expect(result.height).toBe(1440);
    expect(result.scale).toBeCloseTo(4 / 3);
    expect(result.letterboxX).toBe(880);
    expect(result.letterboxY).toBe(0);
  });

  it('letterboxes vertically when the viewport is taller than 16:9', () => {
    const result = calculateFittedStage({ width: 1200, height: 1000 }, LOGICAL_STAGE);

    expect(result.width).toBe(1200);
    expect(result.height).toBe(675);
    expect(result.letterboxX).toBe(0);
    expect(result.letterboxY).toBe(325);
  });

  it('rejects invalid dimensions instead of producing broken CSS values', () => {
    expect(() => calculateFittedStage({ width: 0, height: 1080 }, LOGICAL_STAGE)).toThrow(
      RangeError,
    );
  });
});
