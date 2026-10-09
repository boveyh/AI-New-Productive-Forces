import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle, Database, Gauge, Leaf, Warning } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AdoptionStory } from './components/AdoptionStory'
import { FactorMachine, GovernanceRing, HeroDecisionLine, ProcessCircuit, type FactorFault } from './components/KnowledgeMechanics'
import { CausalRail, FinalExpansion, RangeInstrument, StoryBridge, StorySpine } from './components/StorySystem'
import ledgerJson from './data/data-ledger.json'
import type { LedgerEntry } from './data/ledger-types'
import type { AdoptionSceneKey } from './model/adoption'
import { evaluateProductivity, type ProductivityInputs } from './model/productivity'
import { resolveSliderState } from './model/slider-state'
import { causalNodes, type CausalNodeId } from './model/story'

const PersistentScene = lazy(() =>
  import('./scene/PersistentScene').then((module) => ({ default: module.PersistentScene })),
)

gsap.registerPlugin(ScrollTrigger)

const ledger = ledgerJson as LedgerEntry[]
const chapters = ['引擎', '扩散', '重构', '产业', '实验室', '代价', '结论']
const chapterIds = ['engine', 'adoption', 'process', 'industry', 'lab', 'cost', 'conclusion']

const cases = [
  { id: 'deere-see-spray-77', kind: '节约型', title: '只对杂草喷洒', statement: '识别从整片田地缩小到单株植物，材料投入随决策精度下降。' },
  { id: 'github-copilot-55-8', kind: '增效型', title: '缩短指定开发任务', statement: '生成能力进入编码流程，把人的注意力移向验证、架构与需求。' },
  { id: 'alphafold-200m', kind: '创造型', title: '打开蛋白质结构空间', statement: 'AI不只加速旧任务，也使过去难以规模化完成的研究成为公共资源。' },
  { id: 'nber-support-14', kind: '传递型', title: '把优秀经验送到一线', statement: '客服现场研究显示，生成式AI像一个实时教练，经验较少的员工获益更明显。' },
  { id: 'wef-guizhou-tire-68', kind: '重构型', title: '让质量数据回到生产现场', statement: '检测、排产与工艺优化形成反馈回路，生产率提升来自整条流程而不只是一项工具。' },
]

const macroSignals = [
  { id: 'miit-ai-enterprises-4500', value: '4,500+', label: '中国AI企业' },
  { id: 'cnnic-genai-users-602m', value: '6.02亿', label: '中国生成式AI用户' },
  { id: 'ifr-china-robots-295k', value: '29.5万', label: '中国工业机器人新增安装' },
  { id: 'eurostat-ai-depth-2025', value: '20.0%', label: '欧盟企业AI采用率' },
]

const industries = [
  { name: '精准农业', entry: ledger[0], chain: ['识别', '决策', '执行'] },
  { name: '软件研发', entry: ledger[1], chain: ['生成', '协作', '验证'] },
  { name: '科学研究', entry: ledger[2], chain: ['预测', '搜索', '实验'] },
]

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
  const [inputs, setInputs] = useState<ProductivityInputs>({ investment: 0.62, data: 0.42, process: 0.48, training: 0.3 })
  const [governance, setGovernance] = useState(18)
  const [augmentation, setAugmentation] = useState(62)
  const [selectedIndustry, setSelectedIndustry] = useState(0)
  const [adoptionScene, setAdoptionScene] = useState<AdoptionSceneKey>('depth')
  const [factorFault, setFactorFault] = useState<FactorFault>('none')
  const [intervention, setIntervention] = useState(48)
  const riskMode = governance >= 50 ? '负责任采用' : '无治理扩张'
  const result = useMemo(() => evaluateProductivity(inputs), [inputs])
  const labState = useMemo(() => resolveSliderState('productivity', result.complementarity * 100, { complementarity: result.complementarity }), [result.complementarity])

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

  const ignite = () => {
    setIgnited(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => document.querySelector('#adoption')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), reduced ? 0 : 900)
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="scene scene-fallback" aria-hidden="true" />}>
        <PersistentScene
          activeChapter={Math.max(0, activeChapter - 1)}
          ignited={ignited}
          productivity={result.index}
          processMode={processMode}
          selectedIndustry={selectedIndustry}
          riskMode={riskMode}
          augmentation={augmentation}
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
            <p className="hero-intro">这不是一个农业问题。我们将追踪这次田间判断，看它如何被复制、进入流程，并最终变成一种新的生产力。</p>
            <button className="primary-button" onClick={ignite}>
              {ignited ? '引擎已启动' : '启动决策引擎'} <ArrowRight weight="bold" />
            </button>
          </div>
          <HeroDecisionLine active={ignited} />
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
            <p>同一个模型放进不同组织，会得到完全不同的生产结果。切换流程，观察等待、返工与责任节点如何改变。</p>
          </div>
          <div className="process-lab reveal">
            <div className="segmented" role="group" aria-label="流程模式">
              {(['传统流程', 'AI辅助', '人机协同'] as const).map((mode) => (
                <button key={mode} aria-pressed={processMode === mode} onClick={() => { setProcessMode(mode); setIntervention(mode === '传统流程' ? 8 : mode === 'AI辅助' ? 38 : 78) }}>{mode}</button>
              ))}
            </div>
            <ProcessCircuit mode={processMode} intervention={intervention} onIntervention={setIntervention} />
            <p className="process-note">
              {processMode === '传统流程' && '信息逐级传递，等待与返工集中在阶段之间。'}
              {processMode === 'AI辅助' && 'AI缩短局部任务，但人仍在流程末端集中复核。'}
              {processMode === '人机协同' && '模型建议、人工判断和结果反馈形成闭环。'}
            </p>
          </div>
        </section>
        <StoryBridge id="process-results" />

        <section id="industry" className="cases-section chapter">
          <div className="section-copy reveal">
            <h2>生产力不止一种结果</h2>
            <p>它可以节约投入、加快任务、传递经验、重构流程，也可以创造过去无法规模化完成的新任务。</p>
          </div>
          <div className="signal-rail reveal" aria-label="AI扩散的四个现实锚点">
            {macroSignals.map((signal) => {
              const entry = ledger.find((item) => item.id === signal.id)!
              return <a key={signal.id} href={entry.sourceUrl} target="_blank" rel="noreferrer"><strong>{signal.value}</strong><span>{signal.label}</span><small>{entry.year} · {entry.geography}</small></a>
            })}
          </div>
          <div className="case-stack">
            {cases.map((item, index) => {
              const entry = ledger.find((candidate) => candidate.id === item.id)!
              return (
                <article className="case reveal" key={item.id}>
                  <div className="case-index">0{index + 1}</div>
                  <div><span className="case-kind">{item.kind}</span><h3>{item.title}</h3><p>{item.statement}</p></div>
                  <div className="case-metric"><strong>{entry.value}{entry.id === 'alphafold-200m' ? 'M+' : '%'}</strong><EvidenceBadge entry={entry} /></div>
                  <details><summary>查看口径与来源</summary><p>{entry.methodology}。{entry.caveats}。</p><a href={entry.sourceUrl} target="_blank" rel="noreferrer">打开来源 <ArrowRight /></a>{!entry.independentCorroboration && <small>当前仅有单一来源，尚未找到独立佐证。</small>}</details>
                </article>
              )
            })}
          </div>
          <IndustryExplorer selected={selectedIndustry} onSelect={setSelectedIndustry} />
        </section>
        <StoryBridge id="results-lab" />

        <section id="lab" className="simulator-section chapter">
          <div className="section-copy reveal">
            <h2>投入越多，结果越好吗？</h2>
            <p>调节四个条件。模型不会随机给分，任何短板都会通过协同基础放大成转型摩擦。</p>
          </div>
          <div className="simulator reveal">
            <div className="controls">
              {sliderLabels.map(([key, label, dimension]) => (
                <RangeInstrument key={key} kind="productivity" label={label} value={inputs[key] * 100} params={{ dimension }} compact onChange={(value) => setInputs((current) => ({ ...current, [key]: value / 100 }))} />
              ))}
            </div>
            <div className={`result state-${result.state}`} aria-live="polite">
              <div className="result-score"><span>有效生产力指数</span><strong>{result.index.toFixed(1)}</strong></div>
              <div className="result-state"><Gauge weight="duotone" /><span>当前状态</span><h3>{result.label}</h3></div>
              <ol>
                <li><b>瓶颈</b>{result.bottleneck}</li>
                <li><b>因果位置</b>{result.causalPosition}</li>
                <li><b>下一步</b>{result.recommendation}</li>
              </ol>
              <div className="lab-metrics">{Object.entries(labState.metrics).map(([name, value]) => <span key={name}><b>{value}%</b>{name}</span>)}</div>
              <p className="lab-threshold"><b>{labState.stageName}</b>{labState.explanation}</p>
              <details><summary>查看公式与教学假设</summary><code>C = (D × P × H)^(1/3)<br />指数 = 100 × [1 + 0.45 × I × C - 0.30 × I × (1-C)]</code><p>权重用于教学情景，不是企业预测或经验估计。</p></details>
            </div>
          </div>
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
        </section>
        <StoryBridge id="governance-conclusion" />

        <section id="conclusion" className="conclusion chapter">
          <div className="conclusion-inner reveal">
            <Leaf weight="duotone" />
            <h2>替代劳动，还是扩展能力？</h2>
            <p>真正的选择不是要不要使用AI，而是让哪些判断自动完成，让哪些责任继续由人承担。</p>
            <div className="augmentation-control"><RangeInstrument kind="augmentation" label="从任务替代到能力增强" value={augmentation} onChange={setAugmentation} metricUnits={{ 任务速度: '%' }} /></div>
            <FinalExpansion />
          </div>
        </section>
      </main>

      <footer><span>AI生产力引擎</span><a href="#engine">返回开场</a><span>数据更新：2026-10-09</span></footer>
    </div>
  )
}

function IndustryExplorer({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  const current = industries[selected]
  return (
    <div className="industry-explorer reveal">
      <div className="industry-list" role="listbox" aria-label="行业">
        <span className="industry-list-label">选择行业，点亮能力路径</span>
        {industries.map((industry, index) => <button key={industry.name} role="option" aria-selected={selected === index} onClick={() => onSelect(index)}>{industry.name}</button>)}
      </div>
      <div className="ability-map">
        <span>能力关系 · 3D星图同步响应</span>
        <div>{current.chain.map((item, index) => <span key={item}>{item}{index < current.chain.length - 1 && <ArrowRight />}</span>)}</div>
        <p>{current.entry.claim}</p>
        <EvidenceBadge entry={current.entry} />
      </div>
    </div>
  )
}
