import * as THREE from 'three';
import { WORLD_HALF, rng, heightAt } from './world/world.js';
import { buildTerrain } from './world/terrain.js';
import { buildNature } from './world/nature.js';
import { createPistol, createRifle, createAxe, ITEM_DEFS, weaponDefFor } from './entities/weapons.js';
import { spawnWorldItems, animateItems, findNearestItem } from './entities/items.js';
import { setupInput } from './systems/input.js';
import { updateSky } from './systems/dayNight.js';
import * as MP from './systems/multiplayer.js';
import * as HUD from './ui/hud.js';

/* ---------- رندرر / صحنه / دوربین ---------- */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const FOG_COLOR = new THREE.Color(0x9fd0e8);
scene.fog = new THREE.Fog(FOG_COLOR, 20, 190);
scene.background = FOG_COLOR.clone();

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 500);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x2b3a1e, 0.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 200;
scene.add(sun, sun.target);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- دنیا ---------- */
buildTerrain(scene);
buildNature(scene);
const worldItems = spawnWorldItems(scene, 160);

/* ---------- بازیکن ---------- */
const player = {
  pos: new THREE.Vector3(0, 0, 0),
  vel: new THREE.Vector3(),
  yaw: 0, pitch: 0,
  onGround: false,
  hp: 100, hunger: 100, stamina: 100,
  alive: true,
  inventory: {},
  weapons: [],
  activeSlot: 0,
  lastShot: 0,
  name: 'Player'
};
player.pos.set(0, heightAt(0, 0) + 2, 0);

const viewGroup = new THREE.Group();
camera.add(viewGroup);
const weaponAmmo = {};
let currentWeaponMesh = null;

function equipToHand(kind) {
  viewGroup.clear();
  currentWeaponMesh = null;
  if (!kind) return;
  let m = null;
  if (kind === 'pistol') m = createPistol();
  else if (kind === 'rifle') m = createRifle();
  else if (kind === 'axe') m = createAxe();
  if (!m) return;
  m.position.set(0.18, -0.16, -0.35);
  m.rotation.y = Math.PI * 0.02;
  viewGroup.add(m);
  currentWeaponMesh = m;
}

/* ---------- کوله‌پشتی / هات‌بار ---------- */
function addItem(kind, n = 1) {
  player.inventory[kind] = (player.inventory[kind] || 0) + n;
  if (ITEM_DEFS[kind].weapon && !player.weapons.includes(kind)) player.weapons.push(kind);
  HUD.refreshHotbar(player, weaponAmmo, ITEM_DEFS);
  HUD.refreshBackpack(player, ITEM_DEFS, useItem);
}
function switchSlot(i) {
  player.activeSlot = i;
  equipToHand(player.weapons[i]);
  HUD.refreshHotbar(player, weaponAmmo, ITEM_DEFS);
}
function useItem(kind) {
  const def = ITEM_DEFS[kind];
  if (def.food) { player.hunger = Math.min(100, player.hunger + def.food); player.inventory[kind]--; }
  else if (def.heal) { player.hp = Math.min(100, player.hp + def.heal); player.inventory[kind]--; }
  else if (def.weapon) { const idx = player.weapons.indexOf(kind); if (idx >= 0) switchSlot(idx); }
  HUD.refreshBackpack(player, ITEM_DEFS, useItem);
  HUD.refreshHotbar(player, weaponAmmo, ITEM_DEFS);
}
function toggleBackpack() {
  HUD.toggleBackpack(() => HUD.refreshBackpack(player, ITEM_DEFS, useItem));
}
function reload() {
  const kind = player.weapons[player.activeSlot];
  if (!kind || kind === 'axe') return;
  const def = weaponDefFor(kind);
  const have = player.inventory['ammo'] || 0;
  const need = def.magMax - (weaponAmmo[kind] || 0);
  const use = Math.min(need, have);
  if (use <= 0) return;
  weaponAmmo[kind] = (weaponAmmo[kind] || 0) + use;
  player.inventory['ammo'] -= use;
  HUD.refreshHotbar(player, weaponAmmo, ITEM_DEFS);
  HUD.refreshBackpack(player, ITEM_DEFS, useItem);
}

/* ---------- شلیک ---------- */
const raycaster = new THREE.Raycaster();
const muzzleFlashLight = new THREE.PointLight(0xffcc77, 0, 6);
scene.add(muzzleFlashLight);

function shoot() {
  if (!player.alive) return;
  const kind = player.weapons[player.activeSlot];
  if (!kind) return;
  const def = weaponDefFor(kind);
  const now = performance.now();
  if (now - player.lastShot < def.fireDelay) return;

  if (!def.melee) {
    if ((weaponAmmo[kind] || 0) <= 0) { reload(); return; }
    weaponAmmo[kind]--;
  }
  player.lastShot = now;
  HUD.refreshHotbar(player, weaponAmmo, ITEM_DEFS);

  muzzleFlashLight.position.copy(camera.position);
  muzzleFlashLight.intensity = 2.4;
  setTimeout(() => (muzzleFlashLight.intensity = 0), 60);

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const targets = Object.values(MP.remotePlayers).map((p) => p.hitMesh).filter(Boolean);
  const hits = raycaster.intersectObjects(targets, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj && !obj.userData.playerId) obj = obj.parent;
    if (obj && hits[0].distance <= def.range) MP.broadcastHit(obj.userData.playerId, def.damage, myId);
  }

  if (currentWeaponMesh) {
    currentWeaponMesh.position.z += 0.05;
    setTimeout(() => { if (currentWeaponMesh) currentWeaponMesh.position.z -= 0.05; }, 70);
  }
}

/* ---------- برداشتن آیتم ---------- */
let nearestItem = null;
function updateNearestItem(isTouch) {
  nearestItem = findNearestItem(worldItems, player.pos);
  if (nearestItem) {
    HUD.setPrompt((isTouch ? 'دکمه برداشت را بزن: ' : 'E را بزن: ') + ITEM_DEFS[nearestItem.kind].name);
  } else {
    HUD.setPrompt(null);
  }
}
function tryInteract() {
  if (!nearestItem) return;
  addItem(nearestItem.kind, nearestItem.kind === 'ammo' ? 12 : 1);
  nearestItem.mesh.visible = false;
  nearestItem.taken = true;
  MP.broadcastItemTaken(nearestItem.id);
  if (ITEM_DEFS[nearestItem.kind].weapon && player.weapons.length === 1) switchSlot(0);
}

/* ---------- ورودی (کیبورد/ماوس/لمسی) ---------- */
const input = setupInput(player, canvas, { toggleBackpack, switchSlot, tryInteract, reload, shoot });

/* ---------- مرگ / ری‌اسپاون ---------- */
function die(reason) {
  player.alive = false;
  HUD.showDeath(reason);
}
function respawn() {
  player.hp = 100; player.hunger = 100; player.stamina = 100; player.alive = true;
  player.pos.set((rng() * 2 - 1) * 20, 0, (rng() * 2 - 1) * 20);
  player.pos.y = heightAt(player.pos.x, player.pos.z) + 2;
  HUD.hideDeath();
}
document.getElementById('btnRespawn').addEventListener('click', respawn);

/* ---------- حرکت ---------- */
function updateMovement(dt) {
  if (!player.alive) return;
  let mx = 0, mz = 0;
  if (input.keys['KeyW']) mz -= 1;
  if (input.keys['KeyS']) mz += 1;
  if (input.keys['KeyA']) mx -= 1;
  if (input.keys['KeyD']) mx += 1;
  if (input.isTouch) { mx += input.joyVec.x; mz += input.joyVec.y; }
  const len = Math.hypot(mx, mz);
  if (len > 0) { mx /= len; mz /= len; }

  const sprint = (input.keys['ShiftLeft'] || input.keys['ShiftRight']) && player.stamina > 2;
  const speed = sprint ? 6.2 : 3.4;
  if (sprint && len > 0) player.stamina = Math.max(0, player.stamina - dt * 14);
  else player.stamina = Math.min(100, player.stamina + dt * 6);

  const forward = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.sin(player.yaw + Math.PI / 2), 0, Math.cos(player.yaw + Math.PI / 2));
  const move = new THREE.Vector3();
  move.addScaledVector(forward, -mz).addScaledVector(right, mx);
  if (move.lengthSq() > 0) move.normalize();

  player.vel.x = move.x * speed;
  player.vel.z = move.z * speed;

  if ((input.keys['Space'] || input.jumpQueued.value) && player.onGround) {
    player.vel.y = 5.2;
    player.onGround = false;
  }
  input.jumpQueued.value = false;

  player.vel.y -= 14 * dt;
  player.pos.x += player.vel.x * dt;
  player.pos.z += player.vel.z * dt;
  player.pos.y += player.vel.y * dt;

  const groundY = heightAt(player.pos.x, player.pos.z) + 1.7;
  if (player.pos.y <= groundY) { player.pos.y = groundY; player.vel.y = 0; player.onGround = true; }

  player.pos.x = Math.max(-WORLD_HALF + 1, Math.min(WORLD_HALF - 1, player.pos.x));
  player.pos.z = Math.max(-WORLD_HALF + 1, Math.min(WORLD_HALF - 1, player.pos.z));

  camera.position.copy(player.pos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  if (currentWeaponMesh) {
    const bob = (len > 0 && player.onGround) ? Math.sin(performance.now() * 0.012) * 0.012 : 0;
    currentWeaponMesh.position.y = -0.16 + bob;
  }
}

function updateSurvival(dt) {
  if (!player.alive) return;
  player.hunger = Math.max(0, player.hunger - dt * 0.35);
  if (player.hunger <= 0) player.hp = Math.max(0, player.hp - dt * 2.2);
  else if (player.hunger > 60) player.hp = Math.min(100, player.hp + dt * 0.6);
  if (player.hp <= 0) die('گرسنگی و ضعف');
  HUD.updateBars(player.hp, player.hunger, player.stamina);
}

/* ---------- چندنفره ---------- */
const myId = 'p_' + Math.random().toString(36).slice(2, 9);

function onHit(dmg) {
  if (!player.alive) return;
  player.hp -= dmg;
  HUD.flashDamage();
  if (player.hp <= 0) die('یک بازیکن دیگر');
}
function onItemTaken(itemId) {
  const it = worldItems.find((w) => w.id === itemId);
  if (it && !it.taken) { it.taken = true; it.mesh.visible = false; }
}
function onPresence(state, count) {
  HUD.updateClockCount(count);
  HUD.updatePlayersList(state, myId, player.name);
}

let renderStarted = false;
function startGameLoop() {
  if (renderStarted) return;
  renderStarted = true;
  HUD.enterGameUI();
  addItem('wood', 5);
  switchSlot(0);
  tick();
}

/* ---------- حلقه‌ی اصلی ---------- */
const clock = new THREE.Clock();
let lastNetSend = 0;
const clockEl = document.getElementById('clockTxt');

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  updateMovement(dt);
  updateSurvival(dt);
  updateSky(dt, { scene, sun, hemi, target: player.pos, clockEl });
  MP.updateRemotes(dt);
  updateNearestItem(input.isTouch);
  animateItems(worldItems, t);

  if (performance.now() - lastNetSend > 80) {
    MP.broadcastMove(myId, player);
    lastNetSend = performance.now();
  }

  renderer.render(scene, camera);
}

/* ---------- دکمه‌ی شروع ---------- */
document.getElementById('btnPlay').addEventListener('click', () => {
  const name = document.getElementById('inName').value.trim() || 'Player' + Math.floor(Math.random() * 999);
  const url = document.getElementById('inUrl').value.trim();
  const key = document.getElementById('inKey').value.trim();
  player.name = name;
  MP.initMultiplayer(scene, url, key, name, myId, { onReady: startGameLoop, onHit, onItemTaken, onPresence });
});

/* پیش‌فرض از .env در صورت وجود (اختیاری) */
try {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl) document.getElementById('inUrl').value = envUrl;
  if (envKey) document.getElementById('inKey').value = envKey;
} catch (e) { /* noop */ }
