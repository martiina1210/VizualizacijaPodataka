// config.js — Globalne konstante i pomoćne funkcije

// Boje po laneu
const LANE_COL = {
  Top:     '#E84057',
  Jungle:  '#1DB954',
  Middle:  '#4D8FCA',
  Bottom:  '#C89B3C',
  Support: '#8B5CF6'
};

// Nazivi laneva
const LANE_LBL = {
  Top:     'TOP LANE',
  Jungle:  'JUNGLE',
  Middle:  'MID LANE',
  Bottom:  'BOT LANE',
  Support: 'SUPPORT'
};

// Data Dragon verzija (Riot CDN)
const DDV = "14.24.1";

// Globalni state aplikacije
let lane      = null;   // trenutno odabrani lane
let champ     = null;   // trenutno odabrani champion (detail view)
let sortKey   = 'winrate';
let sortDir   = 'desc';
let cmpMode   = false;  // compare mode aktivan
let cmpA      = null;   // prvi odabrani champion za usporedbu
let cmpB      = null;   // drugi odabrani champion za usporedbu
let laneChamps = [];    // filtrirani championи za trenutni lane

// Tooltip element
const tt = document.getElementById('tt');

// ── POMOĆNE FUNKCIJE ──

/** Generira inicijale iz imena championa (npr. "Master Yi" → "MY") */
function initials(n) {
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/** Generira boju iz hasha imena za fallback avatar */
function champBg(n) {
  let h = 0;
  for (let c of n) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 55%, 38%)`;
}

/** Vraća CSS klasu za win rate badge (good/ok/bad) */
function wrCls(w) {
  return w >= 52 ? 'good' : w < 48 ? 'bad' : 'ok';
}

/** Prikazuje tooltip na poziciji miša */
function showTt(ev, html) {
  tt.innerHTML = html;
  tt.style.left = (ev.clientX + 14) + 'px';
  tt.style.top  = (ev.clientY - 30) + 'px';
  tt.classList.add('show');
}

/** Skriva tooltip */
function hideTt() {
  tt.classList.remove('show');
}
