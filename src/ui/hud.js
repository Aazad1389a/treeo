// همه‌ی دستکاری‌های DOM (نوار سلامتی، هات‌بار، کوله‌پشتی، پیام‌ها) اینجاست
export function updateBars(hp, hunger, stam) {
  document.querySelector('#hp>i').style.width = hp + '%';
  document.querySelector('#hunger>i').style.width = hunger + '%';
  document.querySelector('#stam>i').style.width = stam + '%';
}

export function updateClockCount(count) {
  document.getElementById('cntTxt').textContent = count;
}

export function refreshHotbar(player, weaponAmmo, ITEM_DEFS) {
  const hb = document.getElementById('hotbar');
  hb.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const kind = player.weapons[i];
    const div = document.createElement('div');
    div.className = 'slot' + (i === player.activeSlot ? ' active' : '');
    if (kind) {
      div.innerHTML = ITEM_DEFS[kind].icon;
      if (kind !== 'axe') {
        const c = document.createElement('div');
        c.className = 'cnt';
        c.textContent = weaponAmmo[kind] !== undefined ? weaponAmmo[kind] : '';
        div.appendChild(c);
      }
    }
    hb.appendChild(div);
  }
}

export function refreshBackpack(player, ITEM_DEFS, onUse) {
  const grid = document.getElementById('bpGrid');
  grid.innerHTML = '';
  Object.keys(player.inventory).forEach((kind) => {
    if (player.inventory[kind] <= 0) return;
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = ITEM_DEFS[kind].icon;
    const c = document.createElement('div');
    c.className = 'cnt';
    c.textContent = player.inventory[kind];
    div.appendChild(c);
    div.onclick = () => onUse(kind);
    grid.appendChild(div);
  });
}

export function toggleBackpack(refreshFn) {
  const p = document.getElementById('bpPanel');
  p.style.display = p.style.display === 'block' ? 'none' : 'block';
  if (p.style.display === 'block') refreshFn();
}

export function setPrompt(text) {
  const el = document.getElementById('promptText');
  if (text) { el.style.display = 'block'; el.textContent = text; }
  else el.style.display = 'none';
}

export function flashDamage() {
  const f = document.getElementById('dmgFlash');
  f.style.opacity = 1;
  setTimeout(() => (f.style.opacity = 0), 200);
}

export function showDeath(reason) {
  document.getElementById('deathReason').textContent = reason;
  document.getElementById('deathScreen').style.display = 'flex';
  if (document.pointerLockElement) document.exitPointerLock();
}
export function hideDeath() {
  document.getElementById('deathScreen').style.display = 'none';
}

export function updatePlayersList(state, myId, myName) {
  const el = document.getElementById('players');
  el.innerHTML = '<div style="opacity:.6;margin-bottom:4px;">آنلاین</div>';
  Object.entries(state).forEach(([id, arr]) => {
    const nm = arr[0]?.name || id.slice(0, 6);
    const div = document.createElement('div');
    div.className = 'p';
    div.textContent = id === myId ? '⭐ ' + myName + ' (شما)' : nm;
    el.appendChild(div);
  });
}

export function enterGameUI() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
}
