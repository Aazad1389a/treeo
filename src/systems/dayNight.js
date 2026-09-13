import * as THREE from 'three';

const DAY_LENGTH_SEC = 300;
let dayTime = 0.32;
let authoritativeStartMs = null;
let authoritativeDayLength = DAY_LENGTH_SEC;

const dayCol = new THREE.Color(0x9fd0e8);
const nightCol = new THREE.Color(0x0a1224);

export function setWorldClock({startedAt,dayLengthSeconds=DAY_LENGTH_SEC,serverNowMs=Date.now()}={}){
  const startMs=Date.parse(startedAt||'');
  if(!Number.isFinite(startMs))return;
  authoritativeStartMs=startMs;
  authoritativeDayLength=Math.max(30,Number(dayLengthSeconds)||DAY_LENGTH_SEC);
  const elapsed=Math.max(0,serverNowMs-startMs)/1000;
  dayTime=(elapsed/authoritativeDayLength)%1;
}

export function updateSky(dt,{scene,sun,hemi,target,clockEl}){
  if(authoritativeStartMs===null)dayTime=(dayTime+dt/DAY_LENGTH_SEC)%1;
  else dayTime=((Date.now()-authoritativeStartMs)/1000/authoritativeDayLength)%1;
  const angle=dayTime*Math.PI*2;
  const sunHeight=Math.sin(angle-Math.PI/2);
  sun.position.set(Math.cos(angle)*80,Math.max(sunHeight,-.15)*80+20,30);
  sun.target.position.copy(target);
  const t=Math.max(0,Math.min(1,sunHeight*1.4+.35));
  const sky=nightCol.clone().lerp(dayCol,t);
  scene.background.copy(sky);scene.fog.color.copy(sky);
  sun.intensity=.15+t*1.1;hemi.intensity=.15+t*.55;
  const hrs=Math.floor(dayTime*24),mins=Math.floor((dayTime*24*60)%60);
  clockEl.textContent=String(hrs).padStart(2,'0')+':'+String(mins).padStart(2,'0');
}
