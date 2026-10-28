import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { normalizeAvatarStyle, type AvatarStyle } from './game/avatars'

export type AvatarMotion = { speed: number; action: 'idle' | 'walk' | 'work' | 'water' | 'feed' | 'bond' | 'wave'; waterTarget?: [number, number, number] }
type Point = [number, number, number]

function Ellipsoid({ position, scale, color }: { position: Point; scale: Point; color: string }) {
  return <mesh position={position} scale={scale} castShadow receiveShadow><sphereGeometry args={[1, 20, 14]} /><meshStandardMaterial color={color} roughness={.82} /></mesh>
}

function Strand({ points, radius, color }: { points: Point[]; radius: number; color: string }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points])
  return <mesh castShadow><tubeGeometry args={[curve, 12, radius, 7, false]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
}

function Hair({ style }: { style: AvatarStyle }) {
  const highlight = useMemo(() => new THREE.Color(style.hair).lerp(new THREE.Color('#e9c58a'), .13).getStyle(), [style.hair])
  if (style.hairStyle === 'bald') return null
  const cropped = style.hairStyle === 'close-cropped'
  return <group>
    <mesh position={[0,1.6,-.015]} scale={[1,1.13,.94]} castShadow><sphereGeometry args={[cropped ? .158 : .17,24,16,0,Math.PI*2,0,['long','ponytail','bun'].includes(style.hairStyle)?1.15:1.35]} /><meshStandardMaterial color={style.hair} roughness={.9} /></mesh>
    {!cropped && <mesh position={[0,1.6,-.02]} scale={[1,1.1,.94]} castShadow><sphereGeometry args={[.17,24,14,Math.PI,Math.PI,.8,1.4]} /><meshStandardMaterial color={style.hair} roughness={.9} /></mesh>}
    {style.hairStyle === 'short' && [-1,1].map(side=><Ellipsoid key={side} position={[side*.142,1.64,-.018]} scale={[.045,.115,.12]} color={style.hair}/>)}
    {style.hairStyle === 'long' && Array.from({length:11},(_,i)=>{
      const angle = Math.PI + i / 10 * Math.PI, x=Math.cos(angle)*.135, z=Math.sin(angle)*.125-.025
      return <Strand key={i} points={[[x,1.68,z],[x*1.15,1.48,z-.025],[x*1.3,1.25,z-.08],[x*1.35+Math.sin(i)*.018,1.07,z-.025]]} radius={.044} color={i%3===0?highlight:style.hair}/>
    })}
    {style.hairStyle === 'bun' && <Ellipsoid position={[0,1.67,-.195]} scale={[.105,.1,.09]} color={style.hair}/>}
    {style.hairStyle === 'ponytail' && <><Ellipsoid position={[0,1.56,-.17]} scale={[.08,.065,.07]} color={style.hair}/><Strand points={[[0,1.57,-.2],[.025,1.43,-.24],[.07,1.26,-.21],[.04,1.14,-.16]]} radius={.065} color={style.hair}/><mesh position={[0,1.54,-.195]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.065,.012,6,16]}/><meshStandardMaterial color="#7c6758"/></mesh></>}
  </group>
}

function Foot({ style }: { style: AvatarStyle }) {
  const sandal = style.footwear === 'flip-flops', bare = style.footwear === 'barefoot'
  return <group>
    <Ellipsoid position={[0,.045,.045]} scale={[.07,.045,.14]} color={sandal||bare ? style.skin : style.shoes}/>
    {!bare && <mesh position={[0,.014,.05]} scale={[.075,.018,.15]} castShadow><sphereGeometry args={[1,18,10]}/><meshStandardMaterial color={sandal?'#b49a70':'#eee8d8'} roughness={1}/></mesh>}
    {sandal && <>{[-1,1].map(side=><Strand key={side} points={[[side*.065,.07,.015],[side*.025,.089,.07],[0,.07,.115]]} radius={.012} color={style.shoes}/>)}</>}
    {style.footwear === 'boots' && <mesh position={[0,.115,0]} castShadow><cylinderGeometry args={[.075,.08,.18,14]}/><meshStandardMaterial color={style.shoes} roughness={.9}/></mesh>}
    {style.footwear === 'trainers' && [0,1,2].map(i=><mesh key={i} position={[0,.085,.035+i*.025]}><boxGeometry args={[.09,.008,.009]}/><meshStandardMaterial color="#eee8d8"/></mesh>)}
  </group>
}

/** A single articulated character is used in the editor and in the garden. */
export function GardenAvatar({ appearance, motion, floralShorts = false }: { appearance: AvatarStyle; motion?: RefObject<AvatarMotion>; floralShorts?: boolean }) {
  const style = useMemo(() => normalizeAvatarStyle(appearance), [appearance])
  const torso = useRef<THREE.Group>(null), head = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null)
  const leftForearm = useRef<THREE.Group>(null), rightForearm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null)
  const leftKnee = useRef<THREE.Group>(null), rightKnee = useRef<THREE.Group>(null)
  const can = useRef<THREE.Group>(null), spout = useRef<THREE.Group>(null), drops = useRef<THREE.InstancedMesh>(null)
  const phase = useRef(0), elapsed = useRef(0)
  const scratch = useMemo(() => ({ start:new THREE.Vector3(),end:new THREE.Vector3(),point:new THREE.Vector3(),dummy:new THREE.Object3D() }), [])
  const shoulder = style.bodyFrame === 'masculine' ? .235 : style.bodyFrame === 'feminine' ? .19 : .215
  const torsoPoints = useMemo(() => [.89,.94,1.08,1.24,1.34,1.39].map((y,i)=>new THREE.Vector2([.19,.185,style.bodyFrame==='feminine'?.145:.165,.195,shoulder,.155][i],y)),[shoulder,style.bodyFrame])
  const skirtPoints = useMemo(()=>[new THREE.Vector2(.31,.48),new THREE.Vector2(.27,.65),new THREE.Vector2(.205,.85),new THREE.Vector2(.175,.96)],[])
  useFrame((_, frameDelta) => {
    const delta=Math.min(frameDelta,.05), activity=motion?.current, speed=activity?.speed||0, action=activity?.action||'idle'
    elapsed.current+=delta; phase.current+=delta*(speed>3.5?10:7)
    const walking=action==='walk', swing=walking?Math.sin(phase.current)*Math.min(.65,speed*.16):0
    const water=action==='water', work=action==='work'||action==='feed', bond=action==='bond'
    for(const [ref,target] of [[leftLeg,swing],[rightLeg,-swing],[leftKnee,walking?Math.max(0,-Math.sin(phase.current))*.55:0],[rightKnee,walking?Math.max(0,Math.sin(phase.current))*.55:0],[leftArm,water?-.45:work?-.8:bond?-.6:-swing*.7],[rightArm,water?-1:work?-.8:bond?-.6:swing*.7],[leftForearm,water?-.55:work?-.6:-.15],[rightForearm,water?-.35:work?-.6:-.15]] as const) if(ref.current) ref.current.rotation.x=THREE.MathUtils.damp(ref.current.rotation.x,target,12,delta)
    if(torso.current) { torso.current.position.y=walking?Math.abs(Math.sin(phase.current))*.015:Math.sin(elapsed.current*1.7)*.003; torso.current.rotation.x=THREE.MathUtils.damp(torso.current.rotation.x,work?.2:bond?.22:0,8,delta) }
    if(head.current) head.current.rotation.x=THREE.MathUtils.damp(head.current.rotation.x,water?.14:bond?.2:0,8,delta)
    if(can.current) { can.current.visible=water;can.current.rotation.x=1.75+Math.sin(elapsed.current*2)*.025 }
    if(drops.current) {
      drops.current.visible=water
      if(water&&spout.current&&activity?.waterTarget) {
        spout.current.getWorldPosition(scratch.start); drops.current.worldToLocal(scratch.start)
        scratch.end.set(...activity.waterTarget); drops.current.worldToLocal(scratch.end)
        for(let i=0;i<28;i++) {
          const t=(elapsed.current*1.9+i/28)%1
          scratch.point.lerpVectors(scratch.start,scratch.end,t);scratch.point.y+=Math.sin(t*Math.PI)*.07
          scratch.point.x+=Math.sin(i*2.4)*t*.15;scratch.point.z+=Math.cos(i*1.7)*t*.12
          scratch.dummy.position.copy(scratch.point);scratch.dummy.scale.set(.018,.04,.018);scratch.dummy.updateMatrix();drops.current.setMatrixAt(i,scratch.dummy.matrix)
        }
        drops.current.instanceMatrix.needsUpdate=true
      }
    }
  })
  return <group name={`avatar-${style.displayName}`} position={[0,-.046*style.height/1.8,0]} scale={[style.height/1.8*style.build,style.height/1.8,style.height/1.8*style.build]}>
    <group ref={torso}>
      <mesh scale={[1,1,.67]} castShadow receiveShadow><latheGeometry args={[torsoPoints,24]}/><meshStandardMaterial color={style.clothing} roughness={.95}/></mesh>
      <Ellipsoid position={[0,1.365,0]} scale={[.14,.055,.095]} color={style.topStyle==='tank'?style.skin:style.clothing}/>
      {style.topStyle==='tank' && <Ellipsoid position={[0,1.37,.09]} scale={[.095,.075,.037]} color={style.skin}/>}
      {style.topStyle==='tank' && [-1,1].map(side=><mesh key={side} position={[side*.115,1.37,0]} castShadow><boxGeometry args={[.055,.095,.19]}/><meshStandardMaterial color={style.clothing} roughness={1}/></mesh>)}
      <mesh position={[0,1.425,0]} castShadow><cylinderGeometry args={[.062,.07,.12,16]}/><meshStandardMaterial color={style.skin}/></mesh>
      <group ref={head}>
        <Ellipsoid position={[0,1.595,0]} scale={[.15,.19,.135]} color={style.skin}/>
        {[-1,1].map(side=><group key={side}>
          <Ellipsoid position={[side*.148,1.58,0]} scale={[.025,.042,.022]} color={style.skin}/>
          <Ellipsoid position={[side*.059,1.623,.122]} scale={[.03,.014,.012]} color="#f6eee2"/>
          <Ellipsoid position={[side*.059,1.623,.133]} scale={[.012,.012,.006]} color={style.eyes}/>
          <Ellipsoid position={[side*.059,1.623,.138]} scale={[.0055,.007,.003]} color="#26221e"/>
          <mesh position={[side*.06,1.654,.125]} rotation={[0,0,Math.PI/2+side*-.08]}><capsuleGeometry args={[.004,.045,3,6]}/><meshStandardMaterial color={style.hair}/></mesh>
        </group>)}
        <Ellipsoid position={[0,1.587,.135]} scale={[.018,.028,.024]} color={style.skin}/>
        <Strand points={[[ -.03,1.538,.123],[0,1.532,.132],[.03,1.538,.123]]} radius={.004} color="#966356"/>
        <Hair style={style}/>
      </group>
      {[-1,1].map(side=><group key={side} ref={side===1?leftArm:rightArm} position={[side*(shoulder+.025),1.325,0]} rotation={[0,0,side*.1]}>
        <mesh position={[0,-.13,0]} castShadow><capsuleGeometry args={[.055,.22,6,12]}/><meshStandardMaterial color={style.topStyle==='long-sleeve'?style.clothing:style.skin} roughness={.9}/></mesh>
        {style.topStyle==='tee' && <mesh position={[0,-.045,0]} castShadow><capsuleGeometry args={[.075,.085,6,16]}/><meshStandardMaterial color={style.clothing} roughness={1}/></mesh>}
        <group ref={side===1?leftForearm:rightForearm} position={[0,-.27,0]}>
          <mesh position={[0,-.12,0]} castShadow><capsuleGeometry args={[.044,.19,6,12]}/><meshStandardMaterial color={style.topStyle==='long-sleeve'?style.clothing:style.skin} roughness={.9}/></mesh>
          <Ellipsoid position={[0,-.265,0]} scale={[.045,.065,.034]} color={style.skin}/>
          {side===-1 && <group name="held-watering-can" ref={can} visible={false} position={[0,-.35,.025]}>
            <mesh castShadow><cylinderGeometry args={[.14,.16,.25,20]}/><meshStandardMaterial color="#6d9c95" metalness={.15} roughness={.5}/></mesh>
            <mesh position={[0,.19,0]}><torusGeometry args={[.09,.014,8,20,Math.PI]}/><meshStandardMaterial color="#365f59"/></mesh>
            <mesh position={[0,.005,.22]} rotation={[Math.PI/2-.2,0,0]} castShadow><cylinderGeometry args={[.035,.055,.34,12]}/><meshStandardMaterial color="#6d9c95" metalness={.15} roughness={.5}/></mesh>
            <group ref={spout} position={[0,.035,.38]}><mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.075,.045,.035,16]}/><meshStandardMaterial color="#d2ddd1" metalness={.4} roughness={.4}/></mesh></group>
          </group>}
        </group>
      </group>)}
    </group>
    <Ellipsoid position={[0,.895,0]} scale={[.175,.11,.115]} color={style.pants}/>
    {[-1,1].map(side=><group key={side} ref={side===1?leftLeg:rightLeg} position={[side*.095,.86,0]}>
      <mesh position={[0,-.175,0]} castShadow><capsuleGeometry args={[.075,.23,6,14]}/><meshStandardMaterial color={style.bottomStyle==='skirt'?style.skin:style.pants} roughness={.95}/></mesh>
      {style.bottomStyle==='shorts' && <mesh position={[0,-.12,0]} castShadow><cylinderGeometry args={[.086,.085,.28,16]}/><meshStandardMaterial color={style.pants} roughness={1}/></mesh>}
      {floralShorts && Array.from({length:7},(_,i)=><mesh key={i} position={[Math.sin(i*2)*.06,-.025-(i%3)*.085,.083]}><circleGeometry args={[.012,5]}/><meshStandardMaterial color="#637a9a" side={THREE.DoubleSide}/></mesh>)}
      <group ref={side===1?leftKnee:rightKnee} position={[0,-.355,0]}>
        <mesh position={[0,-.185,0]} castShadow><capsuleGeometry args={[.058,.25,6,14]}/><meshStandardMaterial color={style.bottomStyle==='trousers'?style.pants:style.skin} roughness={.95}/></mesh>
        <group position={[0,-.455,0]}><Foot style={style}/></group>
      </group>
    </group>)}
    {style.bottomStyle==='skirt' && <mesh scale={[1,1,.8]} castShadow receiveShadow><latheGeometry args={[skirtPoints,32]}/><meshStandardMaterial color={style.pants} roughness={1} side={THREE.DoubleSide}/></mesh>}
    <instancedMesh name="watering-stream" ref={drops} args={[undefined,undefined,28]} visible={false} frustumCulled={false}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#bcecff" emissive="#4b97ae" emissiveIntensity={.3} transparent opacity={.85}/></instancedMesh>
  </group>
}
