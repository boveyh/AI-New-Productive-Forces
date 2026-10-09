import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { resolveSliderState } from './slider-state'
import { causalNodes, storyBridges, type CausalNodeId } from './story'

const ledger = ledgerJson as LedgerEntry[]

/**
 * 台账锚点：只有当某个环节的**被测量对象**与证据本身一致时才填，其余留空。
 *
 * 这一列最容易变成"为了表格好看硬塞数字"，所以映射写死在这里、逐条给出理由，
 * 并由测试锁死 decision / factors / process 三行必须为空：
 * - decision（判断成本 ↓）与 factors（要素重组）没有任何证据直接测量过；
 * - process（流程重构）关心的是 AI 在流程中的位置，而现有案例测量的是生产率结果，
 *   属于 results 那一行，不能挪用来充当流程的证据。
 */
const anchorsByNode: Partial<Record<CausalNodeId, string[]>> = {
  // 「AI 进入任务」讲的就是采用率本身。
  task: ['eurostat-ai-depth-2025'],
  // 「结果改变」要求生产力在成本、周期、质量上留下证据；两条都是现场生产率测量。
  results: ['nber-support-14', 'wef-guizhou-tire-68'],
  // 「新治理」的现实代价是能源需求。
  governance: ['iea-datacentre-17'],
}

export type SummaryAnchor = {
  id: string
  value: number
  unit: string
  claim: string
  year: number
  geography: string
}

export type SummaryRow = {
  id: CausalNodeId
  /** 环节，取自因果链的标签 */
  stage: string
  /** 被复制的判断，取自因果链的说明 */
  copied: string
  /** 留下的约束，取自故事桥上已有的小结论（同一环节有多条时合并） */
  constraint: string
  /** 台账锚点，可能为空 */
  anchors: SummaryAnchor[]
  /** 该环节对应的章节 id，供表格行跳转 */
  chapter: string
}

export function buildSummaryRows(): SummaryRow[] {
  return causalNodes.map((node) => ({
    id: node.id,
    stage: node.label,
    copied: node.proof,
    constraint: storyBridges.filter((bridge) => bridge.nodeId === node.id).map((bridge) => bridge.conclusion).join(''),
    chapter: node.target,
    anchors: (anchorsByNode[node.id] ?? []).map((id) => {
      const entry = ledger.find((item) => item.id === id)
      if (!entry) throw new Error(`汇总表的台账锚点指向了不存在的证据：${id}`)
      return {
        id: entry.id,
        value: entry.value,
        unit: entry.unit,
        claim: entry.claim,
        year: entry.year,
        geography: entry.geography,
      }
    }),
  }))
}

export const summaryRows = buildSummaryRows()

/** 前两条收束结论，沿用页面上原有的文案，只是从 FinalExpansion 移到这里统一管理。 */
export const closingTakeaways = {
  mechanism: 'AI降低可复制判断的成本，使过去无法规模化的新任务、新产品和新组织方式成为可能。',
  boundary: '判断越能被复制，责任越不能一起被复制。上限取决于哪些判断被明确留给人，并且有人为它负责。',
} as const

/**
 * 第三条收束结论「选择」随 augmentation 的当前阶段变化，让结尾与用户当下的操作真正相连。
 *
 * 阶段索引必须来自 `resolveSliderState`，不能在组件里重算分段——
 * 否则 25 / 50 / 75 的边界会与滑杆区显示打架。
 */
export const closingChoices = [
  '把可复制的判断交给系统，把不可复制的判断留给人',
  '自动化的边界，取决于谁为错误负责',
  '判断可以分担，责任不能分摊',
  '新任务出现时，责任边界要重新设计',
] as const

export function closingChoice(augmentation: number): string {
  return closingChoices[resolveSliderState('augmentation', augmentation).stageIndex]
}
