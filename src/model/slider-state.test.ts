import { describe, expect, it } from 'vitest'
import { resolveSliderState } from './slider-state'

describe('resolveSliderState', () => {
  it.each([
    [0, 0], [24, 0], [25, 1], [49, 1], [50, 2], [74, 2], [75, 3], [100, 3],
  ])('maps %i to stage %i', (value, stage) => {
    expect(resolveSliderState('governance', value).stageIndex).toBe(stage)
  })

  it('uses the same complete result shape for every control', () => {
    for (const kind of ['ai-position', 'productivity', 'governance', 'augmentation'] as const) {
      const state = resolveSliderState(kind, 50)
      expect(state.explanation).toBeTruthy()
      expect(state.benefit).toBeTruthy()
      expect(state.cost).toBeTruthy()
      expect(Object.keys(state.metrics).length).toBeGreaterThanOrEqual(4)
    }
  })

  it('clamps out-of-range values', () => {
    expect(resolveSliderState('augmentation', -5).value).toBe(0)
    expect(resolveSliderState('augmentation', 120).value).toBe(100)
  })
})
