import { describe, expect, it } from 'vitest'
import { buildAtomLayout, percentagePointGap, relativeGrowth, scaleLinear } from './adoption'

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
})
