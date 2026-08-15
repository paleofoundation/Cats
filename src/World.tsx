import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Html, RoundedBox, Sky, Sparkles, Text, useAnimations, useGLTF } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { BallCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { playCollect } from './game/audio'
import { useGame } from './game/store'

const CAT_POSITION = new THREE.Vector3(0.2, 0, 4.2)
const CAT_FEEDING_POSITION = new THREE.Vector3(0.2, .04, 4.2)
const CAT_SHELTER_POSITION = new THREE.Vector3(4.55, .04, 7.05)
const CAT_BOND_POSITION = new THREE.Vector3(2.2, .04, 2.0)
const SHELTER_POSITION = new THREE.Vector3(5.4, 0, 7.2)
const REALITY_PORTAL_POSITION = new THREE.Vector3(10.8, 0, -4.8)
const DREAM_PORTAL_POSITION = new THREE.Vector3(-7.9, 0, 8.7)
const START_POSITION: [number, number, number] = [0, 0.75, -9]

const FOOD_CRATES = [
  { id: 'food-olive', position: [0, 0.45, -3.2] as [number, number, number] },
  { id: 'food-well', position: [6.8, 0.45, .5] as [number, number, number] },
  { id: 'food-road', position: [-5.8, 0.45, 4.9] as [number, number, number] },
]

const SHELTER_PARTS = [
  { id: 'part-timber', position: [10.4, 0.42, 3.2] as [number, number, number] },
  { id: 'part-roof', position: [-9.2, 0.42, 2.4] as [number, number, number] },
  { id: 'part-wall', position: [-8.1, 0.42, 11.1] as [number, number, number] },
  { id: 'part-cushion', position: [8.8, 0.42, 11.4] as [number, number, number] },
]

const TREE_POSITIONS = [
  [-17, -12, .52], [-12, -16, .44], [-5, -17, .48], [5, -17, .4], [13, -15, .5], [18, -10, .42],
  [18, -1, .48], [18, 8, .44], [14, 16, .5], [6, 17, .42], [-4, 17, .5], [-13, 15, .46],
  [-18, 9, .5], [-18, 1, .42], [-17, -6, .46], [13, -6, .32], [-13, 5, .34], [2, 14, .3],
] as const

const seeded = (seed: number) => {
  const value = Math.sin(seed * 144.731) * 43758.5453
  return value - Math.floor(value)
}

function useRoadGeometry(points: Array<[number, number]>, width: number) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.035, z)), true, 'catmullrom', 0.25)
    const samples = 110
    const vertices: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let index = 0; index <= samples; index += 1) {
      const t = index / samples
      const point = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t)
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2)
      vertices.push(point.x + side.x, point.y, point.z + side.z)
      vertices.push(point.x - side.x, point.y, point.z - side.z)
      uvs.push(0, t * 18, 1, t * 18)
      if (index < samples) {
        const a = index * 2
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [points, width])
}

function Road() {
  const geometry = useRoadGeometry([
    [0, -11], [10, -8], [12, 1], [9, 10], [1, 13], [-9, 10], [-12, 2], [-9, -7],
  ], 3.25)
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#92765f" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  )
}

function GrassField() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const count = 780
  useEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    for (let index = 0; index < count; index += 1) {
      const angle = seeded(index + 1) * Math.PI * 2
      const radius = 7 + seeded(index + 41) * 25
      const x = Math.cos(angle) * radius + (seeded(index + 74) - .5) * 5
      const z = Math.sin(angle) * radius + (seeded(index + 97) - .5) * 5
      const scale = .55 + seeded(index + 131) * 1.15
      dummy.position.set(x, .16, z)
      dummy.rotation.set((seeded(index + 154) - .5) * .12, seeded(index + 181) * Math.PI, (seeded(index + 201) - .5) * .16)
      dummy.scale.set(.7 + seeded(index + 241) * .55, scale, .7 + seeded(index + 263) * .55)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow frustumCulled={false}>
      <coneGeometry args={[.075, .48, 3]} />
      <meshStandardMaterial color="#73894f" emissive="#23310f" emissiveIntensity={.18} roughness={1} />
    </instancedMesh>
  )
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

function Landscape() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={2.4} restitution={0}>
        <CuboidCollider args={[45, .18, 45]} position={[0, -.18, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[90, 90, 2, 2]} />
          <meshStandardMaterial color="#899861" roughness={1} />
        </mesh>
      </RigidBody>
      <Road />
      <GrassField />
      {TREE_POSITIONS.map(([x, z, scale], index) => (
        <OakTree key={`${x}-${z}`} position={[x, 0, z]} scale={scale} />
      ))}
      <mesh position={[-28, -1.5, -8]} scale={[1.4, .42, 1]} receiveShadow>
        <sphereGeometry args={[13, 32, 14]} />
        <meshStandardMaterial color="#66764e" roughness={1} />
      </mesh>
      <mesh position={[27, -2, 12]} scale={[1.5, .5, 1]} receiveShadow>
        <sphereGeometry args={[13, 32, 14]} />
        <meshStandardMaterial color="#75835a" roughness={1} />
      </mesh>
      <group position={[0, 0, -13.8]}>
        <mesh castShadow position={[0, 1.35, 0]}>
          <boxGeometry args={[5.2, 2.1, .26]} />
          <meshStandardMaterial color="#303633" roughness={.72} />
        </mesh>
        <mesh castShadow position={[-2.15, .32, 0]}><boxGeometry args={[.2, 2.6, .2]} /><meshStandardMaterial color="#d8d1b9" /></mesh>
        <mesh castShadow position={[2.15, .32, 0]}><boxGeometry args={[.2, 2.6, .2]} /><meshStandardMaterial color="#d8d1b9" /></mesh>
        <Text position={[0, 1.55, .15]} fontSize={.52} color="#e2ff70" anchorX="center">CAT GARDENS</Text>
        <Text position={[0, .95, .15]} fontSize={.2} color="#f7f3e8" anchorX="center" letterSpacing={.18}>CARE JOURNEY</Text>
      </group>
    </group>
  )
}

function StormClouds() {
  const clouds = [
    [-16, 18, -25, 8], [-4, 20, -30, 10], [12, 18, -26, 8], [25, 21, -18, 11], [-25, 21, -9, 8],
  ] as const
  return (
    <group>
      {clouds.map(([x, y, z, scale], index) => (
        <Float key={index} speed={.18 + index * .02} rotationIntensity={.02} floatIntensity={.25}>
          <mesh position={[x, y, z]} scale={[scale, scale * .22, scale * .55]}>
            <dodecahedronGeometry args={[1, 2]} />
            <meshStandardMaterial color={index % 2 ? '#5f586f' : '#71697e'} roughness={1} transparent opacity={.82} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function RoverVisual({ speed, steer }: { speed: React.MutableRefObject<number>; steer: React.MutableRefObject<number> }) {
  const { scene } = useGLTF('/models/bruno/rescue-rover.glb')
  const chassis = useMemo(() => scene.getObjectByName('chassis001')?.clone(true), [scene])
  const wheelSource = useMemo(() => scene.getObjectByName('wheelContainer001'), [scene])
  const wheelRefs = useRef<Array<THREE.Group | null>>([])
  const green = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cce94d', roughness: .42, metalness: .25 }), [])

  useEffect(() => {
    chassis?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        if (object.name.includes('bodyPainted')) object.material = green
      }
    })
  }, [chassis, green])

  useFrame((_, delta) => {
    wheelRefs.current.forEach((wheel, index) => {
      if (!wheel) return
      wheel.rotation.z -= speed.current * delta * .85
      if (index < 2) wheel.rotation.y = steer.current * .32
    })
  })

  return (
    <group scale={.9} position={[0, -.68, 0]}>
      {chassis && <primitive object={chassis} />}
      {wheelSource && [
        [.86, -.08, -.68], [.86, -.08, .68], [-.78, -.08, -.68], [-.78, -.08, .68],
      ].map((position, index) => {
        const wheel = wheelSource.clone(true)
        wheel.position.set(0, 0, 0)
        wheel.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            if (object.name.includes('Painted')) object.material = green
          }
        })
        return (
          <group key={index} position={position as [number, number, number]} ref={(value) => { wheelRefs.current[index] = value }}>
            <primitive object={wheel} rotation={index % 2 ? [Math.PI, 0, 0] : [0, 0, 0]} />
          </group>
        )
      })}
      <pointLight position={[1.1, .65, 0]} color="#f4ffd0" intensity={1.2} distance={7} />
    </group>
  )
}

function CaretakerRover() {
  const body = useRef<RapierRigidBody>(null)
  const { camera } = useThree()
  const smoothTarget = useRef(new THREE.Vector3(0, 1, -4))
  const speedRef = useRef(0)
  const driveSpeed = useRef(0)
  const steerRef = useRef(0)
  const frame = useRef(0)
  const resetToken = useGame((state) => state.resetToken)
  const started = useGame((state) => state.started)
  const setNearby = useGame((state) => state.setNearby)
  const setPlayerPosition = useGame((state) => state.setPlayerPosition)

  const reset = useCallback(() => {
    if (!body.current) return
    body.current.setTranslation({ x: START_POSITION[0], y: START_POSITION[1], z: START_POSITION[2] }, true)
    body.current.setRotation({ x: 0, y: -Math.sin(Math.PI / 4), z: 0, w: Math.cos(Math.PI / 4) }, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    driveSpeed.current = 0
  }, [])

  useEffect(reset, [reset, resetToken])

  useFrame((_, delta) => {
    const rigidBody = body.current
    if (!rigidBody) return
    const game = useGame.getState()
    const input = game.input
    const translation = rigidBody.translation()
    const rotation = rigidBody.rotation()
    const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize()
    const right = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize()
    const velocity = rigidBody.linvel()
    const linear = new THREE.Vector3(velocity.x, velocity.y, velocity.z)
    const forwardSpeed = linear.dot(forward)
    const throttle = input.forward - input.backward
    const steer = input.left - input.right
    const boost = input.boost > 0 ? 1.35 : 1
    const cappedDelta = Math.min(delta, .034)

    if (started && !game.bondingMode) {
      const lateralSpeed = linear.dot(right)
      const maxSpeed = 8 * boost
      const targetSpeed = throttle * maxSpeed
      const acceleration = Math.abs(throttle) > .01 ? 1 - Math.exp(-cappedDelta * 2.8) : 1 - Math.exp(-cappedDelta * 5.2)
      driveSpeed.current = THREE.MathUtils.lerp(driveSpeed.current, targetSpeed, acceleration)
      if (input.brake > 0) driveSpeed.current *= Math.pow(.03, cappedDelta)
      const nextForwardSpeed = driveSpeed.current
      const nextLateralSpeed = lateralSpeed * Math.pow(.08, cappedDelta)
      const nextVelocity = forward.clone().multiplyScalar(nextForwardSpeed).add(right.clone().multiplyScalar(nextLateralSpeed))
      rigidBody.setLinvel({ x: nextVelocity.x, y: velocity.y, z: nextVelocity.z }, true)

      const turnDirection = nextForwardSpeed < -.2 ? -1 : 1
      const steeringAuthority = Math.min(Math.abs(nextForwardSpeed) / 3, 1)
      if (Math.abs(steer) > .015 && steeringAuthority > .05) {
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -steer * turnDirection * steeringAuthority * cappedDelta * .92)
        const nextRotation = yaw.multiply(quaternion).normalize()
        rigidBody.setRotation({ x: nextRotation.x, y: nextRotation.y, z: nextRotation.z, w: nextRotation.w }, true)
      }
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }

    if (game.bondingMode) {
      const bondTarget = CAT_BOND_POSITION
      driveSpeed.current = 0
      rigidBody.setLinvel({ x: 0, y: velocity.y, z: 0 }, true)
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
      camera.position.lerp(bondTarget.clone().add(new THREE.Vector3(2.9, 1.78, -2.2)), 1 - Math.exp(-delta * 3.2))
      smoothTarget.current.lerp(bondTarget.clone().add(new THREE.Vector3(.28, .75, 0)), 1 - Math.exp(-delta * 4.8))
      camera.lookAt(smoothTarget.current)
      return
    }

    speedRef.current = THREE.MathUtils.lerp(speedRef.current, driveSpeed.current, .18)
    steerRef.current = THREE.MathUtils.lerp(steerRef.current, steer, .18)
    const position = new THREE.Vector3(translation.x, translation.y, translation.z)
    const desiredCamera = position.clone().addScaledVector(forward, -8.4).add(new THREE.Vector3(0, 4.9, 0))
    camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * 4.6))
    smoothTarget.current.lerp(position.clone().addScaledVector(forward, 2.7).add(new THREE.Vector3(0, .65, 0)), 1 - Math.exp(-delta * 6.2))
    camera.lookAt(smoothTarget.current)

    frame.current += 1
    if (frame.current % 5 === 0) {
      setPlayerPosition([translation.x, translation.y, translation.z])
      const flat = new THREE.Vector3(translation.x, 0, translation.z)
      const activeCatPosition = game.shelterStage === 4 ? CAT_SHELTER_POSITION : CAT_POSITION
      const catDistance = flat.distanceTo(activeCatPosition)
      const shelterDistance = flat.distanceTo(SHELTER_POSITION)
      const realityDistance = flat.distanceTo(REALITY_PORTAL_POSITION)
      const dreamDistance = flat.distanceTo(DREAM_PORTAL_POSITION)
      const nearby = catDistance < 2.65
        ? 'cat'
        : shelterDistance < 3.1
          ? 'shelter'
          : realityDistance < 3.2
            ? 'reality'
            : game.shelterStage === 4 && dreamDistance < 3.2
              ? 'dream'
              : null
      setNearby(nearby)
    }
    if (translation.y < -3 || Math.abs(translation.x) > 43 || Math.abs(translation.z) > 43) reset()
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={START_POSITION}
      rotation={[0, -Math.PI / 2, 0]}
      mass={2.2}
      canSleep={false}
      linearDamping={.65}
      angularDamping={3.2}
      enabledRotations={[false, true, false]}
      friction={1.8}
    >
      <CuboidCollider args={[1.18, .46, .75]} position={[0, -.04, 0]} restitution={.08} friction={.72} />
      <RoverVisual speed={speedRef} steer={steerRef} />
    </RigidBody>
  )
}

function Beacon({ color, label, value }: { color: string; label: string; value: string }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ring.current) return
    const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * .12
    ring.current.scale.setScalar(pulse)
    ring.current.rotation.z = clock.elapsedTime * .45
  })
  return (
    <group>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, .08, 0]}>
        <torusGeometry args={[.82, .045, 8, 34]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[.014, .14, 3.4, 10, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={.33} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={.48} distance={5} position={[0, 1, 0]} />
      <Html center position={[0, 2.65, 0]} distanceFactor={10} zIndexRange={[6, 0]}>
        <div className="world-objective-tag"><span>{label}</span><b>{value}</b></div>
      </Html>
    </group>
  )
}

function FoodCrate({ id, position }: { id: string; position: [number, number, number] }) {
  const found = useGame((state) => state.foodFound.includes(id))
  const collectFood = useGame((state) => state.collectFood)
  const playerPosition = useGame((state) => state.playerPosition)
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (found || !group.current) return
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2.4 + position[0]) * .08
    const dx = playerPosition[0] - position[0]
    const dz = playerPosition[2] - position[2]
    if (dx * dx + dz * dz < 8.41) {
      collectFood(id)
      playCollect()
    }
  })
  if (found) return null
  return (
    <group ref={group} position={position}>
      <Beacon color="#ffbd69" label="FOOD" value="+10 care" />
      <RoundedBox args={[1.05, .9, .82]} radius={.16} smoothness={4} castShadow>
        <meshStandardMaterial color="#c88b54" roughness={.88} />
      </RoundedBox>
      <mesh position={[0, .05, .43]}><circleGeometry args={[.22, 22]} /><meshStandardMaterial color="#2f4338" /></mesh>
      <Text position={[0, -.03, .445]} fontSize={.22} color="#dfff6c" anchorX="center">FOOD</Text>
    </group>
  )
}

function ShelterPart({ id, position, index }: { id: string; position: [number, number, number]; index: number }) {
  const visible = useGame((state) => state.hasBonded)
  const found = useGame((state) => state.partsFound.includes(id))
  const collectPart = useGame((state) => state.collectPart)
  const playerPosition = useGame((state) => state.playerPosition)
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!visible || found || !group.current) return
    group.current.rotation.y = clock.elapsedTime * .28 + index
    const dx = playerPosition[0] - position[0]
    const dz = playerPosition[2] - position[2]
    if (dx * dx + dz * dz < 8.41) {
      collectPart(id)
      playCollect()
    }
  })
  if (!visible || found) return null
  return (
    <group ref={group} position={position}>
      <Beacon color="#eefde0" label="SHELTER PART" value="+15 care" />
      {[0, 1, 2].map((row) => (
        <RoundedBox key={row} position={[0, (row - 1) * .25, 0]} args={[1.35, .18, .35]} radius={.05} smoothness={2} castShadow>
          <meshStandardMaterial color={row === 1 ? '#d09a5f' : '#b97845'} roughness={.9} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0, .2]}><boxGeometry args={[.22, 1, .08]} /><meshStandardMaterial color="#6c4a32" /></mesh>
    </group>
  )
}

function CatActor() {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/kenney/animal-cat.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const animation = useGame((state) => state.catAnimation)
  const hasFed = useGame((state) => state.hasFed)
  const hasBonded = useGame((state) => state.hasBonded)
  const shelterStage = useGame((state) => state.shelterStage)
  const bondingMode = useGame((state) => state.bondingMode)
  const setCatAnimation = useGame((state) => state.setCatAnimation)

  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
        const material = (object.material as THREE.MeshStandardMaterial).clone()
        material.color.multiply(new THREE.Color('#ffc08a'))
        material.roughness = .9
        object.material = material
      }
    })
  }, [clone])

  useEffect(() => {
    const selected = actions[animation] ?? actions.idle
    selected?.reset().fadeIn(.22).play()
    if (animation === 'eat') {
      const timer = window.setTimeout(() => setCatAnimation('idle'), 2600)
      return () => {
        window.clearTimeout(timer)
        selected?.fadeOut(.2)
      }
    }
    return () => { selected?.fadeOut(.2) }
  }, [actions, animation, setCatAnimation])

  useFrame((_, delta) => {
    if (!group.current) return
    const target = bondingMode ? CAT_BOND_POSITION : shelterStage === 4 ? CAT_SHELTER_POSITION : CAT_FEEDING_POSITION
    group.current.position.lerp(target, 1 - Math.exp(-delta * .8))
    if (shelterStage === 4) group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, -1.35, .03)
  })

  return (
    <group ref={group} position={[CAT_POSITION.x, .04, CAT_POSITION.z]} rotation={[0, Math.PI, 0]}>
      <primitive object={clone} scale={.72} />
      {!bondingMode && (
        <Html center position={[0, 1.35, 0]} distanceFactor={9} zIndexRange={[8, 0]}>
          <div className={`cat-world-tag ${hasFed ? 'is-fed' : ''}`}>
            <strong>Splotch · game proxy</strong>
            <span>{shelterStage === 4 ? 'safe + warm' : hasBonded ? 'trusting you' : hasFed ? 'eating' : 'hungry'}</span>
          </div>
        </Html>
      )}
      {hasBonded && <Sparkles count={12} scale={[2.3, 2, 2.3]} size={4} speed={.35} color="#e2ff70" position={[0, .9, 0]} />}
    </group>
  )
}

function GroundCaretaker() {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF('/models/quaternius/caretaker.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)
  const bondingMode = useGame((state) => state.bondingMode)

  useEffect(() => {
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }, [clone])

  useEffect(() => {
    if (!bondingMode) return
    const action = actions.Interact ?? actions.Idle_Neutral ?? actions.Idle
    action?.reset().setEffectiveTimeScale(.72).fadeIn(.25).play()
    return () => { action?.fadeOut(.2) }
  }, [actions, bondingMode])

  if (!bondingMode) return null
  const catTarget = CAT_BOND_POSITION
  return (
    <group ref={group} position={[catTarget.x + .85, -.03, catTarget.z]} rotation={[0, -Math.PI / 2, 0]} scale={.9}>
      <primitive object={clone} />
    </group>
  )
}

function FeedingGarden() {
  const hasFed = useGame((state) => state.hasFed)
  return (
    <group>
      <mesh position={[CAT_POSITION.x, .055, CAT_POSITION.z]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.28, .1, 32]} />
        <meshStandardMaterial color="#b8ab89" roughness={1} />
      </mesh>
      <mesh position={[CAT_POSITION.x - .9, .15, CAT_POSITION.z + .2]} castShadow>
        <cylinderGeometry args={[.46, .32, .22, 24]} />
        <meshStandardMaterial color="#617e76" metalness={.55} roughness={.3} />
      </mesh>
      {hasFed && (
        <mesh position={[CAT_POSITION.x - .9, .29, CAT_POSITION.z + .2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[.27, 20]} />
          <meshStandardMaterial color="#8b5c37" roughness={1} />
        </mesh>
      )}
      <CatActor />
    </group>
  )
}

function Shelter() {
  const stage = useGame((state) => state.shelterStage)
  const hasBonded = useGame((state) => state.hasBonded)
  return (
    <group position={[SHELTER_POSITION.x, 0, SHELTER_POSITION.z]}>
      <mesh position={[0, .035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.05, 40]} />
        <meshBasicMaterial color={hasBonded && stage < 4 ? '#dfff6c' : '#5f6f53'} transparent opacity={hasBonded ? .75 : .26} toneMapped={false} />
      </mesh>
      {hasBonded && stage < 4 && <Beacon color="#dfff6c" label="BUILD HERE" value={`${stage}/4`} />}
      {stage >= 1 && (
        <RoundedBox args={[3.05, .28, 2.35]} position={[0, .18, 0]} radius={.11} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#96714e" roughness={.95} />
        </RoundedBox>
      )}
      {stage >= 2 && [-1.32, 1.32].map((x) => (
        <RoundedBox key={x} args={[.22, 1.75, 2.15]} position={[x, 1.15, 0]} radius={.08} smoothness={2} castShadow>
          <meshStandardMaterial color="#bd8556" roughness={.88} />
        </RoundedBox>
      ))}
      {stage >= 2 && (
        <RoundedBox args={[2.8, 1.75, .22]} position={[0, 1.15, -.98]} radius={.08} smoothness={2} castShadow>
          <meshStandardMaterial color="#b47c50" roughness={.88} />
        </RoundedBox>
      )}
      {stage >= 3 && (
        <group>
          <RoundedBox args={[1.92, .18, 2.6]} position={[-.77, 2.1, 0]} rotation={[0, 0, .47]} radius={.07} smoothness={2} castShadow>
            <meshStandardMaterial color="#66554a" roughness={.8} />
          </RoundedBox>
          <RoundedBox args={[1.92, .18, 2.6]} position={[.77, 2.1, 0]} rotation={[0, 0, -.47]} radius={.07} smoothness={2} castShadow>
            <meshStandardMaterial color="#5b4c43" roughness={.8} />
          </RoundedBox>
        </group>
      )}
      {stage >= 4 && (
        <group>
          <RoundedBox args={[1.55, .18, 1.22]} position={[0, .42, .12]} radius={.2} smoothness={6} castShadow>
            <meshStandardMaterial color="#b9d77e" roughness={.95} />
          </RoundedBox>
          <pointLight position={[0, 1.65, .65]} color="#ffe0a1" intensity={2.1} distance={7} />
          <Sparkles count={18} scale={[3.2, 2.8, 3]} size={4} speed={.3} color="#ffdf96" position={[0, 1.2, 0]} />
        </group>
      )}
    </group>
  )
}

function GardenPortals() {
  const shelterStage = useGame((state) => state.shelterStage)
  const realityVisits = useGame((state) => state.realityVisits)
  const dreamVisits = useGame((state) => state.dreamVisits)
  return (
    <group>
      <group position={[REALITY_PORTAL_POSITION.x, 0, REALITY_PORTAL_POSITION.z]} rotation={[0, -.35, 0]}>
        <mesh position={[0, 1.55, 0]} castShadow>
          <boxGeometry args={[3.35, 2.85, .28]} />
          <meshStandardMaterial color="#e9e5d7" roughness={.72} metalness={.08} />
        </mesh>
        <mesh position={[0, 1.55, -.16]}>
          <planeGeometry args={[2.82, 2.3]} />
          <meshStandardMaterial color="#202a27" emissive="#8fd8c5" emissiveIntensity={.2} roughness={.42} />
        </mesh>
        <mesh position={[0, 1.72, -.32]}>
          <circleGeometry args={[.58, 36]} />
          <meshBasicMaterial color={realityVisits ? '#dfff6c' : '#f4f1e7'} toneMapped={false} />
        </mesh>
        <Text position={[0, .78, -.33]} rotation={[0, Math.PI, 0]} fontSize={.23} color="#f7f4e9" anchorX="center">SPLOTCH · REAL LIFE</Text>
        <Text position={[0, .43, -.33]} rotation={[0, Math.PI, 0]} fontSize={.13} color="#a5b9b2" anchorX="center">MEDIA · NEEDS · VERIFIED UPDATES</Text>
        <Beacon color="#f7f4e9" label="REALITY PORTAL" value={realityVisits ? 'open again' : '+40 care'} />
      </group>

      {shelterStage === 4 && (
        <group position={[DREAM_PORTAL_POSITION.x, 0, DREAM_PORTAL_POSITION.z]} rotation={[0, .6, 0]}>
          <mesh position={[0, 1.65, 0]}>
            <torusGeometry args={[1.2, .16, 18, 72]} />
            <meshStandardMaterial color="#c8b8ff" emissive="#6b50c6" emissiveIntensity={2.2} roughness={.25} metalness={.35} toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.65, .06]}>
            <circleGeometry args={[1.05, 54]} />
            <meshBasicMaterial color="#73628c" transparent opacity={.5} toneMapped={false} />
          </mesh>
          <Sparkles count={48} scale={[3.2, 4, 2.2]} size={6} speed={.28} color="#fff8d4" position={[0, 1.7, 0]} />
          <pointLight color="#d4c5ff" intensity={3.5} distance={10} position={[0, 1.8, 0]} />
          <Beacon color="#d3c4ff" label="SPLOTCH’S DREAM" value={dreamVisits ? 'return' : '+75 care'} />
        </group>
      )}
    </group>
  )
}

function KnockableGardenProps() {
  const positions = [
    [-3.1, -5.4], [4.3, -7.2], [9.7, 6.2], [-10.4, -2.5], [3.2, 10.8], [-5.2, 12.3],
  ] as const
  return (
    <group>
      {positions.map(([x, z], index) => (
        <RigidBody key={index} position={[x, .55, z]} mass={.28} colliders="cuboid" restitution={.18} friction={.8}>
          <RoundedBox args={[.72, 1.05, .72]} radius={.06} smoothness={2} castShadow>
            <meshStandardMaterial color={index % 2 ? '#9d7049' : '#6e8260'} roughness={.92} />
          </RoundedBox>
          <mesh position={[0, 0, .37]}><boxGeometry args={[.5, .08, .02]} /><meshBasicMaterial color="#e7e0c8" /></mesh>
        </RigidBody>
      ))}
    </group>
  )
}

function BoundaryColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[24, 2, .2]} position={[0, 1, -22]} />
      <CuboidCollider args={[24, 2, .2]} position={[0, 1, 22]} />
      <CuboidCollider args={[.2, 2, 24]} position={[-22, 1, 0]} />
      <CuboidCollider args={[.2, 2, 24]} position={[22, 1, 0]} />
      <BallCollider args={[1]} position={[0, -10, 0]} sensor />
    </RigidBody>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#81778e']} />
      <fog attach="fog" args={['#8d8497', 29, 67]} />
      <Sky distance={450000} sunPosition={[70, 24, -90]} inclination={.5} azimuth={.25} turbidity={11} rayleigh={3.6} mieCoefficient={.014} mieDirectionalG={.88} />
      <ambientLight intensity={1.7} color="#d8d4ef" />
      <hemisphereLight intensity={1.8} color="#fffef2" groundColor="#485037" />
      <directionalLight
        castShadow
        position={[-12, 24, -15]}
        intensity={3.8}
        color="#fffff4"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-.00018}
      />
      <StormClouds />
      <Landscape />
      <BoundaryColliders />
      <FeedingGarden />
      <GroundCaretaker />
      <Shelter />
      <GardenPortals />
      {FOOD_CRATES.map((item) => <FoodCrate key={item.id} {...item} />)}
      {SHELTER_PARTS.map((item, index) => <ShelterPart key={item.id} {...item} index={index} />)}
      <KnockableGardenProps />
      <CaretakerRover />
      <EffectComposer multisampling={0}>
        <Bloom intensity={.32} luminanceThreshold={1.05} mipmapBlur />
        <Vignette offset={.25} darkness={.28} />
      </EffectComposer>
    </>
  )
}

export function CatGardenWorld() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.7]}
      camera={{ position: [0, 7, -18], fov: 46, near: .1, far: 160 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.22
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -18, 0]} timeStep="vary">
          <Scene />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload('/models/bruno/rescue-rover.glb')
useGLTF.preload('/models/bruno/oak-tree.glb')
useGLTF.preload('/models/kenney/animal-cat.glb')
useGLTF.preload('/models/quaternius/caretaker.glb')

export default CatGardenWorld
