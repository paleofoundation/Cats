import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { normalizeAvatarStyle, karenAvatar, chandaAvatar } from '../src/game/avatars.ts'
import { advanceTraffic, trafficLane, ROAD_HALF_LENGTH } from '../src/game/traffic.ts'

test('cars occupy separate lanes and move at the same speed across refresh rates',()=>{
  assert.ok(Math.abs(trafficLane(1)-trafficLane(-1))>2)
  for(const fps of [30,60,120]) {
    let x=-18
    for(let frame=0;frame<fps*10;frame++) x=advanceTraffic(x,1/fps,1)
    assert.ok(Math.abs(x-13)<1e-8)
  }
})
test('pausing and long background frames never jump traffic through the garden',()=>{
  assert.equal(advanceTraffic(12,300,1,false),12)
  assert.ok(advanceTraffic(12,300,1)-12<.16)
  assert.ok(advanceTraffic(ROAD_HALF_LENGTH-.01,1/60,1)<-119)
  assert.ok(advanceTraffic(-ROAD_HALF_LENGTH+.01,1/60,-1)>119)
})
test('old avatar saves retain their selections while gaining new wardrobe defaults',()=>{
  const old={displayName:'Sam',hairStyle:'bun',clothing:'#123456',pants:'#abcdef',skin:'#986b49'}
  const next=normalizeAvatarStyle(old)
  for(const key of Object.keys(old)) assert.equal(next[key],old[key])
  assert.equal(next.bottomStyle,'trousers');assert.equal(next.footwear,'trainers')
  assert.deepEqual(normalizeAvatarStyle(karenAvatar),karenAvatar)
  assert.equal(chandaAvatar.height,1.5)
})
test('invalid avatar dimensions and choices cannot produce missing or broken geometry',()=>{
  const next=normalizeAvatarStyle({height:NaN,build:999,hair:'invalid',hairStyle:'unsupported',footwear:null})
  assert.equal(next.height,1.7);assert.equal(next.build,1.3);assert.equal(next.footwear,'trainers');assert.equal(next.hairStyle,'short')
})
test('signed-in profile saves round-trip the full outfit and reject unsupported fields',async()=>{
  let stored
  const sql=async(strings,...values)=>{ if(strings[0].includes('INSERT INTO garden_profiles')) stored=JSON.parse(values[3]);return [] }
  const sandbox={module:{exports:{}},require(name){if(name==='./_auth')return {authenticateGardenRequest:async()=>({userId:'test-gardener'})};if(name==='./_db')return {database:()=>sql,ensureSchema:async()=>{}};throw Error(name)},console}
  vm.runInNewContext(readFileSync(new URL('../api/game-profile.js',import.meta.url),'utf8'),sandbox)
  const response={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}}
  await sandbox.module.exports({method:'PUT',body:{state:{avatarStyle:{...karenAvatar,admin:true},gardenTokens:35,hasFed:true}}},response)
  assert.equal(response.code,200);assert.deepEqual(stored.avatarStyle,karenAvatar);assert.equal(stored.gardenTokens,35);assert.equal(stored.hasFed,true)
})
