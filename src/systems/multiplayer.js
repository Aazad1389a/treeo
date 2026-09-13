import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';

// تمام منطق چندنفره‌ی آنلاین با Supabase Realtime — بدون دیتابیس و بدون بک‌اند اضافه.
// دنیای بازی روی هر کلاینت با یک seed یکسان ساخته می‌شود (دیدید world.js)،
// پس فقط وضعیت زنده‌ی بازیکن‌ها (موقعیت/شلیک/برداشتن آیتم) روی شبکه رد و بدل می‌شود.

export const remotePlayers = {}; // id -> { group, hitMesh, target:{x,y,z,yaw}, lastSeen }
let sceneRef = null;
let channel = null;

function makeRemoteAvatar() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3d8fd6 }));
  body.position.y = 1.0;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf0c9a0 }));
  head.position.y = 1.75;
  g.add(body, head);
  g.traverse((o) => { o.castShadow = true; });
  return { group: g, hit: body };
}

function upsertRemote(payload) {
  let rp = remotePlayers[payload.id];
  if (!rp) {
    const av = makeRemoteAvatar();
    av.hit.userData.playerId = payload.id;
    av.group.userData.playerId = payload.id;
    sceneRef.add(av.group);
    rp = remotePlayers[payload.id] = {
      group: av.group,
      hitMesh: av.hit,
      target: { x: payload.x, y: payload.y, z: payload.z, yaw: payload.yaw }
    };
  }
  rp.target = { x: payload.x, y: payload.y, z: payload.z, yaw: payload.yaw };
  rp.lastSeen = performance.now();
}

// url/key خالی => حالت تک‌نفره؛ در غیر این صورت به کانال 'survival-world' وصل می‌شود
export function initMultiplayer(scene, url, key, name, myId, handlers) {
  sceneRef = scene;
  if (!url || !key) { handlers.onReady(); return; }

  try {
    const sb = createClient(url, key);
    channel = sb.channel('survival-world', {
      config: { presence: { key: myId }, broadcast: { self: false } }
    });

    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (payload.id === myId) return;
      upsertRemote(payload);
    });
    channel.on('broadcast', { event: 'hit' }, ({ payload }) => {
      if (payload.targetId === myId) handlers.onHit(payload.dmg);
    });
    channel.on('broadcast', { event: 'itemTaken' }, ({ payload }) => {
      handlers.onItemTaken(payload.itemId);
    });
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const ids = Object.keys(state);
      Object.keys(remotePlayers).forEach((id) => {
        if (!ids.includes(id)) {
          scene.remove(remotePlayers[id].group);
          delete remotePlayers[id];
        }
      });
      handlers.onPresence(state, ids.length);
    });

    let started = false;
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ name, joinedAt: Date.now() });
        if (!started) { started = true; handlers.onReady(); }
      }
    });
    // اگر اتصال گیر کرد، بعد از چند ثانیه به‌صورت تک‌نفره ادامه بده
    setTimeout(() => { if (!started) { started = true; handlers.onReady(); } }, 3500);
  } catch (err) {
    console.warn('اتصال Supabase ناموفق بود، حالت تک‌نفره اجرا می‌شود.', err);
    handlers.onReady();
  }
}

export function broadcastMove(myId, player) {
  if (!channel) return;
  channel.send({ type: 'broadcast', event: 'move', payload: { id: myId, x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw } });
}
export function broadcastHit(targetId, dmg, myId) {
  if (!channel) return;
  channel.send({ type: 'broadcast', event: 'hit', payload: { targetId, dmg, from: myId } });
}
export function broadcastItemTaken(itemId) {
  if (!channel) return;
  channel.send({ type: 'broadcast', event: 'itemTaken', payload: { itemId } });
}

export function updateRemotes(dt) {
  const now = performance.now();
  Object.entries(remotePlayers).forEach(([id, rp]) => {
    rp.group.position.lerp(new THREE.Vector3(rp.target.x, rp.target.y, rp.target.z), Math.min(1, dt * 8));
    rp.group.rotation.y = rp.target.yaw;
    if (now - (rp.lastSeen || 0) > 15000) {
      sceneRef.remove(rp.group);
      delete remotePlayers[id];
    }
  });
}
