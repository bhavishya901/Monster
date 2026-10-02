import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* ============ CAMPAIGN CONFIG — edit here ============ */
const campaigns = [
  { name: "ORIGINAL", color: "#A8FF00", can: "original.webp", description: "Bold flavor. Maximum energy." },
  { name: "ZERO SUGAR", color: "#20A9FF", can: "zero-sugar.webp", description: "Crisp energy without sugar.", ice: true },
  { name: "ULTRA", color: "#F2F5F3", can: "ultra.webp", description: "Clean. Cold. Ultra.", ice: true },
  { name: "MANGO LOCO", color: "#FF7A18", can: "mango-loco.webp", description: "Tropical mango intensity." },
  { name: "PIPELINE PUNCH", color: "#FF4FA3", can: "pipeline-punch.webp", description: "Fruit punch energy." }
];
const CAN_DIR = "assets/cans/";

/* ============ DOM REFERENCES ============ */
const $ = (s, r = document) => r.querySelector(s);
const gsap = window.gsap;
const loader = $("#loader"), stage = $("#stage"), canvas = $("#webgl"), grid = $("#campaignGrid");
const tag = $("#campaignTag"), desc = $("#campaignDescription"), num = $("#campaignNumber");
const toast = $("#toast"), fallbackImg = $("#productImage");
const isTouch = matchMedia("(hover:none)").matches;
const isMobile = innerWidth < 800 || isTouch;
const root = document.documentElement;

/* ============ CAMPAIGN SYSTEM (UI) ============ */
campaigns.forEach((c, i) => {
  const b = document.createElement("button");
  b.className = "card"; b.style.setProperty("--cc", c.color);
  b.setAttribute("aria-label", `Select ${c.name}`);
  b.innerHTML = `<span class="n">0${i + 1}</span><span class="thumb"><img alt="${c.name} can" src="${CAN_DIR + c.can}"></span><b>${c.name}</b><small>${c.description}</small><i>↗</i>`;
  $("img", b).onerror = (e) => e.target.replaceWith(Object.assign(document.createElement("span"), { className: "mini-can" }));
  b.onclick = () => select(i);
  grid.append(b);
});
const cards = [...grid.children];
let current = 0, busy = false;
const env = { color: new THREE.Color(campaigns[0].color) }; // single shared colour, tweened by GSAP
root.style.setProperty("--c", campaigns[0].color);

function showToast(msg) {
  toast.innerHTML = msg; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4200);
}
function setText(i) {
  const c = campaigns[i];
  tag.textContent = c.name; desc.textContent = c.description; num.textContent = "0" + (i + 1);
  cards.forEach((k, n) => k.classList.toggle("on", n === i));
  root.style.setProperty("--c", c.color);
  fallbackImg.alt = `Monster ${c.name} energy drink can`;
}

/* ============ THREE.JS INITIALIZATION ============ */
let renderer, scene, camera, product, slots = [], baseZ = 8.6;
const rig = { z: 8.6 }, fx = { light: 1, liquid: 1, ice: 0, p: 1 };
const mouse = { x: 0, y: 0 }, look = { x: 0, y: 0 };
let webgl = true;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
} catch (e) { webgl = false; document.body.classList.add("no-webgl"); }

const texLoader = new THREE.TextureLoader();
const loadTex = (url) => new Promise((res) => texLoader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(null)));
const dot = (inner, outer) => { const k = document.createElement("canvas"); k.width = k.height = 64; const x = k.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(k); };
const tint = (obj, k = 1) => obj.color.copy(env.color).multiplyScalar(k);

let rim, point, accent, key, rings = [], liquid, ice, shadow, layers = [];

if (webgl) {
  renderer.setClearColor(0x000000, 0);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, 0.035);
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  product = new THREE.Group(); scene.add(product);

  // Studio reflection map (soft-boxes) so the metal reads as metal
  const ec = document.createElement("canvas"); ec.width = 512; ec.height = 256;
  const ex = ec.getContext("2d"), eg = ex.createLinearGradient(0, 0, 0, 256);
  eg.addColorStop(0, "#2a2a2a"); eg.addColorStop(.5, "#060606"); eg.addColorStop(1, "#151515");
  ex.fillStyle = eg; ex.fillRect(0, 0, 512, 256); ex.fillStyle = "#fff";
  [[50, 60, 40, 130], [250, 50, 18, 140], [390, 80, 64, 100]].forEach((r) => ex.fillRect(...r));
  const et = new THREE.CanvasTexture(ec); et.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(et).texture; pm.dispose();

  /* ============ LIGHTING ============ */
  scene.add(new THREE.AmbientLight(0x404050, 0.35));
  key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 5); scene.add(key);
  rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(4, 2, -3); scene.add(rim);
  point = new THREE.PointLight(0xffffff, 30, 14); point.position.set(0, .2, -2.6); scene.add(point);
  accent = new THREE.PointLight(0xffffff, 12, 12); accent.position.set(-3, -1.2, 2); scene.add(accent);

  /* ============ PARTICLES (BufferGeometry / Points, two size layers) ============ */
  const sprite = dot("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  [[isMobile ? 110 : 280, .06], [isMobile ? 40 : 90, .13]].forEach(([n, size]) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 15; pos[i * 3 + 1] = (Math.random() - .5) * 9; pos[i * 3 + 2] = -5 + Math.random() * 7; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ size, map: sprite, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
    p.userData.size = size; scene.add(p); layers.push(p);
  });

  /* ============ RINGS ============ */
  rings = [[1.9, .012, .55, .25], [2.5, .008, .38, -.18], [3.2, .006, .22, .1]].map(([r, t, o, s], i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, isMobile ? 64 : 140), new THREE.MeshBasicMaterial({ transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.position.z = -1.4 - i * .6; m.rotation.x = 1 + i * .3; m.userData = { s, o }; scene.add(m); return m;
  });

  /* ============ LIQUID-ENERGY SHADER BACKDROP ============ */
  liquid = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { t: { value: 0 }, c: { value: env.color }, k: { value: 1 } },
    vertexShader: "varying vec2 v;void main(){v=uv-.5;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 v;uniform float t,k;uniform vec3 c;void main(){float r=length(v),a=atan(v.y,v.x);
      float w=.27+.035*sin(a*5.+t)+.02*sin(a*9.-t*1.7)+.015*sin(a*14.+t*2.3);
      float e=smoothstep(.035,0.,abs(r-w));float g=exp(-r*5.5)*.5;
      float d=smoothstep(.02,0.,abs(r-w-.05-.03*sin(a*7.-t*2.)))*.5*step(.6,sin(a*11.+t));
      gl_FragColor=vec4(c*(e*1.2+g+d)*k,1.);}`
  }));
  liquid.position.z = -2.4; scene.add(liquid);

  /* ============ ICE (Zero Sugar / Ultra) ============ */
  ice = new THREE.Group();
  const iceMat = new THREE.MeshStandardMaterial({ color: 0xcfefff, metalness: .1, roughness: .05, transparent: true, opacity: 0 });
  const iceGeo = new THREE.OctahedronGeometry(1, 0);
  for (let i = 0; i < (isMobile ? 8 : 16); i++) {
    const m = new THREE.Mesh(iceGeo, iceMat), a = Math.random() * 6.28, r = 1.6 + Math.random() * 1.8;
    m.position.set(Math.cos(a) * r, (Math.random() - .5) * 3.4, Math.sin(a) * r * .5 - .5);
    m.scale.setScalar(.04 + Math.random() * .09); m.userData.s = (Math.random() - .5) * 1.4; ice.add(m);
  }
  ice.userData.mat = iceMat; scene.add(ice);

  /* ============ SOFT SHADOW ============ */
  shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: dot("rgba(0,0,0,.9)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false, fog: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.95; scene.add(shadow);
}

/* ============ PRODUCT (image render or procedural fallback) ============ */
function labelTexture(c) {
  const k = document.createElement("canvas"); k.width = k.height = 1024; const x = k.getContext("2d");
  for (let s = 0; s < 2; s++) { // tile twice so the label wraps the whole can
    x.save(); x.translate(s * 512, 0);
    const g = x.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, "#040404"); g.addColorStop(.5, "#181818"); g.addColorStop(1, "#040404");
    x.fillStyle = g; x.fillRect(0, 0, 512, 1024); x.fillStyle = c.color;
    for (let i = 0; i < 3; i++) { const o = 150 + i * 72; x.beginPath(); x.moveTo(o, 230); x.lineTo(o + 46, 230); x.lineTo(o + 96, 760); x.lineTo(o + 46, 760); x.fill(); }
    x.fillRect(0, 120, 512, 10); x.fillRect(0, 900, 512, 10);
    x.fillStyle = "#fff"; x.textAlign = "center";
    x.font = "900 120px 'Barlow Condensed',Impact,sans-serif"; x.fillText("MONSTER", 256, 860);
    x.font = "700 52px 'Barlow Condensed',Impact,sans-serif"; x.fillStyle = c.color; x.fillText(c.name, 256, 985);
    x.restore();
  }
  const t = new THREE.CanvasTexture(k); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function buildCan(c, tex) {
  const g = new THREE.Group();
  if (tex) { // user-supplied transparent render → lit-looking billboard plane
    const h = 3.5, w = h * (tex.image.width / tex.image.height);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false }));
    g.add(m); return { g, spin: false, x: 0, z: 0, s: 1, off: 0 };
  }
  const seg = isMobile ? 32 : 56, inner = new THREE.Group();
  inner.add(new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 2.2, seg, 1, true), new THREE.MeshStandardMaterial({ map: labelTexture(c), metalness: .75, roughness: .28 })));
  const metal = new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 1, roughness: .22 });
  const prof = [[.62, 1.1], [.6, 1.2], [.5, 1.3], [.46, 1.32], [.46, 1.37], [.38, 1.37], [.38, 1.32], [0, 1.32]];
  const lathe = (sign) => new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y * sign)), seg), metal);
  inner.add(lathe(1), lathe(-1)); inner.scale.setScalar(1.25); g.add(inner);
  return { g, spin: true, x: 0, z: 0, s: 1, off: 0 };
}

/* ============ PRODUCT ANIMATION (render loop) ============ */
let raf = 0, last = 0, T = 0, onScreen = true, active = null;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  look.x += (mouse.x - look.x) * .05; look.y += (mouse.y - look.y) * .05; // lerp parallax
  camera.position.set(look.x * .8, look.y * .45, rig.z); camera.lookAt(0, 0, 0);
  product.position.y = Math.sin(T * 1.2) * .09 - .05;
  product.rotation.x = -look.y * .16; product.rotation.z = look.x * .05;
  for (const s of slots) if (s && s.g.parent) {
    s.g.position.set(s.x, 0, s.z); s.g.scale.setScalar(s.s);
    s.g.rotation.y = s.off + (s.spin ? T * .38 : Math.sin(T * .45) * .3 + look.x * .25);
  }
  const sh = 1 - product.position.y * 1.2; shadow.scale.set(sh, sh, sh); shadow.material.opacity = .75 * sh;
  tint(rim, 1); rim.intensity = 3.2 * fx.light; tint(point, 1); point.intensity = 30 * fx.light; tint(accent, .8); accent.intensity = 12 * fx.light;
  scene.fog.color.copy(env.color).multiplyScalar(.1);
  rings.forEach((r, i) => { r.rotation.z += r.userData.s * dt; r.rotation.y += r.userData.s * .4 * dt; r.material.color.copy(env.color); r.material.opacity = r.userData.o * fx.light * (1 + .15 * Math.sin(T + i)); });
  liquid.material.uniforms.t.value = T; liquid.material.uniforms.k.value = fx.liquid;
  layers.forEach((p, i) => { p.material.color.copy(env.color); p.material.opacity = .8 * fx.p; p.rotation.y = T * .02 * (i + 1) + look.x * .08; p.position.y = Math.sin(T * .3 + i) * .15 - look.y * .2; });
  ice.userData.mat.opacity = .6 * fx.ice; if (fx.ice > .01) ice.children.forEach((m) => { m.rotation.x += m.userData.s * dt; m.rotation.y += m.userData.s * dt; });
  ice.rotation.y = T * .06;
  renderer.render(scene, camera);
}

/* ============ CAMPAIGN TRANSITION ============ */
function swapText(i) {
  gsap.timeline().to([tag, desc, num], { y: -14, opacity: 0, duration: .3, ease: "power2.in" })
    .add(() => setText(i)).fromTo([tag, desc, num], { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .06, ease: "expo.out" });
}
function select(i) {
  if (i === current || busy) return;
  const c = campaigns[i], dir = i > current ? 1 : -1; busy = true;
  if (!webgl) { // CSS fallback path: still a staged transition
    gsap.to(fallbackImg, { opacity: 0, scale: .9, duration: .3, onComplete: () => { fallbackImg.src = CAN_DIR + c.can; gsap.to(fallbackImg, { opacity: 1, scale: 1, duration: .7, ease: "expo.out" }); busy = false; } });
    swapText(i); current = i; return;
  }
  const out = active, inc = slots[i], tl = gsap.timeline({ onComplete: () => { busy = false; } });
  swapText(i);
  tl.to(out, { off: out.off + .9, z: -3.2, s: .55, x: -2.4 * dir, duration: .8, ease: "power3.inOut" }, 0)   // rotate, move back, scale down
    .to(fx, { light: .1, liquid: .1, p: .15, duration: .6, ease: "power2.inOut" }, 0)                       // lights, liquid, particles fade
    .to(rig, { z: baseZ - 1, duration: .8, ease: "power3.inOut" }, 0)
    .addLabel("swap", .6)
    .add(() => { product.remove(out.g); Object.assign(inc, { x: 2.8 * dir, z: -3.2, s: .55, off: -1.4 }); product.add(inc.g); active = inc; current = i; }, "swap")
    .to(env.color, { r: new THREE.Color(c.color).r, g: new THREE.Color(c.color).g, b: new THREE.Color(c.color).b, duration: 1.1, ease: "power2.inOut" }, "swap-=.4") // bg/fog/lights/rings colour morph
    .to(fx, { ice: c.ice ? 1 : 0, duration: 1, ease: "power2.inOut" }, "swap")
    .to(inc, { x: 0, z: 0, off: 0, duration: 1.1, ease: "expo.out" }, "swap+=.02")
    .to(inc, { s: 1, duration: 1.2, ease: "elastic.out(1,.65)" }, "swap+=.02")
    .to(fx, { light: 1, liquid: 1, p: 1, duration: 1, ease: "power2.out" }, "swap+=.15")
    .to(rig, { z: baseZ, duration: 1.1, ease: "expo.out" }, "swap");
}
function intro() { // used on load and by REPLAY
  const s = active; if (!s) return;
  Object.assign(s, { z: -4, s: .4, off: -2.2 });
  gsap.to(s, { z: 0, s: 1, off: 0, duration: 1.8, ease: "expo.out" });
  gsap.fromTo(rig, { z: baseZ + 1.6 }, { z: baseZ, duration: 2.2, ease: "expo.out" });
}

/* ============ MOUSE INTERACTION ============ */
addEventListener("pointermove", (e) => { mouse.x = (e.clientX / innerWidth - .5) * 2; mouse.y = -(e.clientY / innerHeight - .5) * 2; }, { passive: true });
addEventListener("deviceorientation", (e) => { if (e.gamma != null) { mouse.x = Math.max(-1, Math.min(1, e.gamma / 30)); mouse.y = Math.max(-1, Math.min(1, (e.beta - 45) / -40)); } }, { passive: true });

/* ============ RESPONSIVE SYSTEM ============ */
function resize() {
  if (!webgl) return;
  const { width: w, height: h } = stage.getBoundingClientRect(); if (!w || !h) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.5));
  renderer.setSize(w, h, false); camera.aspect = w / h;
  baseZ = camera.aspect < .9 ? 11 : camera.aspect < 1.4 ? 9.6 : 8.6; rig.z = baseZ;
  camera.updateProjectionMatrix();
}

/* ============ PERFORMANCE SYSTEM ============ */
function sync() {
  if (!webgl) return;
  const run = onScreen && !document.hidden;
  if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
}

/* ============ GSAP ANIMATIONS / UX ============ */
function initUX() {
  if (!isTouch) { // custom cursor
    document.body.classList.add("has-cursor");
    const ring = $(".cursor"), dotEl = $(".cursor-dot"); gsap.set([ring, dotEl], { xPercent: -50, yPercent: -50 });
    const rx = gsap.quickTo(ring, "x", { duration: .4, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: .4, ease: "power3" });
    const dx = gsap.quickTo(dotEl, "x", { duration: .08 }), dy = gsap.quickTo(dotEl, "y", { duration: .08 });
    addEventListener("pointermove", (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", (e) => ring.classList.toggle("hot", !!e.target.closest("a,button")));
  }
  document.querySelectorAll(".magnetic").forEach((el) => { // magnetic buttons
    if (isTouch) return;
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, scale: 1.05, duration: .4, ease: "power3.out" }); });
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, scale: 1, duration: .8, ease: "elastic.out(1,.4)" }));
  });
  const bar = $(".topbar"); addEventListener("scroll", () => bar.classList.toggle("scrolled", scrollY > 40), { passive: true });
  const mb = $(".menu-btn"); mb.onclick = () => { const o = document.body.classList.toggle("menu-open"); mb.setAttribute("aria-expanded", o); };
  document.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  $("#replayBtn").onclick = () => { if (webgl) intro(); gsap.from([".hero h1 span", ".hero h1 em"], { yPercent: 40, opacity: 0, stagger: .1, duration: 1, ease: "expo.out" }); };
  $("#videoBtn").onclick = () => { // optional reel, never required
    const card = $(".video-card"); if ($("video", card)) return;
    const v = Object.assign(document.createElement("video"), { src: "assets/videos/energy-reel.mp4", controls: true, playsInline: true });
    v.onerror = () => { v.remove(); showToast("ADD YOUR REEL AT <b>assets/videos/energy-reel.mp4</b>"); };
    v.oncanplay = () => { card.classList.add("playing"); v.play(); };
    card.append(v);
  };
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".section-head, .campaign-grid, .statement h2, .video-card, .gallery-copy").forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    gsap.to(".statement-number", { yPercent: -35, ease: "none", scrollTrigger: { trigger: ".statement", scrub: true } });
  }
  gsap.from([".hero-copy > *", ".feature-panel > *"], { y: 36, opacity: 0, stagger: .07, duration: 1.2, ease: "expo.out", delay: .3 });
}

/* ============ BOOT ============ */
async function boot() {
  setText(0);
  const t0 = performance.now(); let missing = 0;
  if (webgl) {
    try { await document.fonts.ready; } catch (e) {}
    const textures = await Promise.all(campaigns.map((c) => loadTex(CAN_DIR + c.can)));
    textures.forEach((t, i) => { if (!t) missing++; slots[i] = buildCan(campaigns[i], t); });
    active = slots[0]; product.add(active.g); resize();
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(stage);
    document.addEventListener("visibilitychange", sync);
    addEventListener("pagehide", () => { renderer.dispose(); });
    sync();
  } else {
    fallbackImg.onerror = () => { fallbackImg.style.display = "none"; };
  }
  await new Promise((r) => setTimeout(r, Math.max(0, 1100 - (performance.now() - t0))));
  loader.classList.add("done"); initUX(); if (webgl) intro();
  if (missing) setTimeout(() => showToast(`USING PROCEDURAL CANS — ADD CAN IMAGES TO <b>${CAN_DIR}</b>`), 2200);
}
boot().catch((e) => { console.error(e); loader.classList.add("done"); });
