import { describe, expect, it } from 'vitest'
import { evaluateProductivity } from './productivity'

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
