const KEY='treeo-storage-v1';

export function createStorage(){return {wood:0,stone:0,meat:0,ammo:0,bandage:0};}
export function depositStorage(player,storage){
  for(const k of Object.keys(storage)){
    const n=Math.max(0,player.inventory[k]||0); storage[k]+=n; player.inventory[k]=0;
  }
}
export function withdrawStorage(player,storage){
  for(const k of Object.keys(storage)){player.inventory[k]=(player.inventory[k]||0)+storage[k];storage[k]=0;}
}
export function saveStorage(storage){localStorage.setItem(KEY,JSON.stringify(storage));}
export function loadStorage(){try{return {...createStorage(),...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return createStorage();}}
