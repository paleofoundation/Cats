import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Cat, Place } from './data'

type Focus = 'overview' | 'garden' | 'dream'

const CAMERA_VIEWS: Record<Focus, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: { position: new THREE.Vector3(12, 12, 15), target: new THREE.Vector3(0, 0, -0.5) },
  garden: { position: new THREE.Vector3(-8, 7, 9), target: new THREE.Vector3(-3, 0, 1.5) },
  dream: { position: new THREE.Vector3(10, 8, -1), target: new THREE.Vector3(4, 1, -5) },
}

function CameraRig({ focus, controls }: { focus: Focus; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const goal = useRef(CAMERA_VIEWS[focus])
  const moving = useRef(true)

  useEffect(() => {
    goal.current = CAMERA_VIEWS[focus]
    moving.current = true
  }, [focus])

  useFrame(() => {
    if (!moving.current || !controls.current) return
    camera.position.lerp(goal.current.position, 0.055)
    controls.current.target.lerp(goal.current.target, 0.055)
    controls.current.update()
    if (camera.position.distanceTo(goal.current.position) < 0.08) moving.current = false
  })
  return null
}

function OliveTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const foliage = useMemo(() => [
    [-0.34, 1.58, 0.05, 0.64], [0.3, 1.72, 0.02, 0.7], [0.02, 1.98, -0.12, 0.58],
    [-0.05, 1.55, 0.36, 0.6], [0.22, 1.48, -0.33, 0.55],
  ], [])
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.82, 0]} rotation={[0.03, 0, -0.08]}>
        <cylinderGeometry args={[0.16, 0.28, 1.7, 7]} />
        <meshStandardMaterial color="#746050" roughness={1} />
      </mesh>
      {foliage.map(([x, y, z, s], index) => (
        <mesh key={index} castShadow position={[x, y, z]} scale={[s * 1.35, s * 0.7, s]}>
          <dodecahedronGeometry args={[0.76, 1]} />
          <meshStandardMaterial color={index % 2 ? '#6f8467' : '#819475'} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function GrassPatch({ position, color = '#9eaa6b' }: { position: [number, number, number]; color?: string }) {
  const blades = useMemo(() => Array.from({ length: 13 }, (_, i) => ({
    x: Math.sin(i * 5.1) * 0.45,
    z: Math.cos(i * 3.8) * 0.4,
    h: 0.28 + (i % 4) * 0.08,
    r: (i - 6) * 0.08,
  })), [])
  return (
    <group position={position}>
      {blades.map((blade, index) => (
        <mesh key={index} position={[blade.x, blade.h / 2, blade.z]} rotation={[0, blade.r, blade.r * 0.18]} castShadow>
          <coneGeometry args={[0.045, blade.h, 3]} />
          <meshStandardMaterial color={index % 3 ? color : '#b7bc78'} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function StoneWall({ position, length = 3, rotation = 0 }: { position: [number, number, number]; length?: number; rotation?: number }) {
  const stones = useMemo(() => Array.from({ length: Math.ceil(length * 3) }, (_, i) => ({
    x: -length / 2 + (i + 0.5) * (length / Math.ceil(length * 3)),
    y: 0.18 + (i % 2) * 0.05,
    s: 0.26 + (i % 3) * 0.04,
  })), [length])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {stones.map((stone, index) => (
        <mesh key={index} position={[stone.x, stone.y, 0]} scale={[stone.s * 1.35, stone.s, stone.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={index % 2 ? '#b7a78d' : '#c7b99d'} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function CatFigure({ position, color, scale = 1, rotation = 0 }: { position: [number, number, number]; color: string; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.31, 0]} scale={[0.45, 0.56, 0.72]}>
        <sphereGeometry args={[0.48, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.72, 0.26]}>
        <sphereGeometry args={[0.32, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} castShadow position={[x, 1.01, 0.24]} rotation={[0.08, 0, x > 0 ? -0.08 : 0.08]}>
          <coneGeometry args={[0.12, 0.3, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      <mesh castShadow position={[0.42, 0.34, -0.12]} rotation={[0.05, 0.25, -0.74]}>
        <cylinderGeometry args={[0.055, 0.09, 0.95, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[-0.11, 0.78, 0.53]}><sphereGeometry args={[0.026, 8, 8]} /><meshBasicMaterial color="#d7f7c7" /></mesh>
      <mesh position={[0.11, 0.78, 0.53]}><sphereGeometry args={[0.026, 8, 8]} /><meshBasicMaterial color="#d7f7c7" /></mesh>
    </group>
  )
}

function MovingCar({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const progress = ((clock.elapsedTime * 1.25 + offset) % 22) - 11
    ref.current.position.x = progress
  })
  return (
    <group ref={ref} position={[0, 0.23, 6.3]}>
      <RoundedBox args={[1.25, 0.42, 0.68]} radius={0.13} smoothness={3} castShadow>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.33, 0]} castShadow>
        <boxGeometry args={[0.62, 0.32, 0.56]} />
        <meshStandardMaterial color="#d9e3e2" metalness={0.2} roughness={0.25} />
      </mesh>
      {[-0.42, 0.42].flatMap((x) => [-0.36, 0.36].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, -0.18, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.11, 12]} />
          <meshStandardMaterial color="#27272a" />
        </mesh>
      )))}
    </group>
  )
}

function CurrentGarden({ companion }: { companion: Cat }) {
  return (
    <group position={[-4.4, 0.02, 1.1]}>
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[3.3, 3.55, 0.18, 20]} />
        <meshStandardMaterial color="#cabb9d" roughness={1} />
      </mesh>
      <StoneWall position={[0, 0, -2.25]} length={5.1} />
      <OliveTree position={[-1.7, 0.08, -0.8]} scale={0.92} />
      <OliveTree position={[1.5, 0.08, -1.25]} scale={0.72} />
      <GrassPatch position={[-0.4, 0.1, 1.3]} />
      <GrassPatch position={[1.3, 0.1, 0.8]} color="#718f5d" />
      <GrassPatch position={[-1.5, 0.1, 0.8]} color="#80956b" />
      <CatFigure position={[0.1, 0.13, 0.1]} color={companion.color} scale={0.8} rotation={0.35} />
      <CatFigure position={[1.4, 0.12, 1.55]} color="#292c2b" scale={0.65} rotation={-0.5} />
      <CatFigure position={[-1.35, 0.12, 1.6]} color="#bd7843" scale={0.7} rotation={0.7} />
    </group>
  )
}

function ShelterWorkshop() {
  return (
    <group position={[5.1, 0.15, 0.2]}>
      <mesh receiveShadow position={[0, 0, 0]}><cylinderGeometry args={[2.3, 2.5, 0.24, 8]} /><meshStandardMaterial color="#b6a889" /></mesh>
      {[-0.75, 0.15, 0.95].map((x, index) => (
        <group key={x} position={[x, 0.12, index % 2 ? 0.35 : -0.15]} rotation={[0, index * 0.35, 0]}>
          <mesh castShadow position={[0, 0.42, 0]}><boxGeometry args={[0.74, 0.78, 0.85]} /><meshStandardMaterial color={index % 2 ? '#c68e5c' : '#ac7650'} /></mesh>
          <mesh castShadow position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.73, 0.73, 0.08]} /><meshStandardMaterial color="#695c51" /></mesh>
          <mesh position={[0, 0.38, 0.44]}><circleGeometry args={[0.16, 16]} /><meshStandardMaterial color="#2f2e2d" /></mesh>
        </group>
      ))}
      <StoneWall position={[0, 0.05, 1.58]} length={3.2} />
    </group>
  )
}

function DreamProperty() {
  return (
    <group position={[4.25, 0.88, -5.2]}>
      <mesh receiveShadow position={[0, -0.38, 0]}>
        <cylinderGeometry args={[4.1, 4.8, 0.82, 9]} />
        <meshStandardMaterial color="#8f9e67" roughness={1} />
      </mesh>
      <group position={[0.35, 0, 0]}>
        <mesh castShadow position={[0, 0.8, 0]}><boxGeometry args={[3.2, 1.65, 2.25]} /><meshStandardMaterial color="#d8c9ad" roughness={0.95} /></mesh>
        <mesh castShadow position={[-0.6, 1.8, 0]}><boxGeometry args={[2.15, 0.42, 1.75]} /><meshStandardMaterial color="#c7b697" /></mesh>
        {[-1.15, 0, 1.15].map((x) => <mesh key={x} position={[x, 0.8, 1.14]}><boxGeometry args={[0.48, 0.68, 0.05]} /><meshStandardMaterial color="#6a7275" metalness={0.2} /></mesh>)}
        <mesh position={[0.72, 0.35, -1.18]}><boxGeometry args={[1.2, 0.62, 0.08]} /><meshStandardMaterial color="#59656b" /></mesh>
      </group>
      <mesh receiveShadow position={[-2.2, 0.08, -0.5]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[2.5, 1.65]} />
        <meshStandardMaterial color="#b78766" roughness={0.9} />
      </mesh>
      {[[-2.95, -1.5], [-2.8, 1.6], [2.7, -1.7], [2.8, 1.6]].map(([x, z], i) => <OliveTree key={i} position={[x, 0.02, z]} scale={0.55} />)}
      <StoneWall position={[0, 0.05, 2.55]} length={5.6} />
    </group>
  )
}

function Hotspot({ place, onOpen }: { place: Place; onOpen: (place: Place) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <group position={place.position}>
      <mesh
        position={[0, 0.45, 0]}
        onClick={(event) => { event.stopPropagation(); onOpen(place) }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        scale={hovered ? 1.15 : 1}
      >
        <octahedronGeometry args={[0.29, 0]} />
        <meshStandardMaterial color={place.accent} emissive={place.accent} emissiveIntensity={hovered ? 2.2 : 1.1} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.54, 32]} />
        <meshBasicMaterial color={place.accent} transparent opacity={hovered ? 0.85 : 0.42} />
      </mesh>
      <Html position={[0, 1.08, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className={`world-label ${hovered ? 'is-hovered' : ''}`}>
          <span>{place.label}</span>
          <strong>+{place.points}</strong>
        </div>
      </Html>
    </group>
  )
}

function Scene({ places, companion, focus, onOpen }: { places: Place[]; companion: Cat; focus: Focus; onOpen: (place: Place) => void }) {
  const controls = useRef<OrbitControlsImpl>(null)
  return (
    <>
      <color attach="background" args={['#716a82']} />
      <fog attach="fog" args={['#8c8397', 18, 38]} />
      <hemisphereLight args={['#fffef2', '#6e5d52', 2.1]} />
      <directionalLight position={[-7, 13, 8]} intensity={4.4} color="#fffdf0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={35} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <directionalLight position={[8, 4, -8]} intensity={1.1} color="#b8b7ff" />
      <mesh receiveShadow position={[0, -0.23, 0]}>
        <cylinderGeometry args={[14.5, 15.2, 0.55, 32]} />
        <meshStandardMaterial color="#81935d" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 6.3]}>
        <boxGeometry args={[25, 0.14, 2.15]} />
        <meshStandardMaterial color="#57585b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.11, 6.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 0.07]} />
        <meshBasicMaterial color="#e9dfb9" />
      </mesh>
      <MovingCar offset={0} color="#d3dbd4" />
      <MovingCar offset={10.5} color="#8f665e" />
      <CurrentGarden companion={companion} />
      <ShelterWorkshop />
      <DreamProperty />
      <OliveTree position={[-0.2, 0, -3.9]} scale={0.85} />
      <OliveTree position={[-7.8, 0, -4.2]} scale={0.7} />
      <OliveTree position={[7.6, 0, 3.4]} scale={0.8} />
      {Array.from({ length: 24 }, (_, i) => (
        <GrassPatch key={i} position={[-9 + (i * 4.1) % 18, 0.06, -6.8 + ((i * 7.3) % 12)]} color={i % 2 ? '#859766' : '#a0a667'} />
      ))}
      <CatFigure position={[0.3, 0.08, 5.15]} color="#d8c0a4" scale={0.52} rotation={-0.35} />
      {places.map((place) => <Hotspot key={place.id} place={place} onOpen={onOpen} />)}
      <CameraRig focus={focus} controls={controls} />
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.06} minDistance={7} maxDistance={25} maxPolarAngle={Math.PI / 2.14} minPolarAngle={0.28} enablePan={false} />
    </>
  )
}

export function CatGardenWorld(props: { places: Place[]; companion: Cat; focus: Focus; onOpen: (place: Place) => void }) {
  return (
    <Canvas shadows dpr={[1, 1.65]} camera={{ fov: 40, near: 0.1, far: 70, position: [12, 12, 15] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Scene {...props} />
    </Canvas>
  )
}

export type { Focus }
