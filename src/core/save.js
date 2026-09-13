const KEY = 'treeo-save-v1';

export function saveGame(player) {
  const data = {
    pos: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
    yaw: player.yaw,
    pitch: player.pitch,
    hp: player.hp,
    hunger: player.hunger,
    stamina: player.stamina,
    inventory: { ...player.inventory },
    weapons: [...player.weapons],
    activeSlot: player.activeSlot,
    weaponAmmo: { ...player.weaponAmmo }
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadGame(player, heightAt) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.pos) {
      player.pos.set(Number(d.pos.x) || 0, Number(d.pos.y) || heightAt(0, 0) + 1.7, Number(d.pos.z) || 0);
      player.pos.y = heightAt(player.pos.x, player.pos.z) + 1.7;
    }
    player.yaw = Number(d.yaw) || 0;
    player.pitch = Number(d.pitch) || 0;
    player.hp = Math.max(1, Math.min(100, Number(d.hp) || 100));
    player.hunger = Math.max(0, Math.min(100, Number(d.hunger) || 100));
    player.stamina = Math.max(0, Math.min(100, Number(d.stamina) || 100));
    player.inventory = { ...(d.inventory || {}) };
    player.weapons = Array.isArray(d.weapons) ? [...d.weapons] : [];
    player.activeSlot = Math.max(0, Number(d.activeSlot) || 0);
    player.weaponAmmo = { ...(d.weaponAmmo || {}) };
    return true;
  } catch (err) {
    console.warn('TREEO save load failed:', err);
    return false;
  }
}

export function clearSave() {
  localStorage.removeItem(KEY);
}
