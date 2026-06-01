/* ============================================================
 * FUTA LAND - SHARED LOGIC
 * Modal · Filter · Compare · Export PDF
 * ============================================================ */

const compareList = [];  // Lưu các unit/villa đang so sánh
let currentProject = null;

// ============================================================
// PARSE URL - lấy project ID từ query string
// ============================================================
function getProjectFromURL(defaultType) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('project');
  if (id) {
    const p = getProject(id);
    if (p && p.type === defaultType) return p;
  }
  // Fallback: dự án đầu tiên đúng type
  return PROJECTS.find(p => p.type === defaultType);
}

// ============================================================
// HIỂN THỊ HEADER với tên dự án
// ============================================================
function renderProjectHeader(project) {
  const headerProject = document.getElementById('projectName');
  if (headerProject) headerProject.textContent = project.name;
  document.title = `${project.name} - FUTA Land Sa Bàn Số`;
}

// ============================================================
// MODAL CHI TIẾT CĂN HỘ / BIỆT THỰ
// ============================================================
function openUnitModal(unit, project) {
  const modal = document.getElementById('unitModal');
  const isApartment = project.type === 'apartment';

  // Đánh dấu villa cho virtual viewer
  unit._isVilla = !isApartment;
  window._activeUnit = unit;
  window._activeProject = project;

  const detailItems = isApartment ? [
    { label: 'Mã căn', value: unit.code },
    { label: 'Tầng', value: unit.floor },
    { label: 'Diện tích', value: `${unit.area} m²` },
    { label: 'Phòng ngủ', value: unit.bedrooms },
    { label: 'Phòng tắm', value: unit.bathrooms },
    { label: 'Hướng', value: unit.direction },
    { label: 'View', value: unit.view },
    { label: 'Ban công', value: unit.balcony ? 'Có' : 'Không' }
  ] : [
    { label: 'Mã căn', value: unit.id },
    { label: 'Vị trí', value: unit.code },
    { label: 'Loại hình', value: unit.type },
    { label: 'DT xây dựng', value: `${unit.area} m²` },
    { label: 'DT đất', value: `${unit.landArea} m²` },
    { label: 'Phòng ngủ', value: unit.bedrooms },
    { label: 'Phòng tắm', value: unit.bathrooms },
    { label: 'Hướng', value: unit.direction }
  ];

  // Sử dụng modal-wide cho virtual viewer
  modal.querySelector('.modal').classList.add('modal-wide');
  modal.querySelector('.modal').innerHTML = `
    <div class="modal-header">
      <div>
        <h2>${unit.code || unit.id}</h2>
        <div class="modal-sub">${project.name} · ${isApartment ? `Tầng ${unit.floor}` : unit.type}</div>
      </div>
      <button class="modal-close" onclick="closeModal('unitModal')">×</button>
    </div>
    <div class="modal-body">

      ${renderVirtualTabs(unit, project)}

      <div style="margin: 1.5rem 0 1rem;">
        <span class="status-pill" style="background:${STATUS_COLOR[unit.status]}">${STATUS_LABEL[unit.status]}</span>
      </div>

      <div class="detail-grid">
        ${detailItems.map(d => `
          <div class="detail-item">
            <div class="label">${d.label}</div>
            <div class="value">${d.value}</div>
          </div>
        `).join('')}
        <div class="detail-item" style="grid-column: span 2;">
          <div class="label">Giá bán</div>
          <div class="value price">${formatPriceDetail(unit.price)}</div>
        </div>
      </div>

      <div class="print-only" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #1a1a2e;">
        <p style="text-align:center; font-size:.85rem; color: #6b7280;">
          📞 Hotline: 1900 6067 · 🌐 www.futaland.vn<br>
          Báo giá có giá trị trong 7 ngày kể từ ngày phát hành.
        </p>
      </div>

      <div class="modal-actions">
        <button class="btn btn-outline" onclick="addToCompare('${unit.id}')">
          ⚖️ Thêm vào so sánh
        </button>
        <button class="btn btn-primary" onclick="window.print()">
          🖨️ In / Xuất PDF báo giá
        </button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  // Cleanup virtual viewer khi đóng modal
  if (typeof cleanupVirtualMode === 'function') cleanupVirtualMode();
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    if (typeof cleanupVirtualMode === 'function') cleanupVirtualMode();
  }
});

// ============================================================
// SO SÁNH NHIỀU CĂN
// ============================================================
function addToCompare(unitId) {
  const project = currentProject;
  let unit = null;
  if (project.type === 'apartment') {
    for (const f of project.floors) {
      const u = f.units.find(u => u.id === unitId);
      if (u) { unit = u; break; }
    }
  } else {
    unit = project.villas.find(v => v.id === unitId);
  }
  if (!unit) return;

  if (compareList.find(c => c.id === unitId)) {
    alert('Căn này đã có trong danh sách so sánh');
    return;
  }
  if (compareList.length >= 4) {
    alert('Chỉ so sánh tối đa 4 căn cùng lúc');
    return;
  }
  compareList.push(unit);
  renderCompareDrawer();
  closeModal('unitModal');
}

function removeFromCompare(unitId) {
  const idx = compareList.findIndex(c => c.id === unitId);
  if (idx > -1) compareList.splice(idx, 1);
  renderCompareDrawer();
}

function clearCompare() {
  compareList.length = 0;
  renderCompareDrawer();
}

function renderCompareDrawer() {
  const drawer = document.getElementById('compareDrawer');
  if (!drawer) return;

  if (compareList.length === 0) {
    drawer.classList.remove('open');
    return;
  }

  drawer.classList.add('open');
  drawer.innerHTML = `
    <div class="compare-drawer-inner">
      <div style="font-weight:700; color: var(--gray-700);">
        ⚖️ So sánh (${compareList.length}/4):
      </div>
      <div class="compare-chips">
        ${compareList.map(u => `
          <span class="compare-chip">
            ${u.code || u.id}
            <button onclick="removeFromCompare('${u.id}')" title="Xoá">×</button>
          </span>
        `).join('')}
      </div>
      <button class="btn btn-outline" onclick="clearCompare()">Xoá hết</button>
      <button class="btn btn-primary" onclick="openCompareModal()" ${compareList.length < 2 ? 'disabled style="opacity:.5"' : ''}>
        Xem bảng so sánh
      </button>
    </div>
  `;
}

function openCompareModal() {
  if (compareList.length < 2) return;
  const modal = document.getElementById('unitModal');
  const isApartment = currentProject.type === 'apartment';

  const rows = isApartment ? [
    ['Mã căn',      u => u.code],
    ['Tầng',        u => u.floor],
    ['Diện tích',   u => `${u.area} m²`],
    ['Phòng ngủ',   u => u.bedrooms],
    ['Phòng tắm',   u => u.bathrooms],
    ['Hướng',       u => u.direction],
    ['View',        u => u.view],
    ['Ban công',    u => u.balcony ? 'Có' : 'Không'],
    ['Trạng thái',  u => `<span class="status-pill" style="background:${STATUS_COLOR[u.status]}">${STATUS_LABEL[u.status]}</span>`],
    ['Giá',         u => `<strong style="color:var(--futa-orange-dark)">${formatPriceDetail(u.price)}</strong>`]
  ] : [
    ['Mã căn',       u => u.id],
    ['Vị trí',       u => u.code],
    ['Loại hình',    u => u.type],
    ['DT xây dựng',  u => `${u.area} m²`],
    ['DT đất',       u => `${u.landArea} m²`],
    ['Phòng ngủ',    u => u.bedrooms],
    ['Hướng',        u => u.direction],
    ['Trạng thái',   u => `<span class="status-pill" style="background:${STATUS_COLOR[u.status]}">${STATUS_LABEL[u.status]}</span>`],
    ['Giá',          u => `<strong style="color:var(--futa-orange-dark)">${formatPriceDetail(u.price)}</strong>`]
  ];

  modal.querySelector('.modal').innerHTML = `
    <div class="modal-header">
      <div>
        <h2>Bảng so sánh ${compareList.length} căn</h2>
        <div class="modal-sub">${currentProject.name}</div>
      </div>
      <button class="modal-close" onclick="closeModal('unitModal')">×</button>
    </div>
    <div class="modal-body">
      <div style="overflow-x:auto;">
        <table class="compare-table">
          <thead>
            <tr>
              <th></th>
              ${compareList.map(u => `<th>${u.code || u.id}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(([label, fn]) => `
              <tr>
                <td>${label}</td>
                ${compareList.map(u => `<td>${fn(u)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="print-only" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #1a1a2e;">
        <p style="text-align:center; font-size:.85rem; color: #6b7280;">
          📞 Hotline: 1900 6067 · 🌐 www.futaland.vn
        </p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeModal('unitModal')">Đóng</button>
        <button class="btn btn-primary" onclick="window.print()">🖨️ In bảng so sánh</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

// ============================================================
// FILTER (dùng chung cho apartment & villa)
// ============================================================
function buildFilterBar(onFilterChange) {
  return `
    <div class="filter-bar">
      <div class="filter-group">
        <label>Trạng thái</label>
        <select id="filterStatus" onchange="(${onFilterChange.name})()">
          <option value="">Tất cả</option>
          <option value="available">🟢 Còn trống</option>
          <option value="reserved">🟡 Đã giữ chỗ</option>
          <option value="sold">🔴 Đã bán</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Hướng</label>
        <select id="filterDirection" onchange="(${onFilterChange.name})()">
          <option value="">Tất cả</option>
          <option>Đông</option><option>Tây</option>
          <option>Nam</option><option>Bắc</option>
          <option>Đông Nam</option><option>Tây Nam</option>
          <option>Đông Bắc</option><option>Tây Bắc</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Diện tích tối thiểu (m²)</label>
        <input type="number" id="filterMinArea" placeholder="VD: 80" oninput="(${onFilterChange.name})()">
      </div>
      <div class="filter-group">
        <label>Ngân sách tối đa (tỷ)</label>
        <input type="number" id="filterMaxPrice" placeholder="VD: 5" step="0.5" oninput="(${onFilterChange.name})()">
      </div>
      <div class="status-legend">
        <span><span class="legend-dot" style="background:#16a34a"></span>Còn</span>
        <span><span class="legend-dot" style="background:#eab308"></span>Giữ chỗ</span>
        <span><span class="legend-dot" style="background:#dc2626"></span>Đã bán</span>
      </div>
    </div>
  `;
}

function getActiveFilters() {
  return {
    status:    document.getElementById('filterStatus')?.value || '',
    direction: document.getElementById('filterDirection')?.value || '',
    minArea:   parseFloat(document.getElementById('filterMinArea')?.value) || 0,
    maxPrice:  parseFloat(document.getElementById('filterMaxPrice')?.value) * 1000 || Infinity
  };
}

function matchFilters(unit, filters) {
  if (filters.status && unit.status !== filters.status) return false;
  if (filters.direction && unit.direction !== filters.direction) return false;
  if (filters.minArea && unit.area < filters.minArea) return false;
  if (filters.maxPrice && unit.price > filters.maxPrice) return false;
  return true;
}

// ============================================================
// SVG ILLUSTRATIONS - ưu tiên dùng phiên bản architectural từ covers.js
// ============================================================
function floorplanSVG(unit) {
  // Dùng phiên bản kiến trúc nếu có
  if (typeof floorplanArchitecturalSVG === 'function') {
    return floorplanArchitecturalSVG(unit);
  }
  return floorplanSVGFallback(unit);
}

function villaIllustrationSVG(villa) {
  if (typeof villaArchitecturalSVG === 'function') {
    return villaArchitecturalSVG(villa);
  }
  return villaIllustrationSVGFallback(villa);
}

// Fallback (placeholder cũ)
function floorplanSVGFallback(unit) {
  return `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff4ea"/>
          <stop offset="100%" stop-color="#fde4cc"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#fp)"/>
      <g stroke="#7c2d12" stroke-width="3" fill="white">
        <!-- Outer wall -->
        <rect x="40" y="40" width="320" height="160"/>
        <!-- Living -->
        <rect x="40" y="40" width="180" height="100"/>
        <text x="130" y="95" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#7c2d12" stroke="none">Phòng khách</text>
        <!-- Bedroom 1 -->
        <rect x="220" y="40" width="140" height="80"/>
        <text x="290" y="85" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#7c2d12" stroke="none">Phòng ngủ 1</text>
        <!-- Bedroom 2 -->
        ${unit.bedrooms >= 2 ? `
          <rect x="220" y="120" width="140" height="80"/>
          <text x="290" y="165" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#7c2d12" stroke="none">Phòng ngủ 2</text>
        ` : ''}
        <!-- Kitchen -->
        <rect x="40" y="140" width="100" height="60"/>
        <text x="90" y="175" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#7c2d12" stroke="none">Bếp</text>
        <!-- Bath -->
        <rect x="140" y="140" width="80" height="60"/>
        <text x="180" y="175" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="700" fill="#7c2d12" stroke="none">WC</text>
      </g>
      <text x="200" y="225" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#9ca3af">Mặt bằng minh hoạ · ${unit.area} m²</text>
    </svg>
  `;
}

function villaIllustrationSVGFallback(villa) {
  return `
    <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7dd3fc"/>
          <stop offset="100%" stop-color="#e0f2fe"/>
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#sky)"/>
      <!-- Ground -->
      <rect x="0" y="180" width="400" height="60" fill="#86efac"/>
      <!-- Villa -->
      <rect x="120" y="100" width="160" height="80" fill="#fef3c7" stroke="#92400e" stroke-width="2"/>
      <polygon points="120,100 200,50 280,100" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
      <!-- Door -->
      <rect x="185" y="135" width="30" height="45" fill="#7c2d12"/>
      <!-- Windows -->
      <rect x="135" y="120" width="30" height="30" fill="#bae6fd" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="235" y="120" width="30" height="30" fill="#bae6fd" stroke="#1e3a8a" stroke-width="2"/>
      <!-- 2nd floor if applicable -->
      ${villa.bedrooms >= 4 ? `
        <rect x="155" y="60" width="30" height="25" fill="#bae6fd" stroke="#1e3a8a" stroke-width="2"/>
        <rect x="215" y="60" width="30" height="25" fill="#bae6fd" stroke="#1e3a8a" stroke-width="2"/>
      ` : ''}
      <!-- Trees -->
      <circle cx="60" cy="170" r="18" fill="#15803d"/>
      <rect x="57" y="170" width="6" height="20" fill="#7c2d12"/>
      <circle cx="340" cy="170" r="18" fill="#15803d"/>
      <rect x="337" y="170" width="6" height="20" fill="#7c2d12"/>
      <text x="200" y="225" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#1e3a8a">${villa.type} · ${villa.area} m² xây dựng / ${villa.landArea} m² đất</text>
    </svg>
  `;
}

// ============================================================
// SHARED HEADER (dùng cho cả 2 trang)
// ============================================================
function renderSharedHeader(activePage) {
  return `
    <header class="header">
      <div class="header-inner">
        <a href="index.html" class="logo">
          <img src="assets/img/logo-futa-land.png" alt="FUTA Land" class="logo-img">
          <div class="logo-divider"></div>
          <div class="logo-text">
            <strong>Sa Bàn Số</strong>
            <span class="logo-sub" id="projectName">Digital Showroom</span>
          </div>
        </a>
        <nav class="nav">
          <a href="index.html">Trang chủ</a>
          <a href="apartment.html" class="${activePage === 'apartment' ? 'active' : ''}">Chung cư</a>
          <a href="villa.html" class="${activePage === 'villa' ? 'active' : ''}">Biệt thự</a>
        </nav>
      </div>
    </header>
  `;
}
