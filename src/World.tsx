import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Html, RoundedBox, Sky, Sparkles, Text, useAnimations, useGLTF } from '@react-three/drei'
import { CapsuleCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { localDay, useGame, type NearbyAction, type PersonId } from './game/store'
import { getCompanionProfile, sexLabel } from './game/companions'
import { movementVector } from './game/presentation'
import { GardenAvatar, type AvatarMotion } from './GardenAvatar'
import { chandaAvatar, karenAvatar, defaultAvatarStyle, type AvatarStyle } from './game/avatars'
import { advanceTraffic, trafficLane, ROAD_HALF_LENGTH } from './game/traffic'
import { FoodBowl } from './CareProps'
import { GardenGround, GardenDetails, DistantLandscape, OliveGrove } from './GardenScenery'

const START_POSITION: [number, number, number] = [0, 1, -9]
const SPLOTCH_HOME = new THREE.Vector3(0, 0, 4.4)
const SPLOTCH_SHELTER_SPOT = new THREE.Vector3(2.05, 0, 4.75)
const PLANT_POSITION = new THREE.Vector3(-3.2, 0, 3.6)
const BUILD_POSITION = new THREE.Vector3(3.25, 0, 6.1)
const BASKET_POSITION = new THREE.Vector3(1.8, 0, -7.8)
const SUPPLY_POSITION = new THREE.Vector3(-4.6, 0, -7.3)
const REALITY_PORTAL_POSITION = new THREE.Vector3(9.4, 0, -2.1)
const DREAM_PORTAL_POSITION = new THREE.Vector3(-9.2, 0, 7.2)
const SCREEN_FORWARD = new THREE.Vector3(0, 0, 1)
const CAMERA_OFFSET = new THREE.Vector3(0, 4.8, -8.6)
const PEOPLE: Record<PersonId, { position: [number, number, number]; appearance: AvatarStyle; label: string; subtitle: string }> = {
  chanda: { position: [-4.8, 0, .6], appearance: chandaAvatar, label: 'Chanda', subtitle: 'daily caretaker · from Nepal' },
  karen: { position: [6.8, 0, 4.6], appearance: karenAvatar, label: 'Karen', subtitle: 'unlocked · co-founder' },
  kimberly: { position: [6.8, 0, 8.1], appearance: { ...defaultAvatarStyle, displayName: 'Kimberly', bodyFrame: 'feminine', clothing: '#477f78', hair: '#a94d2b', hairStyle: 'long', eyes: '#4d9867' }, label: 'Kimberly', subtitle: 'unlocked · co-founder' },
}

const isPersonUnlocked = (id: PersonId, completedDays: number, realityVisits: number) => {
  if (id === 'chanda') return completedDays >= 1
  if (id === 'karen') return completedDays >= 3 && realityVisits > 0
  return completedDays >= 6 && realityVisits > 0
}

const runIfPlayerNear = (point: THREE.Vector3, action: () => void, label: string) => {
  const game = useGame.getState()
  const player = new THREE.Vector3(game.playerPosition[0], 0, game.playerPosition[2])
  if (player.distanceTo(point) <= 2.65) action()
  else game.setNotification(`Walk closer to ${label} first.`)
}

const seeded = (seed: number) => {
  const value = Math.sin(seed * 144.731) * 43758.5453
  return value - Math.floor(value)
}

function Landscape() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={2.5}>
        <CuboidCollider args={[38, .18, 34]} position={[0, -.18, 0]} />
        <GardenGround />
      </RigidBody>
      <GardenDetails /><DistantLandscape />
      <OliveGrove />
      <mesh position={[-25, -2.8, 8]} scale={[1.4, .5, 1]} receiveShadow><sphereGeometry args={[12, 32, 14]} /><meshStandardMaterial color="#708755" roughness={1} /></mesh>
      <mesh position={[26, -3.2, 9]} scale={[1.6, .52, 1]} receiveShadow><sphereGeometry args={[13, 32, 14]} /><meshStandardMaterial color="#78915d" roughness={1} /></mesh>
      <group position={[0, 0, -18.5]}>
        <mesh castShadow position={[0, 1.45, 0]}><boxGeometry args={[5.8, 2.3, .28]} /><meshStandardMaterial color="#31423b" roughness={.75} /></mesh>
        <mesh castShadow position={[-2.4, .3, 0]}><boxGeometry args={[.22, 2.8, .22]} /><meshStandardMaterial color="#efe1bf" /></mesh>
        <mesh castShadow position={[2.4, .3, 0]}><boxGeometry args={[.22, 2.8, .22]} /><meshStandardMaterial color="#efe1bf" /></mesh>
        <Text font="/fonts/garden-labels.woff" position={[0, 1.68, .16]} fontSize={.53} color="#efffbb" anchorX="center">CAT GARDENS</Text>
        <Text font="/fonts/garden-labels.woff" position={[0, 1.03, .16]} fontSize={.18} color="#fff9e9" anchorX="center" letterSpacing={.13}>A LIVING GARDEN · CYPRUS</Text>
      </group>
    </group>
  )
}

function RoadCar({ offset, color, direction = 1, active }: { offset: number; color: string; direction?: 1 | -1; active: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.position.x = advanceTraffic(group.current.position.x, delta, direction, active)
  })
  return (
    <group name={`road-car-${direction}`} ref={group} position={[offset, .065, trafficLane(direction)]} rotation={[0, direction === 1 ? 0 : Math.PI, 0]}>
      <RoundedBox args={[2.25, .56, 1.05]} position={[0, .35, 0]} radius={.18} smoothness={4} castShadow><meshStandardMaterial color={color} metalness={.1} roughness={.62} /></RoundedBox>
      <RoundedBox args={[1.08, .48, .9]} position={[-.18, .75, 0]} radius={.16} smoothness={4} castShadow><meshStandardMaterial color="#b7c9cf" metalness={.2} roughness={.34} /></RoundedBox>
      {[-.68, .68].flatMap((x) => [-.49, .49].map((z) => <mesh key={`${x}-${z}`} position={[x, .2, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.25, .25, .15, 18]} /><meshStandardMaterial color="#272928" roughness={1} /></mesh>))}
    </group>
  )
}

function RoadRisk({ active }: { active: boolean }) {
  return (
    <group position={[0, 0, 22]}>
      <mesh position={[0,.012,0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[ROAD_HALF_LENGTH * 2 + 8, 5.2]} /><meshStandardMaterial color="#565d60" roughness={.96} /></mesh>
      {Array.from({ length: 61 }, (_, index) => <mesh key={index} position={[-120 + index * 4, .035, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.1, .12]} /><meshBasicMaterial color="#e9e2c6" /></mesh>)}
      <RoadCar offset={-18} color="#d6a45d" active={active} />
      <RoadCar offset={21} color="#879cb0" direction={-1} active={active} />
      <group position={[0, 0, -3]}>{[-24, -18, -12, -6, 1, 7, 13, 19, 25].map((x, index) => <group key={x} position={[x, 0, 0]} rotation={[0, 0, index === 4 ? -.2 : 0]}><mesh position={[0, .65, 0]}><boxGeometry args={[.11, 1.3, .11]} /><meshStandardMaterial color="#8b795f" /></mesh>{index !== 4 && <mesh position={[1.45, .68, 0]}><boxGeometry args={[2.8, .08, .08]} /><meshStandardMaterial color="#9b896d" /></mesh>}</group>)}</group>
      <Html center position={[17, 2.3, -2.7]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}><div className="risk-world-label"><b>ROAD RISK</b><span>The garden needs protected routes</span></div></Html>
    </group>
  )
}

function MathikoloniHorizon() {
  return (
    <group position={[-14, 1.2, 17]} rotation={[0, .18, 0]}>
      <group position={[0, 1.2, 0]}>
        <RoundedBox args={[6.8, 1.8, 2.7]} radius={.2} smoothness={4}><meshStandardMaterial color="#e8edcf" transparent opacity={.3} emissive="#c8dc70" emissiveIntensity={.35} wireframe /></RoundedBox>
        <mesh position={[0, 1.25, 0]} rotation={[0, 0, -.12]}><boxGeometry args={[7.4, .16, 3.2]} /><meshStandardMaterial color="#f2f0d8" transparent opacity={.34} emissive="#dfff6c" emissiveIntensity={.45} /></mesh>
        {[[-2.1, -1.65], [0, -1.65], [2.1, -1.65]].map(([x, z]) => <pointLight key={x} position={[x, .45, z]} color="#dfff6c" intensity={1.2} distance={5} />)}
      </group>
      <WorldTag title="THE MATHIKOLONI DREAM" subtitle="proposed property · not yet acquired" warm />
    </group>
  )
}

function CaretakerPlayer() {
  const body = useRef<RapierRigidBody>(null)
  const model = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const motion = useRef<AvatarMotion>({ speed: 0, action: 'idle' })
  const facing = useRef(0)
  const hudTick = useRef(0)
  const smoothTarget = useRef(new THREE.Vector3(0, 1.2, -5))
  const resetToken = useGame((state) => state.resetToken)
  const started = useGame((state) => state.started)
  const bondingMode = useGame((state) => state.bondingMode)
  const avatarStyle = useGame((state) => state.avatarStyle)
  const setNearby = useGame((state) => state.setNearby)
  const setPlayerPosition = useGame((state) => state.setPlayerPosition)


  const reset = useCallback(() => {
    if (!body.current) return
    body.current.setTranslation({ x: START_POSITION[0], y: START_POSITION[1], z: START_POSITION[2] }, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    facing.current = 0
  }, [])
  useEffect(reset, [reset, resetToken])

  useFrame((_, frameDelta) => {
    const delta = Math.min(frameDelta, .05)
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
    const working = Date.now() < game.playerActionUntil
    const paused = !started || game.bondingMode || working
    if (!paused && magnitude > .02) {
      const movement = movementVector(x, z, speed)
      const nx = movement.x, nz = movement.z
      body.current.setLinvel({ x: nx, y: velocity.y, z: nz }, true)
      const targetFacing = Math.atan2(nx, nz)
      let difference = targetFacing - facing.current
      difference = Math.atan2(Math.sin(difference), Math.cos(difference))
      facing.current += difference * (1 - Math.exp(-delta * 12))
      if (model.current) model.current.rotation.y = facing.current
    } else {
      body.current.setLinvel({ x: 0, y: velocity.y, z: 0 }, true)
    }

    if (model.current) {
      model.current.position.y = THREE.MathUtils.damp(model.current.position.y, -1.1, 7, delta)
      model.current.rotation.x = 0
      if (game.bondingMode) {
        const cat = new THREE.Vector3(...game.catPosition)
        const targetFacing = Math.atan2(cat.x - position.x, cat.z - position.z)
        const difference = Math.atan2(Math.sin(targetFacing - facing.current), Math.cos(targetFacing - facing.current))
        facing.current += difference * (1 - Math.exp(-delta * 7))
        model.current.rotation.y = facing.current
      }
    }

    motion.current.speed = paused ? 0 : magnitude * speed
    motion.current.action = working ? (game.playerAction || 'work') : game.bondingMode ? 'bond' : magnitude > .02 ? 'walk' : 'idle'
    motion.current.waterTarget = [PLANT_POSITION.x, .45, PLANT_POSITION.z]
    if (working && model.current && (game.playerAction === 'water' || game.playerAction === 'feed')) {
      const target = game.playerAction === 'water' ? PLANT_POSITION : new THREE.Vector3(...game.catPosition)
      const angle = Math.atan2(target.x-position.x,target.z-position.z)
      facing.current += Math.atan2(Math.sin(angle-facing.current),Math.cos(angle-facing.current))*(1-Math.exp(-delta*10))
      model.current.rotation.y = facing.current
    }

    const flat = new THREE.Vector3(position.x, 0, position.z)
    if (game.bondingMode) {
      const cat = new THREE.Vector3(...game.catPosition)
      const midpoint = flat.clone().lerp(cat, .5)
      const bondAxis = cat.clone().sub(flat).setY(0).normalize()
      const side = new THREE.Vector3(-bondAxis.z, 0, bondAxis.x)
      camera.position.lerp(midpoint.clone().addScaledVector(side, 3.55).add(new THREE.Vector3(0, 1.85, 0)), 1 - Math.exp(-delta * 3.5))
      smoothTarget.current.lerp(midpoint.add(new THREE.Vector3(0, .72, 0)), 1 - Math.exp(-delta * 5))
    } else {
      const desiredCamera = flat.clone().add(CAMERA_OFFSET)
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 4.4))
      smoothTarget.current.lerp(flat.clone().addScaledVector(SCREEN_FORWARD, 2.1).add(new THREE.Vector3(0, 1.15, 0)), 1 - Math.exp(-delta * 6.5))
    }
    camera.lookAt(smoothTarget.current)

    const distances: Array<[NearbyAction, number]> = [
      [game.lastDailyClaim === localDay() ? null : 'basket', flat.distanceTo(BASKET_POSITION)],
      [game.shelterStage < 3 ? 'build' : 'home', flat.distanceTo(BUILD_POSITION)],
      ['supply', flat.distanceTo(SUPPLY_POSITION)],
      ['cat', flat.distanceTo(new THREE.Vector3(...game.catPosition))],
      ['plant', flat.distanceTo(PLANT_POSITION)],
      [isPersonUnlocked('chanda', game.completedDays, game.realityVisits) ? 'chanda' : null, flat.distanceTo(new THREE.Vector3(...PEOPLE.chanda.position))],
      [isPersonUnlocked('karen', game.completedDays, game.realityVisits) ? 'karen' : null, flat.distanceTo(new THREE.Vector3(...PEOPLE.karen.position))],
      [isPersonUnlocked('kimberly', game.completedDays, game.realityVisits) ? 'kimberly' : null, flat.distanceTo(new THREE.Vector3(...PEOPLE.kimberly.position))],
      ['reality', flat.distanceTo(REALITY_PORTAL_POSITION)],
      ['dream', flat.distanceTo(DREAM_PORTAL_POSITION)],
    ].filter((entry): entry is [Exclude<NearbyAction, null>, number] => Boolean(entry[0]))
    distances.sort((a, b) => a[1] - b[1])
    const [nearest, distance] = distances[0]
    const dreamReady = game.shelterStage >= 3 && game.hasFed && game.blanketLevel > 0 && game.waterBowlLevel > 0
    setNearby(distance < 2.35 && (nearest !== 'dream' || dreamReady) ? nearest : null)
    hudTick.current += delta
    if (hudTick.current >= .08) {
      setPlayerPosition([position.x, position.y, position.z])
      hudTick.current = 0
    }
    if (position.y < -2 || Math.abs(position.x) > 34 || Math.abs(position.z) > 30) reset()
  })

  return (
    <RigidBody ref={body} colliders={false} position={START_POSITION} mass={1.1} canSleep={false} enabledRotations={[false, false, false]} linearDamping={8} friction={1.2}>
      <CapsuleCollider args={[.58, .34]} position={[0, -.18, 0]} />
      <group ref={model} position={[0, -1.1, 0]}>
        <GardenAvatar appearance={avatarStyle} motion={motion} />
      </group>
    </RigidBody>
  )
}

function WorldTag({ title, subtitle, warm = false }: { title: string; subtitle: string; warm?: boolean }) {
  const anchor = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const point = useMemo(() => new THREE.Vector3(), [])
  const shown = useRef(true)
  useFrame(() => {
    if (!anchor.current || !label.current) return
    anchor.current.getWorldPosition(point)
    const player = useGame.getState().playerPosition
    const near = Math.hypot(point.x - player[0], point.z - player[2]) < 13
    if (near !== shown.current) { label.current.style.visibility = near ? 'visible' : 'hidden'; shown.current = near }
  })
  return (
    <group ref={anchor}>
      <Html center position={[0, 2.5, 0]} zIndexRange={[7, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className={`living-world-tag ${warm ? 'warm' : ''}`}><strong>{title}</strong><span>{subtitle}</span></div>
      </Html>
    </group>
  )
}

function PersonActor({ id }: { id: PersonId }) {
  const person = PEOPLE[id]
  const visits = useGame((state) => state.npcVisits[id])
  return <group position={person.position} rotation={[0, id === 'chanda' ? .8 : -1.3, 0]}>
    <GardenAvatar appearance={person.appearance} floralShorts={id === 'chanda'} />
    <WorldTag title={person.label} subtitle={visits ? 'come say hello again' : person.subtitle} warm={visits === 0} />
  </group>
}

function catMaterial(source: THREE.MeshStandardMaterial, baseColor: string, striped: boolean) {
  const material = source.clone()
  material.color.set('#ffffff')
  material.emissive.set('#000000')
  material.roughness = .9
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCoat = { value: new THREE.Color(baseColor) }
    shader.uniforms.uTabby = { value: striped ? 1 : 0 }
    shader.vertexShader = 'varying vec3 vCoatPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoatPosition = position;')
    shader.fragmentShader = 'uniform vec3 uCoat; uniform float uTabby; varying vec3 vCoatPosition;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      #ifdef USE_MAP
      if (vMapUv.x > .8 && vMapUv.x < .9) {
        float bands = smoothstep(.65, .88, sin(vCoatPosition.z * 25.0 + sin(vCoatPosition.y * 12.0) * 1.2));
        diffuseColor.rgb = uCoat * (1.0 - bands * .23 * uTabby);
      }
      #endif
    `)
  }
  material.customProgramCacheKey = () => `cat-coat-${baseColor}-${striped}`
  return material
}

function SplotchActor() {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/kenney/animal-cat.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const selectedCompanionId = useGame((state) => state.selectedCompanionId)
  const companion = getCompanionProfile(selectedCompanionId)
  const discovered = useGame((state) => state.splotchDiscovered)
  const hasBonded = useGame((state) => state.hasBonded)
  const lastFedDate = useGame((state) => state.lastFedDate)
  const shelterStage = useGame((state) => state.shelterStage)
  const collarName = useGame((state) => state.collarName)
  const bondingMode = useGame((state) => state.bondingMode)
  const currentAction = useRef('')
  const hudTick = useRef(0)
  const target = useRef(SPLOTCH_HOME.clone())
  useEffect(() => {
    const owned: THREE.Material[] = []
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        object.material = catMaterial(object.material as THREE.MeshStandardMaterial, companion.phenotype.baseColor, companion.phenotype.pattern === 'tabby')
        owned.push(object.material as THREE.Material)
      }
    })
    return () => owned.forEach((material) => material.dispose())
  }, [clone, companion.phenotype.baseColor, companion.phenotype.secondaryColor])
  useFrame(({ clock }, frameDelta) => {
    const delta = Math.min(frameDelta, .05)
    if (!group.current) return
    const game = useGame.getState()
    const player = new THREE.Vector3(game.playerPosition[0], 0, game.playerPosition[2])
    const position = group.current.position
    const home = game.shelterStage >= 3 ? SPLOTCH_SHELTER_SPOT : SPLOTCH_HOME
    const playerDistance = position.distanceTo(player)
    target.current.copy(home)

    if (game.catAnimation === 'eat') {
      target.current.set(...(game.mealPosition || [2.65, 0, 4.1])).add(new THREE.Vector3(0, 0, companion.phenotype.scale * companion.phenotype.length * .85))
    } else if (game.bondingMode) {
      const approach = THREE.MathUtils.smoothstep(game.bondingProgress, 18, 78)
      const nuzzle = game.bondingProgress > 78 ? (Math.sin(clock.elapsedTime * 2.6) + 1) * .035 : 0
      const contactOffset = new THREE.Vector3(.85, 0, .55).normalize().multiplyScalar(1.55 - approach * .32 - nuzzle)
      target.current.copy(player).add(contactOffset)
    } else if (game.lastFedDate === localDay() && playerDistance > 3.1 && playerDistance < 13 && (companion.id !== 'mabel' || game.hasBonded)) {
      // Fixed world-space following offset: it never feeds Splotch's own yaw
      // back into his destination, which prevents the previous orbiting loop.
      const followDistance = companion.id === 'winona-p-gray' ? .9 : 1.25
      target.current.copy(player).add(new THREE.Vector3(followDistance, 0, -followDistance))
    } else if (game.lastFedDate !== localDay() && playerDistance < 1.05) {
      const away = position.clone().sub(player).setY(0)
      if (away.lengthSq() > .001) target.current.copy(position).add(away.normalize().multiplyScalar(.75))
    }

    const motion = target.current.clone().sub(position).setY(0)
    const moving = motion.lengthSq() > .0025
    if (moving) {
      const step = Math.min(motion.length(), delta * (game.lastFedDate === localDay() ? 1.55 : .78))
      motion.normalize()
      position.addScaledVector(motion, step)
      const desiredFacing = Math.atan2(motion.x, motion.z)
      const turn = Math.atan2(Math.sin(desiredFacing - group.current.rotation.y), Math.cos(desiredFacing - group.current.rotation.y))
      group.current.rotation.y += turn * (1 - Math.exp(-delta * 8))
    } else if (game.catAnimation === 'eat') {
      const turn = Math.atan2(Math.sin(Math.PI - group.current.rotation.y), Math.cos(Math.PI - group.current.rotation.y))
      group.current.rotation.y += turn * (1 - Math.exp(-delta * 9))
    } else if (game.bondingMode) {
      const desiredFacing = Math.atan2(player.x - position.x, player.z - position.z)
      const turn = Math.atan2(Math.sin(desiredFacing - group.current.rotation.y), Math.cos(desiredFacing - group.current.rotation.y))
      group.current.rotation.y += turn * (1 - Math.exp(-delta * 7))
    }

    const groundedY = game.bondingMode && game.bondingProgress > 76 ? Math.sin(clock.elapsedTime * 3.1) * .018 : 0
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, groundedY, 7, delta)

    const desiredAction = game.catAnimation === 'eat' ? (moving ? 'walk' : 'eat') : game.catAnimation === 'dance' ? 'dance' : moving ? 'walk' : 'idle'
    if (currentAction.current !== desiredAction) {
      actions[currentAction.current]?.fadeOut(.2)
      ;(actions[desiredAction] ?? actions.idle)?.reset().fadeIn(.2).play()
      currentAction.current = desiredAction
    }
    hudTick.current += delta
    if (hudTick.current >= .08) {
      game.setCatPosition([position.x, position.y, position.z])
      hudTick.current = 0
    }
  })
  const fedToday = lastFedDate === localDay()
  return (
    <group ref={group} position={[SPLOTCH_HOME.x, 0, SPLOTCH_HOME.z]} rotation={[0, Math.PI, 0]}>
      <primitive object={clone} scale={[companion.phenotype.scale * companion.phenotype.width, companion.phenotype.scale, companion.phenotype.scale * companion.phenotype.length]} />
      <CatIdentityDetails />
      {!bondingMode && <WorldTag title={discovered ? `${companion.name} · ${sexLabel(companion.sex)}` : `${companion.name} is watching`} subtitle={fedToday ? `fed today · choosing to follow` : shelterStage >= 3 ? `${companion.pronouns.possessive} shelter is ready` : 'keep a little distance'} warm={!fedToday} />}
      {collarName && <Text font="/fonts/garden-labels.woff" position={[0, .77, .28]} fontSize={.12} color="#fff4ca" anchorX="center">{collarName}</Text>}
      {hasBonded && <Sparkles count={10} scale={[2.1, 1.7, 2.1]} size={3} speed={.25} color="#f8f2bd" position={[0, .8, 0]} />}
      {bondingMode && <BondingResponse />}
    </group>
  )
}

function VisitingCatActor() {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/kenney/animal-cat.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const selected = useGame((state) => state.selectedCompanionId)
  const realityVisits = useGame((state) => state.realityVisits)
  const visitor = getCompanionProfile(selected === 'splotch' ? 'mabel' : 'splotch')
  useEffect(() => {
    const owned: THREE.Material[] = []
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.material = catMaterial(object.material as THREE.MeshStandardMaterial, visitor.phenotype.baseColor, visitor.phenotype.pattern === 'tabby')
        owned.push(object.material as THREE.Material)
    })
    return () => owned.forEach((material) => material.dispose())
  }, [clone, visitor.phenotype.baseColor, visitor.phenotype.secondaryColor])
  useEffect(() => {
    const action = actions.idle ?? actions.Idle
    action?.reset().fadeIn(.2).play()
    return () => { action?.fadeOut(.2) }
  }, [actions])
  if (realityVisits < 1) return null
  return (
    <group ref={group} position={[-1.9, 0, 7.8]} rotation={[0, -1.7, 0]}>
      <primitive object={clone} scale={[visitor.phenotype.scale * visitor.phenotype.width, visitor.phenotype.scale, visitor.phenotype.scale * visitor.phenotype.length]} />
      <WorldTag title={`${visitor.name} is visiting`} subtitle="a new relationship appeared" warm />
    </group>
  )
}

function ComfortMapOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  const zones = [
    { position: [3.25, .025, 6.1] as [number, number, number], radius: 3.7, color: '#7ee1ce', title: 'PROTECTED REST', detail: 'cover · warmth · retreat' },
    { position: [-3.2, .028, 3.6] as [number, number, number], radius: 2.4, color: '#a8d76a', title: 'PLANTED COVER', detail: 'shade · scent · concealment' },
    { position: [-4.6, .03, -7.3] as [number, number, number], radius: 2.5, color: '#efb55f', title: 'RESOURCE POINT', detail: 'food away from sleeping' },
    { position: [0, .032, 17.8] as [number, number, number], radius: 5.2, color: '#f2816d', title: 'EXPOSED EDGE', detail: 'road buffer still needed' },
  ]
  return (
    <group>
      {zones.map((zone) => <group key={zone.title} position={zone.position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}><circleGeometry args={[zone.radius, 64]} /><meshBasicMaterial color={zone.color} transparent opacity={.2} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .02, 0]} renderOrder={5}><ringGeometry args={[zone.radius - .08, zone.radius, 64]} /><meshBasicMaterial color={zone.color} transparent opacity={.88} depthWrite={false} /></mesh>
        <Html center position={[0, .7, 0]} distanceFactor={11} zIndexRange={[8, 0]}><div className="comfort-world-label" style={{ borderColor: zone.color }}><b style={{ color: zone.color }}>{zone.title}</b><span>{zone.detail}</span></div></Html>
      </group>)}
    </group>
  )
}

function CatIdentityDetails() {
  const selectedCompanionId = useGame((state) => state.selectedCompanionId)
  const companion = getCompanionProfile(selectedCompanionId)
  const phenotype = companion.phenotype
  const scale = phenotype.scale
  const visibleEyes = phenotype.eyeCount === 1 ? [-.13] : phenotype.eyeCount === 2 ? [-.13, .13] : []
  return (
    <group scale={scale}>
      {visibleEyes.map((x) => <mesh key={x} position={[x, 1.17, .58]} scale={[1, .9, .55]}><sphereGeometry args={[.058, 12, 9]} /><meshStandardMaterial color={phenotype.blind ? '#d8dedb' : phenotype.eyeColor} emissive={phenotype.eyeColor} emissiveIntensity={phenotype.blind ? .04 : .2} roughness={phenotype.blind ? .9 : .3} /></mesh>)}
      {phenotype.eyeCount < 2 && [phenotype.eyeCount === 0 ? -.13 : .13, .13].filter((value, index, values) => phenotype.eyeCount === 0 || values.indexOf(value) === index).map((x) => <mesh key={`closed-${x}`} position={[x, 1.17, .593]} scale={[1.6, .32, .3]}><sphereGeometry args={[.052, 12, 8]} /><meshStandardMaterial color={phenotype.secondaryColor} roughness={.96} /></mesh>)}
      {phenotype.pattern === 'tabby' && <group>
        {[-.18, 0, .18].map((x, index) => <mesh key={x} position={[x, 1.3 - Math.abs(x) * .25, .47]} rotation={[0, 0, x * 1.3]} scale={[.34, .055, .025]}><sphereGeometry args={[1, 12, 6]} /><meshStandardMaterial color={phenotype.secondaryColor} roughness={.92} /></mesh>)}
        {[0, 1, 2].map((index) => <mesh key={index} position={[0, .75, -.05 - index * .18]} rotation={[Math.PI / 2, 0, 0]} scale={[.58, .08, .35]}><torusGeometry args={[.46, .055, 7, 24]} /><meshStandardMaterial color={phenotype.secondaryColor} roughness={.94} /></mesh>)}
      </group>}
      <mesh position={[0, .78, .37]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.22, .025, 8, 32]} /><meshStandardMaterial color={companion.sex === 'female' ? '#efe4b8' : companion.sex === 'male' ? '#86a69c' : '#bbb7ae'} metalness={.3} roughness={.4} /></mesh>
      <Text font="/fonts/garden-labels.woff" position={[0, .69, .57]} fontSize={.15} color="#fffdf0" anchorX="center" outlineWidth={.008} outlineColor="#302f2b">{companion.sex === 'female' ? 'F' : companion.sex === 'male' ? 'M' : '·'}</Text>
      {phenotype.blind && <Text font="/fonts/garden-labels.woff" position={[0, 1.62, 0]} fontSize={.1} color="#f4f0d6" anchorX="center" outlineWidth={.006} outlineColor="#31302d">BLIND · REAL TRAIT</Text>}
    </group>
  )
}

function BondingResponse() {
  const pulse = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!pulse.current) return
    const progress = useGame.getState().bondingProgress
    const strength = THREE.MathUtils.smoothstep(progress, 48, 92)
    pulse.current.visible = strength > .02
    const beat = 1 + Math.sin(clock.elapsedTime * 4.5) * .1
    pulse.current.scale.setScalar((.72 + strength * .28) * beat)
    pulse.current.rotation.y = -clock.elapsedTime * .22
  })
  return (
    <group ref={pulse} position={[0, 1.22, .54]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.28, .025, 9, 40]} />
        <meshBasicMaterial color="#fff2ac" transparent opacity={.72} depthWrite={false} />
      </mesh>
      <Sparkles count={12} scale={[1.05, .9, 1.05]} size={3.5} speed={.38} color="#fff3bd" />
    </group>
  )
}

function PlantPlot() {
  const stage = useGame((state) => state.plantStage)
  const watered = useGame((state) => state.lastWateredDate === localDay())
  const leaves = Math.max(2, stage * 3)
  return (
    <group position={[PLANT_POSITION.x, 0, PLANT_POSITION.z]} onClick={(event) => {
      event.stopPropagation()
      runIfPlayerNear(PLANT_POSITION, () => {
        useGame.setState({ nearby: 'plant' })
        useGame.getState().waterPlant()
      }, 'the garden bed')
    }}>
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

function BuildReveal({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (!group.current) return
    const next = THREE.MathUtils.damp(group.current.scale.x, 1, 7, delta)
    group.current.scale.setScalar(next)
  })
  return <group ref={group} scale={.04}>{children}</group>
}

function CatHouse() {
  const stage = useGame((state) => state.shelterStage)
  const blanket = useGame((state) => state.blanketLevel)
  const waterBowl = useGame((state) => state.waterBowlLevel)
  const cuddlebox = useGame((state) => state.cuddleboxLevel)
  const bench = useGame((state) => state.benchPlaced)
  const pathStyle = useGame((state) => state.pathStyle)
  return (
    <group position={[BUILD_POSITION.x, 0, BUILD_POSITION.z]} onClick={(event) => {
      event.stopPropagation()
      runIfPlayerNear(BUILD_POSITION, () => {
        if (useGame.getState().shelterStage < 3) useGame.getState().buildShelter()
      }, 'the build site')
    }}>
      {stage === 0 && (
        <group>
          <RoundedBox args={[3.25, .12, 2.75]} position={[0, .08, 0]} radius={.08} smoothness={3}><meshStandardMaterial color="#efffba" transparent opacity={.2} wireframe /></RoundedBox>
          {[[-1.48, -1.2], [1.48, -1.2], [-1.48, 1.2], [1.48, 1.2]].map(([x, z], index) => <mesh key={index} position={[x, .3, z]}><cylinderGeometry args={[.035, .055, .6, 8]} /><meshStandardMaterial color="#efff9a" emissive="#9aaf3c" emissiveIntensity={.45} /></mesh>)}
          <Sparkles count={18} scale={[3.5, 1.4, 3]} size={3} speed={.22} color="#efff9a" position={[0, .7, 0]} />
        </group>
      )}
      {stage >= 1 && (
        <BuildReveal>
          <RoundedBox args={[3.25, .28, 2.75]} position={[0, .2, 0]} radius={.1} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#9c704d" roughness={.94} /></RoundedBox>
          {Array.from({ length: 7 }, (_, index) => <mesh key={index} position={[-1.35 + index * .45, .36, 0]} castShadow><boxGeometry args={[.08, .08, 2.5]} /><meshStandardMaterial color={index % 2 ? '#bd8b5d' : '#aa794f'} roughness={1} /></mesh>)}
        </BuildReveal>
      )}
      {stage >= 2 && (
        <BuildReveal>
          <RoundedBox args={[3.05, 1.7, .22]} position={[0, 1.2, 1.23]} radius={.07} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#c58b59" roughness={.93} /></RoundedBox>
          <RoundedBox args={[.22, 1.7, 2.25]} position={[-1.42, 1.2, 0]} radius={.07} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#bb7f50" roughness={.93} /></RoundedBox>
          <RoundedBox args={[.22, 1.7, 2.25]} position={[1.42, 1.2, 0]} radius={.07} smoothness={3} castShadow receiveShadow><meshStandardMaterial color="#bb7f50" roughness={.93} /></RoundedBox>
          {[[-1.37, -.98], [1.37, -.98]].map(([x, z], index) => <mesh key={index} position={[x, 1.25, z]}><boxGeometry args={[.13, 1.9, .13]} /><meshStandardMaterial color="#785540" roughness={1} /></mesh>)}
        </BuildReveal>
      )}
      {stage >= 3 && (
        <BuildReveal>
          <group name="pitched-shelter-roof" position={[0, 2.435, 0]}>
            <mesh position={[-.9, 0, 0]} rotation={[0, 0, .404]} castShadow><boxGeometry args={[1.98, .16, 3.15]} /><meshStandardMaterial color="#655047" roughness={.92} /></mesh>
            <mesh position={[.9, 0, 0]} rotation={[0, 0, -.404]} castShadow><boxGeometry args={[1.98, .16, 3.15]} /><meshStandardMaterial color="#6f574a" roughness={.92} /></mesh>
            <mesh position={[0,.4,0]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.085,.085,3.2,6]}/><meshStandardMaterial color="#59483e" roughness={.95}/></mesh>
          </group>
          <RoundedBox args={[1.48, .44, 1.35]} position={[-.55, .48, .2]} radius={.22} smoothness={5} castShadow><meshStandardMaterial color={cuddlebox > 1 ? '#8ca76d' : '#9a7658'} roughness={1} /></RoundedBox>
        </BuildReveal>
      )}
      {stage >= 3 && blanket > 0 && <BuildReveal><RoundedBox args={[1.23, .12, 1.08]} position={[-.55, .74, .04]} radius={.16} smoothness={6}><meshStandardMaterial color="#e9c8a8" roughness={1} /></RoundedBox></BuildReveal>}
      {waterBowl > 0 && (
        <BuildReveal><group position={[1.05, 0, -1.68]}>
          <mesh position={[0, .15, 0]}><cylinderGeometry args={[.42, .3, .24, 24]} /><meshStandardMaterial color={waterBowl > 1 ? '#7aa9a2' : '#d7b45f'} metalness={.4} roughness={.3} /></mesh>
          <mesh position={[0, .29, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.28, 24]} /><meshStandardMaterial color="#7ec8d5" transparent opacity={.8} /></mesh>
          {waterBowl > 1 && <group position={[.28, .62, .08]}><mesh><cylinderGeometry args={[.24, .26, .85, 18]} /><meshStandardMaterial color="#b7d8d0" transparent opacity={.75} /></mesh><mesh position={[-.18, -.28, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.05, .05, .38, 10]} /><meshStandardMaterial color="#6b8f8a" /></mesh></group>}
        </group></BuildReveal>
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
      <Html center position={[0, stage >= 3 ? 3.35 : 1.4, 0]} distanceFactor={11} zIndexRange={[5, 0]}><div className="home-world-label"><b>{stage >= 3 ? 'THE SHELTER YOU BUILT' : 'BUILD SITE · BEFORE NIGHTFALL'}</b><span>{stage === 0 ? 'floor · walls · roof' : stage === 1 ? 'floor complete · walls next' : stage === 2 ? 'walls complete · roof next' : `blanket ${blanket ? 'added' : 'needed'} · water ${waterBowl ? 'ready' : 'needed'}`}</span></div></Html>
      {stage >= 3 && <pointLight position={[-.55, 1.05, -.15]} color="#ffd18d" intensity={blanket ? 1.8 : .6} distance={5} />}
    </group>
  )
}

function GardenPortals() {
  const realityVisits = useGame((state) => state.realityVisits)
  const realityReady = true
  const dreamReady = useGame((state) => state.shelterStage >= 3 && state.hasFed && state.blanketLevel > 0 && state.waterBowlLevel > 0)
  const companion = getCompanionProfile(useGame((state) => state.selectedCompanionId))
  return (
    <group>
      <group position={[REALITY_PORTAL_POSITION.x, 0, REALITY_PORTAL_POSITION.z]} rotation={[0, -.5, 0]}>
        <RoundedBox args={[3.1, 2.55, .32]} position={[0, 1.4, 0]} radius={.18} smoothness={4} castShadow><meshStandardMaterial color="#f3ecd9" roughness={.65} /></RoundedBox>
        <mesh position={[0, 1.45, -.19]}><planeGeometry args={[2.55, 1.95]} /><meshStandardMaterial color={realityReady ? '#263c36' : '#535856'} emissive={realityReady ? '#71b7a5' : '#252928'} emissiveIntensity={realityReady ? .25 : .05} /></mesh>
        <Text font="/fonts/garden-labels.woff" position={[0, 1.65, -.22]} rotation={[0, Math.PI, 0]} fontSize={.25} color={realityReady ? '#f5ffdc' : '#c8ccc4'} anchorX="center">THE REAL {companion.name.toUpperCase()}</Text>
        <Text font="/fonts/garden-labels.woff" position={[0, 1.2, -.22]} rotation={[0, Math.PI, 0]} fontSize={.14} color={realityReady ? '#b5d9ce' : '#9b9f9a'} anchorX="center">{realityReady ? 'PHOTOS · UPDATES · NEEDS' : 'BUILD TRUST THROUGH ACTION'}</Text>
        <WorldTag title={realityReady ? `See ${companion.name} in real life` : 'Real-life record'} subtitle={realityReady ? realityVisits ? 'open again' : 'story, films and care updates · +40' : 'build the first protected place'} warm={realityReady && !realityVisits} />
      </group>
      <group position={[DREAM_PORTAL_POSITION.x, 0, DREAM_PORTAL_POSITION.z]} rotation={[0, .5, 0]}>
        <mesh position={[0, 1.5, 0]}><torusGeometry args={[1.2, .16, 18, 72]} /><meshStandardMaterial color={dreamReady ? '#d4c4ff' : '#7c7889'} emissive={dreamReady ? '#8068dc' : '#393643'} emissiveIntensity={dreamReady ? 2 : .2} roughness={.3} /></mesh>
        <mesh position={[0, 1.5, .03]}><circleGeometry args={[1.04, 48]} /><meshBasicMaterial color={dreamReady ? '#8875b0' : '#5d5b64'} transparent opacity={.5} /></mesh>
        {dreamReady && <Sparkles count={38} scale={[3, 3.5, 2]} size={5} speed={.25} color="#fff5bd" position={[0, 1.5, 0]} />}
        <WorldTag title={`${companion.name}’s Dream`} subtitle={dreamReady ? 'Mathikoloni is waiting' : 'needs food · blanket · water'} warm={dreamReady} />
      </group>
    </group>
  )
}

function VerifiedRealityArtifacts() {
  const artifacts = useGame((state) => state.verifiedRealityArtifacts)
  if (!artifacts.includes('splotch-first-dispatch')) return null
  return (
    <group position={[7.15, 0, -4.15]} rotation={[0, -.25, 0]}>
      <RoundedBox args={[1.7, .12, 1.7]} position={[0, .08, 0]} radius={.12} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#f0eadb" roughness={.8} />
      </RoundedBox>
      <mesh position={[0, .72, 0]} castShadow>
        <icosahedronGeometry args={[.52, 1]} />
        <meshStandardMaterial color="#ffab5d" emissive="#dc7836" emissiveIntensity={1.15} roughness={.38} />
      </mesh>
      <mesh position={[0, .72, 0]} scale={1.28}>
        <icosahedronGeometry args={[.52, 1]} />
        <meshBasicMaterial color="#fff8da" transparent opacity={.14} wireframe />
      </mesh>
      <Sparkles count={18} scale={[2.1, 2.2, 2.1]} size={3} speed={.2} color="#fff4bf" position={[0, .82, 0]} />
      <WorldTag title="A real dispatch arrived" subtitle="Splotch · verified in Cyprus · Live record" warm />
    </group>
  )
}

function MorningBasket() {
  const claimed = useGame((state) => state.lastDailyClaim === localDay())
  const firstDay = useGame((state) => state.completedDays === 0 && state.shelterStage === 0)
  return (
    <group position={[BASKET_POSITION.x, 0, BASKET_POSITION.z]} onClick={(event) => { event.stopPropagation(); runIfPlayerNear(BASKET_POSITION, () => useGame.getState().claimDailyBasket(), 'the supply crate') }}>
      <RoundedBox args={[1.4, .62, 1]} position={[0, .34, 0]} radius={.15} smoothness={4} castShadow><meshStandardMaterial color={claimed ? '#8b765e' : '#d2a466'} roughness={.9} /></RoundedBox>
      {[0, 1, 2, 3].map((index) => <mesh key={index} position={[-.48 + index * .32, .63, 0]}><boxGeometry args={[.09, .45, 1.02]} /><meshStandardMaterial color="#6f5946" /></mesh>)}
      {!claimed && <><pointLight position={[0, 1, 0]} color="#efff9a" intensity={2.5} distance={6} /><Sparkles count={14} scale={[2, 2.5, 2]} size={4} speed={.3} color="#efff9a" position={[0, 1, 0]} /></>}
      <WorldTag title={firstDay ? 'Starter supply crate' : 'Morning supply crate'} subtitle={claimed ? 'opened · come back tomorrow' : 'click, tap, or press E to open'} warm={!claimed} />
    </group>
  )
}

function SupplyShelf() {
  const food = useGame((state) => state.food)
  const tokens = useGame((state) => state.gardenTokens)
  const companion = getCompanionProfile(useGame((state) => state.selectedCompanionId))
  return (
    <group position={[SUPPLY_POSITION.x, 0, SUPPLY_POSITION.z]} onClick={(event) => { event.stopPropagation(); runIfPlayerNear(SUPPLY_POSITION, () => useGame.getState().buyFood(), 'the food shelf') }}>
      <RoundedBox args={[2.25, 1.75, .62]} position={[0, .9, 0]} radius={.12} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#506458" roughness={.9} /></RoundedBox>
      {[.38, 1.02, 1.55].map((height) => <mesh key={height} position={[0, height, -.36]}><boxGeometry args={[2.05, .08, .72]} /><meshStandardMaterial color="#dfc391" roughness={1} /></mesh>)}
      {[-.65, 0, .65].map((x, index) => (
        <group key={x} position={[x, .72 + (index % 2) * .63, -.52]}>
          <mesh castShadow><cylinderGeometry args={[.25, .3, .55, 8]} /><meshStandardMaterial color={index % 2 ? '#b96a45' : '#d6a65f'} roughness={.95} /></mesh>
          <Text font="/fonts/garden-labels.woff" position={[0, 0, -.27]} rotation={[0, Math.PI, 0]} fontSize={.09} color="#fff4cf" anchorX="center">FOOD</Text>
        </group>
      ))}
      <Text font="/fonts/garden-labels.woff" position={[0, 1.98, 0]} rotation={[0, Math.PI, 0]} fontSize={.23} color="#f4ffbd" anchorX="center">CAT GARDENS SUPPLY</Text>
      <WorldTag title={`${companion.name}’s food shelf`} subtitle={food >= 3 ? 'food bag full' : tokens >= 15 ? 'one meal · 15 tokens' : 'earn tokens to pack a meal'} warm={food < 1 && tokens >= 15} />
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

function Scene({ comfortMap, active }: { comfortMap: boolean; active: boolean }) {
  const completedDays = useGame((state) => state.completedDays)
  const realityVisits = useGame((state) => state.realityVisits)
  const unlockedPeople = (Object.keys(PEOPLE) as PersonId[]).filter((id) => isPersonUnlocked(id, completedDays, realityVisits))
  return (
    <>
      <color attach="background" args={['#d4dfdf']} />
      <fog attach="fog" args={['#d4dfcf', 26, 100]} />
      <Sky distance={450000} sunPosition={[-40, 26, -35]} turbidity={3.2} rayleigh={1.4} mieCoefficient={.004} mieDirectionalG={.8} />
      <ambientLight intensity={.38} color="#e5e9ec" />
      <hemisphereLight intensity={1.25} color="#e7f0fa" groundColor="#7b7a4c" />
      <directionalLight castShadow position={[-14, 28, -18]} intensity={2.5} color="#fff1ce" shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={1} shadow-camera-far={70} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-bias={-.00012} shadow-normalBias={.035} shadow-radius={3} />

      <Landscape />
      <RoadRisk active={active} />
      <MathikoloniHorizon />
      <BoundaryColliders />
      <MorningBasket />
      <SupplyShelf />
      <PlantPlot />
      <CatHouse />
      <FoodBowl />
      <SplotchActor />
      <VisitingCatActor />
      {unlockedPeople.map((id) => <PersonActor key={id} id={id} />)}
      <GardenPortals />
      <VerifiedRealityArtifacts />
      <ComfortMapOverlay visible={comfortMap} />
      <CaretakerPlayer />
    </>
  )
}

function RendererHealth({ onContextLost }: { onContextLost: (lost: boolean) => void }) {
  const { gl, setDpr } = useThree()
  const sample = useRef({ time: 0, frames: 0, adjusted: false })
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onContextLost(true) }
    const restored = () => onContextLost(false)
    gl.domElement.addEventListener('webglcontextlost', lost)
    gl.domElement.addEventListener('webglcontextrestored', restored)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost)
      gl.domElement.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, onContextLost])
  useFrame((_, delta) => {
    if (sample.current.adjusted || delta > .25) return
    sample.current.time += delta
    sample.current.frames++
    if (sample.current.time > 4) {
      if (sample.current.frames / sample.current.time < 38 && gl.getPixelRatio() > 1) { setDpr(1); sample.current.adjusted = true }
      sample.current.time = 0
      sample.current.frames = 0
    }
  })
  return null
}

export function CatGardenWorld({ comfortMap = false, paused = false }: { comfortMap?: boolean; paused?: boolean }) {
  const [visible, setVisible] = useState(!document.hidden)
  const [contextLost, setContextLost] = useState(false)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    const nativeState = (event: Event) => setVisible(Boolean((event as CustomEvent<boolean>).detail) && !document.hidden)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('garden-app-active', nativeState)
    return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('garden-app-active', nativeState) }
  }, [])
  const active = visible && !paused
  return (
    <>
    {contextLost && <div className="world-loading graphics-recovery" role="alert"><strong>Let’s reopen the garden.</strong><span>Your browser paused the 3D view. Your progress is saved.</span><button className="primary-button" onClick={() => window.location.reload()}>Reload garden</button></div>}
    <Canvas shadows="percentage" frameloop={active ? 'always' : 'demand'} dpr={[1, 1.5]} camera={{ position: [0, 4.5, -15], fov: 46, near: .1, far: 170 }} gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }} onCreated={({ gl, scene }) => {
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.06
      gl.outputColorSpace = THREE.SRGBColorSpace
      if (import.meta.env.DEV) (window as typeof window & { __CAT_GARDENS_RENDERER__?: THREE.WebGLRenderer }).__CAT_GARDENS_RENDERER__ = gl
      if (import.meta.env.DEV) (window as typeof window & { __CAT_GARDENS_SCENE__?: THREE.Scene }).__CAT_GARDENS_SCENE__ = scene
    }}>
      <RendererHealth onContextLost={setContextLost} />
      <Suspense fallback={<Html fullscreen><div className="world-loading"><i /><span>Opening the garden…</span></div></Html>}><Physics gravity={[0, -18, 0]} timeStep={1 / 60} paused={!active} interpolate><Scene comfortMap={comfortMap} active={active} /></Physics></Suspense>
    </Canvas>
    </>
  )
}

useGLTF.preload('/models/kenney/animal-cat.glb')

export default CatGardenWorld
