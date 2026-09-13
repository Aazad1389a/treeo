import * as THREE from 'three';

// TREEO ULTRA mode: push the renderer hard, but never deliberately lock the browser.
const originalSetPixelRatio=THREE.WebGLRenderer.prototype.setPixelRatio;
const originalRender=THREE.WebGLRenderer.prototype.render;
THREE.WebGLRenderer.prototype.setPixelRatio=function(ratio){return originalSetPixelRatio.call(this,Math.min(Math.max(ratio||1,1),3));};
THREE.WebGLRenderer.prototype.render=function(scene,camera){
  if(!this.__treeoUltraReady){
    this.__treeoUltraReady=true;
    this.setPixelRatio(Math.min(window.devicePixelRatio||1,3));
    this.shadowMap.enabled=true;
    this.shadowMap.type=THREE.PCFSoftShadowMap;
    this.outputColorSpace=THREE.SRGBColorSpace;
    this.toneMapping=THREE.ACESFilmicToneMapping;
    this.toneMappingExposure=1.15;
    scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material)o.material.needsUpdate=true;}});
    scene.traverse(o=>{if(o.isDirectionalLight||o.isSpotLight){o.castShadow=true;if(o.shadow?.mapSize)o.shadow.mapSize.set(4096,4096);if(o.shadow?.camera){o.shadow.camera.near=.1;o.shadow.camera.far=300;o.shadow.camera.updateProjectionMatrix();}}});
  }
  return originalRender.call(this,scene,camera);
};

// Safety valve only: severe sustained frame stalls reduce render resolution.
let last=performance.now(),bad=0;
function monitor(now){const dt=now-last;last=now;if(dt>90)bad++;else bad=Math.max(0,bad-1);if(bad>=12){const c=document.getElementById('c');if(c)c.dataset.ultraThrottle='1';bad=0;}requestAnimationFrame(monitor);}
requestAnimationFrame(monitor);
