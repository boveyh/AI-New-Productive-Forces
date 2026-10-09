import { ArrowRight, Warning } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { applyMode, buildField, fieldMetrics } from '../model/field'
import { sampleSurface } from '../model/productivity'
import { tradeoffCurve } from '../model/threshold'

const ledger = ledgerJson as LedgerEntry[]

const chartField = { seed: 11, cols: 14, rows: 7, weedRate: 0.18 }
const chartAccuracy = 0.85
const barMax = 210
const barLeft = 150

type ComparisonRow = { label: string; unit: string; values: [number, number]; format: (value: number) => string }

export function HerbicideSavingChart() {
  const { rows } = useMemo(() => {
    const grid = buildField(chartField)
    const blanket = fieldMetrics(applyMode(grid, 'blanket', chartAccuracy))
    const spot = fieldMetrics(applyMode(grid, 'spot', chartAccuracy))
    const built: ComparisonRow[] = [
      { label: '除草剂用量', unit: '占全田喷洒', values: [blanket.herbicideUnits * 100, spot.herbicideUnits * 100], format: (value) => `${Math.round(value)}%` },
      { label: '漏喷', unit: '格', values: [blanket.missed, spot.missed], format: (value) => `${value}` },
      { label: '误喷', unit: '格', values: [blanket.falseSpray, spot.falseSpray], format: (value) => `${value}` },
    ]
    return { rows: built }
  }, [])

  const entry = ledger.find((item) => item.id === 'deere-see-spray-77')!

  return <div className="mechanism-chart reveal">
    <div className="mechanism-head">
      <span className="scene-kicker">MECHANISM · 省药从哪里来</span>
      <h3>把整片喷洒换成识别后点喷，省下的是什么</h3>
    </div>

    <div className="mechanism-body">
      <div className="mechanism-sim">
        <div className="mechanism-sim-head">
          <span className="mechanism-tag">场景模拟</span>
          <small>识别准确率 {Math.round(chartAccuracy * 100)}% · 杂草覆盖率 {Math.round(chartField.weedRate * 100)}%</small>
        </div>
        <svg viewBox="0 0 460 270" role="img" aria-label={`同一块田下，全田喷洒与识别后点喷的除草剂用量、漏喷与误喷对比。除草剂用量由 ${Math.round(rows[0].values[0])}% 降到 ${Math.round(rows[0].values[1])}%。`}>
          {rows.map((row, index) => {
            const top = 40 + index * 88
            const max = Math.max(1, ...row.values)
            return <g key={row.label}>
              <text className="mechanism-row-label" x="0" y={top}>{row.label}</text>
              <text className="mechanism-row-unit" x="0" y={top + 17}>{row.unit}</text>
              {row.values.map((value, valueIndex) => {
                const length = Math.max(2, (value / max) * barMax)
                const barY = top + 6 + valueIndex * 20
                return <g key={valueIndex}>
                  <rect className={`mechanism-bar bar-${valueIndex}`} x={barLeft} y={barY} width={length} height={11} rx="5.5" />
                  <text className="mechanism-bar-value" x={barLeft + length + 10} y={barY + 6}>{row.format(value)}</text>
                </g>
              })}
            </g>
          })}
        </svg>
        <div className="mechanism-legend">
          <span><i className="blanket" />全田喷洒</span>
          <span><i className="spot" />识别后点喷</span>
        </div>
      </div>

      <aside className="mechanism-evidence">
        <span className="mechanism-evidence-tag"><Warning weight="fill" />厂商披露 · 有限证据</span>
        <strong>{entry.value}%</strong>
        <p><b>平均节省除草剂</b>{entry.year} · {entry.geography}</p>
        <p className="mechanism-caveat">{entry.claim}。{entry.caveats}</p>
        <a href={entry.sourceUrl} target="_blank" rel="noreferrer">查看原始来源 <ArrowRight /></a>
      </aside>
    </div>

    <p className="mechanism-note">左侧为教学模拟，右侧为厂商披露的限定场景数据，二者统计对象与口径不同，不作换算。</p>
  </div>
}

const accuracyOptions = [0.6, 0.85, 0.95]

export function ThresholdTradeoffChart() {
  const [accuracy, setAccuracy] = useState(0.85)
  const curve = useMemo(() => tradeoffCurve({ steps: 41, accuracy }), [accuracy])
  const crossing = curve.findIndex((point) => point.missedRate >= point.falseRate)
  const crossPoint = crossing > 0 ? curve[crossing] : null
  const x = (threshold: number) => 54 + threshold * 376
  const y = (rate: number) => 248 - rate * 200
  const line = (pick: (point: (typeof curve)[number]) => number) => curve.map((point) => `${x(point.decisionThreshold)},${y(pick(point))}`).join(' ')

  return <div className="mechanism-chart reveal">
    <div className="mechanism-head">
      <span className="scene-kicker">MECHANISM · 误差搬到哪里</span>
      <h3>提高判定阈值，只是把误差从一边搬到另一边</h3>
    </div>

    <div className="segmented" role="group" aria-label="识别准确率">
      {accuracyOptions.map((option) => <button key={option} type="button" aria-pressed={accuracy === option} onClick={() => setAccuracy(option)}>
        识别准确率 {Math.round(option * 100)}%
      </button>)}
    </div>

    <svg className="tradeoff-canvas" viewBox="0 0 460 300" role="img" aria-label={`识别准确率 ${Math.round(accuracy * 100)}% 下，判定阈值从 0 升到 1 时漏喷与误喷的此消彼长。`}>
      {[0, 0.25, 0.5, 0.75, 1].map((rate) => <g key={rate}>
        <line className="tradeoff-grid" x1="54" x2="430" y1={y(rate)} y2={y(rate)} />
        <text className="tradeoff-tick" x="44" y={y(rate) + 4} textAnchor="end">{Math.round(rate * 100)}%</text>
      </g>)}
      {[0, 0.5, 1].map((threshold) => <text key={threshold} className="tradeoff-tick" x={x(threshold)} y="270" textAnchor="middle">{threshold.toFixed(1)}</text>)}
      <text className="tradeoff-axis" x="242" y="292" textAnchor="middle">判定阈值（多高才触发喷洒）</text>

      <polyline className="tradeoff-line is-false" points={line((point) => point.falseRate)} />
      <polyline className="tradeoff-line is-missed" points={line((point) => point.missedRate)} />

      {crossPoint && <g className="tradeoff-crossing">
        <line x1={x(crossPoint.decisionThreshold)} x2={x(crossPoint.decisionThreshold)} y1="48" y2="248" />
        <circle cx={x(crossPoint.decisionThreshold)} cy={y(crossPoint.missedRate)} r="5" />
        <text x={x(crossPoint.decisionThreshold) + 10} y={y(crossPoint.missedRate) - 12}>这里需要人工复核</text>
      </g>}
    </svg>

    <div className="mechanism-legend">
      <span><i className="missed" />漏喷率</span>
      <span><i className="false" />误喷率</span>
    </div>

    <p className="mechanism-note">阈值只能决定误差如何分配，不能把两类误差同时清零。分配不掉的那部分，就是治理章要求保留人工复核的位置。</p>
  </div>
}

const surfaceSteps = 20
const surfaceBox = { left: 64, right: 430, top: 44, bottom: 252 }

function surfaceColor(ratio: number) {
  const from = [22, 28, 32]
  const to = [242, 106, 46]
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * ratio)
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`
}

export function ResponseSurfaceChart({ investment, complementarity }: { investment: number; complementarity: number }) {
  const grid = useMemo(() => sampleSurface(surfaceSteps), [])
  const bounds = useMemo(() => {
    const values = grid.map((point) => point.index)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [grid])
  const span = bounds.max - bounds.min || 1
  const width = surfaceBox.right - surfaceBox.left
  const height = surfaceBox.bottom - surfaceBox.top
  const cellW = width / (surfaceSteps - 1) + 0.8
  const cellH = height / (surfaceSteps - 1) + 0.8
  const x = (value: number) => surfaceBox.left + value * width
  const y = (value: number) => surfaceBox.bottom - value * height
  const markerX = x(Math.min(1, Math.max(0, investment)))
  const markerY = y(Math.min(1, Math.max(0, complementarity)))

  return <div className="mechanism-chart reveal">
    <div className="mechanism-head">
      <span className="scene-kicker">MECHANISM · 短板能不能被投入买回来</span>
      <h3>整个投入平面上，有效生产力指数长什么样</h3>
    </div>

    <svg className="surface-canvas" viewBox="0 0 460 320" role="img" aria-label={`AI投入强度与协同基础构成的响应面。当前投入 ${Math.round(investment * 100)}%，协同基础 ${Math.round(complementarity * 100)}%。`}>
      {grid.map((point) => <rect
        key={`${point.investment}-${point.complementarity}`}
        x={x(point.investment) - cellW / 2}
        y={y(point.complementarity) - cellH / 2}
        width={cellW}
        height={cellH}
        fill={surfaceColor((point.index - bounds.min) / span)}
      />)}

      <line className="surface-base-line" x1={surfaceBox.left} x2={surfaceBox.right} y1={y(0.5)} y2={y(0.5)} />
      <text className="surface-base-label" x={surfaceBox.right - 6} y={y(0.5) - 8} textAnchor="end">协同基础 0.5 · 收益开始超过摩擦</text>

      <circle className="surface-marker" cx={markerX} cy={markerY} r="7" />
      <circle className="surface-marker-ring" cx={markerX} cy={markerY} r="13" />

      {[0, 0.5, 1].map((tick) => <text key={`x-${tick}`} className="tradeoff-tick" x={x(tick)} y={surfaceBox.bottom + 20} textAnchor="middle">{(tick * 100).toFixed(0)}%</text>)}
      {[0, 0.5, 1].map((tick) => <text key={`y-${tick}`} className="tradeoff-tick" x={surfaceBox.left - 10} y={y(tick) + 4} textAnchor="end">{(tick * 100).toFixed(0)}%</text>)}
      <text className="tradeoff-axis" x={(surfaceBox.left + surfaceBox.right) / 2} y="300" textAnchor="middle">AI投入强度</text>
      <text className="tradeoff-axis" x={surfaceBox.left} y="32">协同基础（数据 × 流程 × 训练）</text>
    </svg>

    <div className="surface-scale">
      <span>有效生产力指数</span>
      <i />
      <span>{bounds.min.toFixed(0)} → {bounds.max.toFixed(0)}</span>
      <span className="surface-current"><b />当前位置 · 投入 {Math.round(investment * 100)}% / 协同 {Math.round(complementarity * 100)}%</span>
    </div>

    <p className="mechanism-note">横轴把投入推到多高，都不能越过协同基础的边界；纵轴低于 0.5 时，投入越多只是把收益变成摩擦。</p>
  </div>
}
