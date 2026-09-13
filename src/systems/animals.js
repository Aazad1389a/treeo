import * as THREE from 'three';
import { WORLD_HALF, heightAt, rng } from '../world/world.js';

const animals=[];
const TYPES={
  wolf:{group:'wild',speed:2.2,hp:60,damage:8,radius:.55,color:0x777777,scale:1.05,aggressive:true},
  boar:{group:'wild',speed:1.5,hp:80,damage:6,radius:.65,color:0x6b4b32,scale:1.05,aggressive:true},
  cow:{group:'domestic',speed:1.0,hp:100,damage:0,radius:.8,color:0xf1eee3,scale:1.2,aggressive:false},
  sheep:{group:'domestic',speed:1.15,hp:55,damage:0,radius:.55,color:0xffffff,scale:.9,aggressive:false},
  chicken:{group:'domestic',speed:1.25,hp:25,damage:0,radius:.3,color:0xd8b07a,scale:.5,aggressive:false}
};

function makeAnimal(type){
  const d=TYPES[type],g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:d.color,roughness:.9});
  const body=new THREE.Mesh(new THREE.SphereGeometry(d.radius,10,8),mat);body.scale.set(1.25,.8,1.65);body.position.y=d.radius+.35;
  const head=new THREE.Mesh(new THREE.SphereGeometry(d.radius*.72,9,7),mat);head.position.set(0,d.radius+.55,d.radius*.9);
  const eyeMat=new THREE.MeshStandardMaterial({color:0x111111});
  const e1=new THREE.Mesh(new THREE.SphereGeometry(.045,6,6),eyeMat),e2=e1.clone();e1.position.set(-d.radius*.28,d.radius+.62,d.radius*1.42);e2.position.set(d.radius*.28,d.radius+.62,d.radius*1.42);
  g.add(body,head,e1,e2);g.scale.setScalar(d.scale);g.traverse(o=>o.castShadow=true);g.userData.type=type;return g;
}

export function spawnAnimals(scene,count=24){
  const wild=['wolf','boar'],domestic=['cow','sheep','chicken'];
  for(let i=0;i<count;i++){
    const type=i<count*.42?wild[i%wild.length]:domestic[i%domestic.length];
    const a={id:`animal-${i}`,type,data:TYPES[type],pos:new THREE.Vector3((rng()*2-1)*WORLD_HALF*.82,0,(rng()*2-1)*WORLD_HALF*.82),dir:new THREE.Vector3(),turnAt:0,nextThink:0,hp:TYPES[type].hp,attackAt:0};
    a.pos.y=heightAt(a.pos.x,a.pos.z);a.group=makeAnimal(type);a.group.position.copy(a.pos);scene.add(a.group);animals.push(a);
  }
  return animals;
}

function think(a,player,now){
  const d=a.data, toPlayer=player.pos.clone().sub(a.pos);toPlayer.y=0;const dist=toPlayer.length();
  if(d.aggressive&&dist<10){if(dist>2.2){a.dir.copy(toPlayer.normalize());}else{a.dir.set(0,0,0);if(now>a.attackAt){a.attackAt=now+1300;player.hp=Math.max(0,player.hp-d.damage);}}}
  else if(now>a.nextThink){a.nextThink=now+1200+Math.random()*2600;const ang=Math.random()*Math.PI*2;a.dir.set(Math.sin(ang),0,Math.cos(ang));}
}

export function updateAnimals(dt,player){
  const now=performance.now();
  for(const a of animals){think(a,player,now);const speed=a.data.speed*(a.data.aggressive&&a.pos.distanceTo(player.pos)<10?1.35:1);a.pos.addScaledVector(a.dir,speed*dt);a.pos.x=Math.max(-WORLD_HALF+3,Math.min(WORLD_HALF-3,a.pos.x));a.pos.z=Math.max(-WORLD_HALF+3,Math.min(WORLD_HALF-3,a.pos.z));a.pos.y=heightAt(a.pos.x,a.pos.z);a.group.position.copy(a.pos);if(a.dir.lengthSq()>0.001)a.group.rotation.y=Math.atan2(a.dir.x,a.dir.z);}
}

export function getAnimals(){return animals;}
export const ANIMAL_TYPES=TYPES;
