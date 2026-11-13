import * as THREE from "./assets/vendor/three.module.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener("pointermove", (e) => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const edgeGeo = new THREE.EdgesGeometry(boxGeo);

function crate(w, h, d, color, edge, eo) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color }));
  mesh.scale.set(w, h, d);
  const lines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: eo }));
  lines.scale.set(w, h, d);
  g.add(mesh, lines);
  g.userData.mesh = mesh;
  return g;
}
function lights(s) {
  s.add(new THREE.AmbientLight(0xffffff, 1.5));
  const d = new THREE.DirectionalLight(0xffffff, 2.4);
  d.position.set(-4, 9, 6);
  s.add(d);
}
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ---------- hero: warehouse with six gates, the record crate rides the belt ---------- */
function hero() {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 2.4, 0.1, 100);
  lights(scene);
  const grid = new THREE.GridHelper(44, 44, 0xffffff, 0xffffff);
  grid.material.transparent = true; grid.material.opacity = 0.07;
  scene.add(grid);

  const gx = (k) => -7.6 + k * 3.04;
  const belt = crate(19.5, 0.18, 1.7, 0x0a4fa6, 0xffffff, 0.35);
  belt.position.set(0, 0.09, 2);
  scene.add(belt);

  const gates = [];
  for (let k = 0; k < 6; k++) {
    const g = new THREE.Group();
    g.position.set(gx(k), 0, 2);
    [-1.05, 1.05].forEach((z) => { const p = crate(0.12, 2.2, 0.12, 0x6fa8f0, 0xffffff, 0.5); p.position.set(0, 1.1, z); g.add(p); });
    const lintel = crate(0.14, 0.14, 2.3, 0x6fa8f0, 0xffffff, 0.5);
    lintel.position.set(0, 2.2, 0);
    g.add(lintel);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0x7fb0f0 }));
    light.position.set(0, 2.55, 0);
    g.add(light);
    g.userData.light = light;
    scene.add(g);
    gates.push(g);
  }

  const rand = rng(11);
  const palette = [0x0d6fe0, 0x0a56b0, 0x3a8cf0, 0x0c64c9];
  const inst = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 2 * 13 * 3);
  const m = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion();
  let n = 0;
  const pts = [];
  [-2.5, -4.6].forEach((z) => {
    for (let j = 0; j < 14; j++) { const x = -9.75 + j * 1.5; for (const dz of [-0.75, 0.75]) pts.push(x, 0, z + dz, x, 3.7, z + dz); }
    for (let l = 0; l < 4; l++) for (const dz of [-0.75, 0.75]) pts.push(-9.75, 0.1 + l * 1.15, z + dz, 11.25, 0.1 + l * 1.15, z + dz);
    for (let j = 0; j < 13; j++) {
      for (let l = 0; l < 3; l++) {
        const present = rand() > 0.28;
        m.compose(new THREE.Vector3(-9 + j * 1.5, 0.62 + l * 1.15, z), q, present ? new THREE.Vector3(1.12, 0.86, 1.2) : new THREE.Vector3(0, 0, 0));
        inst.setMatrixAt(n, m); inst.setColorAt(n, c.setHex(palette[(rand() * 4) | 0])); n++;
      }
    }
  });
  scene.add(inst);
  const frame = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
  scene.add(frame);

  const front = crate(20, 0.08, 1.2, 0x0a4fa6, 0xffffff, 0.3);
  front.position.set(0, 0.04, 5.6);
  scene.add(front);
  const drift = [];
  for (let i = 0; i < 5; i++) { const b = crate(0.9, 0.6, 0.9, 0x3a8cf0, 0xffffff, 0.55); b.position.set(-9 + i * 4.2, 0.38, 5.6); scene.add(b); drift.push(b); }

  const rec = crate(1.05, 0.8, 1.05, 0xf2f4f7, 0x0b1624, 0.5);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ color: 0x17a05d }));
  lab.position.set(0, 0.05, 0.53);
  rec.add(lab);
  scene.add(rec);

  const col = { pending: new THREE.Color(0x7fb0f0), processing: new THREE.Color(0xf2b01e), posted: new THREE.Color(0x17a05d) };
  const base = new THREE.Vector3(5.5, 7.2, 13);
  let cu = 0, fit = 1;
  return {
    scene, cam,
    layout(a) { fit = clamp(2.4 / a, 1, 3.2); },
    update(t, dt) {
      const f = window.__flow || { u: 0, states: [] };
      cu = reduce ? 5 : cu + (f.u - cu) * (1 - Math.exp(-dt * 5));
      const moving = Math.abs(cu - Math.round(cu)) > 0.04;
      rec.position.set(gx(0) + cu * 3.04, 0.18 + 0.4 + (moving ? Math.abs(Math.sin(t * 9)) * 0.03 : 0), 2);
      gates.forEach((g, k) => {
        const lt = g.userData.light;
        lt.material.color.lerp(col[(f.states[k]) || "pending"], reduce ? 1 : 0.14);
        const s = f.states[k] === "processing" ? 1 + Math.sin(t * 8) * 0.18 : 1;
        lt.scale.setScalar(s);
      });
      drift.forEach((b, i) => { b.position.x = ((((b.position.x - (reduce ? 0 : dt * 0.55)) + 10) % 20) + 20) % 20 - 10; });
      cam.position.set(base.x * fit + ptr.sx * 1.3 + (cu - 2.5) * 0.35, base.y * fit - ptr.sy * 0.7, base.z * fit);
      cam.lookAt((cu - 2.5) * 0.25, 0.6, 0.5);
    }
  };
}

/* ---------- profile: 20 crates for 20 modules, a posting wave runs through them ---------- */
function profile(canvas) {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1.9, 0.1, 100);
  cam.position.set(0, 2.3, 10.5);
  lights(scene);
  const grp = new THREE.Group();
  scene.add(grp);
  const blue = new THREE.Color(0x0a5fc4), green = new THREE.Color(0x17a05d);
  const items = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const cr = crate(1, 0.8, 0.9, 0x0a5fc4, 0x0b1624, 0.45);
    cr.position.set((c - 2) * 1.24, (3 - r) * 0.98 - 1.4, 0);
    cr.userData.home = cr.position.y;
    grp.add(cr);
    items.push(cr);
  }
  const slab = crate(7.2, 0.14, 1.5, 0xc4ccd6, 0x0b1624, 0.5);
  slab.position.set(0, -1.95, 0);
  grp.add(slab);
  const ndc = new THREE.Vector2(9, 9), ray = new THREE.Raycaster();
  canvas.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); });
  canvas.addEventListener("pointerleave", () => ndc.set(9, 9));
  return {
    scene, cam,
    update(t, dt) {
      grp.rotation.y = -0.5 + (reduce ? 0 : Math.sin(t * 0.35) * 0.22) + ptr.sx * 0.12;
      grp.rotation.x = 0.06;
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObjects(items.map((i) => i.userData.mesh))[0];
      const hov = hit && items.find((i) => i.userData.mesh === hit.object);
      const phase = (t * 5) % 28;
      items.forEach((it, i) => {
        const d = phase - i;
        const k = reduce ? (i % 4 === 0 ? 1 : 0) : d > 0 && d < 4 ? 1 - d / 4 : 0;
        it.userData.mesh.material.color.copy(blue).lerp(green, k);
        const ty = it.userData.home + (it === hov ? 0.28 : 0);
        it.position.y += (ty - it.position.y) * (reduce ? 1 : 1 - Math.exp(-dt * 10));
      });
      cam.lookAt(0, -0.3, 0);
    }
  };
}

/* ---------- contact: crates drop onto a pallet as the section arrives ---------- */
function contact(canvas) {
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 2, 0.1, 100);
  cam.position.set(0, 2.6, 13);
  cam.lookAt(0, 1.4, 0);
  lights(scene);
  const grp = new THREE.Group();
  scene.add(grp);
  const pallet = crate(3.4, 0.22, 2.5, 0x0a4a9c, 0xffffff, 0.6);
  pallet.position.y = 0.11;
  grp.add(pallet);
  const items = [];
  for (let l = 0; l < 3; l++) for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const cr = crate(0.98, 0.86, 1.05, 0x3b8cf0, 0xffffff, 0.7);
    cr.userData.rest = new THREE.Vector3((c - 1) * 1.06, 0.22 + 0.43 + l * 0.9, (r - 0.5) * 1.12);
    cr.visible = false;
    grp.add(cr);
    items.push(cr);
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.36), new THREE.MeshBasicMaterial({ color: 0x17a05d }));
  label.position.set(0, 0.0, 0.54);
  items[items.length - 2].add(label);
  let vw = 10, vh = 7;
  return {
    scene, cam,
    layout(a) {
      vh = 2 * 13 * Math.tan((30 * Math.PI) / 360); vw = vh * a;
      const wide = a > 1.15;
      grp.scale.setScalar(wide ? 0.8 : 0.5);
      grp.position.set(wide ? -vw * 0.3 : 0, wide ? -vh * 0.25 : -vh * 0.25, 0);
    },
    update(t) {
      const r = canvas.getBoundingClientRect();
      const c = reduce ? 1 : clamp((innerHeight - r.top) / (innerHeight * 0.8), 0, 1);
      const N = items.length;
      items.forEach((it, i) => {
        const k = clamp((c * (N + 4) - i) / 4, 0, 1);
        it.visible = k > 0;
        it.position.copy(it.userData.rest);
        it.position.y += (1 - ease(k)) * 6;
      });
      label.scale.setScalar(c > 0.98 ? 1 + Math.sin(t * 5) * 0.08 : 1);
      grp.rotation.y = -0.5 + (reduce ? 0 : Math.sin(t * 0.3) * 0.2) + ptr.sx * 0.15;
    }
  };
}

/* ---------- runtime ---------- */
const live = [];
function register(id, build) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const inst = build(canvas);
  inst.renderer = renderer; inst.vis = false;
  const draw = () => { inst.update(performance.now() / 1000, 1 / 60); renderer.render(inst.scene, inst.cam); };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    inst.cam.aspect = w / h;
    if (inst.layout) inst.layout(w / h);
    inst.cam.updateProjectionMatrix();
    if (reduce) draw();
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((es) => { inst.vis = es[0].isIntersecting; if (reduce && inst.vis) draw(); }, { rootMargin: "120px" }).observe(canvas);
  resize();
  canvas.classList.add("on");
  live.push(inst);
}

register("gl-hero", hero);
register("gl-profile", profile);
register("gl-contact", contact);

if (!reduce && live.length) {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ptr.sx += (ptr.x - ptr.sx) * 0.06; ptr.sy += (ptr.y - ptr.sy) * 0.06;
    for (const i of live) if (i.vis) { i.update(now / 1000, dt); i.renderer.render(i.scene, i.cam); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
