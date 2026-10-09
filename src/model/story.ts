export const pulsePathId = 'decision-pulse-path'

export type CausalNodeId = 'decision' | 'task' | 'factors' | 'process' | 'results' | 'governance'

export type CausalNode = {
  id: CausalNodeId
  label: string
  target: string
  proof: string
}

export const causalNodes: CausalNode[] = [
  { id: 'decision', label: '判断成本 ↓', target: 'engine', proof: '识别、计算和执行被压缩为一次可以复制的判断。' },
  { id: 'task', label: 'AI进入任务', target: 'adoption', proof: '采用率上升只说明能力进入企业，不等于生产力已经形成。' },
  { id: 'factors', label: '要素重组', target: 'factors', proof: '数据、算力和算法必须同时咬合，智能才来得及行动。' },
  { id: 'process', label: '流程重构', target: 'process', proof: 'AI介入的位置决定它是旁路工具，还是反馈闭环。' },
  { id: 'results', label: '结果改变', target: 'industry', proof: '生产力要在成本、周期、质量或新任务上留下证据。' },
  { id: 'governance', label: '新治理', target: 'cost', proof: '判断传播越快，错误、能源和责任也越需要被重新约束。' },
]

export type StoryBridgeKind = 'morph' | 'relay' | 'overlay' | 'reveal'

export type StoryBridgeEntry = {
  id: string
  nodeId: CausalNodeId
  kind: StoryBridgeKind
  layout: string
  action: string
  conclusion: string
  question?: string
  start: number
  end: number
}

export const storyBridges: StoryBridgeEntry[] = [
  { id: 'decision-task', nodeId: 'decision', kind: 'morph', layout: 'morph', action: '形态重组 · 田间判断点重组成采用率数据点', conclusion: '一次正确判断还不是生产力，它必须能够被稳定复制。', question: '当判断开始复制，为什么有些企业先用起来，有些仍停在原地？', start: 0, end: 1 },
  { id: 'task-factors', nodeId: 'task', kind: 'relay', layout: 'relay', action: '对象接力 · 采用率数据点拆为三路要素信号', conclusion: '买到AI能力，不等于获得生产力。', start: 1, end: 2 },
  { id: 'factors-process', nodeId: 'factors', kind: 'relay', layout: 'relay', action: '对象接力 · 故障路径继续延伸为流程电路', conclusion: '要素咬合只产生能力，能力还必须进入任务。', question: 'AI放在流程的哪个位置，才会减少等待而不是增加返工？', start: 2, end: 3 },
  { id: 'process-results', nodeId: 'process', kind: 'overlay', layout: 'overlay', action: '前后叠影 · 旧流程与新流程重叠比较', conclusion: '流程变化只有转化为结果，才称得上生产力。', start: 3, end: 4 },
  { id: 'results-lab', nodeId: 'results', kind: 'reveal', layout: 'reveal-edge', action: '约束显影 · 收益扩大，摩擦从背景进入前景', conclusion: '局部案例可以成功，但规模化依赖组织条件互补。', question: '投入继续增加时，哪块短板会把收益变成摩擦？', start: 4, end: 5 },
  { id: 'lab-governance', nodeId: 'results', kind: 'reveal', layout: 'reveal-floor', action: '约束显影 · 错误与能源需求同步放大', conclusion: '规模扩大了收益，也同步扩大错误和能源需求。', start: 5, end: 6 },
  { id: 'governance-conclusion', nodeId: 'governance', kind: 'reveal', layout: 'reveal-frame', action: '约束显影 · 把不可转移的责任固定下来', conclusion: '治理不是生产力的反面，而是它能够持续的条件。', start: 6, end: 7 },
]

export const domainPaths = [
  { id: 'research', name: '研发', verb: '搜索 → 生成验证', domainAction: '从搜索已有答案转向生成并验证候选', process: '实验设计从串行变并行', result: '候选数量与验证速度', constraint: '验证成本', constraintSide: '过程侧', governance: '验证责任不能外包给生成' },
  { id: 'manufacturing', name: '制造', verb: '事后检测 → 实时反馈', domainAction: '从事后发现缺陷转向实时反馈', process: '工艺调整从事后变在线', result: '良率与停机时间', constraint: '物理实时性', constraintSide: '过程侧', governance: '在线调整需要明确权限边界' },
  { id: 'healthcare', name: '医疗', verb: '信息整理 → 辅助判断', domainAction: '从整理信息转向提供判断辅助', process: '判断路径从集中变为协作', result: '判断速度与一致性', constraint: '责任不可转移', constraintSide: '制度侧', governance: '高影响责任仍由人承担' },
  { id: 'organization', name: '组织', verb: '层层传递 → 现场判断', domainAction: '从层层传递转向现场判断', process: '决策点向现场前移', result: '响应速度与连接数', constraint: '信息传递损耗', constraintSide: '制度侧', governance: '决策权与责任同步下沉' },
] as const

export const pulseGeometry = {
  start: { x: 50, y: 0 },
  causalNodes: causalNodes.map((_, index) => ({ x: 50, y: 8 + index * 13 })),
  splitPoint: { x: 50, y: 88 },
} as const
