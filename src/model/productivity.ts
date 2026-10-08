export type ProductivityInputs = {
  investment: number
  data: number
  process: number
  training: number
}

export type ProductivityState = 'not-scale' | 'synergy' | 'trap' | 'island'

export type ProductivityResult = {
  index: number
  complementarity: number
  gain: number
  friction: number
  state: ProductivityState
  label: string
  bottleneck: string
  causalPosition: string
  recommendation: string
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function evaluateProductivity(raw: ProductivityInputs): ProductivityResult {
  const inputs = {
    investment: clamp01(raw.investment),
    data: clamp01(raw.data),
    process: clamp01(raw.process),
    training: clamp01(raw.training),
  }
  const complementarity = Math.cbrt(inputs.data * inputs.process * inputs.training)
  const gain = inputs.investment * complementarity
  const friction = inputs.investment * (1 - complementarity)
  const index = 100 * (1 + 0.45 * gain - 0.3 * friction)

  if (inputs.investment < 0.2) {
    return {
      index,
      complementarity,
      gain,
      friction,
      state: 'not-scale',
      label: '尚未形成规模效应',
      bottleneck: 'AI投入强度不足以改变现有流程。',
      causalPosition: '智能能力尚未稳定进入生产过程。',
      recommendation: '先选择一个高频、可验证的任务建立试点。',
    }
  }

  if (gain >= friction) {
    const weakest = Math.min(inputs.data, inputs.process, inputs.training)
    const next = weakest === inputs.data ? '数据准备度' : weakest === inputs.process ? '流程适配度' : '人员训练度'
    return {
      index,
      complementarity,
      gain,
      friction,
      state: 'synergy',
      label: '人机协同',
      bottleneck: `${next}仍是当前相对短板。`,
      causalPosition: 'AI能力已经进入流程，并与组织条件形成正向配合。',
      recommendation: `保持投入节奏，下一步优先提升${next}。`,
    }
  }

  if (inputs.training <= Math.min(inputs.data, inputs.process)) {
    return {
      index,
      complementarity,
      gain,
      friction,
      state: 'trap',
      label: '自动化陷阱',
      bottleneck: '人员训练度是当前最低项。',
      causalPosition: '模型已经进入流程，但人工复核与协作能力没有同步形成。',
      recommendation: '先提高培训与复核能力，再继续提高AI投入。',
    }
  }

  const tied = inputs.data === inputs.process
  const bottleneck = tied ? '数据准备度与流程适配度同时偏低。' : inputs.data < inputs.process ? '数据准备度是当前最低项。' : '流程适配度是当前最低项。'
  return {
    index,
    complementarity,
    gain,
    friction,
    state: 'island',
    label: '技术孤岛',
    bottleneck,
    causalPosition: '技术已经投入，但尚未连接到可靠数据和可执行流程。',
    recommendation: inputs.data <= inputs.process ? '先治理数据口径和质量，再扩大模型使用范围。' : '先重构任务流程，再增加自动化比例。',
  }
}
