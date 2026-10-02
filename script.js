/**
 * MONSTER ENERGY — OBJECTIVE 3D EXPERIENCE
 * Modular Three.js + GSAP 3 Architecture
 */

// ==========================================
// 1. CAMPAIGN CONFIGURATION OBJECT (MODULAR)
// ==========================================
const campaigns = [
  {
    id: "original",
    name: "Original",
    tagline: "UNLEASH YOUR TRUE ENERGY",
    description: "Bold flavor. Maximum energy. Fuel your passion and push beyond limits with every sip.",
    color: "#a8ff00",
    rgb: "168, 255, 0",
    can: "assets/cans/original.png",
    canBg: "#0d1a00",
    particleCount: 150,
    particleSize: 0.12,
    fogDensity: 0.035,
    metallic: 0.85,
    roughness: 0.2
  },
  {
    id: "zero-sugar",
    name: "Zero Sugar",
    tagline: "ZERO SUGAR. 100% MONSTER.",
    description: "Pure electrical performance. Crisp, light citrus kick without a single calorie.",
    color: "#00e5ff",
    rgb: "0, 229, 255",
    can: "assets/cans/zero-sugar.png",
    canBg: "#001824",
    particleCount: 180,
    particleSize: 0.1,
    fogDensity: 0.04,
    metallic: 0.9,
    roughness: 0.15
  },
  {
    id: "ultra",
    name: "Ultra",
    tagline: "LIGHTER & REFRESHING",
    description: "Cold silver atmosphere. Frost-bite finish crafted for intense focus and peak physical agility.",
    color: "#e0e0e0",
    rgb: "224, 224, 224",
    can: "assets/cans/ultra.png",
    canBg: "#1a1a1a",
    particleCount: 200,
    particleSize: 0.08,
    fogDensity: 0.03,
    metallic: 0.95,
    roughness: 0.1
  },
  {
    id: "mango-loco",
    name: "Mango Loco",
    tagline: "HEAVENLY TROPICAL BLEND",
    description: "Explosive juice blend loaded with exotic mango aura and relentless Monster energy.",
    color: "#ff6b00",
    rgb: "255, 107, 0",
    can: "assets/cans/mango-loco.png",
    canBg: "#240e00",
    particleCount: 160,
    particleSize: 0.14,
    fogDensity: 0.038,
    metallic: 0.8,
    roughness: 0.25
  },
  {
    id: "pipeline-punch",
    name: "Pipeline Punch",
    tagline: "THE PERFECT STORM",
    description: "Passion fruit, orange, and guava surge into a vibrant pink swell of unstoppable power.",
    color: "#ff007a",
    rgb: "255, 0, 122",
    can: "assets/cans/pipeline-punch.png",
    canBg: "#240012",
    particleCount: 170,
    particleSize: 0.11,
    fogDensity: 0.036,
    metallic: 0.82,
    roughness: 0.22
  }
];

let currentCampaignIndex = 0;
let isTransitioning = false;

// ==========================================
// 2. THREE.JS SCENE SETUP
// ==========================================
let scene, camera, renderer;
let productGroup, canMesh, particleSystem, particleGeo, particleMat;
let keyLight, rimLight, pointLight, ambientLight;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function init3D() {
  const container = document.getElementById('stage');
  const canvas = document.getElementById('webgl');

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050505, campaigns[0].fogDensity);

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 7.5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(4, 5, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  rimLight = new THREE.DirectionalLight(new THREE.Color(campaigns[0].color), 3.5);
  rimLight.position.set(-5, 4, -4);
  scene.add(rimLight);

  pointLight = new THREE.PointLight(new THREE.Color(campaigns[0].color), 2.5, 10);
  pointLight.position.set(0, -1, 2);
  scene.add(pointLight);

  // Product Group
  productGroup = new THREE.Group();
  scene.add(productGroup);

  // Construct initial 3D Monster Can
  createCanMesh(campaigns[0]);

  // Particles & Ice Atmosphere
  createParticles(campaigns[0]);

  // Events
  window.addEventListener('resize', onWindowResize);
  container.addEventListener('mousemove', onMouseMove);
  
  // Touch support
  container.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      mouseX = ((touch.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -((touch.clientY - rect.top) / container.clientHeight) * 2 + 1;
    }
  });

  // Render loop
  animate();
}

// ==========================================
// 3. PROCEDURAL & PNG CAN MESH CREATOR
// ==========================================
function generateCanTexture(campaign) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, '#111111');
  grad.addColorStop(0.3, campaign.canBg);
  grad.addColorStop(0.7, '#080808');
  grad.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Metallic brushed texture lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < canvas.height; i += 4) {
    ctx.fillRect(0, i, canvas.width, 1);
  }

  // Neon stripes
  ctx.strokeStyle = campaign.color;
  ctx.lineWidth = 12;
  ctx.shadowColor = campaign.color;
  ctx.shadowBlur = 20;

  ctx.beginPath();
  ctx.moveTo(100, 0);
  ctx.lineTo(300, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(700, 0);
  ctx.lineTo(900, canvas.height);
  ctx.stroke();

  // Draw Iconic Monster Claw Marks (Claw Logo)
  ctx.shadowBlur = 30;
  ctx.fillStyle = campaign.color;
  
  // Slash 1
  ctx.beginPath();
  ctx.moveTo(460, 320);
  ctx.lineTo(485, 280);
  ctx.lineTo(510, 520);
  ctx.lineTo(475, 550);
  ctx.closePath();
  ctx.fill();

  // Slash 2
  ctx.beginPath();
  ctx.moveTo(520, 260);
  ctx.lineTo(550, 220);
  ctx.lineTo(570, 580);
  ctx.lineTo(535, 600);
  ctx.closePath();
  ctx.fill();

  // Slash 3
  ctx.beginPath();
  ctx.moveTo(580, 300);
  ctx.lineTo(605, 270);
  ctx.lineTo(625, 510);
  ctx.lineTo(595, 530);
  ctx.closePath();
  ctx.fill();

  // Typography Label
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MONSTER', 530, 680);

  ctx.fillStyle = campaign.color;
  ctx.font = '700 32px "Barlow Condensed", sans-serif';
  ctx.fillText(campaign.name.toUpperCase(), 530, 720);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '500 20px "Inter", sans-serif';
  ctx.fillText('ENERGY DRINK - 16 FL OZ', 530, 760);

  return new THREE.CanvasTexture(canvas);
}

function createCanMesh(campaign) {
  if (canMesh) productGroup.remove(canMesh);

  const canWrapper = new THREE.Group();

  // Cylinder Geometry for Can Body
  const geometry = new THREE.CylinderGeometry(1.05, 1.05, 3.8, 64);
  const texture = generateCanTexture(campaign);
  texture.wrapS = THREE.RepeatWrapping;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: campaign.metallic,
    roughness: campaign.roughness,
    envMapIntensity: 1.5
  });

  const body = new THREE.Mesh(geometry, material);
  body.castShadow = true;
  body.receiveShadow = true;
  canWrapper.add(body);

  // Top metallic rim & cap
  const capGeo = new THREE.CylinderGeometry(1.06, 1.0, 0.2, 64);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.95,
    roughness: 0.1
  });
  const topCap = new THREE.Mesh(capGeo, capMat);
  topCap.position.y = 1.95;
  canWrapper.add(topCap);

  // Bottom metallic rim
  const botGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.2, 64);
  const botCap = new THREE.Mesh(botGeo, botMat = capMat);
  botCap.position.y = -1.95;
  canWrapper.add(botCap);

  canMesh = canWrapper;
  canMesh.rotation.y = Math.PI * 0.2;
  productGroup.add(canMesh);
}

// ==========================================
// 4. ATMOSPHERIC PARTICLES
// ==========================================
function createParticles(campaign) {
  if (particleSystem) scene.remove(particleSystem);

  const count = campaign.particleCount;
  particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    scales[i] = Math.random();
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

  particleMat = new THREE.PointsMaterial({
    color: new THREE.Color(campaign.color),
    size: campaign.particleSize,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);
}

// ==========================================
// 5. ANIMATION & PARALLAX LOOP
// ==========================================
function onMouseMove(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;

  if (canMesh && !isTransitioning) {
    canMesh.rotation.y += 0.006;
    canMesh.rotation.x = targetY * 0.25;
    canMesh.position.y = Math.sin(Date.now() * 0.0018) * 0.15;
    canMesh.position.x = targetX * 0.3;
  }

  if (particleSystem) {
    particleSystem.rotation.y += 0.001;
    particleSystem.rotation.x = targetY * 0.1;
  }

  // Camera parallax
  camera.position.x = targetX * 0.5;
  camera.position.y = targetY * 0.5;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function onWindowResize() {
  const container = document.getElementById('stage');
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// ==========================================
// 6. CINEMATIC CAMPAIGN TRANSITION (GSAP 3)
// ==========================================
function switchCampaign(index) {
  if (index === currentCampaignIndex || isTransitioning) return;
  isTransitioning = true;

  const prevCampaign = campaigns[currentCampaignIndex];
  currentCampaignIndex = index;
  const nextCampaign = campaigns[currentCampaignIndex];

  // Update UI Active states
  document.querySelectorAll('.campaign-card').forEach((card, idx) => {
    card.classList.toggle('active', idx === index);
  });

  // GSAP Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      isTransitioning = false;
    }
  });

  // Step 1: Animate Current Can Out
  tl.to(canMesh.position, {
    z: -4,
    y: -2,
    duration: 0.6,
    ease: "power3.in"
  })
  .to(canMesh.rotation, {
    y: canMesh.rotation.y + Math.PI * 1.5,
    duration: 0.6,
    ease: "power3.in"
  }, 0)
  .to([keyLight, pointLight], {
    intensity: 0.1,
    duration: 0.4
  }, 0);

  // Step 2: Swap Environment & Recalculate
  tl.add(() => {
    // Swap 3D Can texture/mesh
    createCanMesh(nextCampaign);
    createParticles(nextCampaign);

    // Update lights
    rimLight.color.set(nextCampaign.color);
    pointLight.color.set(nextCampaign.color);
    scene.fog.color.set(0x050505);
    scene.fog.density = nextCampaign.fogDensity;

    // Update CSS Variables & DOM Text
    document.documentElement.style.setProperty('--accent-color', nextCampaign.color);
    document.documentElement.style.setProperty('--accent-rgb', nextCampaign.rgb);

    document.getElementById('campaignTag').textContent = nextCampaign.name.toUpperCase();
    document.getElementById('campaignTagline').textContent = nextCampaign.tagline;
    document.getElementById('campaignDescription').textContent = nextCampaign.description;
    document.getElementById('campaignNumber').textContent = `0${nextCampaign + 1}`;

    // Reset position off-screen
    canMesh.position.set(0, 3, -4);
    canMesh.rotation.y = 0;
  });

  // Step 3: Animate New Can In
  tl.to(canMesh.position, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.9,
    ease: "elastic.out(1, 0.75)"
  })
  .to(canMesh.rotation, {
    y: Math.PI * 0.2,
    duration: 0.9,
    ease: "power3.out"
  }, "-=0.9")
  .to(keyLight, { intensity: 2.0, duration: 0.5 }, "-=0.7")
  .to(pointLight, { intensity: 2.5, duration: 0.5 }, "-=0.7");

  // Step 4: Animate Typography Slide-In
  tl.fromTo("#heroTitle, #campaignDescription, .actions", 
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" },
    "-=0.6"
  );

  showToast(`ACTIVATED ${nextCampaign.name.toUpperCase()} ATMOSPHERE`);
}

// ==========================================
// 7. CARDS & UI INITIALIZATION
// ==========================================
function renderCampaignCards() {
  const grid = document.getElementById('campaignGrid');
  grid.innerHTML = '';

  campaigns.forEach((camp, idx) => {
    const card = document.createElement('div');
    card.className = `campaign-card ${idx === 0 ? 'active' : ''}`;
    card.style.setProperty('--card-color', camp.color);
    card.style.setProperty('--card-rgb', camp.rgb);

    card.innerHTML = `
      <span class="card-num">0${idx + 1}</span>
      <div class="card-preview" id="cardPreview_${idx}"></div>
      <h3>${camp.name}</h3>
      <span>EXPLORE ATMOSPHERE →</span>
    `;

    card.addEventListener('click', () => switchCampaign(idx));
    grid.appendChild(card);

    // Render static thumbnail canvas inside card
    setTimeout(() => {
      const thumbCanvas = generateCardThumbnail(camp);
      const container = document.getElementById(`cardPreview_${idx}`);
      if (container) container.appendChild(thumbCanvas);
    }, 50);
  });
}

function generateCardThumbnail(camp) {
  const tex = generateCanTexture(camp);
  const canvas = tex.image;
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "140px";
  return canvas;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function initUI() {
  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 800);

  // Custom Cursor
  const cursor = document.getElementById('cursorFollower');
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });

  // Replay animation button
  document.getElementById('replayBtn').addEventListener('click', () => {
    gsap.fromTo(canMesh.rotation, 
      { y: canMesh.rotation.y },
      { y: canMesh.rotation.y + Math.PI * 2, duration: 1.2, ease: "expo.inOut" }
    );
  });

  // Video Reel button
  document.getElementById('videoBtn').addEventListener('click', () => {
    showToast("CINEMATIC REEL LOADING...");
  });

  // Cart Counter increment
  document.querySelectorAll('.shop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = document.getElementById('cartCount');
      cart.textContent = parseInt(cart.textContent) + 1;
      showToast("ADDED TO CART");
    });
  });
}

// ==========================================
// 8. BOOTSTRAP
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  renderCampaignCards();
  init3D();
  initUI();
});
