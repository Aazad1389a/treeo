import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://pzvayflxdicppwrcfnwy.supabase.co';
const FALLBACK_KEY = 'sb_publishable_yF7Jp-goS1v7B4spb1XxPA_EYEjqAcu';

let client = null;
let playerId = null;

function config() {
  let url = FALLBACK_URL;
  let key = FALLBACK_KEY;
  try {
    url = import.meta.env.VITE_SUPABASE_URL || url;
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || key;
  } catch {}
  return { url, key };
}

export function initWorldSync(id) {
  playerId = id;
  const { url, key } = config();
  client = createClient(url, key);
  return client;
}

export async function loadWorldState() {
  if (!client) return { structures: [], resources: [], storage: null };
  const [structures, resources, storage] = await Promise.all([
    client.from('world_structures').select('*').order('created_at', { ascending: true }),
    client.from('world_resources').select('*').order('id', { ascending: true }),
    client.from('world_storage').select('*').eq('id', 1).maybeSingle()
  ]);
  return {
    structures: structures.data || [],
    resources: resources.data || [],
    storage: storage.data || null
  };
}

export async function savePlayerState(player) {
  if (!client || !playerId) return;
  const row = {
    player_id: playerId,
    name: player.name || 'Player',
    level: player.level || 1,
    xp: player.xp || 0,
    x: player.pos.x,
    y: player.pos.y,
    z: player.pos.z,
    yaw: player.yaw || 0,
    hp: player.hp,
    hunger: player.hunger,
    stamina: player.stamina,
    inventory: player.inventory || {},
    weapons: player.weapons || [],
    weapon_ammo: player.weaponAmmo || {},
    active_slot: player.activeSlot || 0,
    updated_at: new Date().toISOString()
  };
  const { error } = await client.from('player_states').upsert(row, { onConflict: 'player_id' });
  if (error) console.warn('TREEO player save:', error.message);
}

export async function loadPlayerState() {
  if (!client || !playerId) return null;
  const { data } = await client.from('player_states').select('*').eq('player_id', playerId).maybeSingle();
  return data || null;
}

export async function saveStructure(data) {
  if (!client) return;
  const { error } = await client.from('world_structures').upsert({
    id: data.id,
    owner_id: playerId || 'unknown',
    type: data.kind,
    x: data.x,
    y: data.y,
    z: data.z,
    rotation: data.rotation || 0
  }, { onConflict: 'id' });
  if (error) console.warn('TREEO structure save:', error.message);
}

export async function saveStorage(storage) {
  if (!client) return;
  const { error } = await client.from('world_storage').upsert({
    id: 1,
    wood: storage.wood || 0,
    stone: storage.stone || 0,
    meat: storage.meat || 0,
    ammo: storage.ammo || 0,
    bandage: storage.bandage || 0,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  if (error) console.warn('TREEO storage save:', error.message);
}

export function subscribeWorld(onChange) {
  if (!client) return null;
  const channel = client.channel('treeo-world-db')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'world_structures' }, payload => onChange?.('structure', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'world_resources' }, payload => onChange?.('resource', payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'world_storage' }, payload => onChange?.('storage', payload));
  channel.subscribe();
  return channel;
}
