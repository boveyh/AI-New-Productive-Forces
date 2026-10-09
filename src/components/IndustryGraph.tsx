import { ArrowRight } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { casesForCapability, evidenceCases, evidenceLayerLabels, sharedCapabilities, type SharedCapability } from '../model/evidence'
import { industryLayers, industryNodes } from '../model/industry'

const caseColumnX = 42
const capabilityColumnX = 318
const caseRowGap = 52
const capabilityRowGap = 46

function caseY(index: number) {
  return 34 + index * caseRowGap
}

function capabilityY(index: number) {
  return 30 + index * capabilityRowGap
}

export function IndustryGraph({ selected, onSelectCase }: { selected: number; onSelectCase: (index: number) => void }) {
  const industry = industryNodes[selected]
  const activeCase = evidenceCases.find((candidate) => candidate.id === industry.caseId)!
  const capabilityIndex = useMemo(
    () => new Map<SharedCapability, number>(sharedCapabilities.map((capability, index) => [capability, index])),
    [],
  )

  return <div className="industry-graph reveal">
    <div className="capability-fold">
      <span className="scene-kicker">SHARED CAPABILITIES</span>
      <h3>五个案例先折叠为六种共享能力</h3>
      <p>相同的低成本判断进入不同任务，会落在不同的能力组合与流程约束上；能力名称和顺序只在同一张常量表里定义。</p>
      <svg className="capability-fold-svg" viewBox="0 0 360 316" aria-hidden="true">
        {evidenceCases.map((item, caseIndex) => item.capabilities.map((capability) => {
          const index = capabilityIndex.get(capability)!
          const active = item.id === activeCase.id
          return <path key={`${item.id}-${capability}`} className={active ? 'is-active' : ''} d={`M${caseColumnX} ${caseY(caseIndex)} C200 ${caseY(caseIndex)} 170 ${capabilityY(index)} ${capabilityColumnX} ${capabilityY(index)}`} />
        }))}
        {evidenceCases.map((item, index) => <circle key={item.id} className={`fold-case ${item.id === activeCase.id ? 'is-active' : ''}`} cx={caseColumnX} cy={caseY(index)} r="5" />)}
        {sharedCapabilities.map((capability, index) => <g key={capability} className={`fold-capability ${activeCase.capabilities.includes(capability) ? 'is-active' : ''}`}>
          <circle cx={capabilityColumnX} cy={capabilityY(index)} r="7" />
          <text x={capabilityColumnX} y={capabilityY(index) - 13} textAnchor="middle">{capability}</text>
        </g>)}
      </svg>
      <ul className="capability-list">
        {sharedCapabilities.map((capability) => <li key={capability} className={activeCase.capabilities.includes(capability) ? 'is-active' : ''}>
          <strong>{capability}</strong><small>{casesForCapability(capability).length} 个案例</small>
        </li>)}
      </ul>
    </div>
    <div className="industry-expansion">
      <div className="industry-nodes" role="tablist" aria-label="从共享能力展开的行业">
        {/* 只发一个事件：行业和案例是同一次选择的两个说法，分开写就会漂移。
            两半的顺序由 industry.test.ts 锁住，所以这里能直接用案例下标。 */}
        {industryNodes.map((node, index) => <button key={node.id} role="tab" aria-selected={index === selected} onClick={() => onSelectCase(evidenceCases.findIndex((item) => item.id === node.caseId))}>
          <span>{node.name}</span><small>改变{node.outcome}</small>
        </button>)}
      </div>
      <div className="industry-detail" role="tabpanel" aria-live="polite">
        <ol>
          <li><b>{industryLayers[0]}</b>{industry.decision}</li>
          <li><b>{industryLayers[1]}</b>{industry.processNode}</li>
          <li><b>{industryLayers[2]}</b>{industry.outcome}</li>
        </ol>
        <div className="industry-case">
          <span>来自证据剧场</span>
          <strong>{evidenceLayerLabels[activeCase.layer]} · {activeCase.metricLabel}</strong>
          <p>{activeCase.outcome}</p>
          <div className="capability-path">{activeCase.capabilities.map((capability) => <span key={capability}>{capability}</span>)}</div>
          <button onClick={() => onSelectCase(evidenceCases.findIndex((item) => item.id === activeCase.id))}>在证据剧场查看 <ArrowRight /></button>
        </div>
      </div>
    </div>
  </div>
}
