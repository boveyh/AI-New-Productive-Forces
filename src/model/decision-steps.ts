export const humanFallbackNodeId = 'human-review-station' as const

export type DecisionStepId = 'observe' | 'classify' | 'decide' | 'execute'

export type DecisionStep = {
  id: DecisionStepId
  label: string
  failure: string
  humanFallback: string
  causalNode: 'decision'
  humanFallbackNodeId: typeof humanFallbackNodeId
}

export const decisionSteps: DecisionStep[] = [
  { id: 'observe', label: '识别现场', failure: '看不清', humanFallback: '重新观察', causalNode: 'decision', humanFallbackNodeId },
  { id: 'classify', label: '区分目标', failure: '分错目标', humanFallback: '重新判断', causalNode: 'decision', humanFallbackNodeId },
  { id: 'decide', label: '形成决策', failure: '来不及', humanFallback: '重新决策', causalNode: 'decision', humanFallbackNodeId },
  { id: 'execute', label: '执行动作', failure: '执行错位', humanFallback: '重新操作', causalNode: 'decision', humanFallbackNodeId },
]

export const decisionContext = {
  scene: '休耕地定点喷洒',
  target: '除草剂',
  distinguishes: '需要清除的杂草与不应触发喷洒的区域',
  action: '判断结果控制对应喷嘴是否开启',
} as const

export const decisionOutcome = '真正改变生产力的，不是机器判断对了一次，而是同类判断可以低成本、高频率地重复。'

export function stepIndexFor(id: DecisionStepId) {
  return decisionSteps.findIndex((step) => step.id === id)
}
