const LOWER='abcdefghijklmnopqrstuvwxyz',UPPER='ABCDEFGHIJKLMNOPQRSTUVWXYZ',DIGITS='0123456789',SYMS='!@#$%^&*()_+-=[]{}|;:,.?';
const SNAPS=[8,16,24,32,40,48,56,64],SNAP_R=3;
let currentPw='',visible=false,copyTimer=null,errorTimer=null;

const field      = document.getElementById('pw-field');
const pwFade     = document.getElementById('pw-fade');
const slider     = document.getElementById('length-slider');
const numInput   = document.getElementById('length-number');
const sliderWrap = document.getElementById('slider-wrap');
const tooltip    = document.getElementById('slider-tooltip');
const copiedInl  = document.getElementById('copied-inline');
const errorPop   = document.getElementById('error-popover');
const iconVis    = document.getElementById('icon-vis');
const iconCopyEl = document.getElementById('icon-copy');
const badge      = document.getElementById('strength-badge');
const srAnn      = document.getElementById('sr-announce');
const allOffWarn = document.getElementById('all-off-warning');
const copyBtn    = document.getElementById('btn-copy');

/* ── Theme ── */
const sysMQ = window.matchMedia('(prefers-color-scheme: dark)');
let themeMode = 'system'; // 'system' | 'light' | 'dark'

function applyTheme() {
  const dark = themeMode === 'dark' || (themeMode === 'system' && sysMQ.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  updateFade();
  updateFill(parseInt(slider.value, 10));
}

function setTheme(mode) {
  themeMode = mode;
  ['system','light','dark'].forEach(m => {
    const btn = document.getElementById('theme-'+m);
    btn.classList.toggle('active', m === mode);
    btn.setAttribute('aria-checked', m === mode ? 'true' : 'false');
  });
  applyTheme();
}

document.getElementById('theme-system').addEventListener('click', () => setTheme('system'));
document.getElementById('theme-light').addEventListener('click',  () => setTheme('light'));
document.getElementById('theme-dark').addEventListener('click',   () => setTheme('dark'));
sysMQ.addEventListener('change', () => { if(themeMode === 'system') applyTheme(); });

/* ── Overflow fade ── */
function updateFade() {
  const overflows = field.scrollWidth > field.clientWidth + 2;
  pwFade.classList.toggle('visible', overflows);
}

/* ── Tabs ── */
function switchTab(id) {
  ['password','options'].forEach(t => {
    const btn   = document.getElementById('tab-'+t);
    const panel = document.getElementById('panel-'+t);
    const active = t === id;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
    panel.classList.toggle('hidden', !active);
  });
}
document.getElementById('tab-password').addEventListener('click', () => switchTab('password'));
document.getElementById('tab-options').addEventListener('click',  () => switchTab('options'));

/* Arrow key navigation between tabs — ARIA tab pattern */
document.querySelector('.tab-bar').addEventListener('keydown', e => {
  const tabs = ['password','options'];
  const current = tabs.findIndex(t => document.getElementById('tab-'+t).classList.contains('active'));
  if (e.key === 'ArrowRight') { e.preventDefault(); switchTab(tabs[(current+1)%tabs.length]); document.getElementById('tab-'+tabs[(current+1)%tabs.length]).focus(); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); switchTab(tabs[(current-1+tabs.length)%tabs.length]); document.getElementById('tab-'+tabs[(current-1+tabs.length)%tabs.length]).focus(); }
});

/* ── Tooltip ── */
function positionTooltip(val) { tooltip.style.left=(2+(val-6)/(64-6)*(slider.offsetWidth-4))+'px'; tooltip.textContent=val; }
function showTip() { sliderWrap.classList.add('show-tip'); }
function hideTip() { sliderWrap.classList.remove('show-tip'); }



/* ── Snap ── */
function snapValue(val) { for(const s of SNAPS) if(Math.abs(val-s)<=SNAP_R) return s; return val; }
function setLength(raw, source) {
  let val = Math.max(6, Math.min(64, Math.round(raw)));
  if(source !== 'drag') val = snapValue(val);
  if(source !== 'slider') { slider.value=val; slider.setAttribute('aria-valuenow',val); }
  if(source !== 'number') numInput.value=val;
  updateFill(val); positionTooltip(val); return val;
}

/* ── State ── */
function getState() {
  return { length:parseInt(slider.value,10), numbers:document.getElementById('sw-numbers').checked, symbols:document.getElementById('sw-symbols').checked, mixed:document.getElementById('sw-mixed').checked };
}

function generate(s) {
  let pool=LOWER;
  if(s.mixed) pool+=UPPER; if(s.numbers) pool+=DIGITS; if(s.symbols) pool+=SYMS;
  const buf=new Uint32Array(s.length); crypto.getRandomValues(buf);
  return Array.from(buf).map(n=>pool[n%pool.length]).join('');
}

function calcStrength(pw) {
  let pool=0;
  if(/[a-z]/.test(pw)) pool+=26; if(/[A-Z]/.test(pw)) pool+=26;
  if(/[0-9]/.test(pw)) pool+=10; if(/[^a-zA-Z0-9]/.test(pw)) pool+=32;
  if(!pool) pool=26;
  const bits=pw.length*Math.log2(pool);
  if(bits<35)  return{level:1,label:'Weak',       cls:'weak'     };
  if(bits<50)  return{level:2,label:'Fair',        cls:'fair'     };
  if(bits<70)  return{level:3,label:'Moderate',    cls:'moderate' };
  if(bits<90)  return{level:4,label:'Strong',      cls:'strong'   };
  if(bits<115) return{level:5,label:'Very Strong', cls:'vstrong'  };
  if(bits<256) return{level:6,label:'Excellent',   cls:'excellent'};
  if(bits<350) return{level:7,label:'256-bit',     cls:'aes256'   };
  return             {level:8,label:'Bonkers',     cls:'bonkers'  };
}

/* ── Typewriter ── */
let twTimer = null;
function typewrite(target) {
  clearTimeout(twTimer);
  const len = target.length;
  const perChar = Math.min(24, Math.max(9, Math.floor(750 / len)));
  let i = 0;
  field.value = '';
  updateFade();
  function step() {
    i++;
    field.value = target.slice(0, i);
    updateFade();
    if (i < len) twTimer = setTimeout(step, perChar);
  }
  twTimer = setTimeout(step, perChar);
}

/* ── Render ── */
function render() {
  const s=getState();
  allOffWarn.classList.toggle('visible', !s.numbers&&!s.symbols&&!s.mixed);
  currentPw=generate(s);
  typewrite(visible ? currentPw : '*'.repeat(currentPw.length));
  const {level,label,cls}=calcStrength(currentPw);
  badge.className='strength-badge '+cls;
  badge.setAttribute('aria-label','Password strength: '+label);
  if(cls==='bonkers'){
    badge.innerHTML='<span class="bonkers-text" aria-hidden="true">'+label+'</span>';
  } else {
    badge.textContent=label;
  }
  document.querySelectorAll('#strength-segs .seg').forEach((seg,i)=>{ seg.className=i<level?'seg active '+cls:'seg'; });
  srAnn.textContent=''; requestAnimationFrame(()=>{ srAnn.textContent=`New password, ${s.length} characters. Strength: ${label}.`; });
}

/* ── Slider ── */
slider.addEventListener('mousedown', showTip);
slider.addEventListener('touchstart', showTip, {passive:true});
slider.addEventListener('focus', showTip);
slider.addEventListener('blur', hideTip);
window.addEventListener('mouseup', hideTip);
window.addEventListener('touchend', hideTip);
slider.addEventListener('input', ()=>{ const raw=parseInt(slider.value,10); numInput.value=raw; updateFill(raw); positionTooltip(raw); slider.setAttribute('aria-valuenow',raw); });
slider.addEventListener('change', ()=>{ setLength(parseInt(slider.value,10),'slider'); render(); });

/* ── Number input — only render if value actually changed ── */
let numFocusVal = null;
numInput.addEventListener('focus', ()=>{ numFocusVal = parseInt(numInput.value, 10); });
numInput.addEventListener('input', ()=>{ const raw=parseInt(numInput.value,10); if(!isNaN(raw)){ const c=Math.max(6,Math.min(64,raw)); slider.value=c; slider.setAttribute('aria-valuenow',c); updateFill(c); positionTooltip(c); } });
numInput.addEventListener('blur', ()=>{
  const newVal = parseInt(numInput.value,10) || 16;
  const snapped = snapValue(Math.max(6, Math.min(64, newVal)));
  setLength(snapped, 'number');
  // only regenerate if length actually changed
  if(snapped !== numFocusVal) render();
});
numInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();numInput.blur();} });

/* ── Toggles ── */
['sw-numbers','sw-symbols','sw-mixed'].forEach(id=>{
  document.getElementById(id).addEventListener('change',()=>{ const el=document.getElementById(id); el.setAttribute('aria-checked',el.checked?'true':'false'); render(); });
});

/* ── Visibility ── */
document.getElementById('btn-vis').addEventListener('click',()=>{
  visible=!visible;
  const btn=document.getElementById('btn-vis');
  btn.setAttribute('aria-pressed',String(visible));
  btn.setAttribute('aria-label',visible?'Hide password':'Show password');
  const EYE_OPEN='<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  const EYE_SHUT='<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"/>';
  iconVis.innerHTML=visible?EYE_SHUT:EYE_OPEN;
  typewrite(visible ? currentPw : '*'.repeat(currentPw.length));
});

/* ── Regen ── */
document.getElementById('btn-regen').addEventListener('click', render);

/* ── Copy ── */
const ICON_COPY='<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
const ICON_CHECK='<polyline points="20 6 9 17 4 12"/>';
function fallbackCopy(t){const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0;';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');document.body.removeChild(ta);return ok;}
function showCopySuccess(){ iconCopyEl.innerHTML=ICON_CHECK; copyBtn.classList.add('copied'); copiedInl.classList.add('show'); clearTimeout(copyTimer); copyTimer=setTimeout(()=>{ iconCopyEl.innerHTML=ICON_COPY; copyBtn.classList.remove('copied'); copiedInl.classList.remove('show'); },2200); }
function showCopyError(){ clearTimeout(errorTimer); errorPop.classList.add('show'); errorTimer=setTimeout(()=>errorPop.classList.remove('show'),3000); }
document.getElementById('btn-copy').addEventListener('click',()=>{
  if(!currentPw)return;
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(currentPw).then(showCopySuccess).catch(()=>fallbackCopy(currentPw)?showCopySuccess():showCopyError()); }
  else { fallbackCopy(currentPw)?showCopySuccess():showCopyError(); }
});

/* ── updateFill: no visual fill on track by design ── */
function updateFill(val) { /* intentionally empty — plain track */ }

/* ── Credits panel — with focus trap and Escape close ── */
const creditsOverlay = document.getElementById('credits-overlay');
const creditsPanel   = creditsOverlay.querySelector('.credits-panel');
const creditsClose   = document.getElementById('credits-close');
let prevFocus = null;

function openCredits() {
  prevFocus = document.activeElement;
  creditsOverlay.classList.add('show');
  creditsClose.focus();
}
function closeCredits() {
  creditsOverlay.classList.remove('show');
  if (prevFocus) prevFocus.focus();
}

document.getElementById('btn-info').addEventListener('click', openCredits);
creditsClose.addEventListener('click', closeCredits);
creditsOverlay.addEventListener('click', e => {
  if (e.target === creditsOverlay) closeCredits();
});

/* Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && creditsOverlay.classList.contains('show')) {
    closeCredits();
  }
});

/* Focus trap inside dialog */
creditsOverlay.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(creditsPanel.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
});

/* ── Init ── */
applyTheme();
setLength(16,'init');
render();
window.addEventListener('resize', updateFade);