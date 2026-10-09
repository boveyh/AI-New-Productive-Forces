import { describe, expect, it } from 'vitest'
import { largestChangeKey, labPresets, matchPreset } from './presets'
import { evaluateProductivity } from './productivity'

describe('lab presets', () => {
  it('ships exactly four distinct fixed combinations', () => {
    expect(labPresets).toHaveLength(4)
    expect(new Set(labPresets.map((preset) => preset.id)).size).toBe(4)
  })

  it.each([
    ['cautious-pilot', 'not-scale'],
    ['technology-island', 'island'],
    ['automation-trap', 'trap'],
    ['human-ai-synergy', 'synergy'],
  ] as const)('classifies %s as %s through evaluateProductivity', (id, state) => {
    const preset = labPresets.find((item) => item.id === id)!
    expect(evaluateProductivity(preset.inputs).state).toBe(state)
  })

  it('keeps every preset input bounded and reachable as a manual state', () => {
    for (const preset of labPresets) {
      for (const value of Object.values(preset.inputs)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
      expect(matchPreset(preset.inputs)?.id).toBe(preset.id)
    }
  })

  it('reports the condition that moved the most between two states', () => {
    const from = { investment: 0.16, data: 0.42, process: 0.38, training: 0.46 }
    const to = { investment: 0.82, data: 0.76, process: 0.7, training: 0.18 }
    expect(largestChangeKey(from, to)).toBe('investment')
  })
})
