// Fixed garden furniture, shared by quiet-time staging and the close-up camera.
export const careObstacles = [
  { x:3.25, z:6.1, halfX:1.8, halfZ:1.6, height:3.3 },
  { x:1.8, z:-7.8, halfX:.75, halfZ:.65, height:1 },
  { x:-4.6, z:-7.3, halfX:1.2, halfZ:.65, height:2 },
  { x:-3.2, z:3.6, halfX:1.25, halfZ:.85, height:1.1 },
]
export const CAT_NOSE_DISTANCE = .43

export function quietApproachDirection(x:number,z:number): [number,number] {
  const preferred=Math.atan2(.55,.85)
  for(const turn of [0,1,-1,2,-2,3,-3,4]) {
    const a=preferred+turn*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a)
    const clear=[1.16,1.55].every(radius=>careObstacles.every(o=>
      Math.abs(x+dx*radius-o.x)>o.halfX+.28 || Math.abs(z+dz*radius-o.z)>o.halfZ+.28))
    if(clear)return [dx,dz]
  }
  return [Math.cos(preferred),Math.sin(preferred)]
}
