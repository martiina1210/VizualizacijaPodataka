// views.js — Upravljanje viewovima i navigacijom

/** Prebacuje između 4 viewa: home, lane, detail, compare */
function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById(v + '-view').classList.add('active');

  // Ažuriraj breadcrumb u headeru
  const bc = document.getElementById('breadcrumb');
  if (v === 'home')   bc.textContent = '';
  else if (v === 'lane')   bc.textContent = LANE_LBL[lane] || '';
  else if (v === 'detail' && champ) bc.textContent = (LANE_LBL[lane] || '') + ' · ' + champ.name;
  else if (v === 'compare') bc.textContent = 'USPOREDBA';
}

/** Inicijalizira početne statistike na homu */
function initHome() {
  const n = CHAMPIONS_DATA.length;
  const mostPop = CHAMPIONS_DATA.reduce((a, b) => a.popularity > b.popularity ? a : b);
  const best    = CHAMPIONS_DATA.reduce((a, b) => a.winrate > b.winrate ? a : b);
  document.getElementById('total-champs').textContent = n;
  document.getElementById('avg-wr').textContent       = mostPop.name;
  document.getElementById('best-name').textContent    = best.name;
}

/** Otvara lane view za odabrani lane */
function openLane(l) {
  lane = l;
  cmpMode = false;
  cmpA = cmpB = null;
  hideCmpPanel();
  document.getElementById('cmp-toggle').classList.remove('active');

  // Filtriraj championе po ulozi
  laneChamps = CHAMPIONS_DATA.filter(c => c.roles.includes(l));

  // Ažuriraj zaglavlje
  document.getElementById('lane-title').textContent = LANE_LBL[l];
  document.getElementById('lane-title').style.color = LANE_COL[l];
  document.getElementById('champ-count').textContent = laneChamps.length + ' CHAMPIONA';

  showView('lane');
  renderGrid();
}

/** Otvara detail view za odabranog championa */
function openDetail(c) {
  champ = c;
  showView('detail');
  renderDetail(c);
}

/** Vraća se na lane view */
function backToLane() {
  showView('lane');
}

/** Inicijalizira mapu (učitava sliku) */
function initMap() {
  // Slika se učitava relativno — assets/summoners_rift.png
  document.getElementById('map-img').src = 'assets/summoners_rift.png';
}
