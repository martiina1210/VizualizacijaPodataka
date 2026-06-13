
function renderDetail(c) {
  const wrap = document.getElementById('det-avatar-wrap');
  wrap.innerHTML = `
    <div style="position:relative;width:90px;height:90px;flex-shrink:0">
      <img src="${c.imgUrl}" alt="${c.name}"
        style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2.5px solid var(--gold);box-shadow:0 0 24px rgba(200,155,60,.3)"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div style="display:none;width:90px;height:90px;border-radius:50%;background:${champBg(c.name)};border:2.5px solid var(--gold);align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:1.8rem;font-weight:700;color:#fff;position:absolute;top:0;left:0">${initials(c.name)}</div>
    </div>`;

  document.getElementById('det-name').textContent      = c.name;
  document.getElementById('det-title-el').textContent  = c.title;
  document.getElementById('det-blurb').textContent     = c.blurb ? '"' + c.blurb + '…"' : '';

  // Tag pillovi
  const tagsEl = document.getElementById('det-tags');
  tagsEl.innerHTML = '';
  const knownTags = ['Fighter', 'Mage', 'Assassin', 'Marksman', 'Tank', 'Support'];
  c.tags.forEach(t => {
    const cls = knownTags.includes(t) ? 't' + t : 'tOther';
    tagsEl.innerHTML += `<span class="tag-pill ${cls}">${t}</span>`;
  });
  if (c.rangetype) tagsEl.innerHTML += `<span class="tag-pill tOther">${c.rangetype}</span>`;

  // KDA ratio izračun
  const kda = c.deaths > 0 ? ((c.kills + c.assists) / c.deaths).toFixed(2) : '∞';

  // Stat boxovi — boja win ratea ovisi o vrijednosti
  document.getElementById('stats-row').innerHTML = `
    <div class="stat-box">
      <div class="sv" style="color:${c.winrate >= 52 ? '#1DB954' : c.winrate < 48 ? '#E84057' : 'var(--gold)'}">${c.winrate}%</div>
      <div class="sl">WIN RATE</div>
    </div>
    <div class="stat-box"><div class="sv" style="color:#E84057">${c.banrate}%</div><div class="sl">BAN RATE</div></div>
    <div class="stat-box"><div class="sv">${c.popularity}%</div><div class="sl">POPULARNOST</div></div>
    <div class="stat-box"><div class="sv" style="color:var(--teal)">${kda}</div><div class="sl">KDA RATIO</div></div>
    <div class="stat-box"><div class="sv">${c.kills} / <span style="color:#E84057">${c.deaths}</span> / ${c.assists}</div><div class="sl">AVG K/D/A</div></div>`;

  // Pokreni sve grafove
  renderRadar(c);
  renderBar(c);
  renderDist(c);
  renderSpells(c);
  renderOther(c);
}

/** Radar (spider) chart — 6 dimenzija s animacijom */
function renderRadar(c) {
  const el = document.getElementById('radar-chart');
  el.innerHTML = '';
  const W = 280, H = 280, cx = 140, cy = 145, R = 100;
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

  // Grid kružnice
  [.25, .5, .75, 1].forEach(r =>
    svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', R * r)
      .attr('fill', 'none').attr('stroke', 'var(--blue-border)').attr('stroke-dasharray', '2,3')
  );

  // Osi i labele
  axes.forEach((ax, i) => {
    const a = ang * i - Math.PI / 2;
    svg.append('line').attr('x1', cx).attr('y1', cy)
      .attr('x2', cx + R * Math.cos(a)).attr('y2', cy + R * Math.sin(a))
      .attr('stroke', 'var(--blue-border)');
    svg.append('text')
      .attr('x', cx + (R + 18) * Math.cos(a)).attr('y', cy + (R + 18) * Math.sin(a))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-dim)').attr('font-size', 10).attr('font-family', 'Rajdhani')
      .text(ax.label);
  });

  // Koordinate podatkovnih točaka
  const pts = axes.map((ax, i) => {
    const a = ang * i - Math.PI / 2;
    const val = c[ax.key] || 0, min = ax.min || 0;
    const t = Math.max(0, Math.min(1, (val - min) / (ax.max - min)));
    return [cx + R * t * Math.cos(a), cy + R * t * Math.sin(a)];
  });

  const col = LANE_COL[lane] || 'var(--gold)';

  // Animirano punjenje 
  svg.append('polygon')
    .attr('points', pts.map(p => p.join(',')).join(' '))
    .attr('fill', col).attr('fill-opacity', 0).attr('stroke', col).attr('stroke-width', 2)
    .transition().duration(700).attr('fill-opacity', .2);

  // Animirano crtanje ruba (stroke-dashoffset tehnika)
  svg.append('polygon')
    .attr('points', pts.map(p => p.join(',')).join(' '))
    .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 2)
    .attr('stroke-dasharray', 1000).attr('stroke-dashoffset', 1000)
    .transition().duration(900).attr('stroke-dashoffset', 0);

  // Interaktivne točke s tooltipom
  pts.forEach(([px, py], i) => {
    svg.append('circle').attr('cx', px).attr('cy', py).attr('r', 5)
      .attr('fill', col).style('cursor', 'pointer')
      .on('mousemove', ev => {
        const ax = axes[i], v = c[ax.key];
        showTt(ev, `<b>${ax.label}</b><br>${v !== undefined ? v : '—'}${['winrate','popularity','banrate'].includes(ax.key) ? '%' : ''}`);
      })
      .on('mouseleave', hideTt);
  });
}

/** Grupirani bar chart — champion vs lane prosjek */
function renderBar(c) {
  const el = document.getElementById('bar-chart');
  el.innerHTML = '';

  // Izračun prosjeka svih championа na laneu
  const avg = {
    winrate:    d3.mean(laneChamps, d => d.winrate),
    banrate:    d3.mean(laneChamps, d => d.banrate),
    popularity: d3.mean(laneChamps, d => d.popularity),
    kills:      d3.mean(laneChamps, d => d.kills),
    assists:    d3.mean(laneChamps, d => d.assists),
  };

  const mets = [
    { key: 'winrate',    label: 'Win%',   fmt: v => v.toFixed(1) + '%' },
    { key: 'banrate',    label: 'Ban%',   fmt: v => v.toFixed(1) + '%' },
    { key: 'popularity', label: 'Pop%',   fmt: v => v.toFixed(1) + '%' },
    { key: 'kills',      label: 'Kills',  fmt: v => v.toFixed(1) },
    { key: 'assists',    label: 'Assist', fmt: v => v.toFixed(1) },
  ];

  const W = 290, H = 240, m = { top: 8, right: 70, bottom: 28, left: 54 };
  const w = W - m.left - m.right, h = H - m.top - m.bottom;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
    .append('g').attr('transform', `translate(${m.left},${m.top})`);

  const yS  = d3.scaleBand().domain(mets.map(m => m.label)).range([0, h]).padding(.3);
  const col = LANE_COL[lane] || 'var(--gold)';

  mets.forEach(met => {
    const cv = c[met.key] || 0;
    const av = avg[met.key] || 1;
    const mx = Math.max(cv, av) * 1.15 || 1;
    const y  = yS(met.label), bh = yS.bandwidth() / 2 - 2;

    svg.append('text').attr('x', -4).attr('y', y + yS.bandwidth() / 2)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('fill', 'var(--text-dim)').attr('font-size', 10).attr('font-family', 'Rajdhani')
      .text(met.label);

    // Bar prosjeka (sivi) — animirano
    const aw = (av / mx) * w;
    svg.append('rect').attr('x', 0).attr('y', y).attr('height', bh).attr('width', 0)
      .attr('fill', 'var(--blue-border)').attr('rx', 2)
      .transition().duration(500).attr('width', aw);

    // Bar championa (boja lane-a) — animirano s delay-em
    const cw = (cv / mx) * w;
    svg.append('rect').attr('x', 0).attr('y', y + bh + 2).attr('height', bh).attr('width', 0)
      .attr('fill', col).attr('rx', 2).attr('opacity', .85)
      .transition().duration(500).delay(180).attr('width', cw);

    // Value labele
    svg.append('text').attr('x', Math.max(aw + 2, 2)).attr('y', y + bh / 2)
      .attr('dominant-baseline', 'middle').attr('fill', 'var(--text-dim)').attr('font-size', 9).attr('font-family', 'Rajdhani')
      .text(met.fmt(av));
    svg.append('text').attr('x', Math.max(cw + 2, 2)).attr('y', y + bh + 2 + bh / 2)
      .attr('dominant-baseline', 'middle').attr('fill', col).attr('font-size', 9).attr('font-family', 'Rajdhani').attr('font-weight', 600)
      .text(met.fmt(cv));
  });

  // Legenda
  const ly = h + 14;
  svg.append('rect').attr('x', 0).attr('y', ly).attr('width', 10).attr('height', 6).attr('fill', 'var(--blue-border)');
  svg.append('text').attr('x', 14).attr('y', ly + 5).attr('fill', 'var(--text-dim)').attr('font-size', 9).attr('font-family', 'Rajdhani').text('Lane prosjek');
  svg.append('rect').attr('x', 90).attr('y', ly).attr('width', 10).attr('height', 6).attr('fill', col);
  svg.append('text').attr('x', 104).attr('y', ly + 5).attr('fill', col).attr('font-size', 9).attr('font-family', 'Rajdhani').text(c.name);
}

/** Distribucijski bar chart — win rate svih championа na laneu */
function renderDist(c) {
  const el = document.getElementById('dist-chart');
  el.innerHTML = '';
  const champs = [...laneChamps].sort((a, b) => a.winrate - b.winrate);

  const W = Math.min(720, (el.parentElement.clientWidth || 680) - 36);
  const H = 190, m = { top: 16, right: 16, bottom: 38, left: 38 };
  const w = W - m.left - m.right, h = H - m.top - m.bottom;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H)
    .append('g').attr('transform', `translate(${m.left},${m.top})`);

  const xS = d3.scaleBand().domain(champs.map(d => d.name)).range([0, w]).padding(.12);
  const yS = d3.scaleLinear()
    .domain([d3.min(champs, d => d.winrate) - 1, d3.max(champs, d => d.winrate) + 1])
    .range([h, 0]);

  svg.append('g').attr('class', 'grid').call(d3.axisLeft(yS).tickSize(-w).tickFormat(''));
  svg.append('g').attr('transform', `translate(0,${h})`).attr('class', 'axis')
    .call(d3.axisBottom(xS).tickFormat('').tickSize(0))
    .call(g => g.select('.domain').attr('stroke', 'var(--blue-border)'));
  svg.append('g').attr('class', 'axis').call(d3.axisLeft(yS).ticks(5).tickFormat(d => d + '%'));

  // Referentna linija 50%
  svg.append('line')
    .attr('x1', 0).attr('y1', yS(50)).attr('x2', w).attr('y2', yS(50))
    .attr('stroke', 'rgba(255,255,255,.15)').attr('stroke-dasharray', '4,4');
  svg.append('text').attr('x', w - 2).attr('y', yS(50) - 4)
    .attr('text-anchor', 'end').attr('fill', 'rgba(255,255,255,.25)').attr('font-size', 9).text('50%');

  // Barovi — boja ovisi o win rateu, odabrani je bijeli
  svg.selectAll('.db').data(champs).enter().append('rect').attr('class', 'db')
    .attr('x', d => xS(d.name))
    .attr('y', h).attr('width', xS.bandwidth()).attr('height', 0).attr('rx', 2)
    .attr('fill', d => {
      if (d.id === c.id) return '#FFFFFF';
      return d.winrate >= 52 ? '#1DB954' : d.winrate < 48 ? '#E84057' : 'var(--gold)';
    })
    .attr('opacity', d => d.id === c.id ? 1 : .6)
    .on('mousemove', (ev, d) => showTt(ev, `<b>${d.name}</b><br>WR: ${d.winrate}%<br>Ban: ${d.banrate}%`))
    .on('mouseleave', hideTt)
    .on('click', (ev, d) => { if (d.id !== c.id) openDetail(d); }) 
    .transition().duration(450).delay((d, i) => i * 5)
    .attr('y', d => yS(d.winrate))
    .attr('height', d => h - yS(d.winrate));

  // Label odabranog championa
  const cx2 = xS(c.name);
  if (cx2 !== undefined) {
    svg.append('text')
      .attr('x', cx2 + xS.bandwidth() / 2).attr('y', yS(c.winrate) - 6)
      .attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', 8)
      .attr('font-family', 'Rajdhani').attr('font-weight', 700)
      .text('◀ ' + c.name);
  }
}

/** Prikaz spell liste (Q/W/E/R) */
function renderSpells(c) {
  const el = document.getElementById('spell-info');
  const sp = [{ k: 'spell1_name', l: 'Q' }, { k: 'spell2_name', l: 'W' }, { k: 'spell3_name', l: 'E' }, { k: 'ulti_name', l: 'R' }];
  el.innerHTML = '<div class="spell-list">' +
    sp.map(s => c[s.k] ? `<span class="spell-pill"><b style="color:var(--gold)">${s.l}:</b> ${c[s.k]}</span>` : '').join('') +
    '</div>';
}

/** Prikaz baznih statistika */
function renderOther(c) {
  const el = document.getElementById('other-stats');
  const rows = [
    ['HP', c.hp ? Math.round(c.hp) : '—'],
    ['Armor', c.armor ? c.armor.toFixed(1) : '—'],
    ['Napad dmg', c.attackdamage ? c.attackdamage.toFixed(1) : '—'],
    ['Atk Speed', c.attackspeed ? c.attackspeed.toFixed(3) : '—'],
    ['Move Speed', c.movespeed || '—'],
    ['Atk Range', c.attackrange || '—'],
    ['Datum izl.', c.releasedate || '—'],
    ['Rangetype', c.rangetype || '—'],
  ];
  el.innerHTML = '<div class="info-grid">' +
    rows.map(([l, v]) => `<div class="info-row"><span class="lb">${l}</span><span class="vl">${v}</span></div>`).join('') +
    '</div>';
}
