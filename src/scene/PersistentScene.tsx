import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, Sparkles } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type SceneProps = {
  activeChapter: number
  ignited: boolean
  productivity: number
}

function DecisionPulse({ activeChapter, ignited, productivity }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const energy = Math.max(0, Math.min(1, (productivity - 70) / 75))
  const positions = useMemo(
    () => [
      new THREE.Vector3(1.55, 0.45, 0),
      new THREE.Vector3(0.75, -0.2, 0.4),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.1, 0.45, -0.2),
      new THREE.Vector3(-1.5, -0.2, 0),
    ],
    [],
  )

  useFrame((state, delta) => {
    if (!group.current || !ring.current) return
    const target = positions[Math.min(activeChapter, positions.length - 1)]
    group.current.position.lerp(target, 1 - Math.pow(0.001, delta))
    group.current.rotation.y += delta * (ignited ? 0.45 : 0.12)
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.14
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4) * (ignited ? 0.055 : 0.018)
    const chapterScale = activeChapter === 2 ? 1.35 : activeChapter === 3 ? 0.88 : 1
    group.current.scale.lerp(new THREE.Vector3(pulse * chapterScale, pulse * chapterScale, pulse * chapterScale), 0.08)
    ring.current.rotation.x += delta * (0.25 + energy * 0.35)
  })

  const trail = Array.from({ length: 12 }, (_, index) => {
    const offset = (index + 1) * 0.17
    return new THREE.Vector3(-offset, Math.sin(index * 0.65) * 0.06, -index * 0.025)
  })

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[0.34, 3]} />
        <meshStandardMaterial color="#ff7845" emissive="#f26a2e" emissiveIntensity={ignited ? 3 : 1.1} roughness={0.24} metalness={0.48} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[0.72, 0.018, 12, 96]} />
        <meshBasicMaterial color="#f26a2e" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.006, 8, 96]} />
        <meshBasicMaterial color="#f4eee8" transparent opacity={0.18} />
      </mesh>
      <Line points={trail} color="#f26a2e" transparent opacity={0.58} lineWidth={1.1} />
      {activeChapter >= 2 && (
        <group>
          {[-1.35, 1.35].map((x) => (
            <mesh key={x} position={[x, x > 0 ? 0.35 : -0.28, 0]}>
              <sphereGeometry args={[0.11, 20, 20]} />
              <meshBasicMaterial color="#f26a2e" transparent opacity={0.68} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

function Scene({ activeChapter, ignited, productivity }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2, 3, 4]} color="#ffb392" intensity={18} />
      <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.18}>
        <DecisionPulse activeChapter={activeChapter} ignited={ignited} productivity={productivity} />
      </Float>
      <Sparkles count={80} scale={[9, 5, 3]} size={1.2} speed={0.12} color="#b7bec3" opacity={0.22} />
    </>
  )
}

export function PersistentScene(props: SceneProps) {
  return (
    <div className="scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <Scene {...props} />
      </Canvas>
    </div>
  )
}
