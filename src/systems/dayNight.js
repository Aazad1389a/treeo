import * as THREE from 'three';

const DAY_LENGTH_SEC = 300; // یک شبانه‌روز کامل = ۵ دقیقه واقعی
let dayTime = 0.32; // 0..1  (0=نیمه‌شب, 0.5=ظهر)

const dayCol = new THREE.Color(0x9fd0e8);
const nightCol = new THREE.Color(0x0a1224);

// نور خورشید، رنگ آسمان/مه و ساعت داخل بازی را آپدیت می‌کند
export function updateSky(dt, { scene, sun, hemi, target, clockEl }) {
  dayTime += dt / DAY_LENGTH_SEC;
  if (dayTime > 1) dayTime -= 1;

  const angle = dayTime * Math.PI * 2;
  const sunHeight = Math.sin(angle - Math.PI / 2);
  sun.position.set(Math.cos(angle) * 80, Math.max(sunHeight, -0.15) * 80 + 20, 30);
  sun.target.position.copy(target);

  const t = Math.max(0, Math.min(1, sunHeight * 1.4 + 0.35));
  const sky = nightCol.clone().lerp(dayCol, t);
  scene.background.copy(sky);
  scene.fog.color.copy(sky);
  sun.intensity = 0.15 + t * 1.1;
  hemi.intensity = 0.15 + t * 0.55;

  const hrs = Math.floor(dayTime * 24);
  const mins = Math.floor((dayTime * 24 * 60) % 60);
  clockEl.textContent = String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
}
