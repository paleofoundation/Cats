import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { GardenAvatar } from './GardenAvatar'
import type { AvatarStyle } from './game/avatars'

export default function AvatarPreview({ appearance, angle }: { appearance: AvatarStyle; angle: number }) {
  return <Canvas shadows="percentage" frameloop="demand" dpr={[1,1.5]} camera={{position:[0,1.25,3.9],fov:32}} gl={{alpha:true,antialias:true}}>
    <ambientLight intensity={1.25}/><hemisphereLight args={['#fff8ed','#667263',1.5]}/>
    <directionalLight position={[-3,5,4]} intensity={3} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <group rotation={[0,angle,0]}><GardenAvatar appearance={appearance}/></group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.01,0]} receiveShadow><circleGeometry args={[1.1,64]}/><shadowMaterial opacity={.16}/></mesh>
    <OrbitControls target={[0,.95,0]} enableZoom={false} enablePan={false} minPolarAngle={Math.PI*.34} maxPolarAngle={Math.PI*.55}/>
  </Canvas>
}
