import { describe, expect, it } from 'vitest'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { closingChoice, closingChoices, closingTakeaways, summaryRows } from './summary'
import { resolveSliderState } from './slider-state'
import { causalNodes, storyBridges } from './story'

const ledger = ledgerJson as LedgerEntry[]
const rowFor = (id: string) => summaryRows.find((row) => row.id === id)!

describe('summaryRows', () => {
  it('has one row per causal node, in the same order', () => {
    expect(summaryRows.map((row) => row.stage)).toEqual(causalNodes.map((node) => node.label))
    expect(summaryRows.map((row) => row.id)).toEqual(causalNodes.map((node) => node.id))
  })

  it('takes the copied-judgement column straight from the causal node proofs', () => {
    for (const row of summaryRows) {
      expect(row.copied).toBe(causalNodes.find((node) => node.id === row.id)!.proof)
    }
  })

  it('carries every story bridge conclusion without dropping or duplicating one', () => {
    const joined = summaryRows.map((row) => row.constraint).join('')
    for (const bridge of storyBridges) {
      expect(joined, `missing conclusion: ${bridge.conclusion}`).toContain(bridge.conclusion)
      expect(joined.split(bridge.conclusion)).toHaveLength(2)
    }
    expect(summaryRows.every((row) => row.constraint.length > 0)).toBe(true)
  })

  it('anchors a row only when the evidence measures that same thing', () => {
    // 这一列最容易为了表格好看硬塞数字，所以把必须留空的三行锁死。
    for (const id of ['decision', 'factors', 'process']) {
      expect(rowFor(id).anchors, `${id} 不该有台账锚点`).toEqual([])
    }
    expect(rowFor('task').anchors).toHaveLength(1)
    expect(rowFor('governance').anchors).toHaveLength(1)
    expect(rowFor('results').anchors.length).toBeGreaterThan(0)
  })

  it('resolves every anchor to a real ledger entry, reusing none', () => {
    const used = summaryRows.flatMap((row) => row.anchors.map((anchor) => anchor.id))
    expect(used.length).toBeGreaterThan(0)
    for (const id of used) {
      expect(ledger.find((entry) => entry.id === id), `anchor ${id} 不存在于台账`).toBeTruthy()
    }
    expect(new Set(used).size).toBe(used.length)
    for (const row of summaryRows) {
      for (const anchor of row.anchors) {
        const entry = ledger.find((item) => item.id === anchor.id)!
        expect(anchor.value).toBe(entry.value)
        expect(anchor.claim).toBe(entry.claim)
      }
    }
  })

  it('points every row at the chapter its causal node targets', () => {
    for (const row of summaryRows) {
      expect(row.chapter).toBe(causalNodes.find((node) => node.id === row.id)!.target)
    }
  })

  it('is deterministic', () => {
    expect(summaryRows).toEqual(summaryRows)
  })
})

describe('closingChoice', () => {
  it('switches at the same boundaries the augmentation slider uses', () => {
    expect(closingChoice(0)).toBe(closingChoices[0])
    expect(closingChoice(24)).toBe(closingChoices[0])
    expect(closingChoice(25)).toBe(closingChoices[1])
    expect(closingChoice(49)).toBe(closingChoices[1])
    expect(closingChoice(50)).toBe(closingChoices[2])
    expect(closingChoice(74)).toBe(closingChoices[2])
    expect(closingChoice(75)).toBe(closingChoices[3])
    expect(closingChoice(100)).toBe(closingChoices[3])
  })

  it('never disagrees with the stage the slider area displays', () => {
    for (const value of [-20, 0, 10, 24, 25, 50, 75, 90, 100, 140]) {
      const state = resolveSliderState('augmentation', value)
      expect(closingChoice(value)).toBe(closingChoices[state.stageIndex])
    }
  })

  it('gives every stage its own line and no stage an empty one', () => {
    expect(closingChoices).toHaveLength(4)
    expect(new Set(closingChoices).size).toBe(4)
    expect(closingChoices.every((line) => line.trim().length > 0)).toBe(true)
  })
})

describe('closingTakeaways', () => {
  it('keeps the two takeaways the page already had', () => {
    expect(closingTakeaways.mechanism).toBe('AI降低可复制判断的成本，使过去无法规模化的新任务、新产品和新组织方式成为可能。')
    expect(closingTakeaways.boundary).toBe('判断越能被复制，责任越不能一起被复制。上限取决于哪些判断被明确留给人，并且有人为它负责。')
  })

  it('does not repeat any augmentation-stage choice', () => {
    for (const line of closingChoices) {
      expect(closingTakeaways.mechanism).not.toBe(line)
      expect(closingTakeaways.boundary).not.toBe(line)
    }
  })
})
