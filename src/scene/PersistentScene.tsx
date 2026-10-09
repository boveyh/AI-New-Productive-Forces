import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, Sparkles } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { causalNodes, type CausalNodeId, type ChapterId } from '../model/story'

type ProcessMode = '传统流程' | 'AI辅助' | '人机协同'
type RiskMode = '无治理扩张' | '负责任采用'

type SceneProps = {
  chapterId: ChapterId
  ignited: boolean
  productivity: number
  processMode: ProcessMode
  selectedIndustry: number
  riskMode: RiskMode
  /** 总结表当前指向的环节下标。单向：表格 → 星图，星图不回写。 */
  focusIndex: number | null
}

const orange = '#f26a2e'
const orangeBright = '#ff895a'
const neutral = '#a9b0b5'

/** 减少动效时 frameloop 切到 demand，逐帧累积的渐变会停在半亮，因此需要提前知道。 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const pulseSlot: Record<ChapterId, number> = {
  engine: 0,
  adoption: 0,
  factors: 1,
  process: 1,
  industry: 2,
  lab: 3,
  cost: 4,
  conclusion: 5,
}

function DecisionPulse({ chapterId, ignited, productivity }: Pick<SceneProps, 'chapterId' | 'ignited' | 'productivity'>) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)
  const outerRing = useRef<THREE.Mesh>(null)
  const targetScale = useMemo(() => new THREE.Vector3(), [])
  const energy = THREE.MathUtils.clamp((productivity - 70) / 75, 0, 1)
  const positions = useMemo(
    () => [
      new THREE.Vector3(1.55, 0.45, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.05, 0.35, -0.2),
      new THREE.Vector3(-1.15, -0.05, 0),
      new THREE.Vector3(0, 0.2, 0),
    ],
    [],
  )
  const trail = useMemo(
    () => Array.from({ length: 14 }, (_, index) => new THREE.Vector3(-(index + 1) * 0.16, Math.sin(index * 0.65) * 0.055, -index * 0.024)),
    [],
  )

  useFrame((state, delta) => {
    if (!group.current || !core.current || !ring.current || !outerRing.current) return
    const slot = Math.min(pulseSlot[chapterId], positions.length - 1)
    const target = positions[slot]
    group.current.position.lerp(target, 1 - Math.exp(-4.5 * delta))
    group.current.rotation.y += delta * (ignited ? 0.42 : 0.1)
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.12

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * (ignited ? 0.05 : 0.016)
    const shapes = [
      [1, 1, 1],
      [1.65, 0.56, 0.56],
      [0.72, 0.72, 0.72],
      [0.82 + energy * 0.28, 0.82 + energy * 0.28, 0.82 + energy * 0.28],
      [0.8, 1.12, 0.8],
      [0.9, 0.9, 0.9],
    ][slot]
    targetScale.set(shapes[0] * pulse, shapes[1] * pulse, shapes[2] * pulse)
    core.current.scale.lerp(targetScale, 1 - Math.exp(-5 * delta))

    const ringTarget = chapterId === 'process' ? 1.4 : chapterId === 'industry' ? 0.82 : 1
    ring.current.scale.lerp(targetScale.setScalar(ringTarget), 1 - Math.exp(-4 * delta))
    ring.current.rotation.x += delta * (0.22 + energy * 0.38)
    outerRing.current.rotation.y -= delta * (chapterId === 'cost' ? 0.9 : 0.18)
    if (coreMaterial.current) coreMaterial.current.emissiveIntensity = THREE.MathUtils.damp(coreMaterial.current.emissiveIntensity, ignited ? 2.7 + energy : 1.1, 4, delta)
  })

  return (
    <group ref={group}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.34, 4]} />
        <meshStandardMaterial ref={coreMaterial} color={orangeBright} emissive={orange} emissiveIntensity={1.1} roughness={0.22} metalness={0.52} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[0.72, 0.018, 12, 112]} />
        <meshBasicMaterial color={orange} transparent opacity={0.92} />
      </mesh>
      <mesh ref={outerRing} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.006, 8, 112]} />
        <meshBasicMaterial color="#f4eee8" transparent opacity={0.19} />
      </mesh>
      <Line points={trail} color={orange} transparent opacity={0.58} lineWidth={1.1} />
    </group>
  )
}

function FactorStreams({ ignited }: { ignited: boolean }) {
  const group = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.08
    targetScale.set(ignited ? 1 : 0.78, ignited ? 1 : 0.78, 1)
    group.current.scale.lerp(targetScale, 1 - Math.exp(-3 * delta))
  })
  const paths = [
    [new THREE.Vector3(-3.2, 1.75, -0.5), new THREE.Vector3(-0.4, 0.65, 0), new THREE.Vector3(1.35, 0.48, 0)],
    [new THREE.Vector3(-3.4, 0.05, 0.2), new THREE.Vector3(-0.5, 0.25, -0.1), new THREE.Vector3(1.35, 0.48, 0)],
    [new THREE.Vector3(-2.8, -1.65, -0.3), new THREE.Vector3(-0.2, -0.15, 0.1), new THREE.Vector3(1.35, 0.48, 0)],
  ]
  return (
    <group ref={group}>
      {paths.map((points, index) => <Line key={index} points={points} color={index === 1 ? orange : neutral} transparent opacity={ignited ? 0.42 : 0.17} lineWidth={0.75} />)}
      <Sparkles count={42} scale={[6.5, 3.8, 1.4]} size={1.15} speed={ignited ? 0.55 : 0.12} color={orangeBright} opacity={ignited ? 0.5 : 0.18} />
    </group>
  )
}

function ProcessField({ mode }: { mode: ProcessMode }) {
  const group = useRef<THREE.Group>(null)
  const signals = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const speed = mode === '传统流程' ? 0.24 : mode === 'AI辅助' ? 0.55 : 0.82
  const nodePositions = [-2.25, -0.75, 0.75, 2.25]

  useFrame((state, delta) => {
    if (!group.current || !signals.current) return
    group.current.scale.lerp(targetScale, 1 - Math.exp(-4 * delta))
    signals.current.children.forEach((signal, index) => {
      const progress = (state.clock.elapsedTime * speed + index * 0.34) % 1
      signal.position.x = -2.25 + progress * 4.5
      signal.position.y = mode === '人机协同' ? Math.sin(progress * Math.PI * 4) * 0.12 : 0
    })
  })

  return (
    <group ref={group} position={[0, -0.9, -0.35]}>
      <Line points={[[-2.25, 0, 0], [2.25, 0, 0]]} color={neutral} transparent opacity={0.28} lineWidth={1} />
      {mode === '人机协同' && <Line points={[[-2.25, -0.34, 0], [2.25, -0.34, 0]]} color={orange} transparent opacity={0.3} lineWidth={0.8} />}
      {nodePositions.map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh><sphereGeometry args={[0.11, 18, 18]} /><meshBasicMaterial color={index === 3 ? orangeBright : neutral} transparent opacity={0.82} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.22, 0.009, 8, 48]} /><meshBasicMaterial color={orange} transparent opacity={mode === '传统流程' ? 0.12 : 0.48} /></mesh>
        </group>
      ))}
      <group ref={signals}>
        {[0, 1, 2].map((index) => <mesh key={index}><sphereGeometry args={[0.045, 12, 12]} /><meshBasicMaterial color={orangeBright} transparent opacity={mode === '传统流程' && index > 0 ? 0 : 0.9} /></mesh>)}
      </group>
    </group>
  )
}

const galaxyPositions: [number, number, number][] = [
  [-1.72, -0.92, 0.1],
  [1.78, -0.62, -0.15],
  [0.48, 1.45, 0.2],
]

function IndustryGalaxy({ selected }: { selected: number }) {
  const group = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  useFrame((state, delta) => {
    if (!group.current) return
    group.current.scale.lerp(targetScale, 1 - Math.exp(-4.5 * delta))
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.12
  })
  return (
    <group ref={group} position={[0.75, 0.2, -0.45]}>
      {galaxyPositions.map((position, index) => (
        <group key={index} position={position}>
          <Line points={[[0, 0, 0], [-position[0], -position[1], -position[2]]]} color={index === selected ? orange : neutral} transparent opacity={index === selected ? 0.68 : 0.2} lineWidth={index === selected ? 1.45 : 0.65} />
          <mesh><icosahedronGeometry args={[index === selected ? 0.24 : 0.17, 2]} /><meshStandardMaterial color={index === selected ? orangeBright : '#70787d'} emissive={index === selected ? orange : '#000000'} emissiveIntensity={index === selected ? 2.2 : 0} roughness={0.35} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[index === selected ? 0.42 : 0.29, 0.012, 8, 64]} /><meshBasicMaterial color={index === selected ? orange : neutral} transparent opacity={index === selected ? 0.9 : 0.24} /></mesh>
          {index === selected && <Sparkles count={20} scale={1.15} size={1.8} speed={0.32} color={orangeBright} opacity={0.8} />}
        </group>
      ))}
    </group>
  )
}

function LabOrbit({ productivity }: { productivity: number }) {
  const group = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const energy = THREE.MathUtils.clamp((productivity - 70) / 75, 0, 1)
  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.z += delta * (0.08 + energy * 0.28)
    group.current.scale.lerp(targetScale, 1 - Math.exp(-4 * delta))
  })
  return (
    <group ref={group} position={[1.05, 0.35, -0.55]}>
      {[0, 1, 2, 3].map((index) => {
        const angle = index * Math.PI / 2
        return <mesh key={index} position={[Math.cos(angle) * 1.45, Math.sin(angle) * 1.45, 0]}><octahedronGeometry args={[0.1 + energy * 0.04]} /><meshBasicMaterial color={index / 3 <= energy ? orangeBright : '#555d62'} transparent opacity={0.85} /></mesh>
      })}
      <mesh><torusGeometry args={[1.45, 0.008, 8, 96]} /><meshBasicMaterial color={orange} transparent opacity={0.18 + energy * 0.4} /></mesh>
    </group>
  )
}

function RiskField({ mode }: { mode: RiskMode }) {
  const group = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const governed = mode === '负责任采用'
  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.z = governed ? Math.sin(state.clock.elapsedTime * 0.3) * 0.05 : Math.sin(state.clock.elapsedTime * 2.3) * 0.07
    group.current.scale.lerp(targetScale, 1 - Math.exp(-4 * delta))
  })
  const cracks: [number, number, number][][] = [
    [[0.45, 0.1, 0], [1.25, 0.7, 0], [2.05, 0.62, 0]],
    [[-0.35, 0.3, 0], [-1.2, 1.05, 0], [-2.05, 0.92, 0]],
    [[-0.45, -0.22, 0], [-1.25, -0.9, 0], [-1.9, -1.35, 0]],
    [[0.35, -0.3, 0], [1.2, -1.1, 0], [1.85, -1.42, 0]],
  ]
  return (
    <group ref={group} position={[-1.15, -0.05, -0.5]}>
      {cracks.map((points, index) => <Line key={index} points={points} color={governed ? neutral : orange} transparent opacity={governed ? 0.2 : 0.72} lineWidth={governed ? 0.7 : 1.2} />)}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={governed ? 1 : 0.72}><torusGeometry args={[1.55, 0.025, 10, 96]} /><meshBasicMaterial color={governed ? orangeBright : '#70787d'} transparent opacity={governed ? 0.72 : 0.18} /></mesh>
    </group>
  )
}

/**
 * 结论章星图的 6 个节点，与总结表的 6 个环节一一对应。
 *
 * 用 `Record<CausalNodeId, …>` 而不是位置数组：漏一个环节或多一个环节都会编译失败，
 * 这样「第 3 行表格高亮的不是第 3 个节点」这种错位不可能悄悄发生。
 * 位置顺序只影响构图（顺时针一圈），不影响对应关系。
 */
const conclusionPositions: Record<CausalNodeId, [number, number, number]> = {
  decision: [-2, 1, 0],
  task: [-2.15, -0.9, 0],
  factors: [-0.85, 1.62, 0],
  process: [0.85, 1.55, 0],
  results: [2.05, 0.85, 0],
  governance: [2.1, -0.95, 0],
}

/** 相邻节点的点亮间隔（毫秒）。6 个节点约 0.85 秒走完，避免拖累滚动。 */
const conclusionStagger = 150

/**
 * 结论章的星图：节点与总结表的 6 个环节一一对应，但只负责收束感。
 *
 * 这里刻意**不绑定任何指针或键盘事件**——高亮只由总结表的 hover / focus 单向驱动。
 * 反过来做，装饰层就会获得操作语义，星图会变成第二个导航。
 */
function ConclusionNetwork({ focusIndex }: { focusIndex: number | null }) {
  const group = useRef<THREE.Group>(null)
  const targetScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const invalidate = useThree((state) => state.invalidate)
  // 减少动效下直接全亮：frameloop 会切到 demand，逐帧累积的渐变只会停在半亮。
  const [litCount, setLitCount] = useState(reducedMotion ? causalNodes.length : 0)
  const fullyLit = litCount >= causalNodes.length

  useEffect(() => {
    if (reducedMotion) return
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setLitCount(index)
      if (index >= causalNodes.length) window.clearInterval(timer)
    }, conclusionStagger)
    return () => window.clearInterval(timer)
  }, [])

  // demand 模式下焦点变化不一定触发重绘，这里显式补一帧，保证键盘/指针高亮都能看见。
  useEffect(() => { invalidate() }, [invalidate, focusIndex])

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.08
    group.current.scale.lerp(targetScale, 1 - Math.exp(-4 * delta))
  })

  return (
    <group ref={group} position={[0, 0.2, -0.65]}>
      {causalNodes.map((node, index) => {
        const position = conclusionPositions[node.id]
        const focused = focusIndex === index
        const active = index < litCount || focused
        return (
          <group key={node.id}>
            <Line points={[[0, 0, 0], position]} color={active ? orange : neutral} transparent opacity={active ? 0.2 + ((index + 1) / causalNodes.length) * 0.36 : 0.07} lineWidth={focused ? 1.5 : 0.7} />
            <mesh position={position}>
              <sphereGeometry args={[focused ? 0.14 : active ? 0.095 : 0.055, 14, 14]} />
              <meshBasicMaterial color={active ? orangeBright : '#596167'} transparent opacity={active ? 0.88 : 0.28} />
            </mesh>
            {focused && <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.27, 0.009, 8, 56]} />
              <meshBasicMaterial color={orangeBright} transparent opacity={0.85} />
            </mesh>}
          </group>
        )
      })}
      {fullyLit && <Sparkles count={26} scale={[5.4, 3.8, 1.6]} size={1.9} speed={0.3} color={orangeBright} opacity={0.72} />}
    </group>
  )
}

function Scene(props: SceneProps) {
  const width = useThree((state) => state.size.width)
  const chapterId = props.chapterId
  return (
    <>
      <ambientLight intensity={0.38} />
      <pointLight position={[2, 3, 4]} color="#ffb392" intensity={18} />
      <DecisionPulse chapterId={chapterId} ignited={props.ignited} productivity={props.productivity} />
      {(chapterId === 'engine' || chapterId === 'adoption' || chapterId === 'factors') && <FactorStreams ignited={props.ignited} />}
      {chapterId === 'process' && <ProcessField mode={props.processMode} />}
      {chapterId === 'industry' && <IndustryGalaxy selected={props.selectedIndustry} />}
      {chapterId === 'lab' && <LabOrbit productivity={props.productivity} />}
      {chapterId === 'cost' && <RiskField mode={props.riskMode} />}
      {chapterId === 'conclusion' && <ConclusionNetwork focusIndex={props.focusIndex} />}
      <Sparkles count={width < 768 ? 44 : 110} scale={[9, 5, 3]} size={1.05} speed={0.1} color="#b7bec3" opacity={0.18} />
    </>
  )
}

export function PersistentScene(props: SceneProps) {
  const quality = new URLSearchParams(window.location.search).get('quality')
  const dpr: [number, number] = quality === 'high' ? [1.5, 2] : quality === 'low' ? [0.75, 1] : [1, 1.5]
  return (
    <div className="scene" aria-hidden="true">
      {/* R3F 会在自己的容器上写死 `pointer-events: auto`，把外层 .scene 的 none 顶掉，
          于是整块 1440×900 的透明画布会在空白处吃掉指针事件。星图不承担任何操作语义，
          所以这里显式按回去；顺带让「星图侧无交互」从约定变成 DOM 事实。 */}
      <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={dpr} style={{ pointerEvents: 'none' }} frameloop={reducedMotion ? 'demand' : 'always'} gl={{ antialias: quality !== 'low', alpha: true, powerPreference: 'high-performance' }}>
        <Scene {...props} />
      </Canvas>
    </div>
  )
}
