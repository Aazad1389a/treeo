import * as THREE from 'three';
import { rng, heightAt, WORLD_HALF } from './world.js';

function makeLeafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 12;
    const g = 72 + Math.random() * 80;
    ctx.fillStyle = `rgba(${24 + Math.random() * 50},${g},${24 + Math.random() * 42},${0.18 + Math.random() * 0.62})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function buildTrees(scene, count) {
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.48, 2.7, 14, 3);
  const leafGeo = new THREE.ConeGeometry(1.75, 3.9, 18, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x654025, roughness: 0.82, metalness: 0.015 });
  const leafMat = new THREE.MeshStandardMaterial({
    map: makeLeafTexture(),
    color: 0x6f9f48,
    roughness: 0.86,
    metalness: 0.0,
    alphaTest: 0.08
  });
  const trunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const leaf = new THREE.InstancedMesh(leafGeo, leafMat, count);
  trunk.castShadow = leaf.castShadow = true;
  trunk.receiveShadow = leaf.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.92;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.92;
    const y = heightAt(x, z);
    if (y < -3.8) { i--; continue; }
    const s = 0.7 + rng() * 1.25;
    dummy.position.set(x, y + 1.35 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = rng() * Math.PI * 2;
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y + 3.05 * s;
    dummy.scale.set(s * 1.06, s * 1.06, s * 1.06);
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
  }
  trunk.instanceMatrix.needsUpdate = true;
  leaf.instanceMatrix.needsUpdate = true;
  scene.add(trunk, leaf);
}

function buildRocks(scene, count) {
  const geo = new THREE.DodecahedronGeometry(0.72, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x777975, roughness: 0.93, metalness: 0.025 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const y = heightAt(x, z);
    const s = 0.45 + rng() * 1.55;
    dummy.position.set(x, y + 0.3 * s, z);
    dummy.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    dummy.scale.set(s, s * (0.7 + rng() * 0.3), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

function buildGrass(scene, count) {
  const geo = new THREE.ConeGeometry(0.105, 0.68, 5, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x78a94f, roughness: 0.94, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const y = heightAt(x, z);
    if (y < -3.8) { i--; continue; }
    dummy.position.set(x, y + 0.28, z);
    dummy.rotation.y = rng() * 6;
    dummy.rotation.z = (rng() - 0.5) * 0.38;
    const s = 0.62 + rng() * 1.15;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

export function buildNature(scene) {
  // Instancing keeps the object count bounded while substantially increasing scene detail.
  buildTrees(scene, 650);
  buildRocks(scene, 320);
  buildGrass(scene, 9000);
}
