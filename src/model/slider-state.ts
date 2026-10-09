export type SliderKind = 'ai-position' | 'productivity' | 'governance' | 'augmentation'

export type SliderState = {
  value: number
  stageIndex: number
  stageName: string
  thresholdCrossed: boolean
  metrics: Record<string, number>
  explanation: string
  benefit: string
  cost: string
}

export const sliderThresholds = [0, 25, 50, 75, 100] as const

const stages: Record<SliderKind, Array<{ name: string; explanation: string; benefit: string; cost: string }>> = {
  'ai-position': [
    { name: '流程外建议', explanation: 'AI只提供参考，判断仍在原流程外发生。', benefit: '试错成本低', cost: '等待与交接基本不变' },
    { name: '局部任务自动化', explanation: 'AI接管一个可拆分任务，但上下游仍靠人工交接。', benefit: '单点任务加速', cost: '交接处仍可能返工' },
    { name: '流程内协作', explanation: '生成、复核和执行开始连续，人工判断进入关键节点。', benefit: '周期和返工同时下降', cost: '需要重新分配责任' },
    { name: '反馈闭环', explanation: '执行结果回到上游，模型和流程持续校正。', benefit: '系统可以持续学习', cost: '错误也可能快速回流' },
  ],
  productivity: [
    { name: '基础薄弱', explanation: '参数尚不足以稳定支撑生产任务。', benefit: '投入和改造成本较低', cost: '难以形成规模收益' },
    { name: '可用起点', explanation: '能力可以进入局部任务，但仍依赖人工补洞。', benefit: '可以验证真实价值', cost: '短板会放大摩擦' },
    { name: '协同成形', explanation: '技术与组织条件开始形成正向互补。', benefit: '产出与周期同步改善', cost: '需要持续训练与治理' },
    { name: '规模能力', explanation: '能力可以跨任务复制，并支持新任务出现。', benefit: '创新空间扩大', cost: '系统性风险与投入同步上升' },
  ],
  governance: [
    { name: '无约束扩张', explanation: '速度优先，约束落在系统外部。', benefit: '决策速度快', cost: '错误传播不可控' },
    { name: '事后审计', explanation: '系统保留记录，但问题通常在结果发生后才被发现。', benefit: '结果可以追责', cost: '纠正已经滞后' },
    { name: '关键节点复核', explanation: '高影响节点重新引入人工复核和权限控制。', benefit: '高影响风险可控', cost: '决策速度下降' },
    { name: '可追溯治理', explanation: '数据、模型、权限和责任形成可追踪链条。', benefit: '系统更可持续', cost: '前期组织成本高' },
  ],
  augmentation: [
    { name: '任务替代', explanation: '系统优先替代重复任务，人从执行环节退出。', benefit: '标准任务速度最高', cost: '经验和创新节点减少' },
    { name: '局部自动化', explanation: '部分任务交给AI，人负责例外和复核。', benefit: '减少重复劳动', cost: '责任容易停在交接处' },
    { name: '人机协作', explanation: 'AI提供候选，人负责判断、验证与修正。', benefit: '效率与责任兼顾', cost: '需要新的协作能力' },
    { name: '能力扩展', explanation: '人和AI共同完成过去无法规模化的新任务。', benefit: '新任务和连接增加', cost: '组织结构必须同步改变' },
  ],
}

const productivityDimensions = [
  [
    ['零散试点', '投入不足以改变现有流程，只能验证单个任务。'], ['部门工具', '投入可以覆盖局部任务，但尚未形成公共能力。'], ['跨流程投入', '投入开始连接数据、流程和人员训练。'], ['规模基础设施', '模型、算力与治理成为可复用的组织能力。'],
  ],
  [
    ['口径分散', '数据散落在不同系统，模型看见的是不一致的现场。'], ['可用未统一', '关键数据已经可用，但口径和质量仍依赖人工修补。'], ['可追溯资产', '数据来源、版本和责任可以追踪，判断开始稳定。'], ['实时数据闭环', '执行结果持续回流，数据可以支持动态校正。'],
  ],
  [
    ['原流程外挂', 'AI停留在原流程之外，结果需要重复搬运。'], ['局部改造', '单个环节被加速，但上下游交接没有改变。'], ['跨环节协同', '信息、执行与复核开始连续，等待节点减少。'], ['反馈闭环', '结果回到流程上游，系统可以持续修正。'],
  ],
  [
    ['少数人会用', '能力集中在个别人手里，组织无法稳定复制。'], ['基础培训', '人员能够使用工具，但复核和异常处理仍不稳定。'], ['复核能力', '人能够识别模型边界，并在关键节点承担判断。'], ['协同设计', '岗位、权限和训练围绕人机协作重新设计。'],
  ],
] as const

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

export function resolveSliderState(kind: SliderKind, rawValue: number, params: Record<string, number> = {}): SliderState {
  const value = clamp(rawValue)
  const stageIndex = Math.min(3, Math.floor(value / 25))
  let stage = stages[kind][stageIndex]
  if (kind === 'productivity' && Number.isInteger(params.dimension)) {
    const dimension = Math.min(3, Math.max(0, params.dimension))
    const [name, explanation] = productivityDimensions[dimension][stageIndex]
    stage = { ...stage, name, explanation }
  }
  let metrics: Record<string, number>

  if (kind === 'ai-position') {
    metrics = { 任务周期: Math.round(100 - value * 0.48), 等待节点: Math.max(0, 4 - stageIndex), 人工复核: 20 + stageIndex * 22, 反馈完整度: value }
  } else if (kind === 'governance') {
    metrics = { 决策速度: Math.round(150 - value * 0.65), 错误传播: Math.round(94 - value * 0.76), 人工复核: Math.round(8 + value * 0.72), 可追溯性: Math.round(value * 0.94), 能耗约束: Math.round(6 + value * 0.68) }
  } else if (kind === 'augmentation') {
    metrics = { 任务速度: Math.round(138 - value * 0.18), 人的判断份额: Math.round(18 + value * 0.67), 新任务节点: Math.round(5 + value * 0.78), 组织连接数: Math.round(20 + value * 0.72) }
  } else {
    const complementarity = params.complementarity ?? value / 100
    metrics = { 产出: Math.round(70 + value * 0.75), 周期缩短: Math.round(value * 0.58), 转型摩擦: Math.round(82 - value * 0.68 * complementarity), 创新能力: Math.round(8 + value * 0.72 * complementarity) }
  }

  return { value, stageIndex, stageName: stage.name, thresholdCrossed: sliderThresholds.includes(value as never), metrics, explanation: stage.explanation, benefit: stage.benefit, cost: stage.cost }
}
