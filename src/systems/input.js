// همه‌ی ورودی‌ها: کیبورد+ماوس (PC) و لمسی (موبایل) — با یک state مشترک
export function setupInput(player, canvas, callbacks) {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const keys = {};
  const joyVec = { x: 0, y: 0 };
  const jumpQueued = { value: false };
  let mouseLocked = false;

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Tab') { e.preventDefault(); callbacks.toggleBackpack(); }
    if (e.code === 'Digit1') callbacks.switchSlot(0);
    if (e.code === 'Digit2') callbacks.switchSlot(1);
    if (e.code === 'Digit3') callbacks.switchSlot(2);
    if (e.code === 'KeyE') callbacks.tryInteract();
    if (e.code === 'KeyR') callbacks.reload();
  });
  window.addEventListener('keyup', (e) => (keys[e.code] = false));

  canvas.addEventListener('click', () => {
    if (!isTouch && !mouseLocked) canvas.requestPointerLock();
    if (mouseLocked || isTouch) callbacks.shoot();
  });
  document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('mousemove', (e) => {
    if (!mouseLocked) return;
    player.yaw -= e.movementX * 0.0022;
    player.pitch -= e.movementY * 0.0022;
    player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch));
  });

  if (isTouch) {
    const joyBase = document.getElementById('joyBase');
    const joyKnob = document.getElementById('joyKnob');
    let joyId = null;

    joyBase.addEventListener('touchstart', (e) => {
      joyId = e.changedTouches[0].identifier;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          const r = joyBase.getBoundingClientRect();
          let dx = (t.clientX - (r.left + r.width / 2)) / (r.width / 2);
          let dy = (t.clientY - (r.top + r.height / 2)) / (r.height / 2);
          const len = Math.hypot(dx, dy);
          if (len > 1) { dx /= len; dy /= len; }
          joyVec.x = dx; joyVec.y = dy;
          joyKnob.style.transform = `translate(${dx * 32}px,${dy * 32}px)`;
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          joyId = null; joyVec.x = 0; joyVec.y = 0;
          joyKnob.style.transform = 'translate(0,0)';
        }
      }
    });

    const lookPad = document.getElementById('lookPad');
    let lookId = null, lastLook = { x: 0, y: 0 };
    lookPad.addEventListener('touchstart', (e) => {
      lookId = e.changedTouches[0].identifier;
      const t = e.changedTouches[0];
      lastLook = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookId) {
          const dx = t.clientX - lastLook.x, dy = t.clientY - lastLook.y;
          player.yaw -= dx * 0.0035;
          player.pitch -= dy * 0.0035;
          player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch));
          lastLook = { x: t.clientX, y: t.clientY };
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
    });

    document.getElementById('btnJump').addEventListener('touchstart', (e) => { e.preventDefault(); jumpQueued.value = true; }, { passive: false });
    document.getElementById('btnUse').addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.tryInteract(); }, { passive: false });
    document.getElementById('btnShoot').addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.shoot(); }, { passive: false });
    document.getElementById('btnInv').addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.toggleBackpack(); }, { passive: false });

    document.getElementById('mobileUI').style.display = 'block';
  }

  return { keys, joyVec, jumpQueued, isTouch, get mouseLocked() { return mouseLocked; } };
}
