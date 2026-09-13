import * as THREE from 'three';

// همه‌ی سلاح‌ها، کوله و آیتم‌های روی زمین صرفا با اشکال هندسی پایه‌ی Three.js
// ساخته می‌شوند — هیچ فایل مدل یا تصویری بارگذاری نمی‌شود.

const metalMat = new THREE.MeshStandardMaterial({ color: 0x2b2d31, metalness: 0.6, roughness: 0.35 });
const metalMat2 = new THREE.MeshStandardMaterial({ color: 0x53575e, metalness: 0.7, roughness: 0.3 });
const woodGripMat = new THREE.MeshStandardMaterial({ color: 0x5b3d24, roughness: 0.9 });

export function createPistol() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.42), metalMat);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.14), woodGripMat);
  grip.position.set(0, -0.19, 0.12);
  grip.rotation.x = -0.25;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), metalMat2);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.28);
  const trigger = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 10), metalMat2);
  trigger.position.set(0, -0.06, 0.06);
  g.add(body, grip, barrel, trigger);
  g.traverse(o => (o.castShadow = true));
  g.userData = { kind: 'weapon', id: 'pistol' };
  return g;
}

export function createRifle() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.75), metalMat);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.28), woodGripMat);
  stock.position.set(0, -0.01, 0.48);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), woodGripMat);
  grip.position.set(0, -0.15, 0.2);
  grip.rotation.x = -0.3;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), metalMat2);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.55);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.09), metalMat2);
  mag.position.set(0, -0.18, -0.05);
  mag.rotation.x = 0.25;
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.05), metalMat2);
  sight.position.set(0, 0.1, -0.1);
  g.add(body, stock, grip, barrel, mag, sight);
  g.traverse(o => (o.castShadow = true));
  g.userData = { kind: 'weapon', id: 'rifle' };
  return g;
}

export function createAxe() {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 8), woodGripMat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), metalMat2);
  head.rotation.z = Math.PI / 2;
  head.position.set(0, 0.27, 0.06);
  head.scale.set(1, 1, 0.4);
  g.add(handle, head);
  g.traverse(o => (o.castShadow = true));
  g.userData = { kind: 'weapon', id: 'axe' };
  return g;
}

export function createBackpackMesh() {
  const g = new THREE.Group();
  const main = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.2), new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.9 }));
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x6e451f, roughness: 0.9 }));
  pocket.position.set(0, -0.06, 0.14);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a2916 });
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), strapMat);
  strapL.position.set(-0.13, 0, -0.06);
  strapL.rotation.x = 0.15;
  const strapR = strapL.clone();
  strapR.position.x = 0.13;
  g.add(main, pocket, strapL, strapR);
  g.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
  return g;
}

export function createPickupIcon(kind) {
  let mesh;
  if (kind === 'wood') {
    mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x7a5230, flatShading: true }));
    mesh.rotation.z = Math.PI / 2.3;
  } else if (kind === 'stone') {
    mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: 0x999590, flatShading: true }));
  } else if (kind === 'meat') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb2543f, flatShading: true, roughness: 0.8 }));
    mesh.scale.set(1, 0.7, 1.2);
  } else if (kind === 'bandage') {
    mesh = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 8, 16), new THREE.MeshStandardMaterial({ color: 0xf2f0e6 }));
  } else if (kind === 'ammo') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.28), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.5, roughness: 0.4 }));
  } else if (kind === 'pistol') { mesh = createPistol(); mesh.scale.set(1.4, 1.4, 1.4); }
  else if (kind === 'rifle') { mesh = createRifle(); mesh.scale.set(1.2, 1.2, 1.2); }
  else if (kind === 'axe') { mesh = createAxe(); mesh.scale.set(1.1, 1.1, 1.1); }
  else if (kind === 'backpack') { mesh = createBackpackMesh(); }
  mesh.traverse(o => (o.castShadow = true));
  return mesh;
}

export const ITEM_DEFS = {
  wood: { icon: '🪵', name: 'چوب', stack: 20 },
  stone: { icon: '🪨', name: 'سنگ', stack: 20 },
  meat: { icon: '🍖', name: 'گوشت', stack: 10, food: 28 },
  bandage: { icon: '🩹', name: 'باند', stack: 8, heal: 30 },
  ammo: { icon: '🔸', name: 'فشنگ', stack: 60 },
  pistol: { icon: '🔫', name: 'تپانچه', stack: 1, weapon: true },
  rifle: { icon: '🔫', name: 'تفنگ', stack: 1, weapon: true },
  axe: { icon: '🪓', name: 'تبر', stack: 1, weapon: true },
  backpack: { icon: '🎒', name: 'کوله', stack: 1 }
};

export function weaponDefFor(kind) {
  if (kind === 'pistol') return { damage: 18, fireDelay: 280, magMax: 12, range: 60 };
  if (kind === 'rifle') return { damage: 32, fireDelay: 130, magMax: 30, range: 110 };
  if (kind === 'axe') return { damage: 26, fireDelay: 420, melee: true, range: 2.6 };
  return {};
}
