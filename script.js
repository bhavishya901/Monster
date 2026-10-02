import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

const campaigns = [
  {name:"ORIGINAL", color:"#A8FF00", can:"original.png", desc:"Bold flavor. Maximum energy. Fuel your passion and push beyond limits with every sip.", mood:"GREEN"},
  {name:"ZERO SUGAR", color:"#20A9FF", can:"zero-sugar.png", desc:"Electric energy with a crisp, zero-sugar attitude. Cold, sharp and relentlessly focused.", mood:"ICE"},
  {name:"ULTRA", color:"#F2F5F3", can:"ultra.png", desc:"A clean, light profile with an ultra-cold visual atmosphere built around silver and white.", mood:"SILVER"},
  {name:"MANGO LOCO", color:"#FF7A18", can:"mango-loco.png", desc:"Tropical intensity meets mango flavor in a warm, explosive campaign atmosphere.", mood:"MANGO"},
  {name:"PIPELINE PUNCH", color:"#FF4FA3", can:"pipeline-punch.png", desc:"A fruit-forward punch wrapped in pink energy, purple light and high-impact motion.", mood:"PINK"}
];

const root = document.documentElement;
const hero = document.querySelector(".hero");
const stage = document.querySelector("#stage");
const img = document.querySelector("#productImage");
const shell = document.querySelector("#productShell");
const grid = document.querySelector("#campaignGrid");
const tag = document.querySelector("#campaignTag");
const desc = document.querySelector("#campaignDescription");
const number = document.querySelector("#campaignNumber");
const toast = document.querySelector("#toast");
let active = 0, transitioning = false, mouseX=0, mouseY=0, targetX=0, targetY=0;

function setAccent(c){ root.style.setProperty("--accent",c); hero.querySelector(".hero-bg").style.setProperty("--accent",c); }

function fallbackImage(){
  // Creates a premium procedural can silhouette if the user's supplied image is not present.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 620">
  <defs><linearGradient id="m" x1="0" x2="1"><stop stop-color="#151515"/><stop offset=".45" stop-color="#454545"/><stop offset=".55" stop-color="#0b0b0b"/><stop offset="1" stop-color="#2c2c2c"/></linearGradient></defs>
  <rect x="25" y="8" width="170" height="604" rx="38" fill="url(#m)" stroke="#aaa" stroke-width="2"/>
  <ellipse cx="110" cy="16" rx="84" ry="10" fill="#999"/><ellipse cx="110" cy="16" rx="70" ry="6" fill="#333"/>
  <path d="M78 155l28-48 9 39 29-55-7 68 28-28-22 61-23-31-18 48z" fill="${campaigns[active].color}"/>
  <text x="110" y="335" fill="#eee" font-size="44" font-family="Arial Black" text-anchor="middle" transform="rotate(-90 110 335)">MONSTER</text>
  <text x="110" y="380" fill="${campaigns[active].color}" font-size="13" font-family="Arial" font-weight="bold" text-anchor="middle">ENERGY</text>
  </svg>`;
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
img.addEventListener("error", fallbackImage);

function renderCards(){
  grid.innerHTML = campaigns.map((c,i)=>`
    <article class="campaign-card ${i===active?"active":""}" data-index="${i}" style="--card-accent:${c.color}">
      <div class="card-no">0${i+1} / ${c.mood}</div>
      <div class="card-name">${c.name}</div>
      <div class="card-can"><img src="assets/cans/${c.can}" alt="${c.name} can"></div>
      <div class="card-foot"><span>SELECT CAMPAIGN</span><b class="card-arrow">↗</b></div>
    </article>`).join("");
  grid.querySelectorAll(".campaign-card").forEach(card=>{
    card.addEventListener("click",()=>switchCampaign(+card.dataset.index));
    const ci=+card.dataset.index;
    card.querySelector("img").addEventListener("error",e=>{e.currentTarget.src=makeMiniCan(campaigns[ci].color)});
  });
}
function makeMiniCan(color){
  const s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 300"><defs><linearGradient id="g"><stop stop-color="#111"/><stop offset=".5" stop-color="#555"/><stop offset="1" stop-color="#111"/></linearGradient></defs><rect x="15" y="3" width="90" height="294" rx="20" fill="url(#g)" stroke="#777"/><path d="M42 85l15-27 5 24 15-30-4 38 14-13-11 35-12-18-10 28z" fill="${color}"/><text x="60" y="175" fill="#eee" font-size="18" font-family="Arial Black" text-anchor="middle" transform="rotate(-90 60 175)">MONSTER</text></svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);
}

async function switchCampaign(next){
  if(next===active || transitioning)return;
  transitioning=true;
  const old=campaigns[active], fresh=campaigns[next];
  const tl=gsap.timeline({defaults:{ease:"power3.inOut"}});
  tl.to(shell,{duration:.38,x:110,z:-160,rotationZ:10,scale:.78,opacity:0})
    .to(".hero-bg",{duration:.65,opacity:0},0)
    .to(".can-glow",{duration:.45,opacity:0},0)
    .call(()=>{active=next;setAccent(fresh.color);tag.textContent=fresh.name;desc.textContent=fresh.desc;number.textContent=`0${next+1}`;img.src=`assets/cans/${fresh.can}`;renderCards();fallbackImageIfNeeded();})
    .set(shell,{x:-110,rotationZ:-10,scale:.78})
    .to(".hero-bg",{duration:.75,opacity:.16},.55)
    .to(shell,{duration:.8,x:0,z:0,rotationZ:0,scale:1,opacity:1,ease:"expo.out"})
    .to(".can-glow",{duration:.7,opacity:.25},.62)
    .fromTo(".hero-copy h1",{y:12,opacity:.4},{y:0,opacity:1,duration:.55},.6)
    .add(()=>transitioning=false);
}
function fallbackImageIfNeeded(){ setTimeout(()=>{if(!img.complete || img.naturalWidth===0)fallbackImage()},80); }

renderCards(); setAccent(campaigns[0].color); fallbackImageIfNeeded();

const canvas=document.querySelector("#webgl");
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(stage.clientWidth,stage.clientHeight,false);
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x050805,.045);
const camera=new THREE.PerspectiveCamera(38,stage.clientWidth/stage.clientHeight,.1,100); camera.position.set(0,0,7);

const productGroup=new THREE.Group(); scene.add(productGroup);
const core=new THREE.Mesh(new THREE.SphereGeometry(.08,16,16),new THREE.MeshBasicMaterial({color:0xffffff}));
productGroup.add(core);

const ambient=new THREE.AmbientLight(0xffffff,.35); scene.add(ambient);
const key=new THREE.DirectionalLight(0xffffff,2.5); key.position.set(3,4,5); scene.add(key);
const rim=new THREE.PointLight(0xA8FF00,8,12); rim.position.set(-3,1,2); scene.add(rim);
const fill=new THREE.PointLight(0x3355ff,3,10); fill.position.set(3,-1,3); scene.add(fill);

const particleCount=650;
const positions=new Float32Array(particleCount*3);
for(let i=0;i<particleCount;i++){positions[i*3]=(Math.random()-.5)*9;positions[i*3+1]=(Math.random()-.5)*8;positions[i*3+2]=(Math.random()-.5)*5;}
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xA8FF00,size:.018,transparent:true,opacity:.7}));
scene.add(particles);

const rings=new THREE.Group(); scene.add(rings);
for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1.6+i*.45,.006,8,160),new THREE.MeshBasicMaterial({color:0xA8FF00,transparent:true,opacity:.18}));r.rotation.x=1.15;r.rotation.z=i*.5;rings.add(r);}

function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
addEventListener("resize",resize);
document.addEventListener("mousemove",e=>{
  mouseX=(e.clientX/innerWidth-.5); mouseY=(e.clientY/innerHeight-.5);
  targetX=mouseX;targetY=mouseY;
  document.querySelector(".cursor").style.left=e.clientX+"px";document.querySelector(".cursor").style.top=e.clientY+"px";
  document.querySelector(".cursor-dot").style.left=e.clientX+"px";document.querySelector(".cursor-dot").style.top=e.clientY+"px";
});
function animate(t){
  requestAnimationFrame(animate);
  const time=t*.001;
  productGroup.rotation.y += .003;
  productGroup.rotation.x = Math.sin(time*.6)*.035;
  productGroup.position.y = Math.sin(time*1.1)*.06;
  particles.rotation.y=time*.018;
  particles.rotation.x=Math.sin(time*.2)*.08;
  rings.rotation.z=time*.035;
  rim.intensity=6+Math.sin(time*2)*1.5;
  camera.position.x += ((targetX*.42)-camera.position.x)*.035;
  camera.position.y += ((-targetY*.28)-camera.position.y)*.035;
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
}
animate(0);

function updateLights(color){
  rim.color.set(color);
  particles.material.color.set(color);
  rings.children.forEach(r=>r.material.color.set(color));
}
const originalSwitch=switchCampaign;
window.switchCampaign=(n)=>{updateLights(campaigns[n].color);return originalSwitch(n)};
document.querySelectorAll(".campaign-card").forEach(()=>{});
const observer=new MutationObserver(()=>{grid.querySelectorAll(".campaign-card").forEach(card=>card.addEventListener("click",()=>window.switchCampaign(+card.dataset.index),{once:true}))});
observer.observe(grid,{childList:true});

document.querySelector("#replayBtn").addEventListener("click",()=>{
  gsap.timeline().to(shell,{duration:.35,scale:.82,rotationY:180,ease:"power2.in"}).to(shell,{duration:.7,scale:1,rotationY:360,ease:"elastic.out(1,.55)"});
});
document.querySelector("#videoBtn").addEventListener("click",()=>{toast.innerHTML="VIDEO SLOT READY — ADD YOUR REEL TO <b>assets/energy-reel.mp4</b>";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2800)});
document.querySelector(".shop-btn").addEventListener("click",()=>{toast.textContent="SHOP LINK READY — CONNECT YOUR STORE URL";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2200)});

document.querySelectorAll(".magnetic").forEach(el=>el.addEventListener("mousemove",e=>{const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.3})}));
document.querySelectorAll(".magnetic").forEach(el=>el.addEventListener("mouseleave",()=>gsap.to(el,{x:0,y:0,duration:.4})));

document.addEventListener("visibilitychange",()=>{if(document.hidden){}});
window.addEventListener("load",()=>setTimeout(()=>document.querySelector("#loader").classList.add("hide"),900));
