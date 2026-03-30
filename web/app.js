// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}

// ── Canvas setup ──────────────────────────────────────────────────────────────
const trailCanvas   = document.getElementById('trail');
const sparkleCanvas = document.getElementById('sparkle');
const tc = trailCanvas.getContext('2d');
const sc = sparkleCanvas.getContext('2d');
const bg = document.getElementById('bg');

// Offscreen canvas for "settled" segments (>SETTLE_MS old) — repaints only
// when the settled population changes, not every animation frame.
const settledCanvas = document.createElement('canvas');
const stc = settledCanvas.getContext('2d');
let lastSettledCount = -1; // -1 forces first paint

const TRAIL_MS  = 5000; // segments live for this long (ms)
const SETTLE_MS = 1000; // segments bake to the offscreen canvas after this
const MIN_WIDTH = 6;
const MAX_WIDTH = 36;
let hue = 0;

const fingers  = {};
const segments = [];
const sparkles = [];

// ── Resize ────────────────────────────────────────────────────────────────────
function resize() {
  const dpr = window.devicePixelRatio || 1;
  for (const cvs of [trailCanvas, sparkleCanvas, settledCanvas]) {
    cvs.width  = window.innerWidth  * dpr;
    cvs.height = window.innerHeight * dpr;
    const c = cvs.getContext('2d');
    c.scale(dpr, dpr);
    c.lineCap  = 'round';
    c.lineJoin = 'round';
  }
  lastSettledCount = -1; // force settled canvas repaint after resize
}

// ── Trail ─────────────────────────────────────────────────────────────────────
function drawSegment(ctx, s) {
  ctx.beginPath();
  if (s.isDot) {
    ctx.arc(s.x1, s.y1, s.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${s.hue},100%,50%)`;
    ctx.fill();
  } else {
    ctx.moveTo(s.x1, s.y1);
    ctx.quadraticCurveTo(s.cpx, s.cpy, s.cx, s.cy);
    ctx.strokeStyle = `hsl(${s.hue},100%,50%)`;
    ctx.lineWidth   = s.w;
    ctx.stroke();
  }
}

function redrawTrails() {
  const now = Date.now();

  // Remove fully-expired segments. If any were evicted the settled layer changes.
  const prevLen = segments.length;
  while (segments.length && now - segments[0].t >= TRAIL_MS) segments.shift();

  // Count how many segments have aged into the "settled" zone.
  let settledCount = 0;
  for (const s of segments) { if (now - s.t >= SETTLE_MS) settledCount++; }

  // Repaint the offscreen settled canvas only when its population changes
  // (a new segment became settled, or an old one expired).
  if (settledCount !== lastSettledCount || segments.length !== prevLen) {
    lastSettledCount = settledCount;
    stc.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const s of segments) {
      if (now - s.t >= SETTLE_MS) drawSegment(stc, s);
    }
  }

  // Composite: blit the cached settled layer, then draw fresh (<SETTLE_MS) on top.
  tc.clearRect(0, 0, window.innerWidth, window.innerHeight);
  tc.drawImage(settledCanvas, 0, 0, window.innerWidth, window.innerHeight);
  for (const s of segments) {
    if (now - s.t < SETTLE_MS) drawSegment(tc, s);
  }
}

// ── Sparkles ──────────────────────────────────────────────────────────────────
function spawnSparkles(x, y, h) {
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
    const speed = 2.5 + Math.random() * 4;
    sparkles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:   3 + Math.random() * 4,
      hue: (h + Math.random() * 40 - 20 + 360) % 360,
      born: Date.now(),
      life: 400 + Math.random() * 200
    });
  }
}

function redrawSparkles() {
  const now = Date.now();
  sc.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    const age = now - s.born;
    if (age > s.life) { sparkles.splice(i, 1); continue; }
    s.x += s.vx; s.y += s.vy;
    s.vx *= 0.90; s.vy *= 0.90;
    const alpha = 1 - age / s.life;
    sc.beginPath();
    sc.arc(s.x, s.y, s.r * alpha, 0, Math.PI * 2);
    sc.fillStyle = `hsla(${s.hue},100%,55%,${alpha})`;
    sc.fill();
  }
}

// ── Background tint ───────────────────────────────────────────────────────────
let bgHue = 0;
function updateBg() {
  let diff = hue - bgHue;
  if (diff >  180) diff -= 360;
  if (diff < -180) diff += 360;
  bgHue = (bgHue + diff * 0.02 + 360) % 360;
  bg.style.background = `hsl(${bgHue},60%,94%)`;
}

// ── Input ─────────────────────────────────────────────────────────────────────
function speedToWidth(dist) {
  return Math.max(MIN_WIDTH, MAX_WIDTH - Math.min(dist * 1.2, MAX_WIDTH - MIN_WIDTH));
}

function startFinger(id, x, y) {
  fingers[id] = { pts: [{ x, y }], lastX: x, lastY: y, w: MAX_WIDTH };
  spawnSparkles(x, y, hue);
  segments.push({ isDot: true, x1: x, y1: y, w: MAX_WIDTH, hue, t: Date.now() });
  hue = (hue + 2) % 360;
}

function moveFinger(id, x, y) {
  const f = fingers[id];
  if (!f) return;
  const dist = Math.hypot(x - f.lastX, y - f.lastY);
  if (dist < 2) return;
  f.pts.push({ x, y });
  const pts = f.pts, len = pts.length;
  if (len >= 2) {
    const p0 = pts[len - 2], p1 = pts[len - 1];
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
    f.w += (speedToWidth(dist) - f.w) * 0.08;
    segments.push({
      isDot: false,
      x1:  pts[len - 3] ? (pts[len - 3].x + p0.x) / 2 : p0.x,
      y1:  pts[len - 3] ? (pts[len - 3].y + p0.y) / 2 : p0.y,
      cpx: p0.x, cpy: p0.y, cx: mx, cy: my,
      w: f.w, hue, t: Date.now()
    });
    hue = (hue + 2) % 360;
  }
  f.lastX = x; f.lastY = y;
}

function endFinger(id) {
  delete fingers[id];
}

// ── Main loop ─────────────────────────────────────────────────────────────────
function loop() { redrawTrails(); redrawSparkles(); updateBg(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

// ── Pointer Events (mouse, touch, and stylus in one unified model) ────────────
// setPointerCapture keeps move/up events firing even if the pointer leaves the canvas.

trailCanvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  trailCanvas.setPointerCapture(e.pointerId);
  startFinger(e.pointerId, e.clientX, e.clientY);
});

trailCanvas.addEventListener('pointermove', e => {
  moveFinger(e.pointerId, e.clientX, e.clientY);
});

trailCanvas.addEventListener('pointerup', e => {
  endFinger(e.pointerId);
});

trailCanvas.addEventListener('pointercancel', e => {
  endFinger(e.pointerId);
});

window.addEventListener('resize', resize);
resize();

