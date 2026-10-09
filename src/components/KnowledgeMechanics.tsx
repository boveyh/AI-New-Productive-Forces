import { Check, UserFocus } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { decisionSteps, decisionOutcome, type DecisionStepId } from '../model/decision-steps'
import { resolveSliderState } from '../model/slider-state'
import { RangeInstrument } from './StorySystem'

const stepPoints = [
  { x: 110, y: 92 },
  { x: 250, y: 152 },
  { x: 382, y: 104 },
  { x: 528, y: 176 },
]

const humanPoint = { x: 556, y: 262 }

const decisionPath = `M52 118 C78 118 88 ${stepPoints[0].y} ${stepPoints[0].x} ${stepPoints[0].y} C168 ${stepPoints[0].y} 196 ${stepPoints[1].y} ${stepPoints[1].x} ${stepPoints[1].y} C322 ${stepPoints[1].y} 316 ${stepPoints[2].y} ${stepPoints[2].x} ${stepPoints[2].y} C452 ${stepPoints[2].y} 458 ${stepPoints[3].y} ${stepPoints[3].x} ${stepPoints[3].y}`

function reflowPathFrom(index: number) {
  const point = stepPoints[index]
  return `M${point.x} ${point.y} C${point.x + 44} ${point.y + 26} ${humanPoint.x - 48} ${humanPoint.y - 34} ${humanPoint.x} ${humanPoint.y}`
}

export function DecisionSequence({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const [activeStep, setActiveStep] = useState(0)
  const [failedId, setFailedId] = useState<DecisionStepId | null>(null)
  const [completed, setCompleted] = useState(false)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  const failedIndex = failedId ? decisionSteps.findIndex((step) => step.id === failedId) : -1

  useEffect(() => {
    if (!active) {
      setActiveStep(0)
      setFailedId(null)
      setCompleted(false)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveStep(decisionSteps.length - 1)
      setCompleted(true)
      completeRef.current?.()
      return
    }
    setCompleted(false)
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      if (index >= decisionSteps.length) {
        window.clearInterval(timer)
        setCompleted(true)
        completeRef.current?.()
        return
      }
      setActiveStep(index)
    }, 620)
    return () => window.clearInterval(timer)
  }, [active])

  const selectedIndex = failedIndex >= 0 ? failedIndex : activeStep
  const selected = decisionSteps[selectedIndex]
  const failing = failedIndex >= 0
  const pulse = failing ? stepPoints[failedIndex] : stepPoints[activeStep]
  const cue = failing ? `${selected.failure} · ${selected.humanFallback}` : `${selected.label}通过`

  return <div className={`decision-sequence ${active ? 'is-active' : ''} ${failing ? 'is-failing' : ''}`}>
    <div className="decision-canvas">
      <svg viewBox="0 0 620 300" aria-label="休耕地定点喷洒：从识别现场到开启喷嘴的四步判断">
        <path className="decision-guide" d={decisionPath} />
        <path className="decision-main" pathLength="1" d={decisionPath} />
        {decisionSteps.map((step, index) => <g key={step.id} className={`decision-node ${!failing && index <= selectedIndex ? 'is-visited' : ''} ${index === selectedIndex ? 'is-current' : ''}`}>
          <circle cx={stepPoints[index].x} cy={stepPoints[index].y} r="15" />
          <text x={stepPoints[index].x} y={stepPoints[index].y - 26} textAnchor="middle">{step.label}</text>
        </g>)}
        <path className="spray-out" pathLength="1" d={`M${stepPoints[3].x} ${stepPoints[3].y} L${stepPoints[3].x + 34} ${stepPoints[3].y + 30} M${stepPoints[3].x + 14} ${stepPoints[3].y + 48} L${stepPoints[3].x + 34} ${stepPoints[3].y + 30} L${stepPoints[3].x + 54} ${stepPoints[3].y + 48}`} />
        {failing && <path key={failedId} className="reflow-path" pathLength="1" d={reflowPathFrom(failedIndex)} />}
        <circle className={failing ? 'decision-pulse is-reflow' : 'decision-pulse'} cx={pulse.x} cy={pulse.y} r="6" />
      </svg>
      <div className={`human-station ${failing ? 'is-active' : ''}`}>
        <UserFocus weight="duotone" />
        <span>人工复核</span>
      </div>
    </div>
    <div className="decision-steps" role="group" aria-label="四步判断动作">
      {decisionSteps.map((step, index) => <button key={step.id} type="button" aria-pressed={failedId === step.id} className={`${index === selectedIndex ? 'is-current' : ''} ${failedId === step.id ? 'is-failed' : ''}`} onClick={() => { setFailedId(failedId === step.id ? null : step.id); setCompleted(false) }}>
        <small>0{index + 1}</small><strong>{step.label}</strong><span>失败：{step.failure}</span>
      </button>)}
    </div>
    <p className="decision-cue" aria-live="polite">{cue}</p>
    {active && completed && !failing && <p className="decision-outcome"><strong>判断复制</strong>{decisionOutcome}</p>}
  </div>
}

const faultCopy = {
  none: ['系统闭环', '三种要素同步咬合：摄像头看清植物与地面，设备驶过前完成决策，喷嘴只对杂草开启。'],
  data: ['看不清植物与地面', '目标轮廓缺失，判断区域断裂，系统只能在残缺画面上决定是否喷洒。'],
  compute: ['赶不上喷嘴窗口', '设备驶过前无法完成识别和决策，脉冲在节点前堆积，正确答案也太晚。'],
  algorithm: ['喷洒对象混淆', '算法无法区分杂草与非目标区域，路径错误分叉，可能喷向不应触发的位置。'],
} as const

export type FactorFault = keyof typeof faultCopy

export const factorAgriculture = [
  { key: 'data', factor: '数据', task: '摄像头是否看清植物与地面', failure: '目标轮廓缺失，判断区域断裂' },
  { key: 'compute', factor: '算力', task: '设备驶过前能否完成识别和决策', failure: '脉冲堆积，错过喷嘴窗口' },
  { key: 'algorithm', factor: '算法', task: '能否区分杂草与非目标区域', failure: '路径错误分叉，喷洒对象混淆' },
] as const

export function FactorMachine({ fault, onChange }: { fault: FactorFault; onChange: (fault: FactorFault) => void }) {
  const [title, body] = faultCopy[fault]
  return <div className={`factor-machine fault-${fault}`}>
    <div className="gear-stage" aria-hidden="true">
      <svg viewBox="0 0 620 360">
        <path className="machine-path" pathLength="1" d="M54 180 H180 C220 180 218 95 270 95 H350 C408 95 400 246 460 246 H570" />
        <g className="gear gear-data" transform="translate(190 180)"><circle r="62" /><circle r="24" /><text textAnchor="middle" y="5">数据</text></g>
        <g className="gear gear-compute" transform="translate(315 105)"><circle r="52" /><circle r="20" /><text textAnchor="middle" y="5">算力</text></g>
        <g className="gear gear-algorithm" transform="translate(430 212)"><circle r="67" /><circle r="25" /><text textAnchor="middle" y="5">算法</text></g>
        {[0, 1, 2, 3, 4].map((index) => <circle key={index} className={`machine-pulse pulse-${index}`} r="5" />)}
        <path className="wrong-route" pathLength="1" d="M430 212 C472 156 515 146 566 108" />
      </svg>
    </div>
    <div className="factor-controls" role="group" aria-label="测试生产要素故障">
      <button aria-pressed={fault === 'none'} onClick={() => onChange('none')}><Check /> 全部接通</button>
      <button aria-pressed={fault === 'data'} onClick={() => onChange('data')}>降低数据</button>
      <button aria-pressed={fault === 'compute'} onClick={() => onChange('compute')}>降低算力</button>
      <button aria-pressed={fault === 'algorithm'} onClick={() => onChange('algorithm')}>降低算法</button>
    </div>
    <dl className="factor-agriculture" aria-label="要素在同一除草作业中的作用">
      {factorAgriculture.map((item) => <div key={item.key} className={fault === item.key ? 'is-fault' : ''}>
        <dt>{item.factor}</dt>
        <dd>{item.task}</dd>
        <dd className="factor-failure">{item.failure}</dd>
      </div>)}
    </dl>
    <div className="machine-diagnosis" aria-live="polite"><span>系统诊断</span><h3>{title}</h3><p>{body}</p></div>
  </div>
}

export function ProcessCircuit({ mode, intervention, onIntervention }: { mode: '传统流程' | 'AI辅助' | '人机协同'; intervention: number; onIntervention: (value: number) => void }) {
  const interventionX = 130 + intervention * 5.5
  return <div className={`circuit-board circuit-${mode}`}>
    <svg viewBox="0 0 820 330" role="img" aria-label={`${mode}下的双轨流程。AI介入位置为${intervention}%`}>
      <defs><marker id="circuit-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" /></marker></defs>
      <text x="28" y="75">原始除草作业</text><text x="28" y="232">AI识别与执行</text>
      <path className="track track-top" d="M130 70 H740" markerEnd="url(#circuit-arrow)" />
      <path className="track track-bottom" d={`M130 226 H${interventionX} C${interventionX + 32} 226 ${interventionX + 32} 180 ${interventionX + 64} 180 H740`} markerEnd="url(#circuit-arrow)" />
      {mode === '人机协同' && <path className="feedback-track" pathLength="1" d="M696 180 C696 298 286 298 286 226" markerEnd="url(#circuit-arrow)" />}
      {[150, 340, 530, 720].map((x, index) => <g key={x} className="circuit-node"><circle cx={x} cy="70" r="8" /><text x={x} y="46" textAnchor="middle">{['观察区域', '统一喷洒', '人工复核', '结果统计'][index]}</text></g>)}
      {[150, 340, 530, 720].map((x, index) => <g key={x} className="circuit-node lower"><circle cx={x} cy={index === 0 || x < interventionX ? 226 : 180} r="8" /><text x={x} y={index === 0 || x < interventionX ? 258 : 158} textAnchor="middle">{['识别杂草', '局部喷洒', '异常复核', '结果反馈'][index]}</text></g>)}
      <g className="intervention-node"><line x1={interventionX} x2={interventionX} y1="198" y2="254" /><circle cx={interventionX} cy="226" r="13" /><text x={interventionX} y="286" textAnchor="middle">介入点</text></g>
      {mode === '传统流程' && <g className="wait-nodes">{[245, 435, 625].map((x) => <circle key={x} cx={x} cy="70" r="17" />)}</g>}
    </svg>
    <RangeInstrument kind="ai-position" label="AI介入位置" value={intervention} onChange={onIntervention} metricUnits={{ 等待节点: '个' }} />
    <div className="circuit-legend"><span><i className="solid" />执行路径</span><span><i className="wait" />等待节点</span>{mode === '人机协同' && <span><i className="loop" />反馈闭环</span>}</div>
  </div>
}

export function GovernanceRing({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const state = resolveSliderState('governance', value)
  return <div className="governance-mechanism">
    <div className="governance-ring" style={{ '--governance': value / 100 } as CSSProperties} aria-hidden="true">
      <div className="ring-core"><span>{state.metrics.决策速度}</span><small>决策/秒</small></div>
      {[0, 1, 2, 3].map((index) => <i key={index} style={{ '--claw': index } as CSSProperties} />)}
      <div className="ring-crack" />
    </div>
    <div className="governance-controls">
      <span className="scene-kicker">MECHANICAL LIMITER</span>
      <h3>给高速系统加上限位</h3>
      <p>治理不是把系统关掉，而是用复核、权限和审计控制错误能传播多远。</p>
      <RangeInstrument kind="governance" label="治理约束强度" value={value} onChange={onChange} metricUnits={{ 决策速度: '/秒' }} />
    </div>
  </div>
}
