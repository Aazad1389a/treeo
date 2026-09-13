import * as THREE from 'three';

export const BUILD_DEFS = {
  foundation: { name: 'کف', icon: '▣', cost: { wood: 6, stone: 2 }, size: [4, 0.35, 4], color: 0x765438 },
  wall: { name: 'دیوار', icon: '▤', cost: { wood: 5, stone: 3 }, size: [4, 2.8, 0.35], color: 0x67472f },
  door: { name: 'در', icon: '▥', cost: { wood: 8, stone: 2 }, size: [1.25, 2.6, 0.35], color: 0x8b5a2b },
  storage: { name: 'انبار', icon: '▫', cost: { wood: 10, stone: 4 }, size: [1.5, 1.2, 1.0], color: 0x4c6b45 }
};

let nextId = 1;
export const structures = new Map();

function material(color) { return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02 }); }

export function canBuild(player, kind) {
  const def = BUILD_DEFS[kind];
  if (!def) return false;
  return Object.entries(def.cost).every(([item, n]) => (player.inventory[item] || 0) >= n);
}

export function spendBuildCost(player, kind) {
  if (!canBuild(player, kind)) return false;
  for (const [item, n] of Object.entries(BUILD_DEFS[kind].cost)) player.inventory[item] -= n;
  return true;
}

export function addStructure(scene, data, local = false) {
  if (!data?.id || structures.has(data.id)) return structures.get(data?.id);
  const def = BUILD_DEFS[data.kind];
  if (!def) return null;
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...def.size), material(def.color));
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh);
  g.position.set(data.x, data.y, data.z);
  g.rotation.y = data.ry || 0;
  g.userData.structure = true;
  g.userData.kind = data.kind;
  g.userData.id = data.id;
  g.userData.half = { x: def.size[0] / 2, y: def.size[1] / 2, z: def.size[2] / 2 };
  scene.add(g);
  const record = { ...data, group: g, def };
  structures.set(data.id, record);
  return record;
}

export function createStructure(scene, player, kind, x, y, z, ry = 0) {
  if (!spendBuildCost(player, kind)) return null;
  const data = { id: `s_${Date.now().toString(36)}_${nextId++}`, kind, x, y, z, ry };
  return addStructure(scene, data, true);
}

export function removeStructure(scene, id) {
  const s = structures.get(id); if (!s) return;
  scene.remove(s.group); structures.delete(id);
}

// Simple capsule-vs-AABB horizontal collision. Keeps the player from walking through structures.
export function resolveStructureCollision(player, radius = 0.38) {
  for (const s of structures.values()) {
    const p = s.group.position;
    const h = s.group.userData.half;
    const dx = player.pos.x - p.x, dz = player.pos.z - p.z;
    const cy = player.pos.y - p.y;
    if (Math.abs(cy) > h.y + 1.7) continue;
    const ox = h.x + radius - Math.abs(dx), oz = h.z + radius - Math.abs(dz);
    if (ox <= 0 || oz <= 0) continue;
    if (ox < oz) player.pos.x += dx >= 0 ? ox : -ox;
    else player.pos.z += dz >= 0 ? oz : -oz;
  }
}

export function getBuildData(s) {
  return { id: s.id, kind: s.kind, x: s.x, y: s.y, z: s.z, ry: s.ry || 0 };
}
