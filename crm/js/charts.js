/* ============================================================
 * FUTA HUB CRM - SVG CHARTS LIBRARY
 * Donut / Bar / Line / Sparkline / Progress ring
 * Pure SVG, no dependency, offline-first
 * ============================================================ */

const Charts = (function () {

  /* ----------- DONUT CHART ----------- */
  function donut(data, opts = {}) {
    const size = opts.size || 220;
    const thickness = opts.thickness || 36;
    const cx = size / 2, cy = size / 2;
    const r = (size - thickness) / 2;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;

    let acc = 0;
    const arcs = data.map((d, i) => {
      const startAngle = (acc / total) * 360;
      acc += d.value;
      const endAngle = (acc / total) * 360;
      const path = arcPath(cx, cy, r, startAngle, endAngle);
      const pct = ((d.value / total) * 100).toFixed(1);
      return `<path d="${path}" fill="none" stroke="${d.color}" stroke-width="${thickness}" stroke-linecap="butt">
        <title>${d.label}: ${d.value} (${pct}%)</title>
      </path>`;
    }).join('');

    const center = opts.centerLabel ? `
      <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="${size / 8}" font-weight="800" fill="#0F2010">${opts.centerValue || total}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="${size / 18}" fill="#6b7280" letter-spacing="1px">${opts.centerLabel}</text>
    ` : '';

    return `
      <div class="chart-donut" style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="flex-shrink:0">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="${thickness}"/>
          ${arcs}
          ${center}
        </svg>
        <div class="chart-legend" style="flex:1;min-width:140px">
          ${data.map(d => `
            <div style="display:flex;align-items:center;gap:.5rem;font-size:.82rem;margin-bottom:.4rem">
              <span style="width:10px;height:10px;border-radius:50%;background:${d.color};flex-shrink:0"></span>
              <span style="flex:1">${d.label}</span>
              <strong>${d.value}</strong>
              <span style="color:#9ca3af;font-size:.72rem;min-width:42px;text-align:right">${((d.value / total) * 100).toFixed(0)}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function arcPath(cx, cy, r, startDeg, endDeg) {
    // Avoid 360 → arc not drawn; subtract a tiny amount
    if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99;
    const start = polar(cx, cy, r, endDeg);
    const end = polar(cx, cy, r, startDeg);
    const largeArc = endDeg - startDeg <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /* ----------- BAR CHART (vertical) ----------- */
  function bar(data, opts = {}) {
    const w = opts.width || 560;
    const h = opts.height || 220;
    const pad = { l: 40, r: 16, t: 20, b: 36 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = innerW / data.length * 0.65;
    const step = innerW / data.length;

    const yTicks = 4;
    const yGrid = [];
    for (let i = 0; i <= yTicks; i++) {
      const y = pad.t + (innerH * i / yTicks);
      const val = Math.round(max * (1 - i / yTicks));
      yGrid.push(`
        <line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>
        <text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9ca3af">${val}</text>
      `);
    }

    const bars = data.map((d, i) => {
      const x = pad.l + step * i + (step - barW) / 2;
      const barH = (d.value / max) * innerH;
      const y = pad.t + innerH - barH;
      const color = d.color || '#1B5E20';
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.85">
            <title>${d.label}: ${d.value}</title>
          </rect>
          <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#374151">${opts.formatLabel ? opts.formatLabel(d.value) : d.value}</text>
          <text x="${x + barW / 2}" y="${h - 10}" text-anchor="middle" font-size="11" fill="#6b7280">${d.label}</text>
        </g>
      `;
    }).join('');

    return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="display:block">${yGrid.join('')}${bars}</svg>`;
  }

  /* ----------- LINE CHART (trend) ----------- */
  function line(series, opts = {}) {
    const w = opts.width || 560;
    const h = opts.height || 220;
    const pad = { l: 40, r: 16, t: 20, b: 36 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;

    const allValues = series.flatMap(s => s.data.map(d => d.y));
    const max = Math.max(...allValues, 1);
    const min = Math.min(...allValues, 0);
    const range = max - min || 1;

    const xLabels = series[0].data.map(d => d.x);
    const step = innerW / (xLabels.length - 1 || 1);

    const yTicks = 4;
    const yGrid = [];
    for (let i = 0; i <= yTicks; i++) {
      const y = pad.t + (innerH * i / yTicks);
      const val = Math.round((max - (range * i / yTicks)) * 10) / 10;
      yGrid.push(`
        <line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>
        <text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9ca3af">${opts.formatY ? opts.formatY(val) : val}</text>
      `);
    }

    const xLabelEls = xLabels.map((lbl, i) => {
      const x = pad.l + step * i;
      return `<text x="${x}" y="${h - 10}" text-anchor="middle" font-size="10" fill="#6b7280">${lbl}</text>`;
    }).join('');

    const lines = series.map((s, idx) => {
      const color = s.color || ['#1B5E20', '#C8102E', '#2563eb', '#9333ea'][idx % 4];
      const points = s.data.map((d, i) => {
        const x = pad.l + step * i;
        const y = pad.t + innerH - ((d.y - min) / range) * innerH;
        return [x, y];
      });
      const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');
      const areaD = pathD + ` L ${points[points.length-1][0]} ${pad.t + innerH} L ${points[0][0]} ${pad.t + innerH} Z`;
      const dots = points.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="white" stroke="${color}" stroke-width="2"><title>${s.data[i].x}: ${s.data[i].y}</title></circle>`).join('');

      return `
        ${opts.area !== false ? `<path d="${areaD}" fill="${color}" opacity="0.08"/>` : ''}
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      `;
    }).join('');

    const legend = series.length > 1 ? `
      <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:.5rem;font-size:.82rem">
        ${series.map((s, idx) => `
          <span style="display:flex;align-items:center;gap:.35rem">
            <span style="width:14px;height:3px;background:${s.color || ['#1B5E20', '#C8102E'][idx % 2]}"></span>
            ${s.label}
          </span>
        `).join('')}
      </div>
    ` : '';

    return `
      <div>
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="display:block">${yGrid.join('')}${lines}${xLabelEls}</svg>
        ${legend}
      </div>
    `;
  }

  /* ----------- SPARKLINE (mini) ----------- */
  function sparkline(values, opts = {}) {
    const w = opts.width || 100;
    const h = opts.height || 32;
    const color = opts.color || '#1B5E20';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = w / (values.length - 1 || 1);
    const points = values.map((v, i) => {
      const x = step * i;
      const y = h - ((v - min) / range) * h * 0.85 - h * 0.1;
      return [x, y];
    });
    const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');
    const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`;
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:inline-block;vertical-align:middle">
      <path d="${areaD}" fill="${color}" opacity="0.15"/>
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /* ----------- PROGRESS RING ----------- */
  function progressRing(value, opts = {}) {
    const size = opts.size || 100;
    const thickness = opts.thickness || 10;
    const cx = size / 2, cy = size / 2;
    const r = (size - thickness) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(Math.max(value, 0), 100);
    const offset = circ * (1 - pct / 100);
    const color = opts.color || (pct >= 100 ? '#16a34a' : pct >= 70 ? '#1B5E20' : pct >= 40 ? '#eab308' : '#dc2626');
    const label = opts.label || (pct.toFixed(0) + '%');

    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:inline-block">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="${thickness}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${thickness}"
              stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
              transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="${size / 5}" font-weight="800" fill="${color}">${label}</text>
    </svg>`;
  }

  /* ----------- HORIZONTAL BAR (rank) ----------- */
  function rankBar(data, opts = {}) {
    const max = Math.max(...data.map(d => d.value), 1);
    return `<div class="chart-rankbar">
      ${data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = d.color || (i === 0 ? '#1B5E20' : i === 1 ? '#2E7D32' : i === 2 ? '#43A047' : '#6b7280');
        return `
          <div style="margin-bottom:.6rem">
            <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.25rem">
              <span style="display:flex;gap:.5rem;align-items:center">
                ${d.medal ? `<span style="font-size:1rem">${d.medal}</span>` : ''}
                <span>${d.label}</span>
              </span>
              <strong>${opts.formatValue ? opts.formatValue(d.value) : d.value}</strong>
            </div>
            <div style="background:#f3f4f6;height:10px;border-radius:5px;overflow:hidden">
              <div style="background:linear-gradient(90deg,${color},${color}cc);height:100%;width:${pct}%;border-radius:5px;transition:width .4s"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
  }

  return { donut, bar, line, sparkline, progressRing, rankBar };
})();
