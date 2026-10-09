import { Check } from '@phosphor-icons/react'
import type { CSSProperties } from 'react'
import { resolveSliderState } from '../model/slider-state'
import { RangeInstrument } from './StorySystem'

export function HeroDecisionLine({ active }: { active: boolean }) {
  return <div className={`decision-line ${active ? 'is-active' : ''}`} aria-label="从植物识别到喷洒决策的路径">
    <svg viewBox="0 0 620 310" aria-hidden="true">
      <path className="decision-guide" d="M20 160 C90 160 92 72 160 72 C225 72 226 160 290 160 C358 160 360 236 426 236 C490 236 500 126 594 126" />
      <path className="decision-main" pathLength="1" d="M20 160 C90 160 92 72 160 72 C225 72 226 160 290 160 C358 160 360 236 426 236 C490 236 500 126 594 126" />
      <path className="plant-outline" pathLength="1" d="M116 86 C104 48 128 30 158 58 C178 26 208 48 198 88 M158 58 L160 126" />
      <circle className="decision-core" cx="290" cy="160" r="27" />
      <path className="decision-split" pathLength="1" d="M290 160 L354 112 M290 160 L354 208" />
      <rect className="weed-lock" x="392" y="204" width="68" height="62" rx="2" />
      <path className="spray" pathLength="1" d="M520 126 L520 180 M500 196 L520 180 L540 196" />
    </svg>
    <div className="decision-captions"><span>识别</span><span>计算</span><span>锁定</span><strong>判断成本下降</strong></div>
  </div>
}

const faultCopy = {
  none: ['系统闭环', '三种要素同步咬合，判断才能及时进入生产。'],
  data: ['看不清现场', '数据齿轮空转，路径出现断点，模型只能在不完整的现实上判断。'],
  compute: ['赶不上流程', '算力不足让信号在节点前堆积，正确答案也可能来得太晚。'],
  algorithm: ['走错了方向', '算法与任务不适配，脉冲会被送到错误的执行路径。'],
} as const

export type FactorFault = keyof typeof faultCopy

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
    <div className="machine-diagnosis" aria-live="polite"><span>系统诊断</span><h3>{title}</h3><p>{body}</p></div>
  </div>
}

export function ProcessCircuit({ mode, intervention, onIntervention }: { mode: '传统流程' | 'AI辅助' | '人机协同'; intervention: number; onIntervention: (value: number) => void }) {
  const interventionX = 130 + intervention * 5.5
  return <div className={`circuit-board circuit-${mode}`}>
    <svg viewBox="0 0 820 330" role="img" aria-label={`${mode}下的双轨流程。AI介入位置为${intervention}%`}>
      <defs><marker id="circuit-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" /></marker></defs>
      <text x="28" y="75">原始任务轨</text><text x="28" y="232">AI介入轨</text>
      <path className="track track-top" d="M130 70 H740" markerEnd="url(#circuit-arrow)" />
      <path className="track track-bottom" d={`M130 226 H${interventionX} C${interventionX + 32} 226 ${interventionX + 32} 180 ${interventionX + 64} 180 H740`} markerEnd="url(#circuit-arrow)" />
      {mode === '人机协同' && <path className="feedback-track" pathLength="1" d="M696 180 C696 298 286 298 286 226" markerEnd="url(#circuit-arrow)" />}
      {[150, 340, 530, 720].map((x, index) => <g key={x} className="circuit-node"><circle cx={x} cy="70" r="8" /><text x={x} y="46" textAnchor="middle">{['发现', '方案', '执行', '检查'][index]}</text></g>)}
      {[150, 340, 530, 720].map((x, index) => <g key={x} className="circuit-node lower"><circle cx={x} cy={index === 0 || x < interventionX ? 226 : 180} r="8" /><text x={x} y={index === 0 || x < interventionX ? 258 : 158} textAnchor="middle">{['输入', '生成', '执行', '反馈'][index]}</text></g>)}
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
