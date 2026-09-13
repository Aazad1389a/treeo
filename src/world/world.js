// دنیای بازی: تولید تصادفی با seed ثابت، تا همه‌ی بازیکن‌ها دقیقا یک نقشه ببینند
// بدون نیاز به ذخیره‌سازی سرور یا فایل نقشه.

export const WORLD_SEED = 133742;
export const WORLD_HALF = 100; // نصف عرض دنیا (متر)

// RNG قطعی (deterministic) - برای همه یکسان است چون seed ثابت است
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry32(WORLD_SEED);

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7 + WORLD_SEED * 0.001) * 43758.5453123;
  return s - Math.floor(s);
}

function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

// ارتفاع زمین در هر نقطه (x,z) — هم برای ساخت مش زمین و هم فیزیک حرکت استفاده می‌شود
export function heightAt(x, z) {
  let h = 0, amp = 1, freq = 0.02, total = 0;
  for (let i = 0; i < 4; i++) {
    h += noise2(x * freq, z * freq) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2.2;
  }
  h /= total;
  return h * 14 - 5;
}
