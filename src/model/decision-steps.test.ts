import { describe, expect, it } from 'vitest'
import { decisionSteps, humanFallbackNodeId } from './decision-steps'
import { causalNodes } from './story'

describe('decision steps', () => {
  it('keeps four steps on the single decision causal node', () => {
    expect(decisionSteps.map((step) => step.id)).toEqual(['observe', 'classify', 'decide', 'execute'])
    expect(decisionSteps.every((step) => step.causalNode === 'decision')).toBe(true)
  })

  it('routes every failure to one fallback node outside the causal chain', () => {
    expect(new Set(decisionSteps.map((step) => step.humanFallbackNodeId))).toEqual(new Set([humanFallbackNodeId]))
    expect(causalNodes.some((node) => node.id === (humanFallbackNodeId as string))).toBe(false)
  })

  it('gives every step a distinct failure and a fallback action', () => {
    expect(new Set(decisionSteps.map((step) => step.failure)).size).toBe(4)
    expect(decisionSteps.every((step) => step.humanFallback.length > 0)).toBe(true)
  })
})
