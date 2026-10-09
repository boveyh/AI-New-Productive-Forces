import { describe, expect, it } from 'vitest'
import { buildAtomLayout, getRankedLayout, getRankedValueRight, percentagePointGap, rankedSafeArea, relativeGrowth, scaleLinear } from './adoption'

describe('adoption helpers', () => {
  it('calculates the observed change without hiding the unit', () => {
    expect(relativeGrowth(13.5, 20)).toBeCloseTo(48.15, 2)
    expect(percentagePointGap(55.03, 17)).toBeCloseTo(38.03, 2)
  })

  it('maps chart values to a bounded visual range', () => {
    expect(scaleLinear(20, [0, 60], [100, 700])).toBe(300)
  })

  it.each(['depth', 'size', 'technology', 'country'] as const)('builds a stable %s layout', (scene) => {
    const first = buildAtomLayout(scene)
    expect(first).toEqual(buildAtomLayout(scene))
    expect(first).toHaveLength(36)
    expect(first.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(true)
  })

  it.each(['scroll', 'manual', '15fps', 'static'])('keeps country labels inside the safe area in %s mode', () => {
    const layout = getRankedLayout(7)
    expect(rankedSafeArea.titleBottom).toBeLessThan(layout.positions[0])
    expect(layout.positions.every((position, index) => index === 0 || position > layout.positions[index - 1])).toBe(true)
    expect(layout.positions.at(-1)).toBeLessThanOrEqual(rankedSafeArea.bottom)
    expect(getRankedValueRight(42.03, 45)).toBeLessThan(rankedSafeArea.right)
  })
})
