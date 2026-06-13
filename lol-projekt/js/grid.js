

/** Ažurira sortKey i crta grid */
function updateSort() {
  sortKey = document.getElementById('sort-sel').value;
  renderGrid();
}

/** Mijenja smjer sortiranja (asc/desc) */
function setDir(d) {
  sortDir = d;
  document.getElementById('desc-btn').classList.toggle('active', d === 'desc');
  document.getElementById('asc-btn').classList.toggle('active', d === 'asc');
  renderGrid();
}

/** Sortira laneChamps prema trenutnom sortKey i sortDir */
function sorted() {
  return [...laneChamps].sort((a, b) => {
    let av = sortKey === 'name' ? a.name : (a[sortKey] || 0);
    let bv = sortKey === 'name' ? b.name : (b[sortKey] || 0);
    if (sortKey === 'name')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'desc' ? bv - av : av - bv;
  });
}


function renderGrid() {
  const champs = sorted();
  const col    = LANE_COL[lane];
  const sel    = d3.select('#champ-grid');

  const cards = sel.selectAll('.champ-card').data(champs, d => d.id);

  // ── EXIT ── elementi koji više nisu u podacima
  cards.exit()
    .transition().duration(200)
    .style('opacity', 0)
    .style('transform', 'scale(0.8)')
    .remove();

  // ── ENTER ── novi elementi
  const enter = cards.enter()
    .append('div').attr('class', 'champ-card')
    .style('opacity', 0)
    .style('transform', 'translateY(10px)')
    .style('--card-col', col)
    .on('click', (e, d) => {
      if (cmpMode) { handleCmpClick(d); } else { openDetail(d); }
    });

  // Slika s fallback na inicijale
  const imgWrap = enter.append('div').attr('class', 'champ-img-wrap');
  imgWrap.append('img')
    .attr('class', 'champ-img')
    .attr('src', d => d.imgUrl)
    .attr('alt', d => d.name)
    .style('display', 'block')
    .on('error', function(e, d) {
      d3.select(this).style('display', 'none');
      d3.select(this.parentNode)
        .append('div').attr('class', 'champ-img-fallback')
        .style('background', champBg(d.name))
        .text(initials(d.name));
    });

  enter.append('div').attr('class', 'champ-name');
  enter.append('div').attr('class', 'champ-wr');
  enter.append('div').attr('class', 'champ-tags');

  // ── MERGE (Enter + Update) ── animacija i ažuriranje sadržaja
  const merged = enter.merge(cards);

  merged.transition().duration(320)
    .delay((d, i) => Math.min(i * 10, 350)) 
    .style('opacity', 1)
    .style('transform', 'translateY(0)');

  merged.order(); 

  merged.select('.champ-img').attr('src', d => d.imgUrl).attr('alt', d => d.name);
  merged.select('.champ-name').text(d => d.name);
  merged.select('.champ-wr')
    .attr('class', d => 'champ-wr ' + wrCls(d.winrate))
    .text(d => d.winrate.toFixed(1) + '% WR');
  merged.select('.champ-tags').text(d => d.tags.slice(0, 2).join(' · '));

  merged.classed('cmp-sel', d =>
    cmpMode && ((cmpA && cmpA.id === d.id) || (cmpB && cmpB.id === d.id))
  );
}
