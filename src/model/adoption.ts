export type AdoptionSceneKey = 'depth' | 'size' | 'technology' | 'country'

export type Point = { x: number; y: number; active: boolean; group: number }

export const adoptionSceneOrder: AdoptionSceneKey[] = ['depth', 'size', 'technology', 'country']

export const adoptionSceneLabels: Record<AdoptionSceneKey, string> = {
  depth: '采用深度',
  size: '企业规模',
  technology: '技术类型',
  country: '国家差异',
}

export function scaleLinear(value: number, domain: [number, number], range: [number, number]) {
  if (domain[0] === domain[1]) return range[0]
  const ratio = (value - domain[0]) / (domain[1] - domain[0])
  return range[0] + ratio * (range[1] - range[0])
}

export function relativeGrowth(previous: number, current: number) {
  return ((current - previous) / previous) * 100
}

export function percentagePointGap(a: number, b: number) {
  return Math.abs(a - b)
}

export const rankedSafeArea = { titleBottom: 88, top: 112, bottom: 438, left: 270, right: 808 } as const

export function getRankedLayout(count: number) {
  const rowGap = count > 4 ? Math.min(48, (rankedSafeArea.bottom - rankedSafeArea.top) / Math.max(1, count - 1)) : 90
  return { start: rankedSafeArea.top, rowGap, positions: Array.from({ length: count }, (_, index) => rankedSafeArea.top + index * rowGap) }
}

export function getRankedValueRight(value: number, max: number) {
  return scaleLinear(value, [0, max], [rankedSafeArea.left, 700]) + 76
}

export function buildAtomLayout(scene: AdoptionSceneKey, count = 36): Point[] {
  return Array.from({ length: count }, (_, index) => {
    if (scene === 'depth') {
      const group = index % 3
      const step = Math.floor(index / 3)
      return { x: 128 + step * 47, y: 375 - group * 76 - step * (22 + group * 7), active: index < 27, group }
    }
    if (scene === 'size') {
      const group = index % 3
      const step = Math.floor(index / 3)
      return { x: 150 + step * (24 + group * 13), y: 148 + group * 118, active: step < 10, group }
    }
    if (scene === 'technology') {
      const group = index % 4
      const step = Math.floor(index / 4)
      return { x: 182 + step * 48, y: 115 + group * 90, active: step < 8, group }
    }
    const group = index % 7
    const step = Math.floor(index / 7)
    return { x: 160 + step * 76, y: 112 + group * 46, active: step < 5, group }
  })
}
