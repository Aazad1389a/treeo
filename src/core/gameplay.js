export function craftItem(player, kind) {
  const recipes = {
    bandage: { wood: 1, meat: 1 },
    ammo: { stone: 1, wood: 1 },
    axe: { wood: 3, stone: 2 }
  };
  const recipe = recipes[kind];
  if (!recipe) return false;
  for (const [item, need] of Object.entries(recipe)) {
    if ((player.inventory[item] || 0) < need) return false;
  }
  for (const [item, need] of Object.entries(recipe)) player.inventory[item] -= need;
  player.inventory[kind] = (player.inventory[kind] || 0) + 1;
  if (kind === 'axe' && !player.weapons.includes('axe')) player.weapons.push('axe');
  return true;
}
