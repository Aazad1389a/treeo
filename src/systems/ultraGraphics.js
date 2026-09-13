import * as THREE from 'three';

/** TREEO ULTRA graphics profile.
 * Intentionally pushes GPU/CPU load very high, while keeping a hard frame-time
 * fallback so a weak device does not become permanently unresponsive.
 */
export function applyUltraGraphics(renderer, scene, camera){
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene.traverse((o)=>{
    if(o.isMesh){
      o.castShadow = true;
      o.receiveShadow = true;
      if(o.material){
        o.material.needsUpdate = true;
        if('roughness' in o.material) o.material.roughness = Math.min(o.material.roughness ?? .8, .55);
        if('metalness' in o.material) o.material.metalness = Math.max(o.material.metalness ?? 0, .05);
      }
    }
  });

  const lights=[];
  scene.traverse(o=>{if(o.isDirectionalLight||o.isSpotLight)lights.push(o);});
  for(const light of lights){
    light.castShadow=true;
    if(light.shadow?.mapSize) light.shadow.mapSize.set(4096,4096);
    if(light.shadow?.camera){
      light.shadow.camera.near=.1;
      light.shadow.camera.far=300;
      light.shadow.camera.updateProjectionMatrix();
    }
  }

  if(camera){camera.fov=70;camera.updateProjectionMatrix();}
  return {name:'ULTRA',pixelRatio:Math.min(window.devicePixelRatio||1,3)};
}

export function installUltraQualityControls(renderer){
  let last=performance.now(), badFrames=0;
  function monitor(now){
    const dt=now-last;last=now;
    if(dt>90)badFrames++; else badFrames=Math.max(0,badFrames-1);
    // Safety valve: if rendering becomes severely unstable, lower only the
    // internal pixel ratio instead of allowing the browser tab to lock up.
    if(badFrames>=12){
      renderer.setPixelRatio(Math.max(1,Math.min(window.devicePixelRatio||1,1.5)));
      badFrames=0;
    }
    requestAnimationFrame(monitor);
  }
  requestAnimationFrame(monitor);
}
