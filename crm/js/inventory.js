/* ============================================================
 * FUTA HUB CRM - INVENTORY (Quỹ căn)
 * Đọc units từ Digital Showroom PROJECTS, áp override từ CRM
 * + Map view (stack plan / site map) + So sánh ≤4 căn
 * ============================================================ */

const Inventory = (function () {
  let filters = { project: '', status: '', type: '', minPrice: '', maxPrice: '', minBed: '' };
  let viewMode = 'grid'; // grid | map
  let compareIds = [];

  function getFiltered() {
    const units = Storage.getEnrichedUnits();
    return units.filter(u => {
      if (filters.project && u.projectId !== filters.project) return false;
      if (filters.status && u.status !== filters.status) return false;
      if (filters.type && u.type !== filters.type) return false;
      if (filters.minPrice && u.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && u.price > parseInt(filters.maxPrice)) return false;
      if (filters.minBed && u.bedrooms < parseInt(filters.minBed)) return false;
      return true;
    });
  }

  function render() {
    const units = Storage.getEnrichedUnits();
    const filtered = getFiltered();
    const total = units.length;
    const avail = units.filter(u => u.status === 'available').length;
    const reserved = units.filter(u => u.status === 'reserved').length;
    const sold = units.filter(u => u.status === 'sold').length;
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Quỹ căn</h1>
          <p>Đồng bộ với <a href="../index.html" style="color:var(--futa-green);font-weight:600">Sa bàn số</a> · ${filtered.length} / ${total} căn</p>
        </div>
        <div class="page-actions">
          <div class="tab-switch">
            <button class="tab-btn ${viewMode === 'grid' ? 'active' : ''}" onclick="Inventory.switchView('grid')">▦ Lưới</button>
            <button class="tab-btn ${viewMode === 'map' ? 'active' : ''}" onclick="Inventory.switchView('map')">🗺️ Sơ đồ</button>
          </div>
          <a href="../index.html" class="btn btn-secondary">Mở Sa bàn ↗</a>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">🏘️</div>
          <div class="kpi-label">Tổng căn</div>
          <div class="kpi-value">${total}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🟢</div>
          <div class="kpi-label">Còn trống</div>
          <div class="kpi-value" style="color:var(--green)">${avail}</div>
          <div class="kpi-meta">${((avail / total) * 100).toFixed(0)}% tổng quỹ</div>
        </div>
        <div class="kpi-card kpi-yellow">
          <div class="kpi-icon">🟡</div>
          <div class="kpi-label">Đã giữ chỗ</div>
          <div class="kpi-value" style="color:#ca8a04">${reserved}</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">🔴</div>
          <div class="kpi-label">Đã bán</div>
          <div class="kpi-value" style="color:var(--red)">${sold}</div>
          <div class="kpi-meta">${((sold / total) * 100).toFixed(0)}% tổng quỹ</div>
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-tools">
          <select id="iProject">
            <option value="">Mọi dự án</option>
            ${projects.map(p => `<option value="${p.id}" ${filters.project === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
          <select id="iStatus">
            <option value="">Mọi trạng thái</option>
            <option value="available" ${filters.status === 'available' ? 'selected' : ''}>🟢 Còn trống</option>
            <option value="reserved"  ${filters.status === 'reserved' ? 'selected' : ''}>🟡 Đã giữ chỗ</option>
            <option value="sold"      ${filters.status === 'sold' ? 'selected' : ''}>🔴 Đã bán</option>
          </select>
          <select id="iType">
            <option value="">Mọi loại</option>
            <option value="apartment" ${filters.type === 'apartment' ? 'selected' : ''}>🏢 Chung cư</option>
            <option value="villa"     ${filters.type === 'villa' ? 'selected' : ''}>🏡 Biệt thự / Nhà phố</option>
          </select>
          <input type="number" id="iMinPrice" placeholder="Giá từ (triệu)" value="${filters.minPrice}" style="width:130px">
          <input type="number" id="iMaxPrice" placeholder="Đến" value="${filters.maxPrice}" style="width:110px">
          <select id="iMinBed">
            <option value="">PN ≥</option>
            <option value="1" ${filters.minBed === '1' ? 'selected' : ''}>1 PN</option>
            <option value="2" ${filters.minBed === '2' ? 'selected' : ''}>2 PN</option>
            <option value="3" ${filters.minBed === '3' ? 'selected' : ''}>3 PN</option>
            <option value="4" ${filters.minBed === '4' ? 'selected' : ''}>4 PN</option>
          </select>
          <div class="spacer"></div>
          <button class="btn btn-ghost btn-sm" onclick="Inventory.clearFilters()">↺ Xoá lọc</button>
        </div>

        <div style="padding:1rem" id="invContent">
          ${viewMode === 'grid' ? renderGrid(filtered) : renderMap(filtered)}
        </div>
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;

    document.getElementById('iProject').onchange = e => { filters.project = e.target.value; render(); };
    document.getElementById('iStatus').onchange = e => { filters.status = e.target.value; render(); };
    document.getElementById('iType').onchange = e => { filters.type = e.target.value; render(); };
    document.getElementById('iMinPrice').oninput = e => { filters.minPrice = e.target.value; clearTimeout(window._invT); window._invT = setTimeout(render, 250); };
    document.getElementById('iMaxPrice').oninput = e => { filters.maxPrice = e.target.value; clearTimeout(window._invT); window._invT = setTimeout(render, 250); };
    document.getElementById('iMinBed').onchange = e => { filters.minBed = e.target.value; render(); };

    renderCompareBar();
  }

  /* ----------- GRID VIEW ----------- */
  function renderGrid(filtered) {
    if (filtered.length === 0) return `<div class="empty"><div class="empty-icon">🏘️</div><h3>Không tìm thấy căn nào</h3></div>`;
    return `<div class="unit-grid">${filtered.map(u => renderUnitCard(u)).join('')}</div>`;
  }

  function renderUnitCard(u) {
    const status = u.status || 'available';
    const inCompare = compareIds.includes(u.id);
    return `
      <div class="unit-card status-${status}">
        <div onclick="Inventory.openDetail('${u.id}')">
          <div class="unit-project">${u.projectName}</div>
          <div class="unit-code">${u.code}</div>
          <div class="unit-info">
            <span>📐 ${u.area}m²</span>
            <span>🛏 ${u.bedrooms}PN</span>
            <span>🧭 ${u.direction || '—'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:.4rem">
            <div class="unit-price">${formatVND(u.price)}</div>
            <span style="font-size:.72rem;color:var(--gray-700)">
              <span class="unit-status-dot ${status}"></span>${({available:'Còn',reserved:'Giữ chỗ',sold:'Đã bán'})[status]}
            </span>
          </div>
        </div>
        <button class="compare-toggle ${inCompare ? 'active' : ''}" onclick="event.stopPropagation();Inventory.toggleCompare('${u.id}')">
          ${inCompare ? '✓ Đang so sánh' : '⇄ So sánh'}
        </button>
      </div>
    `;
  }

  /* ----------- MAP VIEW ----------- */
  function renderMap(filtered) {
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
    // chọn dự án để vẽ: nếu đang lọc 1 dự án thì vẽ dự án đó, không thì vẽ tất cả
    const toDraw = filters.project ? projects.filter(p => p.id === filters.project) : projects;
    if (!toDraw.length) return `<div class="empty"><div class="empty-icon">🗺️</div><h3>Không có dự án</h3></div>`;

    const filteredIds = new Set(filtered.map(u => u.id));

    return `
      <div class="map-legend">
        <span><span class="unit-status-dot available"></span> Còn trống</span>
        <span><span class="unit-status-dot reserved"></span> Đã giữ chỗ</span>
        <span><span class="unit-status-dot sold"></span> Đã bán</span>
        <span style="color:var(--gray-500)">· Ô mờ = không khớp bộ lọc · Click để xem chi tiết</span>
      </div>
      ${toDraw.map(p => p.type === 'apartment' ? renderStackPlan(p, filteredIds) : renderSiteMap(p, filteredIds)).join('')}
    `;
  }

  // Stack plan cho chung cư: mỗi hàng = 1 tầng (cao xuống thấp)
  function renderStackPlan(project, filteredIds) {
    const enriched = Storage.getEnrichedUnits();
    const byId = {};
    enriched.forEach(u => { byId[u.id] = u; });

    const floors = [...project.floors].sort((a, b) => b.floorNumber - a.floorNumber);
    return `
      <div class="map-project">
        <h3 class="map-title">🏢 ${project.name} — Mặt cắt tầng (stack plan)</h3>
        <div class="stack-plan">
          ${floors.map(f => `
            <div class="stack-row">
              <div class="stack-floor">T${f.floorNumber}</div>
              <div class="stack-units">
                ${f.units.map(rawU => {
                  const u = byId[rawU.id] || rawU;
                  const st = u.status || 'available';
                  const dim = filteredIds.has(u.id) ? '' : 'dim';
                  return `<div class="stack-cell st-${st} ${dim}" title="${u.code} · ${formatVND(u.price)} · ${({available:'Còn',reserved:'Giữ chỗ',sold:'Đã bán'})[st]}"
                       onclick="Inventory.openDetail('${u.id}')">
                    <span class="stack-cell-code">${u.code.split('.')[0]}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Site map cho biệt thự: vẽ SVG polygon theo toạ độ %
  function renderSiteMap(project, filteredIds) {
    const enriched = Storage.getEnrichedUnits();
    const byId = {};
    enriched.forEach(u => { byId[u.id] = u; });

    const colors = { available: '#16a34a', reserved: '#eab308', sold: '#dc2626' };
    const villas = project.villas || [];

    return `
      <div class="map-project">
        <h3 class="map-title">🏡 ${project.name} — Sơ đồ phân lô</h3>
        <div class="site-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:420px;background:linear-gradient(160deg,#eef6ee,#dceede);border-radius:12px">
            <!-- hồ trung tâm -->
            <ellipse cx="50" cy="50" rx="14" ry="9" fill="#7dd3fc" opacity="0.5"/>
            <text x="50" y="51" text-anchor="middle" font-size="2.5" fill="#0369a1">Hồ bơi</text>
            ${villas.map(v => {
              const u = byId[v.id] || v;
              const st = u.status || 'available';
              const dim = filteredIds.has(u.id) ? '1' : '0.25';
              const cx = avgPolyX(v.polygon);
              const cy = avgPolyY(v.polygon);
              return `
                <polygon points="${v.polygon}" fill="${colors[st]}" opacity="${dim}" stroke="white" stroke-width="0.4"
                  style="cursor:pointer" onclick="Inventory.openDetail('${u.id}')">
                  <title>${u.code} · ${u.type} · ${formatVND(u.price)} · ${({available:'Còn',reserved:'Giữ chỗ',sold:'Đã bán'})[st]}</title>
                </polygon>
                <text x="${cx}" y="${cy}" text-anchor="middle" font-size="2.2" fill="white" font-weight="bold" style="pointer-events:none">${u.id.replace('V-', '')}</text>
              `;
            }).join('')}
          </svg>
        </div>
      </div>
    `;
  }

  function avgPolyX(poly) {
    const pts = poly.split(' ').map(p => parseFloat(p.split(',')[0]));
    return pts.reduce((a, b) => a + b, 0) / pts.length;
  }
  function avgPolyY(poly) {
    const pts = poly.split(' ').map(p => parseFloat(p.split(',')[1]));
    return pts.reduce((a, b) => a + b, 0) / pts.length;
  }

  /* ----------- COMPARE ----------- */
  function toggleCompare(unitId) {
    const i = compareIds.indexOf(unitId);
    if (i >= 0) compareIds.splice(i, 1);
    else {
      if (compareIds.length >= 4) { toast('Chỉ so sánh tối đa 4 căn', 'warning'); return; }
      compareIds.push(unitId);
    }
    render();
  }
  function clearCompare() {
    compareIds = [];
    render();
  }
  function renderCompareBar() {
    let bar = document.getElementById('compareBar');
    if (compareIds.length === 0) {
      if (bar) bar.remove();
      return;
    }
    const units = Storage.getEnrichedUnits();
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'compareBar';
      bar.className = 'compare-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML = `
      <span style="font-weight:700">⇄ So sánh (${compareIds.length}/4):</span>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;flex:1">
        ${compareIds.map(id => {
          const u = units.find(x => x.id === id);
          return u ? `<span class="compare-chip">${u.code}<span onclick="Inventory.toggleCompare('${id}')" style="cursor:pointer;margin-left:.3rem">×</span></span>` : '';
        }).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" onclick="Inventory.clearCompare()">Xóa hết</button>
      <button class="btn btn-primary btn-sm" onclick="Inventory.openCompareModal()" ${compareIds.length < 2 ? 'disabled' : ''}>Xem so sánh →</button>
    `;
  }

  function openCompareModal() {
    if (compareIds.length < 2) return;
    const units = Storage.getEnrichedUnits();
    const items = compareIds.map(id => units.find(u => u.id === id)).filter(Boolean);

    const rows = [
      ['Dự án', u => u.projectName],
      ['Loại', u => u.type === 'apartment' ? '🏢 Chung cư' : '🏡 Biệt thự'],
      ['Giá niêm yết', u => `<strong style="color:var(--futa-red)">${formatVND(u.price)}</strong>`],
      ['Diện tích', u => u.area + 'm²'],
      ['Đất', u => u.landArea ? u.landArea + 'm²' : '—'],
      ['Giá/m²', u => formatVND(Math.round(u.price / u.area)) + '/m²'],
      ['Phòng ngủ', u => u.bedrooms + ' PN'],
      ['WC', u => (u.bathrooms || '—') + ''],
      ['Hướng', u => u.direction || '—'],
      ['View', u => u.view || '—'],
      ['Tầng', u => u.floor || '—'],
      ['Trạng thái', u => {
        const st = u.status || 'available';
        return `<span class="unit-status-dot ${st}"></span> ${({available:'Còn trống',reserved:'Giữ chỗ',sold:'Đã bán'})[st]}`;
      }]
    ];

    // tìm min giá & min giá/m² để highlight
    const minPrice = Math.min(...items.map(u => u.price));
    const minPpsm = Math.min(...items.map(u => u.price / u.area));

    const body = `
      <div style="overflow-x:auto">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Tiêu chí</th>
              ${items.map(u => `<th>${u.code}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label, fn]) => `
              <tr>
                <td class="compare-label">${label}</td>
                ${items.map(u => {
                  let cls = '';
                  if (label === 'Giá niêm yết' && u.price === minPrice) cls = 'best';
                  if (label === 'Giá/m²' && (u.price / u.area) === minPpsm) cls = 'best';
                  return `<td class="${cls}">${fn(u)}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p style="font-size:.78rem;color:var(--gray-500);margin-top:.75rem">💡 Ô <span class="best" style="padding:1px 6px;border-radius:4px">xanh</span> = tốt nhất (giá / giá theo m² thấp nhất)</p>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-primary" onclick="window.print()">🖨 In bảng so sánh</button>
    `;
    Modal.show({ title: 'So sánh ' + items.length + ' căn', body, footer, size: 'lg' });
  }

  /* ----------- DETAIL ----------- */
  function openDetail(unitId) {
    const units = Storage.getEnrichedUnits();
    const u = units.find(x => x.id === unitId);
    if (!u) return;
    const deals = Storage.getDeals().filter(d => d.unitId === unitId);
    const inCompare = compareIds.includes(unitId);

    const body = `
      <div class="info-grid">
        <div class="info-item"><label>Dự án</label><div>${u.projectName}</div></div>
        <div class="info-item"><label>Mã căn</label><div><strong>${u.code}</strong></div></div>
        <div class="info-item"><label>Loại</label><div>${u.type === 'apartment' ? '🏢 Chung cư' : '🏡 Biệt thự / Nhà phố'}</div></div>
        <div class="info-item"><label>Diện tích</label><div>${u.area}m²${u.landArea ? ' (đất ' + u.landArea + 'm²)' : ''}</div></div>
        <div class="info-item"><label>Số PN</label><div>${u.bedrooms}</div></div>
        <div class="info-item"><label>WC</label><div>${u.bathrooms || '—'}</div></div>
        <div class="info-item"><label>Hướng</label><div>${u.direction || '—'}</div></div>
        <div class="info-item"><label>View</label><div>${u.view || '—'}</div></div>
        <div class="info-item"><label>Giá niêm yết</label><div style="color:var(--futa-red);font-weight:700;font-size:1.1rem">${formatVND(u.price)}</div></div>
        <div class="info-item"><label>Trạng thái</label><div><span class="unit-status-dot ${u.status}"></span> ${({available:'Còn trống',reserved:'Đã giữ chỗ',sold:'Đã bán'})[u.status]}</div></div>
      </div>

      ${deals.length > 0 ? `
        <h4 style="margin:1rem 0 .5rem;color:var(--futa-green-dark)">Deal liên quan</h4>
        ${deals.map(d => {
          const st = DEAL_STAGES.find(s => s.key === d.stage);
          return `<div style="padding:.65rem .85rem;background:var(--gray-50);border-radius:8px;margin-bottom:.4rem;cursor:pointer" onclick="Modal.hide();App.navigate('deal/${d.id}')">
            <strong>${d.code}</strong> · ${d.leadName}
            <span class="pill" style="background:${st.color}22;color:${st.color};margin-left:.5rem">${st.label}</span>
          </div>`;
        }).join('')}
      ` : ''}
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-secondary" onclick="Inventory.toggleCompare('${u.id}');Modal.hide()">${inCompare ? '✓ Bỏ so sánh' : '⇄ Thêm so sánh'}</button>
      ${u.status === 'available' ? `<button class="btn btn-primary" onclick="Inventory.createDealFromUnit('${u.id}')">+ Tạo deal cho căn này</button>` : ''}
      ${u.status === 'reserved' ? `<button class="btn btn-secondary" onclick="Inventory.release('${u.id}')">Bỏ giữ chỗ</button>` : ''}
    `;

    Modal.show({ title: 'Chi tiết căn ' + u.code, body, footer, size: 'lg' });
  }

  function createDealFromUnit(unitId) {
    Modal.hide();
    Deals.openCreateModal(null, null, unitId);
  }

  function release(unitId) {
    if (!confirm('Bỏ giữ chỗ căn này?')) return;
    Storage.releaseUnit(unitId);
    Modal.hide();
    toast('Đã bỏ giữ chỗ', 'success');
    render();
  }

  function switchView(v) { viewMode = v; render(); }

  function clearFilters() {
    filters = { project: '', status: '', type: '', minPrice: '', maxPrice: '', minBed: '' };
    render();
  }

  return {
    render, openDetail, createDealFromUnit, release, clearFilters,
    switchView, toggleCompare, clearCompare, openCompareModal
  };
})();
