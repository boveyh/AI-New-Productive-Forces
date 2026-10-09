import { ArrowRight, Warning } from '@phosphor-icons/react'
import { useMemo } from 'react'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { applyMode, buildField, fieldMetrics } from '../model/field'

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
