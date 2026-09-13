export function updateBars(hp, hunger, stam) {
  const hpEl = document.querySelector('.hp>i'), hungerEl = document.querySelector('.hungry>i'), stamEl = document.querySelector('.stam>i');
  if (hpEl) hpEl.style.width = Math.max(0, Math.min(100, hp)) + '%';
  if (hungerEl) hungerEl.style.width = Math.max(0, Math.min(100, hunger)) + '%';
  if (stamEl) stamEl.style.width = Math.max(0, Math.min(100, stam)) + '%';
}
export function updateClockCount(count) { const el = document.getElementById('cntTxt'); if (el) el.textContent = count; }
export function refreshHotbar(player, weaponAmmo, ITEM_DEFS) {
  const hb = document.getElementById('hotbar'); if (!hb) return; hb.innerHTML = '';
  for (let i = 0; i < 3; i++) { const kind = player.weapons[i], div = document.createElement('div'); div.className = 'slot' + (i === player.activeSlot ? ' active' : '');
    if (kind && ITEM_DEFS[kind]) { div.innerHTML = ITEM_DEFS[kind].icon; if (kind !== 'axe') { const c = document.createElement('div'); c.className = 'cnt'; c.textContent = weaponAmmo[kind] ?? ''; div.appendChild(c); } }
    div.addEventListener('click', () => { player.activeSlot = i; }); hb.appendChild(div);
  }
}
export function refreshBackpack(player, ITEM_DEFS, onUse) {
  const grid = document.getElementById('bpGrid'); if (!grid) return; grid.innerHTML = '';
  Object.keys(player.inventory).forEach(kind => { if ((player.inventory[kind] || 0) <= 0 || !ITEM_DEFS[kind]) return; const div = document.createElement('div'); div.className = 'slot'; div.innerHTML = ITEM_DEFS[kind].icon; const c = document.createElement('div'); c.className = 'cnt'; c.textContent = player.inventory[kind]; div.appendChild(c); div.addEventListener('click', () => onUse(kind)); grid.appendChild(div); });
}
export function toggleBackpack(refreshFn) { const p = document.getElementById('bpPanel'); if (!p) return; p.style.display = p.style.display === 'block' ? 'none' : 'block'; if (p.style.display === 'block') refreshFn(); }
export function setPrompt(text) { const el = document.getElementById('promptText'); if (!el) return; el.style.display = text ? 'block' : 'none'; if (text) el.textContent = text; }
export function flashDamage() {}
export function showDeath(reason) { const r = document.getElementById('deathReason'), s = document.getElementById('deathScreen'); if (r) r.textContent = reason; if (s) s.style.display = 'flex'; if (document.pointerLockElement) document.exitPointerLock(); }
export function hideDeath() { const s = document.getElementById('deathScreen'); if (s) s.style.display = 'none'; }
export function updatePlayersList(state, myId, myName) { const el = document.getElementById('players'); if (!el) return; el.innerHTML = '<div style="opacity:.6;margin-bottom:4px;">آنلاین</div>'; Object.entries(state).forEach(([id, arr]) => { const nm = arr[0]?.name || id.slice(0, 6); const div = document.createElement('div'); div.className = 'p'; div.textContent = id === myId ? '⭐ ' + myName + ' (شما)' : nm; el.appendChild(div); }); }
export function enterGameUI() { const splash = document.getElementById('splash'), hud = document.getElementById('hud'); if (splash) splash.style.display = 'none'; if (hud) hud.style.display = 'block'; }
