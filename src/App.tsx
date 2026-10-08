import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle, Database, Gauge, Leaf, Warning } from '@phosphor-icons/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ledgerJson from './data/data-ledger.json'
import type { LedgerEntry } from './data/ledger-types'
import { evaluateProductivity, type ProductivityInputs } from './model/productivity'

const PersistentScene = lazy(() =>
  import('./scene/PersistentScene').then((module) => ({ default: module.PersistentScene })),
)

gsap.registerPlugin(ScrollTrigger)

const ledger = ledgerJson as LedgerEntry[]
const chapters = ['引擎', '重构', '产业', '实验室', '代价', '结论']
const chapterIds = ['engine', 'process', 'industry', 'lab', 'cost', 'conclusion']

const cases = [
  { id: 'deere-see-spray-77', kind: '节约型', title: '只对杂草喷洒', statement: '识别从整片田地缩小到单株植物，材料投入随决策精度下降。' },
  { id: 'github-copilot-55-8', kind: '增效型', title: '缩短指定开发任务', statement: '生成能力进入编码流程，把人的注意力移向验证、架构与需求。' },
  { id: 'alphafold-200m', kind: '创造型', title: '打开蛋白质结构空间', statement: 'AI不只加速旧任务，也使过去难以规模化完成的研究成为公共资源。' },
]

const industries = [
  { name: '精准农业', entry: ledger[0], chain: ['识别', '决策', '执行'] },
  { name: '软件研发', entry: ledger[1], chain: ['生成', '协作', '验证'] },
  { name: '科学研究', entry: ledger[2], chain: ['预测', '搜索', '实验'] },
]

const sliderLabels: Array<[keyof ProductivityInputs, string]> = [
  ['investment', 'AI投入强度'],
  ['data', '数据准备度'],
  ['process', '流程适配度'],
  ['training', '人员训练度'],
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
  const [ignited, setIgnited] = useState(false)
  const [processMode, setProcessMode] = useState<'传统流程' | 'AI辅助' | '人机协同'>('传统流程')
  const [inputs, setInputs] = useState<ProductivityInputs>({ investment: 0.62, data: 0.42, process: 0.48, training: 0.3 })
  const [riskMode, setRiskMode] = useState<'无治理扩张' | '负责任采用'>('无治理扩张')
  const [augmentation, setAugmentation] = useState(62)
  const [selectedIndustry, setSelectedIndustry] = useState(0)
  const result = useMemo(() => evaluateProductivity(inputs), [inputs])

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
    if (!reduced) {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        gsap.fromTo(element, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } })
      })
    }
    return () => triggers.forEach((trigger) => trigger.kill())
  }, [])

  const ignite = () => {
    setIgnited(true)
    document.querySelector('#process')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <div className="app">
      <Suspense fallback={<div className="scene scene-fallback" aria-hidden="true" />}>
        <PersistentScene
          activeChapter={activeChapter}
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
        <span className="chapter-count">{String(activeChapter + 1).padStart(2, '0')} / 06</span>
        <div className="progress" style={{ transform: `scaleX(${(activeChapter + 1) / chapters.length})` }} />
      </header>

      <main>
        <section id="engine" className="hero chapter">
          <div className="hero-copy reveal">
            <p className="eyebrow">一次判断，如何成为生产力</p>
            <h1>喷，还是不喷？</h1>
            <p className="hero-intro">追踪一个智能决策，看它如何进入流程、扩散到产业，并最终改变人的能力边界。</p>
            <button className="primary-button" onClick={ignite}>
              {ignited ? '引擎已启动' : '启动决策引擎'} <ArrowRight weight="bold" />
            </button>
          </div>
          <div className="hero-question reveal">
            <span>毫秒级判断</span>
            <strong>作物</strong>
            <i>或</i>
            <strong>杂草</strong>
          </div>
        </section>

        <section className="factor-section chapter" aria-labelledby="factor-title">
          <div className="section-copy reveal">
            <h2 id="factor-title">判断并非凭空出现</h2>
            <p>数据提供现场，算力压缩时间，算法把输入变成可以执行的选择。三者缺一，智能就无法进入生产。</p>
          </div>
          <div className="factor-grid reveal">
            {[
              ['数据', '看见发生了什么', '质量决定判断上限'],
              ['算力', '在流程允许的时间内处理', '速度决定能否行动'],
              ['算法', '把输入转化为选择', '适配决定结果是否可靠'],
            ].map(([name, action, consequence], index) => (
              <article key={name} className="factor" style={{ '--delay': `${index * 0.08}s` } as React.CSSProperties}>
                <span>{name}</span><h3>{action}</h3><p>{consequence}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="process-section chapter">
          <div className="section-copy reveal">
            <h2>真正变化的是流程</h2>
            <p>同一个模型放进不同组织，会得到完全不同的生产结果。切换流程，观察等待、返工与责任节点如何改变。</p>
          </div>
          <div className="process-lab reveal">
            <div className="segmented" role="group" aria-label="流程模式">
              {(['传统流程', 'AI辅助', '人机协同'] as const).map((mode) => (
                <button key={mode} aria-pressed={processMode === mode} onClick={() => setProcessMode(mode)}>{mode}</button>
              ))}
            </div>
            <div className={`pipeline mode-${processMode}`}>
              {['发现问题', '形成方案', '执行任务', '检查结果'].map((step, index) => (
                <div className="pipeline-step" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong>
                  {processMode !== '传统流程' && index < 3 && <i aria-hidden="true" />}
                </div>
              ))}
            </div>
            <p className="process-note">
              {processMode === '传统流程' && '信息逐级传递，等待与返工集中在阶段之间。'}
              {processMode === 'AI辅助' && 'AI缩短局部任务，但人仍在流程末端集中复核。'}
              {processMode === '人机协同' && '模型建议、人工判断和结果反馈形成闭环。'}
            </p>
          </div>
        </section>

        <section id="industry" className="cases-section chapter">
          <div className="section-copy reveal">
            <h2>生产力有三个层次</h2>
            <p>从节约投入，到加快旧任务，再到创造过去无法规模化完成的新任务。</p>
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

        <section id="lab" className="simulator-section chapter">
          <div className="section-copy reveal">
            <h2>投入越多，结果越好吗？</h2>
            <p>调节四个条件。模型不会随机给分，任何短板都会通过协同基础放大成转型摩擦。</p>
          </div>
          <div className="simulator reveal">
            <div className="controls">
              {sliderLabels.map(([key, label]) => (
                <label key={key}>
                  <span>{label}<output>{Math.round(inputs[key] * 100)}</output></span>
                  <input type="range" min="0" max="100" value={inputs[key] * 100} onChange={(event) => setInputs((current) => ({ ...current, [key]: Number(event.target.value) / 100 }))} />
                </label>
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
              <details><summary>查看公式与教学假设</summary><code>C = (D × P × H)^(1/3)<br />指数 = 100 × [1 + 0.45 × I × C - 0.30 × I × (1-C)]</code><p>权重用于教学情景，不是企业预测或经验估计。</p></details>
            </div>
          </div>
        </section>

        <section id="cost" className="risk-section chapter">
          <div className="section-copy reveal">
            <h2>增长的成本去了哪里？</h2>
            <p>更高频的自动决策同时扩大效率、能源需求、错误传播范围与责任问题。</p>
          </div>
          <div className="risk-switch reveal">
            <div className="segmented" role="group" aria-label="治理情景">
              {(['无治理扩张', '负责任采用'] as const).map((mode) => <button key={mode} aria-pressed={riskMode === mode} onClick={() => setRiskMode(mode)}>{mode}</button>)}
            </div>
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

        <section id="conclusion" className="conclusion chapter">
          <div className="conclusion-inner reveal">
            <Leaf weight="duotone" />
            <h2>替代劳动，还是扩展能力？</h2>
            <p>真正的选择不是要不要使用AI，而是让哪些判断自动完成，让哪些责任继续由人承担。</p>
            <label className="augmentation-control">
              <span>自动替代</span><input type="range" min="0" max="100" value={augmentation} onChange={(event) => setAugmentation(Number(event.target.value))} /><span>能力增强</span>
            </label>
            <div className="network-summary" style={{ '--augmentation': augmentation / 100 } as React.CSSProperties}>
              <span>{augmentation < 45 ? '网络更简单，效率更高，但创新节点减少。' : '人和AI重新连接，新任务与新协作关系开始出现。'}</span>
            </div>
            <blockquote>AI不是天然的生产力。只有进入合适的流程，被人正确使用并受到有效治理，智能能力才会变成可持续的新质生产力。</blockquote>
          </div>
        </section>
      </main>

      <footer><span>AI生产力引擎</span><a href="#engine">返回开场</a><span>数据更新：2026-10-08</span></footer>
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
