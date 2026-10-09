import { ArrowDown, ArrowRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { causalNodes, domainPaths, pulseGeometry, pulsePathId, storyBridges, type CausalNodeId, type StoryBridgeEntry } from '../model/story'
import { resolveSliderState, sliderThresholds, type SliderKind } from '../model/slider-state'

export function CausalRail({ activeId }: { activeId: CausalNodeId }) {
  const [selected, setSelected] = useState<CausalNodeId>(activeId)
  const railRef = useRef<HTMLElement>(null)
  const active = causalNodes.find((node) => node.id === selected) ?? causalNodes[0]

  useEffect(() => {
    setSelected(activeId)
    railRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [activeId])

  return <aside ref={railRef} className="causal-rail" aria-label="AI成为生产力的因果链">
    <div className="causal-steps">
      {causalNodes.map((node, index) => <a key={node.id} href={`#${node.target}`} aria-current={activeId === node.id ? 'step' : undefined} onClick={() => setSelected(node.id)} onFocus={() => setSelected(node.id)} onMouseEnter={() => setSelected(node.id)}><span>{node.label}</span>{index < causalNodes.length - 1 && <ArrowRight aria-hidden="true" />}</a>)}
    </div>
    <p aria-live="polite"><b>{active.label}</b>{active.proof}</p>
  </aside>
}

export function StorySpine() {
  return <svg className="story-spine" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-pulse-path-id={pulsePathId}>
    <path className="story-spine-guide" d="M50 0 V88" />
    <path id={pulsePathId} className="story-spine-pulse" pathLength="1" d="M50 0 V88" />
    {pulseGeometry.causalNodes.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r=".7" />)}
  </svg>
}

function BridgeVisual({ bridge }: { bridge: StoryBridgeEntry }) {
  if (bridge.kind === 'morph') return <svg className="bridge-visual" viewBox="0 0 160 72" aria-hidden="true">
    {[0, 1, 2, 3].map((index) => <circle key={`old-${index}`} className="bridge-unit-old" cx={12 + index * 6} cy={56 - index * 5} r="3" />)}
    <path className="bridge-connector" d="M40 42 C66 40 76 26 98 24" />
    {[0, 1, 2, 3].map((index) => <circle key={`new-${index}`} className="bridge-unit-new" cx={104 + index * 14} cy={24 + (index % 2) * 16} r="3" />)}
  </svg>

  if (bridge.kind === 'relay') return <svg className="bridge-visual" viewBox="0 0 160 72" aria-hidden="true">
    <path className="bridge-track" d="M14 36 H146" />
    <circle className="bridge-handoff" cx="56" cy="36" r="7" />
    <circle className="bridge-token" cx="112" cy="36" r="4" />
    <path className="bridge-connector" d="M64 36 H104" />
  </svg>

  if (bridge.kind === 'overlay') return <svg className="bridge-visual" viewBox="0 0 160 72" aria-hidden="true">
    <path className="bridge-path-old" d="M14 54 H60 C76 54 78 24 94 24 H146" />
    <path className="bridge-path-new" d="M14 54 H60 C76 54 78 24 94 24 H146" />
  </svg>

  return <svg className="bridge-visual" viewBox="0 0 160 72" aria-hidden="true">
    <path className="bridge-track" d="M14 60 H146" />
    <path className="bridge-constraint" d="M30 60 L70 22 H120" />
    <path className="bridge-constraint-bar" d="M70 22 V60" />
  </svg>
}

export function StoryBridge({ id }: { id: string }) {
  const bridge = storyBridges.find((item) => item.id === id)
  if (!bridge) return null
  return <section className={`story-bridge bridge-${bridge.kind} bridge-${bridge.layout}`} data-node-id={bridge.nodeId} data-pulse-path-id={pulsePathId}>
    <div className="bridge-marker"><span /></div>
    <div className="bridge-desktop">
      <BridgeVisual bridge={bridge} />
      <div className="bridge-copy">
        <span className="bridge-action">{bridge.action}</span>
        <p>{bridge.conclusion}</p>
        {bridge.question && <strong>{bridge.question}</strong>}
      </div>
    </div>
    <details><summary>{bridge.question ?? bridge.action}<ArrowDown /></summary><p>{bridge.conclusion}</p></details>
  </section>
}

type RangeInstrumentProps = {
  kind: SliderKind
  label: string
  value: number
  onChange: (value: number) => void
  params?: Record<string, number>
  metricUnits?: Record<string, string>
  compact?: boolean
}

export function RangeInstrument({ kind, label, value, onChange, params, metricUnits = {}, compact = false }: RangeInstrumentProps) {
  const state = resolveSliderState(kind, value, params)
  const previousStage = useRef(state.stageIndex)
  const [thresholdMessage, setThresholdMessage] = useState('')
  const descriptionId = `${kind}-${label.replace(/\s/g, '')}-description`

  useEffect(() => {
    if (previousStage.current !== state.stageIndex) setThresholdMessage(`跨过关键节点，进入${state.stageName}：${state.explanation}`)
    previousStage.current = state.stageIndex
  }, [state.explanation, state.stageIndex, state.stageName])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Home') { event.preventDefault(); onChange(0) }
    if (event.key === 'End') { event.preventDefault(); onChange(100) }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const direction = event.key === 'PageUp' ? 1 : -1
      const next = sliderThresholds[Math.min(4, Math.max(0, state.stageIndex + direction))]
      onChange(next)
    }
  }

  return <div className={`range-instrument ${compact ? 'is-compact' : ''}`}>
    <div className="range-heading"><span>{label}</span><output>{state.value}</output><strong>{state.stageName}</strong></div>
    <div className="range-track-wrap">
      <input aria-label={label} aria-describedby={descriptionId} type="range" min="0" max="100" step="1" value={state.value} onKeyDown={onKeyDown} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="range-thresholds">{sliderThresholds.map((threshold, index) => <button key={threshold} type="button" aria-label={`设置为${threshold}`} className={(state.value === 100 ? index === 4 : state.stageIndex === index) ? 'active' : state.value > threshold ? 'passed' : ''} onClick={() => onChange(threshold)}><i /><span>{threshold}</span></button>)}</div>
    </div>
    <p id={descriptionId} className="range-explanation">{state.explanation}</p>
    <p className={`threshold-cue ${thresholdMessage ? 'is-visible' : ''}`}>{thresholdMessage || (state.thresholdCrossed ? `关键节点 · ${state.stageName}` : '')}</p>
    {!compact && <><div className="range-tradeoff"><span><b>收益</b>{state.benefit}</span><span><b>代价</b>{state.cost}</span></div><div className="range-metrics">{Object.entries(state.metrics).map(([name, metric]) => <span key={name}><b>{metric}{metricUnits[name] ?? '%'}</b>{name}</span>)}</div></>}
    <span className="sr-only" aria-live="polite">{thresholdMessage || `${state.stageName}。${state.explanation}`}</span>
  </div>
}

export function FinalExpansion() {
  const [selected, setSelected] = useState(0)
  const current = domainPaths[selected]
  const branchPaths = ['M50 88 C42 90 24 91 15 96', 'M50 88 C47 92 39 94 36 98', 'M50 88 C53 92 61 94 64 98', 'M50 88 C58 90 76 91 85 96']

  return <div className="final-expansion" data-pulse-path-id={pulsePathId}>
    <div className="constraint-frame">
      <span className="scene-kicker">ONE MECHANISM · FOUR IRREDUCIBLE CONSTRAINTS</span>
      <h3>可复制的判断向AI迁移，<br />不可压缩的约束留在人这一侧。</h3>
      <p>验证与实时性属于过程侧；责任与信息损耗属于制度侧。它们彼此不能替代。</p>
    </div>
    <svg viewBox="0 82 100 18" preserveAspectRatio="none" aria-hidden="true">
      {branchPaths.map((path, index) => <path key={path} d={path} className={selected === index ? 'active' : ''} />)}
      <circle cx={pulseGeometry.splitPoint.x} cy={pulseGeometry.splitPoint.y} r="1.1" />
    </svg>
    <div className="domain-paths" role="tablist" aria-label="四种不可压缩约束">
      {domainPaths.map((path, index) => <button key={path.id} role="tab" aria-selected={selected === index} onClick={() => setSelected(index)}><small>{path.name} · {path.constraintSide}</small><strong>{path.verb}</strong><span>{path.constraint}</span></button>)}
    </div>
    <div className="domain-detail" role="tabpanel" aria-live="polite">
      <span><b>判断迁移</b>{current.domainAction}</span><ArrowRight /><span><b>流程重构</b>{current.process}</span><ArrowRight /><span><b>结果改变</b>{current.result}</span><ArrowRight /><span><b>治理边界</b>{current.governance}</span>
    </div>
    <div className="return-to-field"><span>回到那块田</span><p>“喷，还是不喷”没有消失，而是被拆成更多可以复制的小判断。可复制判断拆得越细，剩下的不可复制判断就越需要被明确指认。</p></div>
    <div className="non-transferable"><p>识别规则：如果判断出错，责任能否完整、明确地转移给另一个人或系统？不能转移的，就必须留下清晰的人类责任节点。</p><ul><li>高影响且不可逆</li><li>责任无法转移</li><li>依赖现场身体经验</li><li>涉及价值排序</li></ul></div>
  </div>
}
