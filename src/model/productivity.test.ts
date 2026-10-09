import { describe, expect, it } from 'vitest'
import { evaluateProductivity, productivityWeights, sampleAt, sampleSurface, surfaceThresholds } from './productivity'

describe('evaluateProductivity', () => {
  it.each([
    [{ investment: 0.1, data: 0.8, process: 0.8, training: 0.8 }, 'not-scale'],
    [{ investment: 0.8, data: 0.8, process: 0.8, training: 0.8 }, 'synergy'],
    [{ investment: 0.8, data: 0.1, process: 0.8, training: 0.8 }, 'island'],
    [{ investment: 0.8, data: 0.8, process: 0.8, training: 0.1 }, 'trap'],
  ] as const)('classifies %o as %s', (inputs, expected) => {
    expect(evaluateProductivity(inputs).state).toBe(expected)
  })

  it('is deterministic and bounded', () => {
    const inputs = { investment: 1, data: 1, process: 1, training: 1 }
    expect(evaluateProductivity(inputs)).toEqual(evaluateProductivity(inputs))
    expect(evaluateProductivity(inputs).index).toBe(145)
    expect(evaluateProductivity({ investment: 1, data: 0, process: 0, training: 0 }).index).toBe(70)
  })

  it('clamps inputs to zero and one', () => {
    expect(evaluateProductivity({ investment: 2, data: 2, process: 2, training: 2 }).index).toBe(145)
  })
})

describe('sampleSurface', () => {
  it('returns a square grid', () => {
    expect(sampleSurface(3)).toHaveLength(9)
    expect(sampleSurface(20)).toHaveLength(400)
  })

  it('is deterministic', () => {
    expect(sampleSurface(10)).toEqual(sampleSurface(10))
  })

  it('agrees with evaluateProductivity at the grid corners', () => {
    const surface = sampleSurface(3)
    const corner = surface.find((point) => point.investment === 1 && point.complementarity === 1)!
    expect(corner.index).toBe(evaluateProductivity({ investment: 1, data: 1, process: 1, training: 1 }).index)
    const floor = surface.find((point) => point.investment === 0 && point.complementarity === 0)!
    expect(floor.index).toBe(100)
  })

  it('cannot rescue a weak complementarity base by adding investment', () => {
    const surface = sampleSurface(11)
    const weakBase = surface.filter((point) => point.complementarity <= 0.4).map((point) => point.index)
    const strongBase = surface.filter((point) => point.complementarity >= 0.6).map((point) => point.index)
    expect(Math.max(...weakBase)).toBeLessThan(Math.max(...strongBase))
  })
})

describe('sampleAt', () => {
  it('agrees with sampleSurface at the same resolution', () => {
    const surface = sampleSurface(10)
    for (const point of surface) {
      expect(sampleAt(point.investment, point.complementarity).index).toBe(point.index)
    }
  })

  it('clamps outside the unit square', () => {
    expect(sampleAt(-1, 2).investment).toBe(0)
    expect(sampleAt(-1, 2).complementarity).toBe(1)
    expect(sampleAt(-1, 2).index).toBe(evaluateProductivity({ investment: 0, data: 1, process: 1, training: 1 }).index)
  })

  it('carries the full evaluation so the readout can show gain and friction', () => {
    const sample = sampleAt(0.6, 0.3)
    expect(sample.result).toEqual(evaluateProductivity({ investment: 0.6, data: 0.3, process: 0.3, training: 0.3 }))
    expect(sample.result.gain).toBeLessThan(sample.result.friction)
  })
})

describe('surfaceThresholds', () => {
  const at = (complementarity: number, investment: number) =>
    evaluateProductivity({ investment, data: complementarity, process: complementarity, training: complementarity })

  it('derives the inflection from the weights instead of hardcoding it', () => {
    const { inflection } = surfaceThresholds()
    expect(inflection).toBeCloseTo(
      productivityWeights.friction / (productivityWeights.gain + productivityWeights.friction),
      12,
    )
  })

  it('places the inflection where the index stops falling as investment rises', () => {
    const { inflection } = surfaceThresholds()
    const delta = (c: number) => at(c, 1).index - at(c, 0).index
    expect(Math.abs(delta(inflection))).toBeLessThan(1e-9)
    expect(delta(inflection - 0.05)).toBeLessThan(0)
    expect(delta(inflection + 0.05)).toBeGreaterThan(0)
  })

  it('places the balance where gain meets friction', () => {
    const { balance } = surfaceThresholds()
    const onLine = at(balance, 1)
    expect(onLine.gain).toBeCloseTo(onLine.friction, 12)
    expect(at(balance - 0.05, 1).gain).toBeLessThan(at(balance - 0.05, 1).friction)
  })

  it('keeps the two thresholds distinct and ordered', () => {
    const { inflection, balance } = surfaceThresholds()
    expect(balance).toBeCloseTo(0.5, 12)
    expect(inflection).toBeCloseTo(0.4, 12)
    expect(inflection).toBeLessThan(balance)
  })
})
