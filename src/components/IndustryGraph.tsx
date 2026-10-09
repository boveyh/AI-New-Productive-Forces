import { ArrowRight } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { casesForCapability, evidenceCases, evidenceLayerLabels, sharedCapabilities, type SharedCapability } from '../model/evidence'
import { industryLayers, industryNameForCase, industryNodes } from '../model/industry'

/* 折叠图的几何集中在一个对象里：改 viewBox 或挪列位置时，曲线和两组标签一起动。
   左列给案例名留了四个字宽的标签沟（75 往左 44 个单位），
   所以案例点从 87 起，而不是贴着左边界。 */
const foldLayout = {
  width: 405,
  height: 316,
  caseLabelX: 75,
  caseColumnX: 87,
  capabilityColumnX: 363,
  caseTop: 34,
  caseGap: 52,
  capabilityTop: 30,
  capabilityGap: 46,
}
const foldSpan = foldLayout.capabilityColumnX - foldLayout.caseColumnX
// 两个控制点的位置取自重构前手调的那一版（列 42 → 318 时的 200 与 170）。
// 用比例而不是字面量表达，以后挪列位置时曲线怎么折不会变。
const curveEntryX = Math.round(foldLayout.caseColumnX + foldSpan * 0.572)
const curveExitX = Math.round(foldLayout.capabilityColumnX - foldSpan * 0.536)

function caseY(index: number) {
  return foldLayout.caseTop + index * foldLayout.caseGap
}

function capabilityY(index: number) {
  return foldLayout.capabilityTop + index * foldLayout.capabilityGap
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
      <div className="fold-copy">
        <span className="scene-kicker">SHARED CAPABILITIES</span>
        <h3>五个案例先折叠为六种共享能力</h3>
        <p>相同的低成本判断进入不同任务，会落在不同的能力组合与流程约束上；能力名称和顺序只在同一张常量表里定义。</p>
      </div>
      <svg className="capability-fold-svg" viewBox={`0 0 ${foldLayout.width} ${foldLayout.height}`} aria-hidden="true">
        {evidenceCases.map((item, caseIndex) => item.capabilities.map((capability) => {
          const index = capabilityIndex.get(capability)!
          const active = item.id === activeCase.id
          return <path key={`${item.id}-${capability}`} className={active ? 'is-active' : ''} d={`M${foldLayout.caseColumnX} ${caseY(caseIndex)} C${curveEntryX} ${caseY(caseIndex)} ${curveExitX} ${capabilityY(index)} ${foldLayout.capabilityColumnX} ${capabilityY(index)}`} />
        }))}
        {evidenceCases.map((item, index) => <g key={item.id} className={`fold-case ${item.id === activeCase.id ? 'is-active' : ''}`}>
          <circle cx={foldLayout.caseColumnX} cy={caseY(index)} r="5" />
          <text x={foldLayout.caseLabelX} y={caseY(index) + 4} textAnchor="end">{industryNameForCase(item.id)}</text>
        </g>)}
        {sharedCapabilities.map((capability, index) => <g key={capability} className={`fold-capability ${activeCase.capabilities.includes(capability) ? 'is-active' : ''}`}>
          <circle cx={foldLayout.capabilityColumnX} cy={capabilityY(index)} r="7" />
          <text x={foldLayout.capabilityColumnX} y={capabilityY(index) - 13} textAnchor="middle">{capability}</text>
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
            另外两半的顺序由 industry.test.ts 锁住，所以这里能直接用案例下标。 */}
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
