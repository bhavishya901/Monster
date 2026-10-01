const campaigns = [
  // 🟢 ORIGINAL — replace CAN + COLOR here
  {id:'original', name:'Original', short:'ORIGINAL', tag:'ORIGINAL CAMPAIGN',
   description:'A cinematic energy-drink experience built around motion, color and attitude.',
   number:'01',
   accent:'#a8ff00',       // ← COLOR: replace this HEX
   rgb:'168,255,0',        // ← same color in RGB
   file:'assets/cans/original.svg', // ← replace this CAN file
   label:'CLASSIC ENERGY'},

  // 🔵 ZERO SUGAR — replace CAN + COLOR here
  {id:'zero', name:'Zero Sugar', short:'ZERO SUGAR', tag:'ZERO SUGAR CAMPAIGN',
   description:'A cold electric-blue atmosphere with a sharper, cleaner visual personality.',
   number:'02',
   accent:'#18c8ff',       // ← COLOR: replace this HEX
   rgb:'24,200,255',        // ← same color in RGB
   file:'assets/cans/zero.svg',     // ← replace this CAN file
   label:'BLUE ENERGY'},

  // ⚪ ULTRA — replace CAN + COLOR here
  {id:'ultra', name:'Ultra', short:'ULTRA', tag:'ULTRA CAMPAIGN',
   description:'A silver-white futuristic environment focused on clean contrast and precision.',
   number:'03',
   accent:'#e7edf5',       // ← COLOR: replace this HEX
   rgb:'231,237,245',       // ← same color in RGB
   file:'assets/cans/ultra.svg',    // ← replace this CAN file
   label:'PURE ENERGY'},

  // 🟠 MANGO LOCO — replace CAN + COLOR here
  {id:'mango', name:'Mango Loco', short:'MANGO LOCO', tag:'MANGO LOCO CAMPAIGN',
   description:'A warm orange atmosphere engineered to feel tropical, loud and explosive.',
   number:'04',
   accent:'#ff8a00',       // ← COLOR: replace this HEX
   rgb:'255,138,0',         // ← same color in RGB
   file:'assets/cans/mango.svg',    // ← replace this CAN file
   label:'TROPICAL ENERGY'},

  // 🩷 PIPELINE PUNCH — replace CAN + COLOR here
  {id:'pipeline', name:'Pipeline Punch', short:'PIPELINE PUNCH', tag:'PIPELINE CAMPAIGN',
   description:'A vivid pink atmosphere with a bold, playful and premium visual attitude.',
   number:'05',
   accent:'#ff4fa6',       // ← COLOR: replace this HEX
   rgb:'255,79,166',       // ← same color in RGB
   file:'assets/cans/pipeline.svg', // ← replace this CAN file
   label:'PUNCH ENERGY'}
];

const root = document.documentElement;
const productWrap = document.getElementById('productWrap');
const productImage = document.getElementById('productImage');
const campaignGrid = document.getElementById('campaignGrid');
const campaignTag = document.getElementById('campaignTag');
const campaignDescription = document.getElementById('campaignDescription');
const campaignNumber = document.getElementById('campaignNumber');
const particleLayer = document.getElementById('particleLayer');
const replayBtn = document.getElementById('replayBtn');
const stage = document.getElementById('stage');

function setTheme(c) {
  root.style.setProperty('--accent', c.accent);
  root.style.setProperty('--accent-rgb', c.rgb);
  root.style.setProperty('--bg-a', mix(c.accent, '#010301', .88));
  root.style.setProperty('--bg-b', mix(c.accent, '#000000', .82));
  document.querySelector('meta[name="theme-color"]').setAttribute('content', c.accent);
}
function mix(a,b,p){
  const pa = hex(a), pb = hex(b);
  const r = Math.round(pa.r*p + pb.r*(1-p));
  const g = Math.round(pa.g*p + pb.g*(1-p));
  const bl = Math.round(pa.b*p + pb.b*(1-p));
  return `rgb(${r},${g},${bl})`;
}
function hex(h){return {r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)}}

function buildCampaignCards(){
  campaignGrid.innerHTML = campaigns.map((c,i)=>`
    <button class="campaign-card ${i===0?'active':''}" data-id="${c.id}" style="--card-rgb:${c.rgb}">
      <img class="mini-can" src="${c.file}" alt="${c.name} can" draggable="false">
      <span class="campaign-meta"><strong>${c.short}</strong><span>${c.label}</span></span>
    </button>
  `).join('');
  campaignGrid.querySelectorAll('.campaign-card').forEach(card=>card.addEventListener('click',()=>activate(card.dataset.id)));
}

let current='original';
let switching=false;
function activate(id, replay=false){
  const c = campaigns.find(x=>x.id===id);
  if(!c || (id===current && !replay) || switching) return;
  switching = true;

  document.querySelectorAll('.campaign-card').forEach(card=>card.classList.toggle('active',card.dataset.id===id));
  productWrap.classList.remove('switching-in');
  productWrap.classList.add('switching-out');
  campaignDescription.style.opacity='0';
  setTheme(c);

  setTimeout(()=>{
    productImage.onload=()=>{
      productWrap.classList.remove('switching-out');
      void productWrap.offsetWidth;
      productWrap.classList.add('switching-in');
      campaignDescription.textContent=c.description;
      campaignDescription.style.opacity='1';
      campaignTag.textContent=c.tag;
      campaignNumber.textContent=c.number;
      current=id;
      setTimeout(()=>switching=false,700);
    };
    productImage.src=c.file;
    productImage.alt=`Monster ${c.name} can`;
  },340);
}

function makeParticles(){
  particleLayer.innerHTML='';
  for(let i=0;i<28;i++){
    const p=document.createElement('span'); p.className='particle';
    p.style.left=`${8+Math.random()*84}%`; p.style.top=`${7+Math.random()*83}%`;
    p.style.opacity=(.18+Math.random()*.42).toFixed(2);
    p.style.transform=`scale(${.45+Math.random()*1.2})`;
    p.style.setProperty('--dur',`${2.2+Math.random()*4.2}s`);
    p.style.animationDelay=`-${Math.random()*4}s`;
    particleLayer.appendChild(p);
  }
}

stage.addEventListener('pointermove',(e)=>{
  const r=stage.getBoundingClientRect();
  const x=(e.clientX-r.left)/r.width-.5;
  const y=(e.clientY-r.top)/r.height-.5;
  productImage.style.transform=`translate3d(${x*9}px,${y*-7}px,0) rotate(${x*2.5}deg)`;
});
stage.addEventListener('pointerleave',()=>productImage.style.transform='translate3d(0,0,0) rotate(0)');
replayBtn.addEventListener('click',()=>{
  const c=campaigns.find(x=>x.id===current);
  if(!c)return;
  productWrap.classList.remove('switching-in');
  void productWrap.offsetWidth;
  productWrap.classList.add('switching-in');
});
document.getElementById('shopBtn').addEventListener('click',()=>document.getElementById('campaigns').scrollIntoView({behavior:'smooth'}));

buildCampaignCards(); makeParticles(); setTheme(campaigns[0]);
