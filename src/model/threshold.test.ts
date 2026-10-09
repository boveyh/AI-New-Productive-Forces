import { describe, expect, it } from 'vitest'
import { tradeoffCurve } from './threshold'

describe('detection threshold tradeoff', () => {
  it('trades misses against false sprays as the threshold rises', () => {
    const curve = tradeoffCurve({ steps: 40, accuracy: 0.85 })
    for (let index = 1; index < curve.length; index += 1) {
      expect(curve[index].missedRate).toBeGreaterThanOrEqual(curve[index - 1].missedRate)
      expect(curve[index].falseRate).toBeLessThanOrEqual(curve[index - 1].falseRate)
    }
  })

  it('crosses once, so some threshold always trades one error for the other', () => {
    const curve = tradeoffCurve({ steps: 40, accuracy: 0.85 })
    const crossed = curve.some((point, index) => index > 0
      && point.missedRate >= point.falseRate
      && curve[index - 1].missedRate < curve[index - 1].falseRate)
    expect(crossed).toBe(true)
  })

  it('moves both curves down when detection improves', () => {
    const weak = tradeoffCurve({ steps: 40, accuracy: 0.6 })
    const strong = tradeoffCurve({ steps: 40, accuracy: 0.95 })
    for (let index = 1; index < weak.length; index += 1) {
      expect(strong[index].missedRate).toBeLessThanOrEqual(weak[index].missedRate)
      expect(strong[index].falseRate).toBeLessThanOrEqual(weak[index].falseRate)
    }
    expect(strong[30].missedRate).toBeLessThan(weak[30].missedRate)
  })

  it('keeps both endpoints stable regardless of resolution', () => {
    const coarse = tradeoffCurve({ steps: 5, accuracy: 0.85 })
    const fine = tradeoffCurve({ steps: 50, accuracy: 0.85 })
    expect(coarse[0]).toEqual(fine[0])
    expect(coarse.at(-1)).toEqual(fine.at(-1))
    expect(coarse[0].missedRate).toBe(0)
    expect(coarse.at(-1)!.falseRate).toBe(0)
  })
})
