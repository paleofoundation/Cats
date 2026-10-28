import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { localDay, useGame } from './game/store'
import { getCompanionProfile } from './game/companions'

export function FoodBowl() {
  const lastFedDate = useGame(state => state.lastFedDate)
  const mealPosition = useGame(state => state.mealPosition)
  const catId = useGame(state => state.selectedCompanionId)
  const cat = getCompanionProfile(catId)
  const kibble = useRef<THREE.Group>(null)
  const outline = useMemo(() => [[.23,.03],[.3,.045],[.36,.19],[.34,.23],[.3,.21],[.255,.075],[0,.075]].map(([x,y])=>new THREE.Vector2(x,y)),[])
  useFrame((_,delta) => {
    if(!kibble.current) return
    const eating = useGame.getState().catAnimation === 'eat'
    const target = eating ? .45 : kibble.current.scale.y
    kibble.current.scale.y = THREE.MathUtils.damp(kibble.current.scale.y,target,.15,Math.min(delta,.05))
  })
  if(lastFedDate !== localDay()) return null
  return <group name="served-food-bowl" position={mealPosition || [2.65,0,4.1]} scale={Math.max(.7,cat.phenotype.scale)}>
    <mesh castShadow receiveShadow><latheGeometry args={[outline,32]}/><meshStandardMaterial color="#c48759" metalness={.12} roughness={.4} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.22,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.333,.017,8,32]}/><meshStandardMaterial color="#efd9ae" metalness={.15} roughness={.35}/></mesh>
    <group ref={kibble} position={[0,.08,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.26,24]}/><meshStandardMaterial color="#795138" roughness={1}/></mesh>
      {Array.from({length:32},(_,i)=>{
        const angle=i*2.4, radius=Math.sqrt((i+.5)/32)*.245
        return <mesh key={i} position={[Math.cos(angle)*radius,.025+(i%3)*.01,Math.sin(angle)*radius]} rotation={[0,i,0]} castShadow><dodecahedronGeometry args={[.035,0]}/><meshStandardMaterial color={i%3===0?'#b9874c':i%3===1?'#805332':'#a06b3e'} roughness={1}/></mesh>
      })}
    </group>
    <Html center position={[0,.55,0]} zIndexRange={[3,0]} style={{pointerEvents:'none'}}><div className="meal-label">{cat.name}’s food</div></Html>
  </group>
}
