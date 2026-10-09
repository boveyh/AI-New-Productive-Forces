import { useMemo } from 'react'
import { applyMode, buildField, fieldMetrics, type SprayMode } from '../model/field'

const fieldGeometry = { cols: 14, rows: 7, cellW: 50, cellH: 44, x: 60, y: 70 }
const boomY = 406
const weedRate = 0.18

export const sprayModeOrder: SprayMode[] = ['blanket', 'spot', 'collaborative']

export const sprayModeLabels: Record<SprayMode, string> = {
  blanket: '全田喷洒',
  spot: '识别后点喷',
  collaborative: '人机协同',
}

const modeNotes: Record<SprayMode, string> = {
  blanket: '不看杂草，整片喷过去。用量最大，杂草一定被覆盖。',
  spot: '只对识别为杂草的位置开喷嘴。省药，但识别出错就会漏喷或误喷。',
  collaborative: '识别之后把低置信的位置交给人工复核，未被覆盖的部分仍会出错。',
}

type FieldViewProps = {
  mode: SprayMode
  accuracy?: number
  seed?: number
  animated?: boolean
  onModeChange?: (mode: SprayMode) => void
  compact?: boolean
}

function cellX(col: number) {
  return fieldGeometry.x + col * fieldGeometry.cellW
}

function cellY(row: number) {
  return fieldGeometry.y + row * fieldGeometry.cellH
}

export function FieldView({ mode, accuracy = 0.85, seed = 11, animated = false, onModeChange, compact = false }: FieldViewProps) {
  const grid = useMemo(() => buildField({ cols: fieldGeometry.cols, rows: fieldGeometry.rows, seed, weedRate }), [seed])
  const sprayed = useMemo(() => applyMode(grid, mode, accuracy), [grid, mode, accuracy])
  const metrics = useMemo(() => fieldMetrics(sprayed), [sprayed])

  const nozzles = useMemo(
    () => Array.from({ length: fieldGeometry.cols }, (_, col) =>
      sprayed.cells.some((cell) => cell.col === col && cell.sprayed)),
    [sprayed],
  )

  return <div className={`field-view ${compact ? 'is-compact' : ''}`}>
    <div className="field-view-head">
      <div>
        <span className="scene-kicker">FIELD SIMULATION · 同一块田</span>
        <h3>{sprayModeLabels[mode]}下的喷杆行为</h3>
      </div>
      <span className="field-simulation-tag">场景模拟</span>
    </div>

    {onModeChange && <div className="segmented" role="group" aria-label="喷洒策略">
      {sprayModeOrder.map((id) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => onModeChange(id)}>{sprayModeLabels[id]}</button>)}
    </div>}

    <div className="field-canvas">
      <svg viewBox="0 0 820 470" role="img" aria-label={`${sprayModeLabels[mode]}：除草剂用量为全田喷洒的 ${(metrics.herbicideUnits * 100).toFixed(0)}%，漏喷 ${metrics.missed} 格，误喷 ${metrics.falseSpray} 格。`}>
        <polygon className="field-camera-fov" points={`410,${boomY} 120,${fieldGeometry.y - 26} 700,${fieldGeometry.y - 26}`} />

        {sprayed.cells.map((cell) => <g key={`${cell.row}:${cell.col}`}>
          <rect className="field-cell" x={cellX(cell.col) + 1} y={cellY(cell.row) + 1} width={fieldGeometry.cellW - 2} height={fieldGeometry.cellH - 2} rx="3" />
          {cell.sprayed && <rect className="field-spray" x={cellX(cell.col) + 1} y={cellY(cell.row) + 1} width={fieldGeometry.cellW - 2} height={fieldGeometry.cellH - 2} rx="3" />}
          {cell.weed && <circle className={`field-weed ${cell.reviewed ? 'is-reviewed' : ''}`} cx={cellX(cell.col) + fieldGeometry.cellW / 2} cy={cellY(cell.row) + fieldGeometry.cellH / 2} r="6" />}
        </g>)}

        <line className="field-boom" x1={fieldGeometry.x} x2={fieldGeometry.x + fieldGeometry.cols * fieldGeometry.cellW} y1={boomY} y2={boomY} />
        {nozzles.map((on, col) => <circle key={col} className={`field-nozzle ${on ? 'is-on' : ''}`} cx={cellX(col) + fieldGeometry.cellW / 2} cy={boomY} r="7" />)}

        {animated && <line className="field-scan" x1={fieldGeometry.x} x2={fieldGeometry.x} y1={fieldGeometry.y - 26} y2={boomY} />}
      </svg>
      <p className="field-caption">{modeNotes[mode]}</p>
    </div>

    <div className="field-legend">
      <span><i className="weed" />杂草</span>
      <span><i className="spray" />已喷洒</span>
      <span><i className="review" />人工复核</span>
      <span><i className="nozzle" />喷嘴开启</span>
    </div>

    <div className="field-metrics" aria-live="polite">
      <span><b>{(metrics.herbicideUnits * 100).toFixed(0)}%</b>除草剂用量</span>
      <span><b>{metrics.missed}</b>漏喷</span>
      <span><b>{metrics.falseSpray}</b>误喷</span>
      <span><b>{metrics.reviewCount}</b>人工复核</span>
      <span><b>{metrics.nozzlePasses}</b>喷嘴开关</span>
    </div>

    <p className="field-assumption">教学假设：识别准确率直接映射为低置信格子的比例，准确率越低，需要人工复核的位置越多。</p>
  </div>
}
