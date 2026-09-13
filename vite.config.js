import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

function treeoMovementFix() {
  return {
    name: 'treeo-movement-fix',
    transform(code, id) {
      if (!id.endsWith('/src/main.js')) return null;
      const oldBlock = "const f=new THREE.Vector3(Math.sin(player.yaw),0,-Math.cos(player.yaw)),r=new THREE.Vector3(Math.cos(player.yaw),0,Math.sin(player.yaw)),move=new THREE.Vector3().addScaledVector(f,mz).addScaledVector(r,mx);if(move.lengthSq()>0)move.normalize();";
      const newBlock = "const f=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);f.y=0;if(f.lengthSq()<0.000001)f.set(0,0,-1);else f.normalize();const r=new THREE.Vector3().crossVectors(f,new THREE.Vector3(0,1,0)).normalize();const move=new THREE.Vector3().addScaledVector(f,mz).addScaledVector(r,mx);if(move.lengthSq()>0)move.normalize();";
      if (!code.includes(oldBlock)) return null;
      return { code: code.replace(oldBlock, newBlock), map: null };
    }
  };
}

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  plugins: [treeoMovementFix()],
  resolve: {
    alias: {
      'three-real': fileURLToPath(new URL('./node_modules/three/build/three.module.js', import.meta.url)),
      three: fileURLToPath(new URL('./src/systems/ultraGraphics.js', import.meta.url))
    }
  },
  build: { target: 'es2020' }
});
