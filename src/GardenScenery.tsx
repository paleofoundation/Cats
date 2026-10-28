import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const random = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const color = new THREE.Color()

function groundTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#718858'
  ctx.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 7000; i++) {
    const x = random(i + 11) * 1024, y = random(i + 9011) * 1024
    const r = 3 + random(i + 18011) * 25
    ctx.fillStyle = ['#91a36a20', '#465f3522', '#b0ac751a', '#b7bd7a18'][i % 4]
    ctx.beginPath(); ctx.ellipse(x, y, r, r * .7, random(i) * 3, 0, Math.PI * 2); ctx.fill()
  }
  const point = (x: number, z: number) => [(x / 76 + .5) * 1024, (.5 + z / 68) * 1024] as const
  const trail = (points: Array<[number, number]>, width: number) => {
    ctx.lineCap = ctx.lineJoin = 'round'
    for (const [extra, fill] of [[1.2, '#b3ae7e38'], [.7, '#b8ad8048'], [.28, '#b5a37988'], [0, '#c3b18a']] as const) {
      ctx.strokeStyle = fill; ctx.lineWidth = (width + extra) / 76 * 1024
      ctx.beginPath(); points.forEach(([x, z], i) => { const p = point(x, z); if (!i) ctx.moveTo(...p); else ctx.lineTo(...p) }); ctx.stroke()
    }
  }
  trail([[0,-18],[0,-8],[-.3,-3],[.6,1.5],[2,5.4],[2,11]], 3.6)
  trail([[0,-7],[-4.6,-7.3]], 2)
  trail([[.1,0],[5,-1],[9.4,-2.1]], 1.7)
  trail([[1,3],[-3,3.6],[-6,5.8],[-9.2,7.2]], 1.8)
  for (let i = 0; i < 80000; i++) {
    ctx.fillStyle = i % 2 ? '#172d2010' : '#fff1c719'
    const r = .35 + random(i + 500) * 1.15
    ctx.fillRect(random(i + 88) * 1024, random(i + 50088) * 1024, r, r)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export function GardenGround() {
  const texture = useMemo(groundTexture, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[76,68]} /><meshStandardMaterial map={texture} roughness={1} /></mesh>
}

// Decorative plants share geometry and materials: hundreds of flowers in five draws.
export function FlowerBorders() {
  const stems = useRef<THREE.InstancedMesh>(null)
  const petals = useRef<THREE.InstancedMesh>(null)
  const centers = useRef<THREE.InstancedMesh>(null)
  const leaves = useRef<THREE.InstancedMesh>(null)
  const rocks = useRef<THREE.InstancedMesh>(null)
  const count = 560
  useEffect(() => {
    if (!stems.current || !petals.current || !centers.current || !leaves.current || !rocks.current) return
    const dummy = new THREE.Object3D()
    const beds = [[-3.8,-12,2.1,3.3],[4.5,-11,1.8,3],[-7,-3,2,2.2],[6,1,1.2,1.8],[-6.3,9,2,1.8],[8.5,11,2.6,2.3],[-12,0,2,3],[13,3,1.5,4]]
    for (let i = 0; i < count; i++) {
      const [bx,bz,w,d] = beds[i % beds.length]
      const angle = random(i + 31) * Math.PI * 2, radius = Math.sqrt(random(i + 705))
      const x = bx + Math.cos(angle) * w * radius, z = bz + Math.sin(angle) * d * radius
      const height = .25 + random(i + 48) * .5, lavender = i % 3 !== 0
      dummy.position.set(x, height / 2, z); dummy.rotation.set(0,random(i) * 6,.1); dummy.scale.set(.018,height,.018); dummy.updateMatrix()
      stems.current.setMatrixAt(i,dummy.matrix)
      dummy.position.set(x,height,z); dummy.scale.set(lavender ? .085 : .14,lavender ? .18 : .045,lavender ? .085 : .14); dummy.updateMatrix()
      petals.current.setMatrixAt(i,dummy.matrix)
      petals.current.setColorAt(i,color.set(lavender ? ['#aa8ab6','#806399','#c0a3cb'][i % 3] : '#f7e9c7'))
      dummy.position.y = height + .035; dummy.scale.setScalar(lavender ? .018 : .048); dummy.updateMatrix(); centers.current.setMatrixAt(i,dummy.matrix)
      dummy.position.set(x + .045,height * .52,z); dummy.rotation.z = -.65; dummy.scale.set(.065,.19,.04); dummy.updateMatrix(); leaves.current.setMatrixAt(i,dummy.matrix)
    }
    for (let i = 0; i < 90; i++) {
      const side = i % 2 ? 1 : -1, z = -15 + (i / 90) * 16
      dummy.position.set(side * (2.1 + .1 * Math.sin(z)), .045, z)
      dummy.rotation.set(random(i)*.2,random(i + 20)*3,0); dummy.scale.set(.17 + random(i)*.13,.09,.16); dummy.updateMatrix()
      rocks.current.setMatrixAt(i,dummy.matrix); rocks.current.setColorAt(i,color.set(['#b9ac8d','#c9bfa4','#968e76'][i%3]))
    }
    for (const mesh of [stems.current,petals.current,centers.current,leaves.current,rocks.current]) { mesh.instanceMatrix.needsUpdate = true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere() }
  }, [])
  return <group>
    <instancedMesh ref={stems} args={[undefined,undefined,count]}><cylinderGeometry args={[1,1,1,4]} /><meshStandardMaterial color="#546846" roughness={1} /></instancedMesh>
    <instancedMesh ref={petals} args={[undefined,undefined,count]}><icosahedronGeometry args={[1,2]} /><meshStandardMaterial roughness={.95} /></instancedMesh>
    <instancedMesh ref={centers} args={[undefined,undefined,count]}><sphereGeometry args={[1,6,4]} /><meshStandardMaterial color="#deb566" roughness={1} /></instancedMesh>
    <instancedMesh ref={leaves} args={[undefined,undefined,count]}><sphereGeometry args={[1,12,8]} /><meshStandardMaterial color="#6d8157" roughness={1} /></instancedMesh>
    <instancedMesh ref={rocks} args={[undefined,undefined,90]} receiveShadow><dodecahedronGeometry args={[1,0]} /><meshStandardMaterial roughness={1} /></instancedMesh>
  </group>
}

export function SoftMeadow() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const wind = useMemo(() => ({ value: 0 }), [])
  const count = 2800
  const geometry = useMemo(() => {
    const positions: number[] = []
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI, x = Math.cos(a) * .055, z = Math.sin(a) * .055
      positions.push(-x,0,-z,x,0,z,x*.3,.23,z*.3)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3)); g.computeVertexNormals(); return g
  }, [])
  useEffect(() => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    for (let i=0;i<count;i++) {
      let x = (random(i+830)-.5)*48, z=(random(i+50100)-.5)*40
      // Keep the playable courtyard and every care station clear.
      if (x > -11 && x < 12 && z > -16 && z < 12) { x = (x < 0 ? -1:1)*(12 + random(i+999)*11); z=(random(i+707)-.5)*36 }
      dummy.position.set(x,.012,z); dummy.rotation.set(0,random(i)*6.28,0); dummy.scale.setScalar(.5+random(i+2)*1.35); dummy.updateMatrix(); mesh.current.setMatrixAt(i,dummy.matrix)
      mesh.current.setColorAt(i,color.set(['#8b9c65','#687f4e','#a3ab76','#79915b'][i%4]))
    }
    mesh.current.instanceMatrix.needsUpdate=true; mesh.current.instanceColor!.needsUpdate=true; mesh.current.computeBoundingSphere()
    return () => geometry.dispose()
  }, [geometry])
  useFrame(({clock}) => { wind.value=clock.elapsedTime })
  return <instancedMesh ref={mesh} args={[geometry,undefined,count]} receiveShadow>
    <meshStandardMaterial roughness={1} side={THREE.DoubleSide} onBeforeCompile={(shader) => {
      shader.uniforms.uGardenWind=wind
      shader.vertexShader='uniform float uGardenWind;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(uGardenWind * 1.15 + instanceMatrix[3].x * .6 + instanceMatrix[3].z * .35) * position.y * .14;')
    }} />
  </instancedMesh>
}

function Planter({position, scale=1}: {position:[number,number,number];scale?:number}) {
  return <group position={position} scale={scale}>
    <mesh position={[0,.31,0]} castShadow receiveShadow><cylinderGeometry args={[.38,.26,.62,16]} /><meshStandardMaterial color="#b87858" roughness={.95} /></mesh>
    <mesh position={[0,.6,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.36,.045,6,24]} /><meshStandardMaterial color="#cf9470" roughness={1} /></mesh>
    <mesh position={[0,.62,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.32,16]} /><meshStandardMaterial color="#544536" /></mesh>
    {[0,1,2,3,4].map(i=><group key={i} rotation={[0,i*1.256,0]}><mesh position={[.14,.83,0]} rotation={[0,0,-.48]} scale={[.12,.38,.055]} castShadow><sphereGeometry args={[1,8,6]} /><meshStandardMaterial color={i%2?'#8ca381':'#657e58'} roughness={.9} /></mesh></group>)}
  </group>
}

export function GardenDetails() {
  return <group>
    <FlowerBorders /><SoftMeadow />
    <Planter position={[-2.65,0,-14]} scale={1.3}/><Planter position={[2.65,0,-14]} scale={1.3}/>
    <Planter position={[-6,0,-6]} /><Planter position={[-3.2,0,-8.4]} scale={.75}/>
    <group position={[0,0,-22]}>
      {[-2.8,2.8].map(x=><group key={x} position={[x,0,0]}><mesh position={[0,1.8,0]} castShadow><boxGeometry args={[.18,3.6,.18]}/><meshStandardMaterial color="#9a8767" roughness={.95}/></mesh><mesh position={[0,3.56,0]} castShadow><boxGeometry args={[.32,.12,.32]}/><meshStandardMaterial color="#c3b18b" /></mesh></group>)}
      <mesh position={[0,3.45,0]} castShadow><boxGeometry args={[6.2,.18,.22]}/><meshStandardMaterial color="#a99470" roughness={.95}/></mesh>
      {[-2,-1,0,1,2].map(x=><mesh key={x} position={[x,3.6,0]} castShadow><boxGeometry args={[.12,.12,1.4]}/><meshStandardMaterial color="#ad9974" roughness={1}/></mesh>)}
    </group>
    {[-1,1].map(side=><group key={side} position={[side*2.8,0,-10.5]}>
      <mesh position={[0,.68,0]} castShadow><cylinderGeometry args={[.045,.06,1.36,8]}/><meshStandardMaterial color="#4c5345" roughness={.8}/></mesh>
      <mesh position={[0,1.42,0]}><boxGeometry args={[.23,.32,.23]}/><meshStandardMaterial color="#f0ce85" emissive="#f6c86e" emissiveIntensity={.4}/></mesh>
      <mesh position={[0,1.63,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[.24,.16,4]}/><meshStandardMaterial color="#51574a" roughness={.8}/></mesh>
    </group>)}
  </group>
}

export function DistantLandscape() {
  return <group>
    {[-1,1].flatMap(side=>[0,1,2,3,4].map(i=><mesh key={`${side}-${i}`} position={[side*(32+i*11),-5,25+i*7]} scale={[18,10+random(i)*10,20]}><sphereGeometry args={[1,24,12]}/><meshStandardMaterial color={i%2?'#809686':'#94a894'} roughness={1}/></mesh>))}
    {[[-25,24,3],[-8,29,16],[20,26,8],[35,30,25]].map(([x,y,z],i)=><group key={i} position={[x,y,z]} scale={[3.4,1.1,2]}>{[-1,0,1].map(j=><mesh key={j} position={[j*1.2,Math.abs(j)*-.18,0]}><sphereGeometry args={[1.5,16,10]}/><meshStandardMaterial color="#f6f2df" roughness={1}/></mesh>)}</group>)}
  </group>
}

export function OliveGrove() {
  const leaves = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)
  const trees = useMemo(() => [[-17,-13],[-10,-17],[8,-18],[17,-12],[18,-3],[18,8],[13,16],[3,18],[-7,17],[-16,13],[-18,3]], [])
  useEffect(() => {
    if (!leaves.current || !trunks.current) return
    const dummy = new THREE.Object3D()
    trees.forEach(([x,z],t) => {
      const scale = .85 + random(t+18)*.35
      for (let b=0;b<4;b++) {
        dummy.position.set(x+(b?Math.cos(b*2.1)*.4:0), (b?2.55:1.35)*scale,z+(b?Math.sin(b*2.1)*.4:0))
        dummy.rotation.set(b?Math.sin(b*2.1)*.5:0,0,b?Math.cos(b*2.1)*.5:.04)
        dummy.scale.set(b?.12:.3,(b?1.6:2.7)*scale,b?.12:.3); dummy.updateMatrix(); trunks.current!.setMatrixAt(t*4+b,dummy.matrix)
      }
      for (let j=0;j<58;j++) {
        const a=random(t*90+j)*6.28, r=Math.sqrt(random(t*99+j+300))*2.1*scale
        dummy.position.set(x+Math.cos(a)*r,(3.6+random(t*80+j+700)*1.45-r*.25)*scale,z+Math.sin(a)*r)
        dummy.rotation.set(random(j)*.3,a,random(j+31)*.5)
        dummy.scale.set((.65+random(j+58)*.3)*scale,(.38+random(j+87)*.2)*scale,(.8+random(j+90)*.45)*scale);dummy.updateMatrix()
        leaves.current!.setMatrixAt(t*58+j,dummy.matrix); leaves.current!.setColorAt(t*58+j,color.set(['#708465','#829776','#9bab8d','#5d7655','#738e6b'][j%5]))
      }
    })
    for(const mesh of [leaves.current,trunks.current]) { mesh.instanceMatrix.needsUpdate=true; if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere() }
  },[trees])
  return <group>
    <instancedMesh ref={trunks} args={[undefined,undefined,trees.length*4]} castShadow receiveShadow><cylinderGeometry args={[.65,1,1,8]}/><meshStandardMaterial color="#80755d" roughness={1}/></instancedMesh>
    <instancedMesh ref={leaves} args={[undefined,undefined,trees.length*58]} castShadow receiveShadow><icosahedronGeometry args={[1,2]}/><meshStandardMaterial roughness={1}/></instancedMesh>
  </group>
}
