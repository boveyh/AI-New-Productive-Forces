import { buildField } from './field'

export type TradeoffPoint = {
  decisionThreshold: number
  missedRate: number
  falseRate: number
}

const curveField = { seed: 11, cols: 14, rows: 7, weedRate: 0.18 }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * 识别系统对每个格子给出一个分数，判定阈值决定多高的分数才触发喷洒。
 * 教学假设与田地模型保持一致：`confidence < 1 - accuracy` 的格子是「低置信格子」。
 * 低置信格子的分数与真实类别无关，均匀铺满整个区间，因此会同时造成漏喷和误喷，
 * 两条曲线才会在中间区域真正交叉，而不是退化成一个没有误差的窗口。
 */
function scoreFor(weed: boolean, confidence: number, accuracy: number) {
  const hesitation = 1 - accuracy
  if (hesitation > 0 && confidence < hesitation) return confidence / hesitation
  return weed ? 1 : 0
}

export function tradeoffCurve(input: { steps: number; accuracy: number }): TradeoffPoint[] {
  const grid = buildField(curveField)
  const weeds = grid.cells.filter((cell) => cell.weed)
  const others = grid.cells.filter((cell) => !cell.weed)
  const accuracy = clamp01(input.accuracy)
  const steps = Math.max(2, Math.floor(input.steps))

  return Array.from({ length: steps }, (_, index) => {
    const decisionThreshold = index / (steps - 1)
    const sprayedWeeds = weeds.filter((cell) => scoreFor(true, cell.confidence, accuracy) >= decisionThreshold).length
    const sprayedOthers = others.filter((cell) => scoreFor(false, cell.confidence, accuracy) >= decisionThreshold).length
    return {
      decisionThreshold,
      missedRate: weeds.length === 0 ? 0 : 1 - sprayedWeeds / weeds.length,
      falseRate: others.length === 0 ? 0 : sprayedOthers / others.length,
    }
  })
}
