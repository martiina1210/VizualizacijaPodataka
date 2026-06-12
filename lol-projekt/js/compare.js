// compare.js — Compare mode i Compare view grafovi

/** Aktivira / deaktivira compare mode */
function toggleCmp() {
  cmpMode = !cmpMode;
  cmpA = cmpB = null;
  document.getElementById('cmp-toggle').classList.toggle('active', cmpMode);
  if (cmpMode) showCmpPanel(); else hideCmpPanel();
  updateCmpPanel();
  renderGrid();
}

function showCmpPanel() { document.getElementById('cmp-panel').classList.add('show'); }
function hideCmpPanel() { document.getElementById('cmp-panel').classList.remove('show'); }

/** Odustaje od usporedbe */
function cancelCmp() {
  cmpMode = false; cmpA = cmpB = null;
  document.getElementById('cmp-toggle').classList.remove('active');
  hideCmpPanel();
  renderGrid();
}

/**
 * Logika odabira championа u compare modeu:
 * - Slot A prazan → popuni A
 * - Slot B prazan → popuni B
 * - Oba puna → premjesti B na A, novi je B
 */
function handleCmpClick(d) {
  if (!cmpA) { cmpA = d; }
  else if (!cmpB && d.id !== cmpA.id) { cmpB = d; }
  else if (d.id !== cmpA.id && d.id !== cmpB.id) { cmpA = cmpB; cmpB = d; }
  updateCmpPanel();
  renderGrid();
}

/** Ažurira prikaz slotova u compare panelu */
function updateCmpPanel() {
  const sa     = document.getElementById('slot-a');
  const sb     = document.getElementById('slot-b');
  const runBtn = document.getElementById('cmp-run-btn');

  function slotHtml(c) {
    if (!c) return '<span class="sl-empty">Odaberi championa</span>';
    return `<img src="${c.imgUrl}" alt="${c.name}"
              style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--teal)"
              onerror="this.style.display='none'">
            <span class="sl-name">${c.name}</span>`;
  }

  sa.innerHTML = slotHtml(cmpA); sb.innerHTML = slotHtml(cmpB);
  sa.classList.toggle('filled', !!cmpA); sb.classList.toggle('filled', !!cmpB);
  // Gumb je aktivan samo kad su oba championa odabrana
  runBtn.disabled = !(cmpA && cmpB);
}

/** Pokreće compare view */
function runCompare() {
  if (!cmpA || !cmpB) return;
  const a = cmpA, b = cmpB;
  cancelCmp();
  renderCmpView(a, b);
  showView('compare');
}

/** Helper — HTML za sliku championa */
function champImgHtml(c, size = 52) {
  return `<img src="${c.imgUrl}" alt="${c.name}"
    style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)"
    onerror="this.style.display='none'">`;
}

/** Renderira compare view — zaglavlje + 3 grafa */
function renderCmpView(a, b) {
  document.getElementById('cmp-vs-hdr').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      ${champImgHtml(a, 52)}
      <div>
        <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:var(--gold)">${a.name}</div>
        <div style="font-size:.72rem;color:var(--text-dim)">${a.title}</div>
      </div>
    </div>
    <div style="font-family:'Cinzel',serif;font-size:1.8rem;color:var(--gold);opacity:.5;margin:0 12px">VS</div>
    <div style="display:flex;align-items:center;gap:12px">
      ${champImgHtml(b, 52)}
      <div>
        <div style="font-family:'Cinzel',serif;font-size:1.1rem;color:var(--teal)">${b.name}</div>
        <div style="font-size:.72rem;color:var(--text-dim)">${b.title}</div>
      </div>
    </div>`;

  renderCmpRadar(a, b);
  renderCmpKDA(a, b);
  renderCmpWBP(a, b);
}

/** Dual radar chart — oba championa na jednom SVG-u */
function renderCmpRadar(a, b) {
  const el = document.getElementById('cmp-radar');
  el.innerHTML = '';
  const W = 320, H = 310, cx = 160, cy = 155, R = 110;
  const axes = [
    { key: 'attack',     label: 'Napad',  max: 10 },
    { key: 'defense',    label: 'Obrana', max: 10 },
    { key: 'magic',      label: 'Magija', max: 10 },
    { key: 'difficulty', label: 'Težina', max: 10 },
    { key: 'winrate',    label: 'Win%',   max: 60, min: 40 },
    { key: 'popularity', label: 'Pop%',   max: 30 },
  ];
  const N = axes.length, ang = Math.PI * 2 / N;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);

  [.25, .5, .75, 1].forEach(r =>
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R * r)
      .attr('fill', 'none').attr('stroke', 'var(--blue-border)').attr('stroke-dasharray', '2,3')
  );
  axes.forEach((ax, i) => {
    const a2 = ang * i - Math.PI / 2;
    svg.append('line').attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + R * Math.cos(a2)).attr('y2', cy + R * Math.sin(a2))
      .attr('stroke', 'var(--blue-border)');
    svg.append('text')
      .attr('x', cx + (R + 20) * Math.cos(a2)).attr('y', cy + (R + 20) * Math.sin(a2))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-dim)').attr('font-size', 10).attr('font-family', 'Rajdhani')
      .text(ax.label);
  });

  // Crtanje oba championa — zlatna za a, teal za b
  [[a, 'var(--gold)'], [b, 'var(--teal)']].forEach(([champ, col]) => {
    const pts = axes.map((ax, i) => {
      const a2 = ang * i - Math.PI / 2;
      const val = champ[ax.key] || 0, min = ax.min || 0;
      const t = Math.max(0, Math.min(1, (val - min) / (ax.max - min)));
      return [cx + R * t * Math.cos(a2), cy + R * t * Math.sin(a2)];
    });
    svg.append('polygon')
      .attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', col).attr('fill-opacity', .15).attr('stroke', col).attr('stroke-width', 2);
    pts.forEach(([px, py]) =>
      svg.append('circle').attr('cx', px).attr('cy', py).attr('r', 4).attr('fill', col)
    );
  });

  // Legenda
  const ly = H - 18;
  svg.append('circle').attr('cx', cx - 70).attr('cy', ly).attr('r', 5).attr('fill', 'var(--gold)');
  svg.append('text').attr('x', cx - 62).attr('y', ly + 4).attr('fill', 'var(--gold)').attr('font-size', 11).attr('font-family', 'Rajdhani').text(a.name);
  svg.append('circle').attr('cx', cx + 20).attr('cy', ly).attr('r', 5).attr('fill', 'var(--teal)');
  svg.append('text').attr('x', cx + 28).attr('y', ly + 4).attr('fill', 'var(--teal)').attr('font-size', 11).attr('font-family', 'Rajdhani').text(b.name);
}

/** KDA usporedba — Kills, Deaths, Assists */
function renderCmpKDA(a, b) {
  const el = document.getElementById('cmp-kda');
  el.innerHTML = '';
  const mets = [{ key: 'kills', label: 'Kills' }, { key: 'deaths', label: 'Deaths' }, { key: 'assists', label: 'Assists' }];
  const W = 300, H = 200, m = { top: 18, right: 60, bottom: 28, left: 56 };
  const w = W - m.left - m.right, h = H - m.top - m.bottom;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
    .append('g').attr('transform', `translate(${m.left},${m.top})`);
  const yS = d3.scaleBand().domain(mets.map(m => m.label)).range([0, h]).padding(.3);
  const mx = d3.max([...mets.map(m => a[m.key]), ...mets.map(m => b[m.key])]) * 1.2;
  const xS = d3.scaleLinear().domain([0, mx]).range([0, w]);

  mets.forEach(met => {
    const y = yS(met.label), bh = yS.bandwidth() / 2 - 2;
    svg.append('text').attr('x', -4).attr('y', y + yS.bandwidth() / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-dim)').attr('font-size', 10).attr('font-family', 'Rajdhani').text(met.label);
    [[a, 'var(--gold)', 0], [b, 'var(--teal)', bh + 2]].forEach(([champ, col, dy]) => {
      const bw = xS(champ[met.key]);
      svg.append('rect').attr('x', 0).attr('y', y + dy).attr('width', 0).attr('height', bh)
        .attr('rx', 2).attr('fill', col).attr('opacity', .82)
        .transition().duration(550).attr('width', bw);
      svg.append('text').attr('x', bw + 3).attr('y', y + dy + bh / 2)
        .attr('dominant-baseline', 'middle').attr('fill', col)
        .attr('font-size', 10).attr('font-family', 'Rajdhani').attr('font-weight', 600)
        .text(champ[met.key].toFixed(1));
    });
  });
}

/** Win/Ban/Popularnost usporedba */
function renderCmpWBP(a, b) {
  const el = document.getElementById('cmp-wbp');
  el.innerHTML = '';
  const mets = [{ key: 'winrate', label: 'Win Rate %' }, { key: 'banrate', label: 'Ban Rate %' }, { key: 'popularity', label: 'Popularnost %' }];
  const W = Math.min(720, (el.parentElement.clientWidth || 680) - 36);
  const H = 220, m = { top: 18, right: 20, bottom: 32, left: 110 };
  const w = W - m.left - m.right, h = H - m.top - m.bottom;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
    .append('g').attr('transform', `translate(${m.left},${m.top})`);
  const yS = d3.scaleBand().domain(mets.map(m => m.label)).range([0, h]).padding(.3);
  const mx = d3.max([...mets.map(m => a[m.key]), ...mets.map(m => b[m.key])]) * 1.2;
  const xS = d3.scaleLinear().domain([0, mx]).range([0, w]);

  svg.append('g').attr('class', 'axis').call(d3.axisLeft(yS).tickSize(0)).call(g => g.select('.domain').remove());
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${h})`).call(d3.axisBottom(xS).ticks(5).tickFormat(d => d + '%'));

  mets.forEach(met => {
    const y = yS(met.label), bh = yS.bandwidth() / 2 - 2;
    [[a, 'var(--gold)', 0], [b, 'var(--teal)', bh + 2]].forEach(([champ, col, dy]) => {
      const bw = xS(champ[met.key]);
      svg.append('rect').attr('x', 0).attr('y', y + dy).attr('width', 0).attr('height', bh)
        .attr('rx', 2).attr('fill', col).attr('opacity', .82)
        .transition().duration(550).attr('width', bw);
      svg.append('text').attr('x', bw + 4).attr('y', y + dy + bh / 2)
        .attr('dominant-baseline', 'middle').attr('fill', col)
        .attr('font-size', 10).attr('font-family', 'Rajdhani').attr('font-weight', 600)
        .text(champ[met.key].toFixed(1) + '%');
    });
  });

  // Legenda
  const ly = h + 26;
  svg.append('circle').attr('cx', 0).attr('cy', ly).attr('r', 5).attr('fill', 'var(--gold)');
  svg.append('text').attr('x', 10).attr('y', ly + 4).attr('fill', 'var(--gold)').attr('font-size', 11).attr('font-family', 'Rajdhani').text(a.name);
  svg.append('circle').attr('cx', 100).attr('cy', ly).attr('r', 5).attr('fill', 'var(--teal)');
  svg.append('text').attr('x', 110).attr('y', ly + 4).attr('fill', 'var(--teal)').attr('font-size', 11).attr('font-family', 'Rajdhani').text(b.name);
}
