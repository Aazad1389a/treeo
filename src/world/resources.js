import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import { rng, heightAt, WORLD_HALF } from './world.js';

export const RESOURCE_DEFS = {
  tree: { name: 'درخت', drop: { wood: 5 }, hp: 3, respawn: 45, color: 0x3f6f36 },
  rock: { name: 'سنگ', drop: { stone: 4 }, hp: 3, respawn: 55, color: 0x777777 }
};

const supabase=createClient('https://pzvayflxdicppwrcfnwy.supabase.co','sb_publishable_yF7Jp-goS1v7B4spb1XxPA_EYEjqAcu');
let nextResourceId = 1;

function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,2.2,7), new THREE.MeshStandardMaterial({color:0x6b4327}));
  trunk.position.y = 1.1;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.05,2.2,8), new THREE.MeshStandardMaterial({color:0x3f6f36}));
  crown.position.y = 2.6;
  g.add(trunk,crown);
  g.traverse(o=>{o.castShadow=true;o.receiveShadow=true;});
  return g;
}
function makeRock() {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.75,0), new THREE.MeshStandardMaterial({color:0x777777,roughness:1}));
  m.castShadow=true;m.receiveShadow=true;return m;
}

export function spawnResources(scene,count=90){
  const nodes=[];
  for(let i=0;i<count;i++){
    const kind=rng()<.58?'tree':'rock';
    const x=(rng()*2-1)*WORLD_HALF*.86,z=(rng()*2-1)*WORLD_HALF*.86,y=heightAt(x,z);
    if(y<-3.6)continue;
    const mesh=kind==='tree'?makeTree():makeRock();
    mesh.position.set(x,y,z); if(kind==='rock')mesh.position.y+=.72;
    mesh.userData.resourceId='res_'+nextResourceId++;
    scene.add(mesh);
    nodes.push({id:mesh.userData.resourceId,kind,mesh,hp:RESOURCE_DEFS[kind].hp,maxHp:RESOURCE_DEFS[kind].hp,available:true,respawnAt:0});
  }

  supabase.from('world_resources').select('id,available,respawn_at').then(({data,error})=>{
    if(error){console.warn('TREEO resource load:',error.message);return;}
    const byId=new Map((data||[]).map(r=>[r.id,r]));
    for(const n of nodes){
      const saved=byId.get(n.id);if(!saved)continue;
      n.available=saved.available!==false;
      n.respawnAt=saved.respawn_at?new Date(saved.respawn_at).getTime():0;
      n.mesh.visible=n.available;
      if(!n.available)n.hp=0;
    }
  });

  return nodes;
}

export function findNearestResource(nodes,pos,maxDist=3){
  let best=null,dist=maxDist;
  for(const n of nodes){if(!n.available)continue;const d=n.mesh.position.distanceTo(pos);if(d<dist){dist=d;best=n;}}
  return best;
}

export function harvestResource(node,player){
  if(!node||!node.available)return null;
  node.hp--;
  if(node.hp>0)return {finished:false,kind:node.kind,drop:{}};
  const def=RESOURCE_DEFS[node.kind];
  for(const [item,count] of Object.entries(def.drop))player.inventory[item]=(player.inventory[item]||0)+count;
  node.available=false;node.respawnAt=performance.now()+def.respawn*1000;node.mesh.visible=false;
  supabase.from('world_resources').upsert({
    id:node.id,type:node.kind,x:node.mesh.position.x,y:node.mesh.position.y,z:node.mesh.position.z,
    amount:0,available:false,respawn_at:new Date(Date.now()+def.respawn*1000).toISOString(),updated_at:new Date().toISOString()
  },{onConflict:'id'}).then(({error})=>{if(error)console.warn('TREEO resource save:',error.message);});
  return {finished:true,kind:node.kind,drop:{...def.drop},id:node.id};
}

export function updateResources(nodes){
  const now=performance.now();
  for(const n of nodes){
    if(n.available||now<n.respawnAt)continue;
    n.hp=n.maxHp;n.available=true;n.mesh.visible=true;
    supabase.from('world_resources').upsert({
      id:n.id,type:n.kind,x:n.mesh.position.x,y:n.mesh.position.y,z:n.mesh.position.z,
      amount:1,available:true,respawn_at:null,updated_at:new Date().toISOString()
    },{onConflict:'id'}).then(({error})=>{if(error)console.warn('TREEO resource respawn:',error.message);});
  }
}
