import { rng, heightAt, WORLD_HALF } from '../world/world.js';
import { createPickupIcon } from './weapons.js';

// آیتم‌های قابل‌برداشت روی زمین را می‌سازد و برمی‌گرداند.
// هر آیتم: { id, kind, mesh, baseY, taken }
export function spawnWorldItems(scene, count = 160) {
  const items = [];
  const kinds = ['wood', 'wood', 'stone', 'stone', 'meat', 'bandage', 'ammo', 'ammo', 'pistol', 'rifle', 'axe'];
  for (let i = 0; i < count; i++) {
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const x = (rng() * 2 - 1) * WORLD_HALF * 0.9;
    const z = (rng() * 2 - 1) * WORLD_HALF * 0.9;
    const y = heightAt(x, z);
    if (y < -3.6) continue;
    const mesh = createPickupIcon(kind);
    mesh.position.set(x, y + 0.5, z);
    scene.add(mesh);
    items.push({ id: 'it' + i, kind, mesh, baseY: y + 0.5, taken: false });
  }
  return items;
}

export function animateItems(items, t) {
  for (const it of items) {
    if (it.taken) continue;
    it.mesh.rotation.y = t * 0.8;
    it.mesh.position.y = it.baseY + Math.sin(t * 2 + it.baseY) * 0.08;
  }
}

// نزدیک‌ترین آیتم برداشت‌نشده به بازیکن را برمی‌گرداند (یا null)
export function findNearestItem(items, playerPos, maxDist = 3.2) {
  let best = null, bestD = maxDist;
  for (const it of items) {
    if (it.taken) continue;
    const d = it.mesh.position.distanceTo(playerPos);
    if (d < bestD) { bestD = d; best = it; }
  }
  return best;
}
