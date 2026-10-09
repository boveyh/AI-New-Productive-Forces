import { describe, expect, it } from 'vitest'
import { causalNodes, domainPaths, pulseGeometry, pulsePathId, storyBridges } from './story'

describe('continuous story model', () => {
  it('keeps bridge segments continuous and aligned with causal nodes', () => {
    for (let index = 0; index < storyBridges.length - 1; index += 1) expect(storyBridges[index].end).toBe(storyBridges[index + 1].start)
    expect(storyBridges.every((bridge) => causalNodes.some((node) => node.id === bridge.nodeId))).toBe(true)
  })

  it('uses one pulse path and one split point', () => {
    expect(pulsePathId).toBe('decision-pulse-path')
    expect(pulseGeometry.causalNodes).toHaveLength(causalNodes.length)
    expect(pulseGeometry.causalNodes.at(-1)!.y).toBeLessThan(pulseGeometry.splitPoint.y)
  })

  it('lets final paths replace only domain-specific fields', () => {
    expect(domainPaths).toHaveLength(4)
    expect(new Set(domainPaths.map((path) => path.constraint)).size).toBe(4)
    expect(domainPaths.every((path) => ['过程侧', '制度侧'].includes(path.constraintSide))).toBe(true)
  })

  it('rotates the seven bridges across at least three visual grammars', () => {
    expect(storyBridges).toHaveLength(7)
    expect(new Set(storyBridges.map((bridge) => bridge.kind)).size).toBeGreaterThanOrEqual(3)
    expect(storyBridges.every((bridge) => bridge.action.length > 0)).toBe(true)
  })

  it('asks at most three questions and avoids three identical layouts in a row', () => {
    expect(storyBridges.filter((bridge) => bridge.question).length).toBeLessThanOrEqual(3)
    for (let index = 0; index < storyBridges.length - 2; index += 1) {
      const window = storyBridges.slice(index, index + 3).map((bridge) => bridge.layout)
      expect(new Set(window).size).toBeGreaterThan(1)
    }
  })
})
