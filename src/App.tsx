import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle, Database, Gauge, Leaf, Warning } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AdoptionStory } from './components/AdoptionStory'
import { ConclusionSummary } from './components/ConclusionSummary'
import { EvidenceTheater } from './components/EvidenceTheater'
import { FieldView } from './components/FieldView'
import { IndustryGraph } from './components/IndustryGraph'
import { HerbicideSavingChart, ResponseSurfaceChart, ThresholdTradeoffChart } from './components/MechanismCharts'
import { DecisionSequence, FactorMachine, GovernanceRing, ProcessCircuit, type FactorFault } from './components/KnowledgeMechanics'
import { CausalRail, FinalExpansion, RangeInstrument, StoryBridge, StorySpine } from './components/StorySystem'
import ledgerJson from './data/data-ledger.json'
import type { LedgerEntry } from './data/ledger-types'
import type { AdoptionSceneKey } from './model/adoption'
import { decisionContext } from './model/decision-steps'
import { evidenceCases } from './model/evidence'
import type { SprayMode } from './model/field'
import { industryIndexForCase } from './model/industry'
import { labPresets, largestChangeKey, matchPreset, type LabPreset } from './model/presets'
import { evaluateProductivity, type ProductivityInputs } from './model/productivity'
import { resolveSliderState } from './model/slider-state'
import { causalNodes, chapterLabels, chapterOrder, type CausalNodeId } from './model/story'

const PersistentScene = lazy(() =>
  import('./scene/PersistentScene').then((module) => ({ default: module.PersistentScene })),
)

gsap.registerPlugin(ScrollTrigger)

const ledger = ledgerJson as LedgerEntry[]
const chapterIds = chapterOrder
const chapters = chapterOrder.map((id) => chapterLabels[id])

const processSprayMode: Record<'传统流程' | 'AI辅助' | '人机协同', SprayMode> = {
  传统流程: 'blanket',
  AI辅助: 'spot',
  人机协同: 'collaborative',
}

const macroSignals = [
  { id: 'miit-ai-enterprises-4500', value: '4,500+', label: '中国AI企业' },
  { id: 'cnnic-genai-users-602m', value: '6.02亿', label: '中国生成式AI用户' },
  { id: 'ifr-china-robots-295k', value: '29.5万', label: '中国工业机器人新增安装' },
  { id: 'eurostat-ai-depth-2025', value: '20.0%', label: '欧盟企业AI采用率' },
]

const inputNames: Record<keyof ProductivityInputs, string> = {
  investment: 'AI投入强度',
  data: '数据准备度',
  process: '流程适配度',
  training: '人员训练度',
}

const sliderLabels: Array<[keyof ProductivityInputs, string, number]> = [
  ['investment', 'AI投入强度', 0],
  ['data', '数据准备度', 1],
  ['process', '流程适配度', 2],
  ['training', '人员训练度', 3],
]

function EvidenceBadge({ entry }: { entry: LedgerEntry }) {
  const limited = entry.verificationStatus === 'qualified'
  return (
    <span className={limited ? 'evidence evidence-limited' : 'evidence'} title={entry.caveats}>
      {limited ? <Warning weight="fill" /> : <CheckCircle weight="fill" />}
      {limited ? '有限证据' : '已核验'}
    </span>
  )
}

export function App() {
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeCausal, setActiveCausal] = useState<CausalNodeId>('decision')
  const [ignited, setIgnited] = useState(false)
  const [processMode, setProcessMode] = useState<'传统流程' | 'AI辅助' | '人机协同'>('传统流程')
  // 开场那块田的喷洒策略。FieldView 自带模式切换，但只在传入 onModeChange 时才渲染，
  // 而两处调用都没有传 —— 于是标题写着「识别后点喷下的喷杆行为」，
  // 读者却找不到切换入口。开场这一处补上，流程章那处由该章的流程模式控件负责。
  const [heroSpray, setHeroSpray] = useState<SprayMode>('spot')
  const [inputs, setInputs] = useState<ProductivityInputs>({ investment: 0.62, data: 0.42, process: 0.48, training: 0.3 })
  // 响应面写入前的一次快照。只记录一档，和预设按钮共用同一条恢复路径，
  // 不引入新的状态机。
  const [labRestore, setLabRestore] = useState<ProductivityInputs | null>(null)
  const [governance, setGovernance] = useState(18)
  const [augmentation, setAugmentation] = useState(62)
  const [selectedIndustry, setSelectedIndustry] = useState(0)
  const [adoptionScene, setAdoptionScene] = useState<AdoptionSceneKey>('depth')
  const [factorFault, setFactorFault] = useState<FactorFault>('none')
  const [intervention, setIntervention] = useState(48)
  const [activeCase, setActiveCase] = useState(0)
  const [presetNote, setPresetNote] = useState<string | null>(null)
  // 高亮只走一个方向：总结表 → 星图。这里存的是表格当前指向的环节下标，
  // 星图只读不写，所以不需要反向的状态，也就不会变成第二个导航。
  const [focusStage, setFocusStage] = useState<number | null>(null)
  const riskMode = governance >= 50 ? '负责任采用' : '无治理扩张'
  const result = useMemo(() => evaluateProductivity(inputs), [inputs])
  const labState = useMemo(() => resolveSliderState('productivity', result.complementarity * 100, { complementarity: result.complementarity }), [result.complementarity])
  const activePreset = matchPreset(inputs)
  const nearestPreset = useMemo(() => labPresets.reduce((best, preset) => {
    const distance = (Object.keys(preset.inputs) as Array<keyof ProductivityInputs>).reduce((total, key) => total + Math.abs(preset.inputs[key] - inputs[key]), 0)
    return distance < best.distance ? { preset, distance } : best
  }, { preset: labPresets[0], distance: Number.POSITIVE_INFINITY }), [inputs])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const triggers = chapterIds.map((id, index) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: ({ isActive }) => isActive && setActiveChapter(index),
      }),
    )
    const causalTriggers = causalNodes.map((node) => ScrollTrigger.create({
      trigger: `#${node.target}`,
      start: 'top 48%',
      end: 'bottom 36%',
      onToggle: ({ isActive }) => isActive && setActiveCausal(node.id),
    }))
    if (!reduced) {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        gsap.fromTo(element, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } })
      })
    }
    return () => [...triggers, ...causalTriggers].forEach((trigger) => trigger.kill())
  }, [])

  const ignite = () => setIgnited(true)

  const applyPreset = (preset: LabPreset) => {
    const key = largestChangeKey(inputs, preset.inputs)
    const delta = Math.round((preset.inputs[key] - inputs[key]) * 100)
    setInputs(preset.inputs)
    setLabRestore(null)
    setPresetNote(`主要调整 ${inputNames[key]} ${delta >= 0 ? '+' : ''}${delta} → ${preset.label}`)
  }

  /** 点击响应面：把该点的投入与协同基础写进模拟器。 */
  const applySurfacePoint = (investment: number, complementarity: number) => {
    setLabRestore(inputs)
    setInputs({ investment, data: complementarity, process: complementarity, training: complementarity })
    setPresetNote(null)
  }

  const restoreLabInputs = () => {
    if (!labRestore) return
    setInputs(labRestore)
    setLabRestore(null)
  }

  // 证据剧场和展开区选的是同一件事（五个案例与五个行业一一对应），
  // 过去却各存一个 state：从剧场选案例时行业页签不动，两半会互相矛盾。
  // 现在这两个 state 只由这一个函数写。
  const selectCase = useCallback((caseIndex: number) => {
    setActiveCase(caseIndex)
    const item = evidenceCases[caseIndex]
    const industryIndex = item ? industryIndexForCase(item.id) : -1
    if (industryIndex >= 0) setSelectedIndustry(industryIndex)
  }, [])

  const handleDecisionComplete = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.querySelector('#adoption')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }, [])

  return (
    <div className="app">
      <Suspense fallback={<div className="scene scene-fallback" aria-hidden="true" />}>
        <PersistentScene
          chapterId={chapterIds[Math.min(activeChapter, chapterIds.length - 1)]}
          ignited={ignited}
          productivity={result.index}
          processMode={processMode}
          selectedIndustry={Math.min(selectedIndustry, 2)}
          riskMode={riskMode}
          focusIndex={focusStage}
        />
      </Suspense>
      <header className="nav-shell">
        <a className="brand" href="#engine">AI生产力引擎</a>
        <nav aria-label="章节导航">
          {chapters.map((chapter, index) => (
            <a key={chapter} href={`#${chapterIds[index]}`} className={activeChapter === index ? 'active' : ''}>{chapter}</a>
          ))}
        </nav>
        <span className="chapter-count">{String(activeChapter + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</span>
        <div className="progress" style={{ transform: `scaleX(${(activeChapter + 1) / chapters.length})` }} />
      </header>
      <CausalRail activeId={activeCausal} />

      <main>
        <StorySpine />
        <section id="engine" className="hero chapter">
          <div className="hero-copy reveal">
            <p className="eyebrow">过去靠增加土地、设备和劳动扩大生产。现在，AI开始降低判断成本。</p>
            <h1>喷，还是不喷？</h1>
            <p className="hero-intro">在{decisionContext.scene}中，摄像头要分清{decisionContext.distinguishes}，判断结果决定{decisionContext.action}。这不是一个农业问题——我们将追踪这次田间判断，看它如何被复制、进入流程，并最终变成一种新的生产力。</p>
            <dl className="hero-context">
              <div><dt>场景</dt><dd>{decisionContext.scene}</dd></div>
              <div><dt>判断对象</dt><dd>{decisionContext.target}</dd></div>
              <div><dt>动作后果</dt><dd>{decisionContext.action}</dd></div>
            </dl>
            <button className="primary-button" onClick={ignite}>
              {ignited ? '判断正在复制' : '启动决策引擎'} <ArrowRight weight="bold" />
            </button>
          </div>
          <DecisionSequence active={ignited} onComplete={handleDecisionComplete} />
          <div className="engine-field reveal">
            <p className="engine-field-lead">把镜头从一株拉到整块田：同一个判断被复制到每一个喷嘴，投入的变化才第一次可见。</p>
            <FieldView mode={heroSpray} accuracy={0.92} animated={ignited} onModeChange={setHeroSpray} />
          </div>
        </section>
        <StoryBridge id="decision-task" />

        <section id="adoption" className="adoption-section chapter" aria-labelledby="adoption-title">
          <div className="section-copy adoption-heading reveal">
            <p className="eyebrow">为什么是现在</p>
            <h2 id="adoption-title">采用率在上升，生产力却不会自动发生</h2>
            <p>2025年，五分之一的欧盟企业已经使用AI。但同一条增长曲线里，藏着采用深度、组织规模、任务类型与地区条件四种完全不同的扩散速度。</p>
          </div>
          <AdoptionStory scene={adoptionScene} onSceneChange={setAdoptionScene} />
        </section>
        <StoryBridge id="task-factors" />

        <section id="factors" className="factor-section chapter" aria-labelledby="factor-title">
          <div className="section-copy reveal">
            <h2 id="factor-title">判断并非凭空出现</h2>
            <p>数据提供现场，算力压缩时间，算法把输入变成可以执行的选择。三者缺一，智能就无法进入生产。</p>
          </div>
          <FactorMachine fault={factorFault} onChange={setFactorFault} />
        </section>
        <StoryBridge id="factors-process" />

        <section id="process" className="process-section chapter">
          <div className="section-copy reveal">
            <h2>真正变化的是流程</h2>
            <p>同一项除草作业，放进不同组织会得到完全不同的生产结果。切换流程，观察等待、返工、复核与反馈节点如何移动。</p>
          </div>
          <div className="process-lab reveal">
            <div className="segmented" role="group" aria-label="流程模式">
              {(['传统流程', 'AI辅助', '人机协同'] as const).map((mode) => (
                <button key={mode} aria-pressed={processMode === mode} onClick={() => { setProcessMode(mode); setIntervention(mode === '传统流程' ? 8 : mode === 'AI辅助' ? 38 : 78) }}>{mode}</button>
              ))}
            </div>
            <div className="process-compare">
              <FieldView mode={processSprayMode[processMode]} accuracy={0.85} />
              <ProcessCircuit mode={processMode} intervention={intervention} onIntervention={setIntervention} />
            </div>
            <p className="process-note">
              {processMode === '传统流程' && '先观察区域，再对整个区域统一喷洒；复核与反馈集中在作业之后。'}
              {processMode === 'AI辅助' && 'AI提供杂草识别结果，但执行与复核仍集中在流程末端。'}
              {processMode === '人机协同' && '识别、局部喷洒、异常复核与结果反馈形成闭环。'}
            </p>
          </div>
        </section>
        <StoryBridge id="process-results" />

        <section id="industry" className="cases-section chapter">
          <div className="section-copy reveal">
            <h2>生产力不止一种结果</h2>
            <p>五个案例沿同一条深度轴排列：一次执行、一个任务、一组经验、一条流程、一类新任务。它们都可以追溯来源，但统计口径不同，因此不做排名。</p>
          </div>
          <div className="signal-rail reveal" aria-label="AI扩散的四个现实锚点">
            {macroSignals.map((signal) => {
              const entry = ledger.find((item) => item.id === signal.id)!
              return <a key={signal.id} href={entry.sourceUrl} target="_blank" rel="noreferrer"><strong>{signal.value}</strong><span>{signal.label}</span><small>{entry.year} · {entry.geography}</small></a>
            })}
          </div>
          <HerbicideSavingChart />
          <EvidenceTheater active={activeCase} onSelect={selectCase} />
          <IndustryGraph selected={selectedIndustry} onSelectCase={selectCase} />
        </section>
        <StoryBridge id="results-lab" />

        <section id="lab" className="simulator-section chapter">
          <div className="section-copy reveal">
            <h2>投入越多，结果越好吗？</h2>
            <p>调节四个条件。模型不会随机给分，任何短板都会通过协同基础放大成转型摩擦。</p>
          </div>
          <div className="simulator reveal">
            <div className="preset-bar reveal" role="group" aria-label="预设情景">
              <span className="preset-bar-label">预设情景</span>
              {labPresets.map((preset) => <button key={preset.id} type="button" aria-pressed={activePreset?.id === preset.id} onClick={() => applyPreset(preset)}>
                <strong>{preset.label}</strong><small>{preset.explanation}</small>
              </button>)}
            </div>
            <div className="controls">
              {sliderLabels.map(([key, label, dimension]) => (
                <RangeInstrument key={key} kind="productivity" label={label} value={inputs[key] * 100} params={{ dimension }} compact onChange={(value) => { setLabRestore(null); setInputs((current) => ({ ...current, [key]: value / 100 })) }} />
              ))}
            </div>
            <div className={`result state-${result.state}`} aria-live="polite">
              <div className="result-score"><span>有效生产力指数</span><strong>{result.index.toFixed(1)}</strong></div>
              <div className="result-state"><Gauge weight="duotone" /><span>当前状态</span><h3>{result.label}</h3></div>
              <ol>
                <li><b>瓶颈</b>{result.bottleneck}</li>
                <li><b>因果位置</b>{result.causalPosition}</li>
                <li><b>下一步</b>{result.recommendation}</li>
                <li><b>预设对照</b>{activePreset ? `当前设置正是「${activePreset.label}」。` : `当前设置最接近「${nearestPreset.preset.label}」。`}</li>
              </ol>
              {presetNote && <p className="lab-preset-note" aria-live="polite">{presetNote}</p>}
              <div className="lab-metrics">{Object.entries(labState.metrics).map(([name, value]) => <span key={name}><b>{value}%</b>{name}</span>)}</div>
              <p className="lab-threshold"><b>{labState.stageName}</b>{labState.explanation}</p>
              <details><summary>查看公式与教学假设</summary><code>C = (D × P × H)^(1/3)<br />指数 = 100 × [1 + 0.45 × I × C - 0.30 × I × (1-C)]</code><p>权重用于教学情景，不是企业预测或经验估计。</p></details>
            </div>
          </div>
          <ResponseSurfaceChart
            investment={inputs.investment}
            complementarity={result.complementarity}
            result={result}
            onApply={applySurfacePoint}
            onRestore={restoreLabInputs}
            canRestore={labRestore !== null}
          />
        </section>
        <StoryBridge id="lab-governance" />

        <section id="cost" className="risk-section chapter">
          <div className="section-copy reveal">
            <h2>增长的成本去了哪里？</h2>
            <p>更高频的自动决策同时扩大效率、能源需求、错误传播范围与责任问题。</p>
          </div>
          <div className="risk-switch reveal">
            <div className="segmented" role="group" aria-label="治理情景">
              {(['无治理扩张', '负责任采用'] as const).map((mode) => <button key={mode} aria-pressed={riskMode === mode} onClick={() => setGovernance(mode === '无治理扩张' ? 18 : 74)}>{mode}</button>)}
            </div>
            <GovernanceRing value={governance} onChange={setGovernance} />
            <div className="risk-grid">
              {[
                ['岗位任务', riskMode === '无治理扩张' ? '替代先于培训' : '先拆解任务，再设计协作'],
                ['能源需求', riskMode === '无治理扩张' ? '规模增长吞噬效率收益' : '把能效纳入模型与部署选择'],
                ['数据权利', riskMode === '无治理扩张' ? '用途边界持续外溢' : '限定目的、权限与保留时间'],
                ['决策责任', riskMode === '无治理扩张' ? '错误沿自动化链条扩散' : '高影响节点保留人工复核'],
              ].map(([title, body]) => <article key={title}><Warning weight="duotone" /><h3>{title}</h3><p>{body}</p></article>)}
            </div>
            <aside className="energy-note"><Database /><span>现实锚点</span><strong>17%</strong><p>IEA报告的2025年全球数据中心用电需求增幅。</p><EvidenceBadge entry={ledger.find((entry) => entry.id === 'iea-datacentre-17')!} /></aside>
          </div>
          <ThresholdTradeoffChart />
        </section>
        <StoryBridge id="governance-conclusion" />

        <section id="conclusion" className="conclusion chapter">
          <div className="conclusion-inner reveal">
            <Leaf weight="duotone" />
            <h2>替代劳动，还是扩展能力？</h2>
            <p>真正的选择不是要不要使用AI，而是让哪些判断自动完成，让哪些责任继续由人承担。</p>
            <div className="augmentation-control"><RangeInstrument kind="augmentation" label="从任务替代到能力增强" value={augmentation} onChange={setAugmentation} metricUnits={{ 任务速度: '%' }} /></div>
            <FinalExpansion />
            <ConclusionSummary augmentation={augmentation} focusIndex={focusStage} onFocusStage={setFocusStage} />
          </div>
        </section>
      </main>

      <footer><span>AI生产力引擎</span><a href="#engine">返回开场</a><span>数据更新：2026-10-09</span></footer>
    </div>
  )
}
