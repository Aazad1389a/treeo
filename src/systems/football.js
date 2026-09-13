import * as THREE from 'three';

const FIELD=new THREE.Vector3(70,0,70);
const WIDTH=22, LENGTH=34, GOAL_W=7, GOAL_D=3, MATCH_SECONDS=180;
let scene=null, channelApi=null, myId=null, player=null, ui=null;
let active=false, team=null, players=new Map(), score=[0,0], timeLeft=MATCH_SECONDS;
let fieldGroup=null, ball=null, ballVel=new THREE.Vector3(), lastUpdate=0, lastGoal=0, startAt=0;

function mat(c){return new THREE.MeshStandardMaterial({color:c});}
function buildField(){
  fieldGroup=new THREE.Group();fieldGroup.position.copy(FIELD);scene.add(fieldGroup);
  const ground=new THREE.Mesh(new THREE.BoxGeometry(LENGTH,.2,WIDTH),mat(0x1d7a3a));ground.position.y=.05;ground.receiveShadow=true;fieldGroup.add(ground);
  const lineMat=mat(0xffffff);const lines=[];
  const addLine=(x,z,sx,sz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,.025,sz),lineMat);m.position.set(x,.16,z);fieldGroup.add(m);};
  addLine(0,-WIDTH/2,LENGTH,.12);addLine(0,WIDTH/2,LENGTH,.12);addLine(-LENGTH/2,0,.12,WIDTH);addLine(LENGTH/2,0,.12,WIDTH);addLine(0,0,.08,WIDTH);
  const circle=new THREE.Mesh(new THREE.RingGeometry(4.9,5.02,48),lineMat);circle.rotation.x=-Math.PI/2;circle.position.y=.17;fieldGroup.add(circle);
  for(const z of [-WIDTH/2,WIDTH/2]){const goal=new THREE.Mesh(new THREE.BoxGeometry(GOAL_D,.05,GOAL_W),mat(0xffffff));goal.position.set(z<0?-LENGTH/2-GOAL_D/2:LENGTH/2+GOAL_D/2,.12,0);goal.rotation.y=Math.PI/2;fieldGroup.add(goal);}
  ball=new THREE.Mesh(new THREE.SphereGeometry(.65,16,12),mat(0xffffff));ball.castShadow=true;ball.position.set(0,1,0);fieldGroup.add(ball);
}
function clearField(){if(fieldGroup){scene.remove(fieldGroup);fieldGroup=null;}ball=null;}
function renderUi(){if(!ui)return;ui.panel.style.display=active?'block':'none';ui.score.textContent=`${score[0]} - ${score[1]}`;ui.timer.textContent=`${Math.max(0,Math.ceil(timeLeft))}`;ui.mode.textContent=active?`فوتبال ${players.size<=2?'1v1':'2v2'} | تیم ${team===0?'A':'B'}`:'';}
function spawnPlayers(){for(const p of players.values()){p.mesh?.removeFromParent();const m=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,5,8),mat(p.team===0?0x2563eb:0xdc2626));m.position.copy(p.pos||new THREE.Vector3());m.castShadow=true;scene.add(m);p.mesh=m;}}
function assignTeam(){const n=players.size;const ids=[...players.keys()].sort();const idx=ids.indexOf(myId);team=idx%2;for(let i=0;i<ids.length;i++)players.get(ids[i]).team=i%2;}
function resetPositions(){for(const [id,p] of players){const isA=p.team===0;const slot=[...players.keys()].sort().indexOf(id);p.pos=new THREE.Vector3((isA?-1:1)*12+(slot%2)*3,1.05,(slot%2?5:-5));if(p.mesh)p.mesh.position.copy(p.pos);}ball.position.set(0,1,0);ballVel.set(0,0,0);startAt=performance.now();}
function localKick(dt){if(!ball||!player)return;const bp=ball.position.clone();const pp=new THREE.Vector3(player.pos.x,1,player.pos.z);const dist=bp.distanceTo(pp);if(dist<2.0){let dir=new THREE.Vector3(Math.sin(player.yaw),0,-Math.cos(player.yaw));if(Math.abs(dir.x)+Math.abs(dir.z)<.1)dir.set(team===0?1:-1,0,0);if(Math.random()<.12)ballVel.addScaledVector(dir,9*dt+1.2);}}
function updateBall(dt){if(!ball)return;ball.position.addScaledVector(ballVel,dt);ballVel.multiplyScalar(Math.pow(.22,dt));ball.position.y=1+Math.sin(Math.min(1,ballVel.length()/8))*0.2;const halfL=LENGTH/2,halfW=WIDTH/2;if(Math.abs(ball.position.z)>halfW-.7){ball.position.z=Math.sign(ball.position.z)*(halfW-.7);ballVel.z*=-.65;}if(Math.abs(ball.position.x)>halfL+.8){if(Math.abs(ball.position.z)<GOAL_W/2&&Math.abs(ball.position.x)<halfL+GOAL_D){const scoring=ball.position.x>0?0:1;if(performance.now()-lastGoal>1800){lastGoal=performance.now();score[scoring]++;broadcast({kind:'goal',score});resetPositions();}}else{ball.position.x=Math.sign(ball.position.x)*(halfL+.8);ballVel.x*=-.65;}}}
function broadcast(payload){channelApi?.sendFootball(payload);}
export function initFootball({scene:sc,player:pl,multiplayer,ui:uis}){scene=sc;player=pl;channelApi=multiplayer;ui=uis;}
export function handleFootballMessage(payload){if(payload.kind==='join'){players.set(payload.id,{id:payload.id,team:payload.team,pos:new THREE.Vector3(payload.x||0,1.05,payload.z||0)});assignTeam();spawnPlayers();}if(payload.kind==='leave'){players.delete(payload.id);assignTeam();spawnPlayers();}if(payload.kind==='state'&&payload.id!==myId){const p=players.get(payload.id);if(p){p.pos.set(payload.x,p.y,p.z);if(p.mesh)p.mesh.position.copy(p.pos);}}if(payload.kind==='ball'&&payload.id!==myId&&ball){ball.position.set(payload.x,payload.y,payload.z);ballVel.set(payload.vx,payload.vy,payload.vz);}if(payload.kind==='goal'&&payload.id!==myId){score=[payload.score[0],payload.score[1]];resetPositions();}renderUi();}
export function startFootball(mode='auto'){
  if(active)return;
  active=true;score=[0,0];timeLeft=MATCH_SECONDS;players.clear();players.set(myId,{id:myId,team:0,pos:new THREE.Vector3()});assignTeam();buildField();resetPositions();broadcast({kind:'join',id:myId,team});renderUi();
}
export function stopFootball(){if(!active)return;broadcast({kind:'leave',id:myId});active=false;players.clear();clearField();renderUi();}
export function isFootballActive(){return active;}
export function updateFootball(dt){if(!active)return;timeLeft=Math.max(0,MATCH_SECONDS-(performance.now()-startAt)/1000);if(timeLeft<=0){stopFootball();return;}localKick(dt);updateBall(dt);const me=players.get(myId);if(me){me.pos.set(player.pos.x,1.05,player.pos.z);if(me.mesh)me.mesh.position.copy(me.pos);if(performance.now()-lastUpdate>80){broadcast({kind:'state',id:myId,x:me.pos.x,y:me.pos.y,z:me.pos.z});lastUpdate=performance.now();}}const authority=[...players.keys()].sort()[0]===myId;if(authority&&ball&&performance.now()-lastUpdate>80){broadcast({kind:'ball',id:myId,x:ball.position.x,y:ball.position.y,z:ball.position.z,vx:ballVel.x,vy:ballVel.y,vz:ballVel.z});}renderUi();}
export function getFootballSpawn(){return FIELD.clone();}
