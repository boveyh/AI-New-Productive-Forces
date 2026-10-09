import { describe, expect, it } from 'vitest'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { casesForCapability, evidenceCases, evidenceLayerOrder, sharedCapabilities, type SharedCapability } from './evidence'

const ledger = ledgerJson as LedgerEntry[]
const causalNodeIds = ['task', 'process', 'results']

describe('evidence cases', () => {
  it('ships five cases ordered by depth of task entry', () => {
    expect(evidenceCases).toHaveLength(5)
    expect(new Set(evidenceCases.map((item) => item.id)).size).toBe(5)
    expect(evidenceCases.map((item) => item.layer)).toEqual(evidenceLayerOrder)
  })

  it('links every case to an existing ledger entry', () => {
    const ids = new Set(ledger.map((entry) => entry.id))
    for (const item of evidenceCases) expect(ids.has(item.ledgerId)).toBe(true)
  })

  it('maps every case to at least one node on the main causal chain', () => {
    for (const item of evidenceCases) {
      expect(item.causalNodes.length).toBeGreaterThanOrEqual(1)
      expect(item.causalNodes.every((node) => causalNodeIds.includes(node))).toBe(true)
    }
  })

  it('uses only shared capabilities with at least two per case', () => {
    for (const item of evidenceCases) {
      expect(item.capabilities.length).toBeGreaterThanOrEqual(2)
      expect(item.capabilities.every((capability) => (sharedCapabilities as readonly string[]).includes(capability))).toBe(true)
    }
  })

  it('keeps every shared capability referenced by at least one case', () => {
    const used = new Set<SharedCapability>(evidenceCases.flatMap((item) => item.capabilities))
    expect(sharedCapabilities.every((capability) => used.has(capability))).toBe(true)
    expect(casesForCapability('复核')).toHaveLength(5)
  })
})
