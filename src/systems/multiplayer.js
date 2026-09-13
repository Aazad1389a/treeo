import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import { addStructure } from '../world/buildings.js';

export const remotePlayers={};
let sceneRef=null,channel=null,db=null,currentId=null;
const SUPABASE_URL='https://pzvayflxdicppwrcfnwy.supabase.co';
const SUPABASE_KEY='sb_publishable_yF7Jp-goS1v7B4spb1XxPA_EYEjqAcu';
let lastPersistAt=0;
let persistInFlight=false;
let pendingPlayer=null;

function makeRemoteAvatar(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.35,1,4,8),new THREE.MeshStandardMaterial({color:0x3d8fd6}));body.position.y=1;const head=new THREE.Mesh(new THREE.SphereGeometry(.28,10,10),new THREE.MeshStandardMaterial({color:0xf0c9a0}));head.position.y=1.75;g.add(body,head);g.traverse(o=>o.castShadow=true);return{group:g,hit:body};}
function upsertRemote(p){let rp=remotePlayers[p.id];if(!rp){const av=makeRemoteAvatar();av.hit.userData.playerId=p.id;av.group.userData.playerId=p.id;sceneRef.add(av.group);rp=remotePlayers[p.id]={group:av.group,hitMesh:av.hit,target:p};}rp.target={x:p.x,y:p.y,z:p.z,yaw:p.yaw};rp.lastSeen=performance.now();}

async function writePlayer(player){
  if(!db||!currentId||!player)return;
  const row={player_id:currentId,name:player.name||'Player',level:player.level||1,x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw||0,hp:player.hp,hunger:player.hunger,stamina:player.stamina,xp:player.xp||0,inventory:player.inventory||{},weapons:player.weapons||[],weapon_ammo:player.weaponAmmo||{},active_slot:player.activeSlot||0,updated_at:new Date().toISOString()};
  persistInFlight=true;
  const {error}=await db.from('player_states').upsert(row,{onConflict:'player_id'});
  persistInFlight=false;
  if(error)console.warn('TREEO player sync:',error.message);
  if(pendingPlayer){const next=pendingPlayer;pendingPlayer=null;writePlayer(next);}
}
function persistPlayer(player){
  if(!db||!currentId||!player)return;
  const now=performance.now();
  if(now-lastPersistAt<1500){pendingPlayer=player;return;}
  if(persistInFlight){pendingPlayer=player;return;}
  lastPersistAt=now;
  writePlayer(player);
}

async function loadStructures(){
  if(!db||!sceneRef)return;
  const {data,error}=await db.from('world_structures').select('*').order('created_at',{ascending:true});
  if(error){console.warn('TREEO structure load:',error.message);return;}
  for(const row of data||[])addStructure(sceneRef,{id:row.id,kind:row.type,x:row.x,y:row.y,z:row.z,ry:row.rotation||0},false);
}

export function initMultiplayer(scene,url,key,name,myId,handlers){
  sceneRef=scene;currentId=myId;
  const supabaseUrl=url||SUPABASE_URL,supabaseKey=key||SUPABASE_KEY;
  try{db=createClient(supabaseUrl,supabaseKey);}catch(err){console.warn('Supabase client failed.',err);handlers.onReady();return;}
  loadStructures();
  channel=db.channel('survival-world',{config:{presence:{key:myId},broadcast:{self:false}}});
  channel.on('broadcast',{event:'move'},({payload})=>{if(payload.id!==myId)upsertRemote(payload);});
  channel.on('broadcast',{event:'hit'},({payload})=>{if(payload.targetId===myId)handlers.onHit(payload.dmg);});
  channel.on('broadcast',{event:'itemTaken'},({payload})=>handlers.onItemTaken(payload.itemId));
  channel.on('broadcast',{event:'resourceHarvested'},({payload})=>handlers.onResourceHarvested?.(payload.resourceId));
  channel.on('broadcast',{event:'structure'},({payload})=>{addStructure(scene,payload,false);handlers.onStructure?.(payload);});
  channel.on('presence',{event:'sync'},()=>{const state=channel.presenceState(),ids=Object.keys(state);Object.keys(remotePlayers).forEach(id=>{if(!ids.includes(id)){scene.remove(remotePlayers[id].group);delete remotePlayers[id];}});handlers.onPresence(state,ids.length);});
  let started=false;
  channel.subscribe(async status=>{if(status==='SUBSCRIBED'){await channel.track({name,joinedAt:Date.now()});if(!started){started=true;handlers.onReady();}}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){console.warn('TREEO realtime status:',status);}});
  setTimeout(()=>{if(!started){started=true;handlers.onReady();}},3500);
}

export function broadcastMove(myId,player){
  if(channel)channel.send({type:'broadcast',event:'move',payload:{id:myId,x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw}});
  persistPlayer(player);
}
export function broadcastHit(targetId,dmg,myId){if(channel)channel.send({type:'broadcast',event:'hit',payload:{targetId,dmg,from:myId}});}
export function broadcastItemTaken(itemId){if(channel)channel.send({type:'broadcast',event:'itemTaken',payload:{itemId}});}
export function broadcastResourceHarvested(resourceId){if(channel)channel.send({type:'broadcast',event:'resourceHarvested',payload:{resourceId}});}
export function broadcastStructure(data){
  if(channel)channel.send({type:'broadcast',event:'structure',payload:data});
  if(db)db.from('world_structures').upsert({id:data.id,owner_id:currentId||'unknown',type:data.kind,x:data.x,y:data.y,z:data.z,rotation:data.ry||0},{onConflict:'id'}).then(({error})=>{if(error)console.warn('TREEO structure sync:',error.message);});
}
export function updateRemotes(dt){const now=performance.now();Object.entries(remotePlayers).forEach(([id,rp])=>{rp.group.position.lerp(new THREE.Vector3(rp.target.x,rp.target.y,rp.target.z),Math.min(1,dt*10));rp.group.rotation.y=rp.target.yaw;if(now-(rp.lastSeen||0)>15000){sceneRef.remove(rp.group);delete remotePlayers[id];}});}
