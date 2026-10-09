import type { ProductivityInputs } from './productivity'

export type LabPreset = {
  id: string
  label: string
  explanation: string
  inputs: ProductivityInputs
}

export const labPresets: LabPreset[] = [
  { id: 'cautious-pilot', label: '谨慎试点', explanation: '投入尚不足以改变整个流程', inputs: { investment: 0.16, data: 0.42, process: 0.38, training: 0.46 } },
  { id: 'technology-island', label: '技术孤岛', explanation: '技术投入与数据、流程脱节', inputs: { investment: 0.76, data: 0.24, process: 0.32, training: 0.68 } },
  { id: 'automation-trap', label: '自动化陷阱', explanation: '自动化扩张快于培训和复核能力', inputs: { investment: 0.82, data: 0.76, process: 0.7, training: 0.18 } },
  { id: 'human-ai-synergy', label: '人机协同', explanation: '四项条件互补，收益超过摩擦', inputs: { investment: 0.74, data: 0.8, process: 0.76, training: 0.72 } },
]

const inputKeys = Object.keys(labPresets[0].inputs) as Array<keyof ProductivityInputs>

export function matchPreset(inputs: ProductivityInputs): LabPreset | undefined {
  return labPresets.find((preset) => inputKeys.every((key) => Math.abs(preset.inputs[key] - inputs[key]) < 0.005))
}

export function largestChangeKey(from: ProductivityInputs, to: ProductivityInputs): keyof ProductivityInputs {
  return inputKeys.reduce((best, key) => (Math.abs(to[key] - from[key]) > Math.abs(to[best] - from[best]) ? key : best))
}
