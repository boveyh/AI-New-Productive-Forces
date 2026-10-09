export const sharedCapabilities = ['识别', '预测', '生成', '决策', '执行', '复核'] as const

export type SharedCapability = (typeof sharedCapabilities)[number]

export type EvidenceLayer = 'saving' | 'speed' | 'transfer' | 'restructure' | 'creation'

export type EvidenceCausalNode = 'task' | 'process' | 'results'

export type EvidenceCase = {
  id: string
  layer: EvidenceLayer
  causalNodes: EvidenceCausalNode[]
  capabilities: SharedCapability[]
  before: string
  aiDecision: string
  processChange: string
  outcome: string
  metricLabel: string
  ledgerId: string
}

export const evidenceLayerOrder: EvidenceLayer[] = ['saving', 'speed', 'transfer', 'restructure', 'creation']

export const evidenceLayerLabels: Record<EvidenceLayer, string> = {
  saving: '节约投入',
  speed: '缩短任务',
  transfer: '传递经验',
  restructure: '重构流程',
  creation: '扩展边界',
}

export const evidenceDepthAxis = '一次执行 → 一个任务 → 一组经验 → 一条流程 → 一类新任务'

export const evidenceCases: EvidenceCase[] = [
  {
    id: 'deere-see-spray-77',
    layer: 'saving',
    causalNodes: ['task', 'results'],
    capabilities: ['识别', '决策', '执行', '复核'],
    before: '整片田块统一喷洒，除草剂用量只由区域平均决定。',
    aiDecision: '摄像头识别单株杂草，判断该位置是否需要喷洒。',
    processChange: '喷洒从整片执行变为逐个喷嘴的局部执行。',
    outcome: '厂商披露：平均节省77%的除草剂。',
    metricLabel: '除草剂投入',
    ledgerId: 'deere-see-spray-77',
  },
  {
    id: 'github-copilot-55-8',
    layer: 'speed',
    causalNodes: ['task'],
    capabilities: ['生成', '执行', '复核'],
    before: '开发者在编辑器里逐段手写指定任务的代码。',
    aiDecision: '在编码任务中生成候选实现，供人验证。',
    processChange: '人的注意力从编写移向验证、架构与需求。',
    outcome: '受控实验：完成指定任务快55.8%。',
    metricLabel: '指定任务完成时间',
    ledgerId: 'github-copilot-55-8',
  },
  {
    id: 'nber-support-14',
    layer: 'transfer',
    causalNodes: ['task', 'process'],
    capabilities: ['生成', '决策', '复核'],
    before: '经验集中在少数优秀员工身上，新人只能自行摸索。',
    aiDecision: '把优秀员工的处理经验转成实时建议。',
    processChange: '经验传递从线下培训移入正在进行的会话。',
    outcome: '现场研究：平均生产率提高14%。',
    metricLabel: '每小时解决问题数',
    ledgerId: 'nber-support-14',
  },
  {
    id: 'wef-guizhou-tire-68',
    layer: 'restructure',
    causalNodes: ['process', 'results'],
    capabilities: ['识别', '预测', '决策', '执行', '复核'],
    before: '质量检测、排产与工艺调整分散在不同环节。',
    aiDecision: '检测与工艺数据回到生产现场形成判断。',
    processChange: '缺陷发现从事后变为现场反馈，工艺在线调整。',
    outcome: '灯塔案例：劳动生产率提高68%。',
    metricLabel: '劳动生产率',
    ledgerId: 'wef-guizhou-tire-68',
  },
  {
    id: 'alphafold-200m',
    layer: 'creation',
    causalNodes: ['task', 'results'],
    capabilities: ['预测', '生成', '复核'],
    before: '蛋白质结构依赖逐个实验测定，难以规模化。',
    aiDecision: '预测蛋白质三维结构，生成可检索的结构库。',
    processChange: '结构获取从逐项实验变为人人可用的公共资源。',
    outcome: '数据库公开超过2亿个结构预测。',
    metricLabel: '可获取结构预测数',
    ledgerId: 'alphafold-200m',
  },
]

export function casesForCapability(capability: SharedCapability): EvidenceCase[] {
  return evidenceCases.filter((item) => item.capabilities.includes(capability))
}
