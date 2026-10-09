import { ArrowRight, CheckCircle, Warning } from '@phosphor-icons/react'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import { evidenceCases, evidenceLayerLabels } from '../model/evidence'

const ledger = ledgerJson as LedgerEntry[]

function formatValue(entry: LedgerEntry) {
  if (entry.unit.includes('million')) return `${entry.value}M+`
  if (entry.unit.includes('%')) return `${entry.value}%`
  return `${entry.value}`
}

function EvidenceTag({ entry }: { entry: LedgerEntry }) {
  if (entry.verificationStatus === 'qualified') return <span className="evidence evidence-limited"><Warning weight="fill" />有限证据</span>
  return <span className="evidence"><CheckCircle weight="fill" />{entry.sourceType === 'official' ? '官方来源' : '研究来源'}</span>
}

export function EvidenceTheater({ active, onSelect }: { active: number; onSelect: (index: number) => void }) {
  const item = evidenceCases[active]
  const entry = ledger.find((candidate) => candidate.id === item.ledgerId)!

  return <div className="evidence-theater reveal">
    <p className="theater-disclaimer">案例统计对象与指标不同，用于解释机制，不进行统一排名。</p>
    <div className="theater-stage">
      <div className="theater-flow">
        <svg viewBox="0 0 300 260" aria-hidden="true">
          <path className="flow-before" d="M40 210 H118 C150 210 150 130 182 130 H262" />
          <path className="flow-after" d="M40 210 H118 C150 210 150 84 182 84 H262" />
          <circle className="flow-anchor" cx="40" cy="210" r="7" />
          <circle className="flow-anchor" cx="262" cy="84" r="7" />
          <circle className="flow-pulse" cx="182" cy="84" r="6" />
          <text x="34" y="238">介入前</text>
          <text x="216" y="66">介入后</text>
        </svg>
      </div>
      <div className="theater-figure">
        <span className="theater-layer">{evidenceLayerLabels[item.layer]}</span>
        <strong>{formatValue(entry)}</strong>
        <p><b>{item.metricLabel}</b>{entry.year} · {entry.geography}</p>
        <EvidenceTag entry={entry} />
      </div>
    </div>
    <dl className="theater-structure">
      <div><dt>原来怎么做</dt><dd>{item.before}</dd></div>
      <div><dt>AI判断什么</dt><dd>{item.aiDecision}</dd></div>
      <div><dt>流程哪里改变</dt><dd>{item.processChange}</dd></div>
      <div><dt>结果如何衡量</dt><dd>{item.outcome}</dd></div>
    </dl>
    <details className="theater-drawer">
      <summary>证据限制与来源</summary>
      <p>{entry.methodology}。{entry.caveats}。</p>
      <a href={entry.sourceUrl} target="_blank" rel="noreferrer">打开来源 <ArrowRight /></a>
      {!entry.independentCorroboration && <small>当前仅有单一来源，尚未找到独立佐证。</small>}
    </details>
    <div className="theater-track" role="tablist" aria-label="五个证据案例轨道">
      {evidenceCases.map((candidate, index) => <button key={candidate.id} role="tab" aria-selected={index === active} onClick={() => onSelect(index)}>
        <small>0{index + 1}</small>
        <span>{evidenceLayerLabels[candidate.layer]}</span>
        <strong>{candidate.metricLabel}</strong>
      </button>)}
    </div>
  </div>
}
