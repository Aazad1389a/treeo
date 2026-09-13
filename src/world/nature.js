import * as THREE from 'three';
import { rng, heightAt, WORLD_HALF } from './world.js';

function makeLeafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 128, y = Math.random() * 128;
    const r = 4 + Math.random() * 10;
    ctx.fillStyle = `rgba(${35 + Math.random() * 35},${85 + Math.random() * 70},${35 + Math.random() * 35},${0.25 + Math.random() * 0.55})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function buildTrees(scene, count) {
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.5, 10, 2);
  const leafGeo = new THREE.ConeGeometry(1.7, 3.6, 12, 4);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4328, roughness: 0.88, metalness: 0.02 });
  const leafMat = new THREE.MeshStandardMaterial({ map: makeLeafTexture(), color: 0x6a9e45, roughness: 0.9, metalness: 0.0 });
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
    const s = 0.75 + rng() * 1.15;
    dummy.position.set(x, y + 1.25 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = rng() * Math.PI * 2;
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.y = y + 3.0 * s;
    dummy.scale.set(s * 1.05, s * 1.05, s * 1.05);
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
  }
  trunk.instanceMatrix.needsUpdate = true;
  leaf.instanceMatrix.needsUpdate = true;
  scene.add(trunk, leaf);
}

function buildRocks(scene, count) {
  const geo = new THREE.DodecahedronGeometry(0.72, 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x777975, roughness: 0.96, metalness: 0.03 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const y = heightAt(x, z);
    const s = 0.5 + rng() * 1.35;
    dummy.position.set(x, y + 0.3 * s, z);
    dummy.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    dummy.scale.set(s, s * (0.72 + rng() * 0.25), s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

function buildGrass(scene, count) {
  const geo = new THREE.ConeGeometry(0.11, 0.62, 4, 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x78a94f, roughness: 0.95, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const y = heightAt(x, z);
    if (y < -3.8) { i--; continue; }
    dummy.position.set(x, y + 0.27, z);
    dummy.rotation.y = rng() * 6;
    dummy.rotation.z = (rng() - 0.5) * 0.35;
    const s = 0.65 + rng() * 1.0;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
}

export function buildNature(scene) {
  buildTrees(scene, 300);
  buildRocks(scene, 180);
  buildGrass(scene, 2600);
}
