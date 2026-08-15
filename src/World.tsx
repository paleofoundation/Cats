import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Html, RoundedBox, Sky, Sparkles, Text, useAnimations, useGLTF } from '@react-three/drei'
import { CapsuleCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { localDay, useGame, type NearbyAction, type PersonId } from './game/store'

const START_POSITION: [number, number, number] = [0, 1, -9]
const SPLOTCH_HOME = new THREE.Vector3(0, 0, 4.4)
const PLANT_POSITION = new THREE.Vector3(-3.2, 0, 3.6)
const REALITY_PORTAL_POSITION = new THREE.Vector3(9.4, 0, -2.1)
const DREAM_PORTAL_POSITION = new THREE.Vector3(-9.2, 0, 7.2)
const SCREEN_FORWARD = new THREE.Vector3(0, 0, 1)
const CAMERA_OFFSET = new THREE.Vector3(0, 3.35, -6.3)
const PEOPLE: Record<PersonId, { position: [number, number, number]; color: string; label: string; subtitle: string }> = {
  chanda: { position: [-4.8, 0, .6], color: '#dd8b52', label: 'Chanda', subtitle: 'daily caretaker' },
  karen: { position: [6.8, 0, 4.6], color: '#b7cc68', label: 'Karen', subtitle: 'co-founder · Cat Gardens' },
  kimberly: { position: [6.8, 0, 8.1], color: '#789f92', label: 'Kimberly', subtitle: 'co-founder · Cat Gardens' },
}

const seeded = (seed: number) => {
  const value = Math.sin(seed * 144.731) * 43758.5453
  return value - Math.floor(value)
}

function OakTree({ position, scale }: { position: [number, number, number]; scale: number }) {
  const { scene } = useGLTF('/models/bruno/oak-tree.glb')
  const clone = useMemo(() => scene.clone(true), [scene])
  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }, [clone])
  return <primitive object={clone} position={position} scale={scale} />
}

function GrassField() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const count = 1150
  useEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    for (let index = 0; index < count; index += 1) {
      const x = (seeded(index + 4) - .5) * 52
      const z = (seeded(index + 77) - .5) * 46
      const inClearing = x > -11 && x < 12 && z > -11 && z < 11
      if (inClearing && seeded(index + 108) > .22) dummy.position.set(100, -10, 100)
      else dummy.position.set(x, .13, z)
      const height = .55 + seeded(index + 141) * .9
      dummy.rotation.set(0, seeded(index + 181) * Math.PI, (seeded(index + 211) - .5) * .15)
      dummy.scale.set(.7 + seeded(index + 224) * .45, height, .7 + seeded(index + 246) * .45)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
      mesh.current.setColorAt(index, new THREE.Color(index % 3 === 0 ? '#6f8d4e' : index % 3 === 1 ? '#8aa45b' : '#5f7946'))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow frustumCulled={false}>
      <coneGeometry args={[.055, .46, 3]} />
      <meshStandardMaterial vertexColors roughness={1} />
    </instancedMesh>
  )
}

function Landscape() {
  const trees = [
    [-17, -13, .5], [-10, -17, .42], [-2, -18, .52], [8, -17, .44], [16, -12, .5], [18, -3, .42],
    [18, 8, .48], [13, 16, .52], [3, 18, .43], [-7, 17, .47], [-16, 13, .5], [-18, 3, .43],
  ] as const
  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={2.5}>
        <CuboidCollider args={[38, .18, 34]} position={[0, -.18, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[76, 68]} />
          <meshStandardMaterial color="#91b56d" emissive="#38512b" emissiveIntensity={.32} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>
      <GrassField />
      {trees.map(([x, z, scale]) => <OakTree key={`${x}-${z}`} position={[x, 0, z]} scale={scale} />)}
      <mesh position={[-25, -2.8, 8]} scale={[1.4, .5, 1]} receiveShadow><sphereGeometry args={[12, 32, 14]} /><meshStandardMaterial color="#708755" roughness={1} /></mesh>
      <mesh position={[26, -3.2, 9]} scale={[1.6, .52, 1]} receiveShadow><sphereGeometry args={[13, 32, 14]} /><meshStandardMaterial color="#78915d" roughness={1} /></mesh>
      <group position={[0, .01, -5.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.2, 11]} /><meshStandardMaterial color="#c9ad82" roughness={1} /></mesh>
        {Array.from({ length: 17 }, (_, index) => (
          <mesh key={index} position={[(index % 2 ? -.9 : .9) + (seeded(index) - .5) * .45, .035, -4.8 + index * .6]} rotation={[-Math.PI / 2, 0, seeded(index + 20) * .8]}>
            <circleGeometry args={[.12 + seeded(index + 30) * .09, 7]} /><meshStandardMaterial color="#dfc59c" roughness={1} />
          </mesh>
        ))}
      </group>
      <group position={[0, 0, -18.5]}>
        <mesh castShadow position={[0, 1.45, 0]}><boxGeometry args={[5.8, 2.3, .28]} /><meshStandardMaterial color="#31423b" roughness={.75} /></mesh>
        <mesh castShadow position={[-2.4, .3, 0]}><boxGeometry args={[.22, 2.8, .22]} /><meshStandardMaterial color="#efe1bf" /></mesh>
        <mesh castShadow position={[2.4, .3, 0]}><boxGeometry args={[.22, 2.8, .22]} /><meshStandardMaterial color="#efe1bf" /></mesh>
        <Text position={[0, 1.68, .16]} fontSize={.53} color="#efffbb" anchorX="center">CAT GARDENS</Text>
        <Text position={[0, 1.03, .16]} fontSize={.18} color="#fff9e9" anchorX="center" letterSpacing={.13}>A LIVING GARDEN · CYPRUS</Text>
      </group>
    </group>
  )
}

function StormClouds() {
  const clouds = [[-20, 18, -28, 9], [-6, 20, -34, 11], [15, 19, -29, 9], [29, 21, -19, 12]] as const
  return (
    <group>
      {clouds.map(([x, y, z, scale], index) => (
        <Float key={index} speed={.12 + index * .02} rotationIntensity={.015} floatIntensity={.25}>
          <mesh position={[x, y, z]} scale={[scale, scale * .2, scale * .52]}>
            <dodecahedronGeometry args={[1, 2]} />
            <meshStandardMaterial color={index % 2 ? '#7d7890' : '#69667c'} roughness={1} transparent opacity={.5} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function CaretakerPlayer() {
  const body = useRef<RapierRigidBody>(null)
  const model = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const { scene, animations } = useGLTF('/models/quaternius/caretaker.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, model)
  const facing = useRef(0)
  const currentAction = useRef('')
  const smoothTarget = useRef(new THREE.Vector3(0, 1.2, -5))
  const resetToken = useGame((state) => state.resetToken)
  const started = useGame((state) => state.started)
  const setNearby = useGame((state) => state.setNearby)
  const setPlayerPosition = useGame((state) => state.setPlayerPosition)

  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        if (object.material) object.material = (object.material as THREE.Material).clone()
      }
    })
  }, [clone])

  const reset = useCallback(() => {
    if (!body.current) return
    body.current.setTranslation({ x: START_POSITION[0], y: START_POSITION[1], z: START_POSITION[2] }, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    facing.current = 0
  }, [])
  useEffect(reset, [reset, resetToken])

  useFrame((_, delta) => {
    if (!body.current) return
    const game = useGame.getState()
    const position = body.current.translation()
    const velocity = body.current.linvel()
    // The camera looks toward +Z, so screen-left is +X and screen-up is +Z.
    // Keep movement locked to those visible axes so keyboard and pad never
    // change meaning as the caretaker turns.
    const x = game.input.left - game.input.right
    const z = game.input.forward - game.input.backward
    const magnitude = Math.min(1, Math.hypot(x, z))
    const running = game.input.boost > 0
    const speed = running ? 5.6 : 3.25
    const paused = !started || game.bondingMode
    if (!paused && magnitude > .02) {
      const nx = x / magnitude
      const nz = z / magnitude
      body.current.setLinvel({ x: nx * speed * magnitude, y: velocity.y, z: nz * speed * magnitude }, true)
      const targetFacing = Math.atan2(nx, nz)
      let difference = targetFacing - facing.current
      difference = Math.atan2(Math.sin(difference), Math.cos(difference))
      facing.current += difference * (1 - Math.exp(-delta * 12))
      if (model.current) model.current.rotation.y = facing.current
    } else {
      body.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true)
    }

    const actionName = paused || magnitude < .02 ? 'Idle_Neutral' : running ? 'Run' : 'Walk'
    if (currentAction.current !== actionName) {
      actions[currentAction.current]?.fadeOut(.18)
      ;(actions[actionName] ?? actions.Idle)?.reset().fadeIn(.18).play()
      currentAction.current = actionName
    }

    const flat = new THREE.Vector3(position.x, 0, position.z)
    if (game.bondingMode) {
      camera.position.lerp(SPLOTCH_HOME.clone().add(new THREE.Vector3(3.5, 2.15, -3.2)), 1 - Math.exp(-delta * 3.5))
      smoothTarget.current.lerp(SPLOTCH_HOME.clone().add(new THREE.Vector3(0, .75, 0)), 1 - Math.exp(-delta * 5))
    } else {
      const desiredCamera = flat.clone().add(CAMERA_OFFSET)
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 4.4))
      smoothTarget.current.lerp(flat.clone().addScaledVector(SCREEN_FORWARD, 2.1).add(new THREE.Vector3(0, 1.15, 0)), 1 - Math.exp(-delta * 6.5))
    }
    camera.lookAt(smoothTarget.current)

    const distances: Array<[NearbyAction, number]> = [
      ['cat', flat.distanceTo(SPLOTCH_HOME)],
      ['plant', flat.distanceTo(PLANT_POSITION)],
      ['chanda', flat.distanceTo(new THREE.Vector3(...PEOPLE.chanda.position))],
      ['karen', flat.distanceTo(new THREE.Vector3(...PEOPLE.karen.position))],
      ['kimberly', flat.distanceTo(new THREE.Vector3(...PEOPLE.kimberly.position))],
      ['reality', flat.distanceTo(REALITY_PORTAL_POSITION)],
      ['dream', flat.distanceTo(DREAM_PORTAL_POSITION)],
    ]
    distances.sort((a, b) => a[1] - b[1])
    const [nearest, distance] = distances[0]
    const dreamReady = game.hasFed && game.blanketLevel > 0 && game.waterBowlLevel > 0
    setNearby(distance < 2.35 && (nearest !== 'dream' || dreamReady) ? nearest : null)
    setPlayerPosition([position.x, position.y, position.z])
    if (position.y < -2 || Math.abs(position.x) > 34 || Math.abs(position.z) > 30) reset()
  })

  return (
    <RigidBody ref={body} colliders={false} position={START_POSITION} mass={1.1} canSleep={false} enabledRotations={[false, false, false]} linearDamping={8} friction={1.2}>
      <CapsuleCollider args={[.58, .34]} position={[0, -.18, 0]} />
      <group ref={model} position={[0, -1, 0]} scale={.88}>
        <primitive object={clone} />
      </group>
    </RigidBody>
  )
}

function WorldTag({ title, subtitle, warm = false }: { title: string; subtitle: string; warm?: boolean }) {
  return (
    <Html center position={[0, 2.5, 0]} distanceFactor={10} zIndexRange={[7, 0]}>
      <div className={`living-world-tag ${warm ? 'warm' : ''}`}><strong>{title}</strong><span>{subtitle}</span></div>
    </Html>
  )
}

function PersonActor({ id }: { id: PersonId }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/quaternius/caretaker.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const person = PEOPLE[id]
  const visits = useGame((state) => state.npcVisits[id])
  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        const material = (object.material as THREE.MeshStandardMaterial).clone()
        if (object.name.includes('Body') || object.name.includes('Casual_Body')) material.color.multiply(new THREE.Color(person.color))
        object.material = material
      }
    })
  }, [clone, person.color])
  useEffect(() => {
    const action = visits === 0 ? actions.Wave ?? actions.Idle_Neutral : actions.Idle_Neutral ?? actions.Idle
    action?.reset().fadeIn(.2).play()
    return () => { action?.fadeOut(.2) }
  }, [actions, visits])
  return (
    <group ref={group} position={person.position} rotation={[0, id === 'chanda' ? .8 : -1.3, 0]} scale={.88}>
      <primitive object={clone} />
      <WorldTag title={person.label} subtitle={visits ? 'come say hello again' : person.subtitle} warm={visits === 0} />
    </group>
  )
}

function SplotchActor() {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/kenney/animal-cat.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const animation = useGame((state) => state.catAnimation)
  const hasBonded = useGame((state) => state.hasBonded)
  const bondingMode = useGame((state) => state.bondingMode)
  const lastFedDate = useGame((state) => state.lastFedDate)
  const collarName = useGame((state) => state.collarName)
  const playerPosition = useGame((state) => state.playerPosition)
  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        const material = (object.material as THREE.MeshStandardMaterial).clone()
        material.color.set('#ffad63')
        material.emissive = new THREE.Color('#6b2108')
        material.emissiveIntensity = .08
        material.roughness = .82
        object.material = material
      }
    })
  }, [clone])
  useEffect(() => {
    const selected = actions[animation] ?? actions.idle
    selected?.reset().fadeIn(.2).play()
    return () => { selected?.fadeOut(.2) }
  }, [actions, animation])
  useFrame((_, delta) => {
    if (!group.current) return
    const player = new THREE.Vector3(playerPosition[0], 0, playerPosition[2])
    const distance = player.distanceTo(SPLOTCH_HOME)
    const shouldFollow = lastFedDate === localDay() && !bondingMode && distance > 3 && distance < 15
    const target = shouldFollow
      ? player.clone().add(new THREE.Vector3(Math.sin(group.current.rotation.y + Math.PI) * 1.45, 0, Math.cos(group.current.rotation.y + Math.PI) * 1.45))
      : SPLOTCH_HOME
    const before = group.current.position.clone()
    group.current.position.lerp(target, 1 - Math.exp(-delta * (shouldFollow ? 1.6 : .8)))
    const motion = group.current.position.clone().sub(before)
    if (motion.lengthSq() > .00002) {
      group.current.rotation.y = Math.atan2(motion.x, motion.z)
      if (animation === 'idle') (actions.walk ?? actions.idle)?.play()
    }
  })
  const fedToday = lastFedDate === localDay()
  return (
    <group ref={group} position={[SPLOTCH_HOME.x, 0, SPLOTCH_HOME.z]} rotation={[0, Math.PI, 0]}>
      <primitive object={clone} scale={.98} />
      <WorldTag title="Splotch · orange male" subtitle={fedToday ? 'fed today · ready for pets' : 'your first garden friend'} warm={!fedToday} />
      {collarName && <Text position={[0, .77, .28]} fontSize={.12} color="#fff4ca" anchorX="center">{collarName}</Text>}
      {hasBonded && <Sparkles count={10} scale={[2.1, 1.7, 2.1]} size={3} speed={.25} color="#f8f2bd" position={[0, .8, 0]} />}
    </group>
  )
}

function PlantPlot() {
  const stage = useGame((state) => state.plantStage)
  const watered = useGame((state) => state.lastWateredDate === localDay())
  const leaves = Math.max(2, stage * 3)
  return (
    <group position={[PLANT_POSITION.x, 0, PLANT_POSITION.z]}>
      <RoundedBox args={[2.1, .32, 1.7]} position={[0, .16, 0]} radius={.16} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#866348" roughness={1} /></RoundedBox>
      <RoundedBox args={[1.8, .12, 1.4]} position={[0, .35, 0]} radius={.15} smoothness={4}><meshStandardMaterial color={watered ? '#4c382a' : '#71523b'} roughness={1} /></RoundedBox>
      {Array.from({ length: leaves }, (_, index) => {
        const angle = (index / leaves) * Math.PI * 2
        const radius = .14 + (index % 3) * .16
        const height = .38 + (index % stage) * .19
        return (
          <group key={index} position={[Math.cos(angle) * radius, .35, Math.sin(angle) * radius]} rotation={[0, -angle, 0]}>
            <mesh position={[0, height / 2, 0]}><cylinderGeometry args={[.025, .035, height, 7]} /><meshStandardMaterial color="#4f7c48" /></mesh>
            <mesh position={[.12, height, 0]} rotation={[0, 0, -.5]}><sphereGeometry args={[.15, 9, 6]} /><meshStandardMaterial color={index % 2 ? '#78a85d' : '#9abc65'} roughness={.9} /></mesh>
          </group>
        )
      })}
      <WorldTag title="Your young garden" subtitle={watered ? 'watered today · growing' : 'Chanda could use help watering'} warm={!watered} />
    </group>
  )
}

function CatHouse() {
  const blanket = useGame((state) => state.blanketLevel)
  const waterBowl = useGame((state) => state.waterBowlLevel)
  const cuddlebox = useGame((state) => state.cuddleboxLevel)
  const bench = useGame((state) => state.benchPlaced)
  const pathStyle = useGame((state) => state.pathStyle)
  return (
    <group position={[3.25, 0, 6.1]}>
      <RoundedBox args={[3.2, 2.25, 2.6]} position={[0, 1.18, 0]} radius={.16} smoothness={4} castShadow receiveShadow><meshStandardMaterial color={cuddlebox > 1 ? '#e0a468' : '#c48a5a'} roughness={.88} /></RoundedBox>
      <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.45, 1.1, 4]} /><meshStandardMaterial color="#6f5647" roughness={.9} /></mesh>
      <mesh position={[-.7, 1, -1.31]}><circleGeometry args={[.65, 28]} /><meshStandardMaterial color="#283330" roughness={1} /></mesh>
      <RoundedBox args={[1.48, .44, 1.35]} position={[-.7, .32, -1.02]} radius={.22} smoothness={5} castShadow><meshStandardMaterial color={cuddlebox > 1 ? '#8ca76d' : '#9a7658'} roughness={1} /></RoundedBox>
      {blanket > 0 && <RoundedBox args={[1.23, .12, 1.08]} position={[-.7, .58, -1.18]} radius={.16} smoothness={6}><meshStandardMaterial color="#e9c8a8" roughness={1} /></RoundedBox>}
      {waterBowl > 0 && (
        <group position={[1.15, 0, -1.8]}>
          <mesh position={[0, .15, 0]}><cylinderGeometry args={[.42, .3, .24, 24]} /><meshStandardMaterial color={waterBowl > 1 ? '#7aa9a2' : '#d7b45f'} metalness={.4} roughness={.3} /></mesh>
          <mesh position={[0, .29, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.28, 24]} /><meshStandardMaterial color="#7ec8d5" transparent opacity={.8} /></mesh>
          {waterBowl > 1 && <group position={[.28, .62, .08]}><mesh><cylinderGeometry args={[.24, .26, .85, 18]} /><meshStandardMaterial color="#b7d8d0" transparent opacity={.75} /></mesh><mesh position={[-.18, -.28, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.05, .05, .38, 10]} /><meshStandardMaterial color="#6b8f8a" /></mesh></group>}
        </group>
      )}
      {bench && (
        <group position={[-3.35, 0, .8]} rotation={[0, .25, 0]}>
          <RoundedBox args={[2.2, .22, .58]} position={[0, .82, 0]} radius={.08} smoothness={3}><meshStandardMaterial color="#b77d4f" /></RoundedBox>
          <RoundedBox args={[2.2, .22, .35]} position={[0, 1.35, .26]} radius={.07} smoothness={3}><meshStandardMaterial color="#b77d4f" /></RoundedBox>
          {[-.8, .8].map((x) => <mesh key={x} position={[x, .4, 0]}><boxGeometry args={[.14, .8, .14]} /><meshStandardMaterial color="#6e5948" /></mesh>)}
        </group>
      )}
      {pathStyle === 'gravel' && Array.from({ length: 24 }, (_, index) => (
        <mesh key={index} position={[-1.4 + (index % 4) * .55, .035, -2.2 - Math.floor(index / 4) * .55]} rotation={[-Math.PI / 2, 0, seeded(index) * 2]}>
          <circleGeometry args={[.16 + seeded(index + 8) * .08, 7]} /><meshStandardMaterial color={index % 2 ? '#dad2bd' : '#b7b0a0'} roughness={1} />
        </mesh>
      ))}
      <Html center position={[0, 3.55, 0]} distanceFactor={11} zIndexRange={[5, 0]}><div className="home-world-label"><b>SPLOTCH’S HOUSE</b><span>cuddlebox {cuddlebox > 1 ? 'upgraded' : 'ready'} · blanket {blanket ? 'added' : 'needed'} · water {waterBowl ? 'ready' : 'needed'}</span></div></Html>
      <pointLight position={[-.7, 1.1, -1.4]} color="#ffd18d" intensity={blanket ? 1.8 : .6} distance={5} />
    </group>
  )
}

function GardenPortals() {
  const realityVisits = useGame((state) => state.realityVisits)
  const dreamReady = useGame((state) => state.hasFed && state.blanketLevel > 0 && state.waterBowlLevel > 0)
  return (
    <group>
      <group position={[REALITY_PORTAL_POSITION.x, 0, REALITY_PORTAL_POSITION.z]} rotation={[0, -.5, 0]}>
        <RoundedBox args={[3.1, 2.55, .32]} position={[0, 1.4, 0]} radius={.18} smoothness={4} castShadow><meshStandardMaterial color="#f3ecd9" roughness={.65} /></RoundedBox>
        <mesh position={[0, 1.45, -.19]}><planeGeometry args={[2.55, 1.95]} /><meshStandardMaterial color="#263c36" emissive="#71b7a5" emissiveIntensity={.25} /></mesh>
        <Text position={[0, 1.65, -.22]} rotation={[0, Math.PI, 0]} fontSize={.25} color="#f5ffdc" anchorX="center">THE REAL SPLOTCH</Text>
        <Text position={[0, 1.2, -.22]} rotation={[0, Math.PI, 0]} fontSize={.14} color="#b5d9ce" anchorX="center">PHOTOS · UPDATES · NEEDS</Text>
        <WorldTag title="Reality Portal" subtitle={realityVisits ? 'open again' : 'meet the real Splotch · +40'} warm={!realityVisits} />
      </group>
      <group position={[DREAM_PORTAL_POSITION.x, 0, DREAM_PORTAL_POSITION.z]} rotation={[0, .5, 0]}>
        <mesh position={[0, 1.5, 0]}><torusGeometry args={[1.2, .16, 18, 72]} /><meshStandardMaterial color={dreamReady ? '#d4c4ff' : '#7c7889'} emissive={dreamReady ? '#8068dc' : '#393643'} emissiveIntensity={dreamReady ? 2 : .2} roughness={.3} /></mesh>
        <mesh position={[0, 1.5, .03]}><circleGeometry args={[1.04, 48]} /><meshBasicMaterial color={dreamReady ? '#8875b0' : '#5d5b64'} transparent opacity={.5} /></mesh>
        {dreamReady && <Sparkles count={38} scale={[3, 3.5, 2]} size={5} speed={.25} color="#fff5bd" position={[0, 1.5, 0]} />}
        <WorldTag title="Splotch’s Dream" subtitle={dreamReady ? 'Mathikoloni is waiting' : 'needs food · blanket · water'} warm={dreamReady} />
      </group>
    </group>
  )
}

function MorningBasket() {
  const claimed = useGame((state) => state.lastDailyClaim === localDay())
  return (
    <group position={[1.8, 0, -7.8]}>
      <RoundedBox args={[1.4, .62, 1]} position={[0, .34, 0]} radius={.15} smoothness={4} castShadow><meshStandardMaterial color={claimed ? '#8b765e' : '#d2a466'} roughness={.9} /></RoundedBox>
      {[0, 1, 2, 3].map((index) => <mesh key={index} position={[-.48 + index * .32, .63, 0]}><boxGeometry args={[.09, .45, 1.02]} /><meshStandardMaterial color="#6f5946" /></mesh>)}
      {!claimed && <><pointLight position={[0, 1, 0]} color="#efff9a" intensity={2.5} distance={6} /><Sparkles count={14} scale={[2, 2.5, 2]} size={4} speed={.3} color="#efff9a" position={[0, 1, 0]} /></>}
      <WorldTag title="Morning basket" subtitle={claimed ? 'come back tomorrow' : 'free daily care supplies'} warm={!claimed} />
    </group>
  )
}

function BoundaryColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[28, 2, .2]} position={[0, 1, -24]} />
      <CuboidCollider args={[28, 2, .2]} position={[0, 1, 24]} />
      <CuboidCollider args={[.2, 2, 24]} position={[-28, 1, 0]} />
      <CuboidCollider args={[.2, 2, 24]} position={[28, 1, 0]} />
    </RigidBody>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#b7c6dc']} />
      <fog attach="fog" args={['#c8cee0', 30, 74]} />
      <Sky distance={450000} sunPosition={[-45, 32, -70]} inclination={.54} azimuth={.21} turbidity={7.5} rayleigh={2.6} mieCoefficient={.009} mieDirectionalG={.82} />
      <ambientLight intensity={1.5} color="#eeeaff" />
      <hemisphereLight intensity={2.4} color="#fffdf0" groundColor="#5e7450" />
      <directionalLight castShadow position={[-14, 28, -18]} intensity={4.4} color="#fffef1" shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={1} shadow-camera-far={70} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-bias={-.00018} />
      <StormClouds />
      <Landscape />
      <BoundaryColliders />
      <MorningBasket />
      <PlantPlot />
      <CatHouse />
      <SplotchActor />
      {(Object.keys(PEOPLE) as PersonId[]).map((id) => <PersonActor key={id} id={id} />)}
      <GardenPortals />
      <CaretakerPlayer />
    </>
  )
}

export function CatGardenWorld() {
  return (
    <Canvas shadows dpr={[1, 1.7]} camera={{ position: [0, 4.5, -15], fov: 46, near: .1, far: 170 }} gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }} onCreated={({ gl }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.3
      gl.outputColorSpace = THREE.SRGBColorSpace
    }}>
      <Suspense fallback={null}><Physics gravity={[0, -18, 0]} timeStep="vary"><Scene /></Physics></Suspense>
    </Canvas>
  )
}

useGLTF.preload('/models/bruno/oak-tree.glb')
useGLTF.preload('/models/kenney/animal-cat.glb')
useGLTF.preload('/models/quaternius/caretaker.glb')

export default CatGardenWorld
