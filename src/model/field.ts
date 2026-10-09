export type SprayMode = 'blanket' | 'spot' | 'collaborative'

export type FieldCell = {
  col: number
  row: number
  weed: boolean
  confidence: number
  lowConfidence: boolean
  detected: boolean
  reviewed: boolean
  sprayed: boolean
}

export type FieldGrid = {
  cols: number
  rows: number
  seed: number
  cells: FieldCell[]
  weedCount: number
}

export type FieldMetrics = {
  herbicideUnits: number
  coverage: number
  missed: number
  falseSpray: number
  nozzlePasses: number
  reviewCount: number
}

// 人工复核永远只能覆盖一部分低置信格子，这是「复核成本」的来源。
export const defaultReviewCoverage = 0.6

function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function buildField(input: { cols: number; rows: number; seed: number; weedRate: number }): FieldGrid {
  const random = mulberry32(input.seed)
  const cells: FieldCell[] = []
  let weedCount = 0

  for (let row = 0; row < input.rows; row += 1) {
    for (let col = 0; col < input.cols; col += 1) {
      const weed = random() < input.weedRate
      const confidence = random()
      if (weed) weedCount += 1
      cells.push({ col, row, weed, confidence, lowConfidence: false, detected: weed, reviewed: false, sprayed: false })
    }
  }

  return { cols: input.cols, rows: input.rows, seed: input.seed, cells, weedCount }
}

export function applyMode(grid: FieldGrid, mode: SprayMode, accuracy: number, reviewCoverage = defaultReviewCoverage): FieldGrid {
  // 教学假设：accuracy 直接决定低置信格子的比例。
  const hesitation = 1 - clamp01(accuracy)
  const cells = grid.cells.map((cell) => {
    const lowConfidence = cell.confidence < hesitation
    if (mode === 'blanket') return { ...cell, lowConfidence, detected: cell.weed, sprayed: true, reviewed: false }
    const detected = lowConfidence ? !cell.weed : cell.weed
    return { ...cell, lowConfidence, detected, sprayed: detected, reviewed: false }
  })

  if (mode !== 'collaborative') return { ...grid, cells }

  const uncertain = cells.filter((cell) => cell.lowConfidence).sort((a, b) => a.row - b.row || a.col - b.col)
  const reviewedKeys = new Set(uncertain.slice(0, Math.round(uncertain.length * clamp01(reviewCoverage))).map((cell) => `${cell.row}:${cell.col}`))

  return {
    ...grid,
    cells: cells.map((cell) => (reviewedKeys.has(`${cell.row}:${cell.col}`) ? { ...cell, reviewed: true, sprayed: cell.weed } : cell)),
  }
}

export function fieldMetrics(grid: FieldGrid): FieldMetrics {
  let sprayedCount = 0
  let missed = 0
  let falseSpray = 0
  let reviewCount = 0

  for (const cell of grid.cells) {
    if (cell.sprayed) sprayedCount += 1
    if (cell.weed && !cell.sprayed) missed += 1
    if (!cell.weed && cell.sprayed) falseSpray += 1
    if (cell.reviewed) reviewCount += 1
  }

  let nozzlePasses = 0
  for (let col = 0; col < grid.cols; col += 1) {
    let wasSpraying = false
    for (let row = 0; row < grid.rows; row += 1) {
      const spraying = grid.cells[row * grid.cols + col].sprayed
      if (spraying && !wasSpraying) nozzlePasses += 1
      wasSpraying = spraying
    }
  }

  return {
    herbicideUnits: grid.cells.length === 0 ? 0 : sprayedCount / grid.cells.length,
    coverage: grid.weedCount === 0 ? 1 : 1 - missed / grid.weedCount,
    missed,
    falseSpray,
    nozzlePasses,
    reviewCount,
  }
}
