import * as THREE from 'three';
import { WORLD_HALF, heightAt } from './world.js';

// می‌سازد: زمین (با ارتفاع واقعی گرفته‌شده از heightAt) + یک دریاچه‌ی ساده
export function buildTerrain(scene) {
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 120, 120);
  groundGeo.rotateX(-Math.PI / 2);

  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4c7a3a, roughness: 1, flatShading: true });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2f7bb0, transparent: true, opacity: 0.75, roughness: 0.15, metalness: 0.2
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(22, 48), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-45, -4.4, 40);
  scene.add(water);

  return { ground, water };
}
