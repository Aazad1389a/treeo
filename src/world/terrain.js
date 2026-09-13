import * as THREE from 'three';
import { WORLD_HALF, heightAt } from './world.js';

function makeGroundTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n1 = Math.sin(x * 0.071) * 7 + Math.sin(y * 0.053) * 6;
      const n2 = Math.sin((x + y) * 0.019) * 10 + Math.sin((x - y) * 0.037) * 5;
      const n = n1 + n2 + (Math.random() - 0.5) * 10;
      data[i] = Math.max(0, Math.min(255, 78 + n));
      data[i + 1] = Math.max(0, Math.min(255, 118 + n * 1.25));
      data[i + 2] = Math.max(0, Math.min(255, 55 + n * 0.55));
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(18, 18);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeGroundBump(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size * .45, size * .4, 4, size * .5, size * .5, size * .55);
  g.addColorStop(0, '#d8d8d8');
  g.addColorStop(.5, '#8d8d8d');
  g.addColorStop(1, '#3e3e3e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(28, 28);
  return t;
}

function makeWaterTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#145b7b';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.strokeStyle = `rgba(160,220,240,${0.05 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8 + Math.random() * 18, y + Math.sin(i) * 2);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildTerrain(scene) {
  const groundGeo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 180, 180);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    map: makeGroundTexture(),
    bumpMap: makeGroundBump(),
    bumpScale: 0.16,
    roughness: 0.92,
    metalness: 0.02
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  const waterTexture = makeWaterTexture();
  const waterMat = new THREE.MeshPhysicalMaterial({
    map: waterTexture,
    color: 0x3f9fbd,
    transparent: true,
    opacity: 0.78,
    roughness: 0.08,
    metalness: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    transmission: 0.04,
    ior: 1.333
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(22, 96), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(-45, -4.4, 40);
  water.receiveShadow = true;
  water.userData.waveTexture = waterTexture;
  scene.add(water);

  return { ground, water };
}
