import assert from 'node:assert/strict'
import { test } from 'node:test'
import { progressStorage, movementVector } from '../src/game/presentation.ts'

test('movement never exceeds walking speed when two keys are held', () => {
  for (const [x,z] of [[1,0],[0,1],[1,1],[-1,1],[-1,-1]]) {
    const movement=movementVector(x,z,3.25)
    assert.ok(Math.abs(Math.hypot(movement.x,movement.z)-3.25)<1e-9)
  }
  assert.deepEqual(movementVector(0,0,3.25),{x:0,z:0})
  assert.equal(movementVector(.25,0,4).x,1,'analogue movement keeps its fine control')
})

test('movement and UI updates do not rewrite unchanged progress', () => {
  let writes=0, stored=''
  const storage=progressStorage(()=>({getItem:()=>stored||null,setItem:(_,v)=>{writes++;stored=v},removeItem:()=>{stored=''}}))
  const progress={tokens:150,cat:'mabel',chapters:['arrival'],avatar:{color:'green'}}
  for(let frame=0;frame<600;frame++) storage.setItem('existing-save',{state:{...progress},version:8})
  assert.equal(writes,1)
  storage.setItem('existing-save',{state:{...progress,tokens:135},version:8})
  assert.equal(writes,2,'a purchase is saved immediately')
  assert.deepEqual(storage.getItem('existing-save'),{state:{...progress,tokens:135},version:8})
  storage.removeItem('existing-save')
  assert.equal(storage.getItem('existing-save'),null)
  storage.setItem('existing-save',{state:{...progress,tokens:135},version:8})
  assert.equal(writes,3,'a reset invalidates the write cache')
})

test('existing version 8 saves round-trip without dropping progress', () => {
  const saved={state:{selectedCompanionId:'winona-p-gray',gardenName:'Home',gardenTokens:450,companionProgress:{mabel:{trust:81}},shelterStage:3,dreamDiscoveries:['water'],donationBadges:['garden-keeper']},version:8}
  const storage=progressStorage(()=>({getItem:()=>JSON.stringify(saved),setItem:()=>{},removeItem:()=>{}}))
  assert.deepEqual(storage.getItem('cat-gardens-splotch-relationship-v4'),saved)
})

test('unavailable storage does not crash play and failed writes can be retried', () => {
  let fail=true,writes=0
  const storage=progressStorage(()=>({getItem:()=>'{bad-json',setItem:()=>{if(fail)throw Error('full');writes++},removeItem:()=>{throw Error('disabled')}}))
  assert.equal(storage.getItem('save'),null)
  const value={state:{tokens:15},version:8}
  assert.doesNotThrow(()=>storage.setItem('save',value))
  fail=false
  storage.setItem('save',value)
  assert.equal(writes,1)
  assert.doesNotThrow(()=>storage.removeItem('save'))
})
