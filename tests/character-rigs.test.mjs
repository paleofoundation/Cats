import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Exercise the shipping skeleton without requiring a GPU or image decoder.
async function loadRig(name) {
  const file=await readFile(new URL(`../public/models/characters/${name}.glb`,import.meta.url))
  const jsonSize=file.readUInt32LE(12),json=JSON.parse(file.subarray(20,20+jsonSize).toString())
  const binaryStart=28+jsonSize
  json.buffers[0].uri=`data:application/octet-stream;base64,${file.subarray(binaryStart).toString('base64')}`
  delete json.images;delete json.textures
  json.materials=json.materials.map(()=>({pbrMetallicRoughness:{metallicFactor:0}}))
  globalThis.ProgressEvent ||= class ProgressEvent {constructor(type,properties){this.type=type;Object.assign(this,properties)}}
  return (await new GLTFLoader().parseAsync(JSON.stringify(json),'' )).scene
}
for(const name of ['female','male'])test(`${name} character bends around an attached neck and retains valid skin weights`,async()=>{
  const scene=await loadRig(name);scene.updateMatrixWorld(true)
  const head=scene.getObjectByName('Head'),neck=scene.getObjectByName('neck_01')
  assert(head?.isBone&&neck?.isBone)
  assert.equal(head.parent,neck)
  const before=head.getWorldPosition(new THREE.Vector3()),q=head.quaternion.clone()
  head.rotateX(.3);scene.updateMatrixWorld(true)
  assert(before.distanceTo(head.getWorldPosition(new THREE.Vector3()))<1e-6,'Nodding must never orbit the head around the feet')
  head.quaternion.copy(q)
  let vertices=0
  scene.traverse(object=>{
    if(!object.isSkinnedMesh)return
    const weights=object.geometry.getAttribute('skinWeight'),joints=object.geometry.getAttribute('skinIndex')
    for(let i=0;i<weights.count;i++){
      let sum=0
      for(let c=0;c<4;c++){const weight=weights.getComponent(i,c);assert(Number.isFinite(weight)&&weight>=0);sum+=weight;assert(joints.getComponent(i,c)<object.skeleton.bones.length)}
      assert(Math.abs(sum-1)<.002,'Every vertex must stay attached to the skeleton')
    }
    vertices+=weights.count
  })
  assert(vertices>4000,'The complete modeled body must be included')
  for(const joint of ['hand_l','hand_r','foot_l','foot_r','pelvis'])assert(scene.getObjectByName(joint)?.isBone,`${joint} is required by care animations`)
})

test('quiet time beside the gate keeps the cat outside the supply basket',async()=>{
  const {quietApproachDirection,careObstacles}=await import('../src/game/characterStaging.ts')
  for(const [x,z] of [[0,-9],[1.9,3.2],[-1.4,3],[0,0]]){
    const [dx,dz]=quietApproachDirection(x,z)
    assert(Math.abs(Math.hypot(dx,dz)-1)<1e-8)
    for(const radius of [1.16,1.55])for(const o of careObstacles)
      assert(Math.abs(x+dx*radius-o.x)>o.halfX+.28 || Math.abs(z+dz*radius-o.z)>o.halfZ+.28)
  }
})
