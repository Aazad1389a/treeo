import { createClient } from '@supabase/supabase-js';

const KEY='treeo-storage-v1';
const SUPABASE_URL='https://pzvayflxdicppwrcfnwy.supabase.co';
const SUPABASE_KEY='sb_publishable_yF7Jp-goS1v7B4spb1XxPA_EYEjqAcu';
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);

export function createStorage(){return {wood:0,stone:0,meat:0,ammo:0,bandage:0};}

export function depositStorage(player,storage){
  for(const k of Object.keys(storage)){
    const n=Math.max(0,player.inventory[k]||0); storage[k]+=n; player.inventory[k]=0;
  }
  saveStorage(storage);
}

export function withdrawStorage(player,storage){
  for(const k of Object.keys(storage)){player.inventory[k]=(player.inventory[k]||0)+storage[k];storage[k]=0;}
  saveStorage(storage);
}

export function saveStorage(storage){
  localStorage.setItem(KEY,JSON.stringify(storage));
  supabase.from('world_storage').upsert({
    id:1,
    wood:storage.wood||0,
    stone:storage.stone||0,
    meat:storage.meat||0,
    ammo:storage.ammo||0,
    bandage:storage.bandage||0,
    updated_at:new Date().toISOString()
  },{onConflict:'id'}).then(({error})=>{if(error)console.warn('TREEO storage sync:',error.message);});
}

export function loadStorage(){
  const storage=createStorage();
  try{Object.assign(storage,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
  supabase.from('world_storage').select('*').eq('id',1).maybeSingle().then(({data,error})=>{
    if(error){console.warn('TREEO storage load:',error.message);return;}
    if(data){Object.assign(storage,{wood:data.wood||0,stone:data.stone||0,meat:data.meat||0,ammo:data.ammo||0,bandage:data.bandage||0});localStorage.setItem(KEY,JSON.stringify(storage));window.dispatchEvent(new CustomEvent('treeo-storage-sync'));}
  });
  supabase.channel('treeo-storage-sync').on('postgres_changes',{event:'UPDATE',schema:'public',table:'world_storage',filter:'id=eq.1'},payload=>{
    const data=payload.new;if(!data)return;
    Object.assign(storage,{wood:data.wood||0,stone:data.stone||0,meat:data.meat||0,ammo:data.ammo||0,bandage:data.bandage||0});
    localStorage.setItem(KEY,JSON.stringify(storage));window.dispatchEvent(new CustomEvent('treeo-storage-sync'));
  }).subscribe();
  return storage;
}
