import { describe, expect, it } from 'vitest'
import { applyMode, buildField, fieldMetrics } from './field'

const fieldOptions = { seed: 11, cols: 14, rows: 7, weedRate: 0.18 }

describe('field simulation model', () => {
  it('is deterministic for a fixed seed', () => {
    expect(buildField(fieldOptions)).toEqual(buildField(fieldOptions))
  })

  it('covers the whole field and never misses when spraying everything', () => {
    const metrics = fieldMetrics(applyMode(buildField(fieldOptions), 'blanket', 1))
    expect(metrics.herbicideUnits).toBeCloseTo(1, 5)
    expect(metrics.missed).toBe(0)
    expect(metrics.nozzlePasses).toBe(fieldOptions.cols)
    expect(metrics.reviewCount).toBe(0)
  })

  it('saves herbicide and misses nothing with a perfect detector', () => {
    const metrics = fieldMetrics(applyMode(buildField(fieldOptions), 'spot', 1))
    expect(metrics.missed).toBe(0)
    expect(metrics.herbicideUnits).toBeLessThan(0.5)
  })

  it('raises both misses and false sprays as detection accuracy drops', () => {
    const grid = buildField(fieldOptions)
    const high = fieldMetrics(applyMode(grid, 'spot', 0.85))
    const low = fieldMetrics(applyMode(grid, 'spot', 0.6))
    expect(low.missed).toBeGreaterThan(high.missed)
    expect(low.falseSpray).toBeGreaterThan(high.falseSpray)
  })

  it('lets human review cut misses without becoming a perfect mode', () => {
    const grid = buildField(fieldOptions)
    const spot = fieldMetrics(applyMode(grid, 'spot', 0.85))
    const review = fieldMetrics(applyMode(grid, 'collaborative', 0.85))
    expect(review.reviewCount).toBeGreaterThan(0)
    expect(review.missed).toBeLessThan(spot.missed)
    expect(review.missed).toBeGreaterThan(0)
  })

  it('scales the review load with the number of low-confidence cells', () => {
    const grid = buildField(fieldOptions)
    const relaxed = fieldMetrics(applyMode(grid, 'collaborative', 0.85))
    const poor = fieldMetrics(applyMode(grid, 'collaborative', 0.6))
    expect(poor.reviewCount).toBeGreaterThan(relaxed.reviewCount)
    expect(poor.missed).toBeGreaterThan(relaxed.missed)
  })

  it('drops review cost to zero when the detector never hesitates', () => {
    const metrics = fieldMetrics(applyMode(buildField(fieldOptions), 'collaborative', 1))
    expect(metrics.reviewCount).toBe(0)
    expect(metrics.missed).toBe(0)
  })

  it('treats review coverage as the only dial for how much gets checked', () => {
    const grid = buildField(fieldOptions)
    const none = fieldMetrics(applyMode(grid, 'collaborative', 0.6, 0))
    const all = fieldMetrics(applyMode(grid, 'collaborative', 0.6, 1))
    expect(none.reviewCount).toBe(0)
    expect(all.reviewCount).toBeGreaterThan(0)
    expect(all.missed).toBe(0)
  })
})
