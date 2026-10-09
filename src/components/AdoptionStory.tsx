import { ArrowRight, CheckCircle, Pause, Play } from '@phosphor-icons/react'
import { Player, type PlayerRef } from '@remotion/player'
import { useEffect, useRef, useState } from 'react'
import adoptionJson from '../data/adoption-series.json'
import ledgerJson from '../data/data-ledger.json'
import type { LedgerEntry } from '../data/ledger-types'
import {
  adoptionSceneLabels,
  adoptionSceneOrder,
  buildAtomLayout,
  percentagePointGap,
  relativeGrowth,
  scaleLinear,
  type AdoptionSceneKey,
} from '../model/adoption'
import { AdoptionComposition } from './AdoptionComposition'

type DepthValue = { year: number; value: number }
type DepthSeries = { name: string; values: DepthValue[] }
type Group = { name: string; value: number }
type SizeGroup = { name: string; value2024: number; value2025: number }
type AdoptionData = {
  depth: { ledgerId: string; title: string; note: string; series: DepthSeries[] }
  size: { ledgerId: string; title: string; note: string; groups: SizeGroup[] }
  technology: { ledgerId: string; title: string; note: string; groups: Group[] }
  country: { ledgerId: string; title: string; note: string; groups: Group[] }
}

const data = adoptionJson as AdoptionData
const ledger = ledgerJson as LedgerEntry[]
const colors = ['#f26a2e', '#ecebe4', 'rgba(236,235,228,.42)', '#f26a2e']

function DepthChart() {
  const x = (year: number) => scaleLinear(year, [2023, 2025], [126, 742])
  const y = (value: number) => scaleLinear(value, [0, 22], [410, 72])
  return (
    <g className="adoption-data-layer">
      {[0, 5, 10, 15, 20].map((tick) => <g key={tick}><line x1="108" x2="768" y1={y(tick)} y2={y(tick)} /><text x="86" y={y(tick) + 4}>{tick}%</text></g>)}
      {data.depth.series.map((series, seriesIndex) => {
        const path = series.values.map((point, index) => `${index ? 'L' : 'M'} ${x(point.year)} ${y(point.value)}`).join(' ')
        return <g key={series.name} className={`series series-${seriesIndex}`}>
          <path d={path} />
          {series.values.map((point) => <circle key={point.year} cx={x(point.year)} cy={y(point.value)} r="5" />)}
          <text className="series-label" x="770" y={y(series.values[2].value) + 4}>{series.name} {series.values[2].value}%</text>
        </g>
      })}
      {[2023, 2024, 2025].map((year) => <text className="axis-label" key={year} x={x(year)} y="446" textAnchor="middle">{year}</text>)}
    </g>
  )
}

function SizeChart() {
  const x = (value: number) => scaleLinear(value, [0, 60], [174, 746])
  return <g className="adoption-data-layer bars">
    {data.size.groups.map((group, index) => {
      const y = 126 + index * 126
      return <g key={group.name}>
        <text x="92" y={y + 7}>{group.name}</text>
        <line className="baseline" x1="174" x2="746" y1={y} y2={y} />
        <line className="bar-previous" x1="174" x2={x(group.value2024)} y1={y - 9} y2={y - 9} />
        <line className="bar-current" x1="174" x2={x(group.value2025)} y1={y + 9} y2={y + 9} />
        <text className="value-label" x={x(group.value2025) + 12} y={y + 14}>{group.value2025.toFixed(2)}%</text>
      </g>
    })}
    <g className="legend"><line className="bar-previous" x1="522" x2="548" y1="446" y2="446" /><text x="556" y="450">2024</text><line className="bar-current" x1="634" x2="660" y1="446" y2="446" /><text x="668" y="450">2025</text></g>
  </g>
}

function RankedChart({ groups, max }: { groups: Group[]; max: number }) {
  const x = (value: number) => scaleLinear(value, [0, max], [282, 746])
  const row = groups.length > 4 ? 55 : 90
  const start = groups.length > 4 ? 76 : 108
  return <g className="adoption-data-layer ranked">
    {groups.map((group, index) => {
      const y = start + index * row
      return <g key={group.name} className={group.name === '欧盟平均' ? 'average' : ''}>
        <text x="92" y={y + 5}>{group.name}</text>
        <line className="baseline" x1="282" x2="746" y1={y} y2={y} />
        <line className="bar-current" x1="282" x2={x(group.value)} y1={y} y2={y} />
        <circle cx={x(group.value)} cy={y} r="5" />
        <text className="value-label" x={x(group.value) + 12} y={y + 5}>{group.value}%</text>
      </g>
    })}
  </g>
}

export function AdoptionStory({ scene, onSceneChange }: { scene: AdoptionSceneKey; onSceneChange: (scene: AdoptionSceneKey) => void }) {
  const playerRef = useRef<PlayerRef>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const internalSeekFrame = useRef<number | null>(null)
  const [timeMode, setTimeMode] = useState<'scroll' | 'manual'>('scroll')
  const [playing, setPlaying] = useState(false)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const queryQuality = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('quality') : null
  const [renderMode, setRenderMode] = useState<30 | 15 | 'static'>(reducedMotion ? 'static' : queryQuality === 'low' ? 15 : 30)
  const fps = renderMode === 'static' ? 15 : renderMode
  const staticMode = renderMode === 'static'
  const durationInFrames = fps * 20
  const framesPerScene = durationInFrames / adoptionSceneOrder.length
  const sceneData = data[scene]
  const source = ledger.find((entry) => entry.id === sceneData.ledgerId)!
  const atoms = buildAtomLayout(scene)
  const insight = scene === 'depth'
    ? `一年内增长 ${relativeGrowth(13.5, 20).toFixed(1)}%，但使用三种以上技术的企业仍只有 8.3%。`
    : scene === 'size'
      ? `大型与小型企业相差 ${percentagePointGap(55.03, 17).toFixed(2)} 个百分点。`
      : scene === 'technology'
        ? '文本分析领先，说明AI最先进入语言密集、可拆分的日常任务。'
        : '最高与最低国家相差 8 倍，扩散不是一条均匀上升的曲线。'

  useEffect(() => {
    if (staticMode || queryQuality === 'high') return
    const samples: number[] = []
    let previous = performance.now()
    let request = 0
    const sample = (now: number) => {
      if (document.visibilityState === 'visible') samples.push(now - previous)
      previous = now
      if (samples.length < 45) request = requestAnimationFrame(sample)
      else {
        const sorted = samples.slice(5).sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        if (median > 71) setRenderMode('static')
        else if (median > 42 && renderMode === 30) setRenderMode(15)
      }
    }
    request = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(request)
  }, [queryQuality, renderMode, staticMode])

  useEffect(() => {
    if (staticMode) return
    const player = playerRef.current
    const root = rootRef.current
    if (!player || !root) return

    const updateSceneFromFrame = (frame: number) => {
      const index = Math.min(3, Math.floor(frame / framesPerScene))
      const next = adoptionSceneOrder[index]
      if (next !== scene) onSceneChange(next)
    }
    const onPlay = () => { setTimeMode('manual'); setPlaying(true) }
    const onPause = () => setPlaying(false)
    const onSeeked = ({ detail }: { detail: { frame: number } }) => {
      updateSceneFromFrame(detail.frame)
      if (internalSeekFrame.current === detail.frame) internalSeekFrame.current = null
      else setTimeMode('manual')
    }
    const onTimeUpdate = ({ detail }: { detail: { frame: number } }) => updateSceneFromFrame(detail.frame)
    const onScroll = () => {
      const rect = root.getBoundingClientRect()
      if (timeMode === 'manual') {
        const process = document.querySelector('#process')?.getBoundingClientRect()
        if (process && process.top < window.innerHeight * 0.8) setTimeMode('scroll')
        return
      }
      const distance = rect.height + window.innerHeight * 0.55
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - rect.top) / distance))
      const frame = Math.min(durationInFrames - 1, Math.round(progress * durationInFrames))
      internalSeekFrame.current = frame
      player.seekTo(frame)
      updateSceneFromFrame(frame)
    }

    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    player.addEventListener('seeked', onSeeked)
    player.addEventListener('timeupdate', onTimeUpdate)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
      player.removeEventListener('seeked', onSeeked)
      player.removeEventListener('timeupdate', onTimeUpdate)
      window.removeEventListener('scroll', onScroll)
    }
  }, [durationInFrames, framesPerScene, onSceneChange, scene, staticMode, timeMode])

  const selectScene = (key: AdoptionSceneKey) => {
    onSceneChange(key)
    if (staticMode) return
    setTimeMode('manual')
    playerRef.current?.pause()
    playerRef.current?.seekTo(adoptionSceneOrder.indexOf(key) * framesPerScene + 1)
  }

  const returnToStory = () => {
    playerRef.current?.pause()
    setPlaying(false)
    setTimeMode('scroll')
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect || !playerRef.current) return
    const distance = rect.height + window.innerHeight * 0.55
    const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.72 - rect.top) / distance))
    const frame = Math.min(durationInFrames - 1, Math.round(progress * durationInFrames))
    internalSeekFrame.current = frame
    playerRef.current.seekTo(frame)
  }

  return (
    <div ref={rootRef} className="adoption-story reveal">
      <div className="adoption-toolbar" role="tablist" aria-label="企业AI采用率观察维度">
        {adoptionSceneOrder.map((key, index) => <button key={key} role="tab" aria-selected={scene === key} onClick={() => selectScene(key)}><span>0{index + 1}</span>{adoptionSceneLabels[key]}</button>)}
      </div>
      <div className="adoption-stage">
        <div className="adoption-narrative">
          <span className="scene-kicker">EU ENTERPRISES · 2023—2025</span>
          <h3>{sceneData.title}</h3>
          <p>{sceneData.note}</p>
          <strong>{insight}</strong>
          <button onClick={() => selectScene(adoptionSceneOrder[(adoptionSceneOrder.indexOf(scene) + 1) % adoptionSceneOrder.length])}>换一个坐标系 <ArrowRight /></button>
        </div>
        <div className="adoption-chart" role="group" aria-label={`${sceneData.title}。${insight}`}>
          {staticMode ? <svg viewBox="0 0 840 500" aria-hidden="true">
              <g className="data-atoms">{atoms.map((point, index) => <g key={index} style={{ transform: `translate(${point.x}px, ${point.y}px)` }}><circle r={point.active ? 2.8 : 1.7} fill={colors[point.group % colors.length]} opacity={point.active ? 0.15 : 0.05} /></g>)}</g>
              {scene === 'depth' && <DepthChart />}{scene === 'size' && <SizeChart />}{scene === 'technology' && <RankedChart groups={data.technology.groups} max={14} />}{scene === 'country' && <RankedChart groups={data.country.groups} max={45} />}
            </svg> : <Player ref={playerRef} component={AdoptionComposition} durationInFrames={durationInFrames} compositionWidth={840} compositionHeight={500} fps={fps} controls loop style={{ width: '100%', aspectRatio: '840 / 500' }} acknowledgeRemotionLicense />}
          <div className="timeline-owner">
            <span className={timeMode === 'scroll' ? 'active' : ''}>滚动主线</span><i />
            <span className={timeMode === 'manual' ? 'active' : ''}>{playing ? <Pause /> : <Play />} 手动时间轴</span>
            {timeMode === 'manual' && <button onClick={returnToStory}>回到主线</button>}
            {renderMode === 15 && <em>15 FPS</em>}
            {staticMode && <em>静态关键帧</em>}
          </div>
        </div>
      </div>
      <div className="adoption-source">
        <span><CheckCircle weight="fill" /> 已核验 · Eurostat</span>
        <p>{source.methodology}。{source.caveats}。</p>
        <a href={source.sourceUrl} target="_blank" rel="noreferrer">查看原始来源 <ArrowRight /></a>
      </div>
    </div>
  )
}
