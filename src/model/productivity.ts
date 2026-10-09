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

/**
 * 有效生产力指数里正负两项的权重。
 *
 * 导出是为了让响应面的参考线能与评价函数共用同一份权重——否则调整权重后，
 * 参考线仍指向旧位置，属于静默失真。
 */
export const productivityWeights = { gain: 0.45, friction: 0.3 } as const

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
  const index = 100 * (1 + productivityWeights.gain * gain - productivityWeights.friction * friction)

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

export type SurfacePoint = {
  investment: number
  complementarity: number
  index: number
}

export type SurfaceSample = SurfacePoint & { result: ProductivityResult }

/**
 * 在「AI投入强度 × 协同基础」平面上采样有效生产力指数。
 * 令 data = process = training = C，即可让三者的几何平均恰好等于 C，
 * 因此纵轴是真正的协同基础，而不是某一个单要素。
 */
export function sampleSurface(steps: number): SurfacePoint[] {
  const size = Math.max(2, Math.floor(steps))
  const points: SurfacePoint[] = []
  for (let row = 0; row < size; row += 1) {
    const complementarity = row / (size - 1)
    for (let col = 0; col < size; col += 1) {
      const investment = col / (size - 1)
      points.push({
        investment,
        complementarity,
        index: evaluateProductivity({ investment, data: complementarity, process: complementarity, training: complementarity }).index,
      })
    }
  }
  return points
}

/**
 * 响应面上的单点查询，供交互读数使用。
 *
 * 与 `sampleSurface` 走同一条评价路径：令 data = process = training = C，
 * 于是几何平均恰好等于 C，和色块用的是同一个指数。这样交互读数与背景
 * 不会各算一套、给出两个数字。
 */
export function sampleAt(investment: number, complementarity: number): SurfaceSample {
  const nextInvestment = clamp01(investment)
  const nextComplementarity = clamp01(complementarity)
  const result = evaluateProductivity({
    investment: nextInvestment,
    data: nextComplementarity,
    process: nextComplementarity,
    training: nextComplementarity,
  })
  return {
    investment: nextInvestment,
    complementarity: nextComplementarity,
    index: result.index,
    result,
  }
}

/**
 * 响应面上两个**不同**的阈值。它们相差约 0.1，正是"颜色已经变亮、净收益却仍为负"
 * 的那段区间——所以在图上必须画两条线，也不能把两个量混为一谈。
 *
 * - `inflection`：指数对投入的偏导为零处（配色所依据的量的拐点）。
 *   index = 100·(1 + g·I·C − f·I·(1−C))，∂index/∂I = 100·(g·C − f·(1−C)) = 0
 *   ⟹ C = f / (g + f)。**与权重相关**，所以必须由权重算出。
 * - `balance`：gain 与 friction 相等处（结构收支平衡，与权重无关）。
 *   直接对评价函数本身二分求根，而不是写 0.5——这样即使日后 gain/friction
 *   的定义变了，这条线也会跟着走。
 */
export function surfaceThresholds(): { inflection: number; balance: number } {
  const { gain: gainWeight, friction: frictionWeight } = productivityWeights
  return {
    inflection: frictionWeight / (gainWeight + frictionWeight),
    balance: solveGainFrictionBalance(),
  }
}

function solveGainFrictionBalance(): number {
  let low = 0
  let high = 1
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2
    const { gain, friction } = evaluateProductivity({ investment: 1, data: mid, process: mid, training: mid })
    if (gain >= friction) high = mid
    else low = mid
  }
  return (low + high) / 2
}
