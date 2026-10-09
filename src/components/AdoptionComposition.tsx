import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import adoptionJson from '../data/adoption-series.json'
import { adoptionSceneOrder, buildAtomLayout, scaleLinear } from '../model/adoption'

type DepthSeries = { name: string; values: Array<{ year: number; value: number }> }
type Group = { name: string; value: number }
type SizeGroup = { name: string; value2024: number; value2025: number }
type AdoptionData = {
  depth: { title: string; series: DepthSeries[] }
  size: { title: string; groups: SizeGroup[] }
  technology: { title: string; groups: Group[] }
  country: { title: string; groups: Group[] }
}

const data = adoptionJson as AdoptionData
const accent = '#f26a2e'
const text = '#ecebe4'
const muted = 'rgba(236,235,228,.42)'

function DepthVisual({ progress }: { progress: number }) {
  const x = (year: number) => scaleLinear(year, [2023, 2025], [116, 702])
  const y = (value: number) => scaleLinear(value, [0, 22], [404, 70])
  return <>
    {[0, 5, 10, 15, 20].map((tick) => <g key={tick}><line x1="98" x2="724" y1={y(tick)} y2={y(tick)} stroke="rgba(236,235,228,.1)" /><text x="78" y={y(tick) + 4}>{tick}%</text></g>)}
    {data.depth.series.map((series, seriesIndex) => {
      const points = series.values.map((point) => `${x(point.year)},${y(point.value)}`).join(' ')
      const color = [accent, text, muted][seriesIndex]
      return <g key={series.name} opacity={interpolate(progress, [0, 0.25 + seriesIndex * 0.08], [0, 1], { extrapolateRight: 'clamp' })}>
        <polyline points={points} fill="none" stroke={color} strokeWidth={seriesIndex === 0 ? 4 : 3} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} strokeLinecap="round" strokeLinejoin="round" />
        {series.values.map((point) => <circle key={point.year} cx={x(point.year)} cy={y(point.value)} r="5" fill={color} stroke="#080a0c" strokeWidth="3" />)}
        <text x="735" y={y(series.values[2].value) + 4} fill={color} fontWeight="700">{series.values[2].value}%</text>
      </g>
    })}
    {[2023, 2024, 2025].map((year) => <text key={year} x={x(year)} y="445" textAnchor="middle">{year}</text>)}
  </>
}

function SizeVisual({ progress }: { progress: number }) {
  const x = (value: number) => scaleLinear(value, [0, 60], [174, 700])
  return <>{data.size.groups.map((group, index) => {
    const y = 124 + index * 126
    const currentWidth = (x(group.value2025) - 174) * progress
    const previousWidth = (x(group.value2024) - 174) * progress
    return <g key={group.name} opacity={interpolate(progress, [index * 0.12, 0.4 + index * 0.12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
      <text x="82" y={y + 5}>{group.name}</text>
      <line x1="174" x2="700" y1={y} y2={y} stroke="rgba(236,235,228,.1)" />
      <line x1="174" x2={174 + previousWidth} y1={y - 9} y2={y - 9} stroke={muted} strokeWidth="6" />
      <line x1="174" x2={174 + currentWidth} y1={y + 9} y2={y + 9} stroke={accent} strokeWidth="8" />
      <text x={190 + currentWidth} y={y + 14} fill={text} fontWeight="700">{group.value2025.toFixed(2)}%</text>
    </g>
  })}</>
}

function RankedVisual({ groups, max, progress }: { groups: Group[]; max: number; progress: number }) {
  const x = (value: number) => scaleLinear(value, [0, max], [270, 700])
  const row = groups.length > 4 ? 55 : 90
  const start = groups.length > 4 ? 72 : 104
  return <>{groups.map((group, index) => {
    const y = start + index * row
    const width = (x(group.value) - 270) * progress
    const average = group.name === '欧盟平均'
    return <g key={group.name} opacity={interpolate(progress, [index * 0.07, 0.28 + index * 0.07], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
      <text x="76" y={y + 5} fill={average ? text : undefined}>{group.name}</text>
      <line x1="270" x2="700" y1={y} y2={y} stroke="rgba(236,235,228,.1)" />
      <line x1="270" x2={270 + width} y1={y} y2={y} stroke={average ? text : accent} strokeWidth="7" />
      <circle cx={270 + width} cy={y} r="5" fill={average ? text : accent} />
      <text x={284 + width} y={y + 5} fill={text} fontWeight="700">{group.value}%</text>
    </g>
  })}</>
}

export function AdoptionComposition() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const framesPerScene = durationInFrames / adoptionSceneOrder.length
  const sceneIndex = Math.min(adoptionSceneOrder.length - 1, Math.floor(frame / framesPerScene))
  const scene = adoptionSceneOrder[sceneIndex]
  const localFrame = frame - sceneIndex * framesPerScene
  const progress = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 105, mass: 0.75 }, durationInFrames: Math.round(fps * 1.25) })
  const opacity = interpolate(localFrame, [0, fps * 0.35, framesPerScene - fps * 0.3, framesPerScene], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const previousScene = adoptionSceneOrder[Math.max(0, sceneIndex - 1)]
  const previousLayout = buildAtomLayout(previousScene)
  const layout = buildAtomLayout(scene)
  const title = data[scene].title

  return <AbsoluteFill style={{ background: '#080a0c', color: text, fontFamily: 'MiSans, Microsoft YaHei, sans-serif', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 52% 48%, rgba(242,106,46,.10), transparent 48%)' }} />
    <div style={{ position: 'absolute', left: 34, top: 28, zIndex: 2, opacity }}>
      <div style={{ color: accent, fontFamily: 'Consolas, monospace', fontSize: 12, letterSpacing: '.12em' }}>0{sceneIndex + 1} / 04 · EUROSTAT 2025</div>
      <div style={{ marginTop: 8, fontSize: 25, fontWeight: 750, letterSpacing: '-.04em' }}>{title}</div>
    </div>
    <svg viewBox="0 0 840 500" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}>
      <g>
        {layout.map((point, index) => {
          const previous = previousLayout[index]
          const x = interpolate(progress, [0, 1], [previous.x, point.x])
          const y = interpolate(progress, [0, 1], [previous.y, point.y])
          return <circle key={index} cx={x} cy={y} r={point.active ? 2.6 : 1.6} fill={index % 4 === 0 ? accent : text} opacity={point.active ? 0.13 : 0.04} />
        })}
      </g>
      <g style={{ fontFamily: 'Consolas, monospace', fontSize: 12, fill: '#899197' }}>
        {scene === 'depth' && <DepthVisual progress={progress} />}
        {scene === 'size' && <SizeVisual progress={progress} />}
        {scene === 'technology' && <RankedVisual groups={data.technology.groups} max={14} progress={progress} />}
        {scene === 'country' && <RankedVisual groups={data.country.groups} max={45} progress={progress} />}
      </g>
    </svg>
    <div style={{ position: 'absolute', right: 24, bottom: 18, fontFamily: 'Consolas, monospace', color: muted, fontSize: 11 }}>FRAME {String(frame).padStart(3, '0')} · {fps} FPS</div>
  </AbsoluteFill>
}
