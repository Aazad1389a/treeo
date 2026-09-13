import * as THREE from 'three';
import { rng, heightAt, WORLD_HALF } from './world.js';

// درخت، سنگ و علف — همه InstancedMesh برای پرفورمنس بالا با هزاران آبجکت

function buildTrees(scene, count) {
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.2, 6);
  const leafGeo = new THREE.ConeGeometry(1.6, 3.2, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, flatShading: true, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6b34, flatShading: true, roughness: 1 });
  const trunk = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const leaf = new THREE.InstancedMesh(leafGeo, leafMat, count);
  trunk.castShadow = leaf.castShadow = true;
  trunk.receiveShadow = leaf.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.92;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.92;
    const y = heightAt(x, z);
    if (y < -3.8) { i--; continue; } // داخل دریاچه نه
    const s = 0.8 + rng() * 0.9;
    dummy.position.set(x, y + 1.1 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = rng() * Math.PI * 2;
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);

    dummy.position.y = y + (2.2 + 1.4) * s * 0.62;
    dummy.updateMatrix();
    leaf.setMatrixAt(i, dummy.matrix);
  }
  scene.add(trunk, leaf);
}

function buildRocks(scene, count) {
  const geo = new THREE.DodecahedronGeometry(0.7, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a8a86, flatShading: true, roughness: 1 });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.95;
    const y = heightAt(x, z);
    const s = 0.5 + rng() * 1.3;
    dummy.position.set(x, y + 0.3 * s, z);
    dummy.rotation.set(rng() * 6, rng() * 6, rng() * 6);
    dummy.scale.set(s, s * 0.8, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(mesh);
}

function buildGrass(scene, count) {
  const geo = new THREE.ConeGeometry(0.12, 0.5, 3);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5f9a45, flatShading: true, roughness: 1, side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(geo, mat, count);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.97;
    const y = heightAt(x, z);
    if (y < -3.8) { i--; continue; }
    dummy.position.set(x, y + 0.22, z);
    dummy.rotation.y = rng() * 6;
    dummy.rotation.z = (rng() - 0.5) * 0.3;
    const s = 0.6 + rng() * 0.8;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(mesh);
}

export function buildNature(scene) {
  buildTrees(scene, 220);
  buildRocks(scene, 140);
  buildGrass(scene, 1500);
}
