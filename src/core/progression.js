const XP_PER_LEVEL = 100;

export function xpForLevel(level) {
  return Math.floor(100 + (level - 1) * 45 + Math.pow(level - 1, 1.35) * 18);
}

export function addXP(player, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  player.xp = Math.max(0, (player.xp || 0) + amount);
  let gained = 0;
  while (player.xp >= xpForLevel(player.level || 1)) {
    player.xp -= xpForLevel(player.level || 1);
    player.level = (player.level || 1) + 1;
    gained++;
    player.maxHp = 100 + Math.min(50, (player.level - 1) * 2);
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player.staminaMax = 100 + Math.min(40, Math.floor((player.level - 1) / 2) * 5);
    player.stamina = player.staminaMax;
  }
  return gained;
}

export function progress(player) {
  const level = player.level || 1;
  const need = xpForLevel(level);
  return { level, xp: player.xp || 0, need, percent: Math.max(0, Math.min(100, ((player.xp || 0) / need) * 100)) };
}

export const XP_PER_ACTION = {
  pickup: 4,
  craft: 8,
  build: 12,
  harvest: 6,
  damage: 2
};
