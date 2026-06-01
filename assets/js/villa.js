/* ============================================================
 * FUTA LAND - SA BÀN BIỆT THỰ
 * Logic: bird-view compound, click polygon → modal
 * ============================================================ */

// Init
(function init() {
  currentProject = getProjectFromURL('villa');
  if (!currentProject) {
    document.body.innerHTML = '<div class="empty"><h3>Không tìm thấy dự án biệt thự</h3></div>';
    return;
  }

  document.getElementById('headerSlot').innerHTML = renderSharedHeader('villa');
  renderProjectHeader(currentProject);
  document.getElementById('filterSlot').innerHTML = buildFilterBar(applyVillaFilter);
  document.getElementById('villaTitle').textContent = `Sa bàn tổng thể - ${currentProject.name}`;

  renderVillaMap();
  updateStatsBar();
})();

// ============================================================
// VẼ SA BÀN COMPOUND
// ============================================================
function renderVillaMap() {
  const svg = document.getElementById('villaMap');
  const filters = getActiveFilters();
  let html = '';

  // ===== Background: cảnh quan compound NÂNG CẤP =====
  html += `
    <defs>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a7e3a7"/>
        <stop offset="50%" stop-color="#86efac"/>
        <stop offset="100%" stop-color="#4ade80"/>
      </linearGradient>
      <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7dd3fc"/>
        <stop offset="50%" stop-color="#0ea5e9"/>
        <stop offset="100%" stop-color="#0c4a6e"/>
      </linearGradient>
      <linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7dd3fc"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
      <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="3" height="3">
        <rect width="3" height="3" fill="url(#grass)"/>
        <circle cx="1" cy="1" r=".15" fill="#15803d" opacity=".5"/>
        <circle cx="2" cy="2" r=".15" fill="#16a34a" opacity=".5"/>
      </pattern>
      <pattern id="roadPattern" patternUnits="userSpaceOnUse" width="2" height="6">
        <rect width="2" height="6" fill="#64748b"/>
        <rect x=".5" y="1" width="1" height="3" fill="#94a3b8" opacity=".5"/>
      </pattern>
      <filter id="villaShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation=".4"/>
        <feOffset dx="0" dy=".3"/>
        <feComponentTransfer><feFuncA type="linear" slope=".4"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="lightGlow">
        <stop offset="0%" stop-color="#FFE082" stop-opacity=".8"/>
        <stop offset="100%" stop-color="#FFE082" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- ===== NỀN ĐẤT CỎ ===== -->
    <rect x="0" y="0" width="100" height="100" fill="url(#grassPattern)"/>

    <!-- ===== SÔNG BAO QUANH ===== -->
    <!-- Sông phía trên -->
    <path d="M0,0 L100,0 L100,9 Q70,11 50,8 Q30,11 0,9 Z" fill="url(#water)"/>
    <path d="M0,9 Q30,11 50,8 Q70,11 100,9" stroke="white" stroke-width=".15" fill="none" opacity=".6"/>
    <!-- Sông phía dưới -->
    <path d="M0,91 Q30,88 50,92 Q70,88 100,91 L100,100 L0,100 Z" fill="url(#water)"/>
    <path d="M0,91 Q30,88 50,92 Q70,88 100,91" stroke="white" stroke-width=".15" fill="none" opacity=".6"/>
    <!-- Sông sparkle effect -->
    ${Array.from({length: 30}, (_, i) => `<circle cx="${3 + (i*3.3)%100}" cy="${i%2 ? 4.5 : 95}" r=".15" fill="white" opacity=".8"/>`).join('')}

    <!-- ===== ĐƯỜNG NỘI BỘ ===== -->
    <!-- Đường ngang chính -->
    <rect x="2" y="41" width="96" height="3" fill="url(#roadPattern)"/>
    <rect x="2" y="56" width="96" height="3" fill="url(#roadPattern)"/>
    <!-- Vạch chia làn -->
    <line x1="2" y1="42.5" x2="98" y2="42.5" stroke="white" stroke-width=".1" stroke-dasharray=".8,.6" opacity=".8"/>
    <line x1="2" y1="57.5" x2="98" y2="57.5" stroke="white" stroke-width=".1" stroke-dasharray=".8,.6" opacity=".8"/>
    <!-- Đường dọc -->
    <rect x="48.5" y="41" width="3" height="18" fill="url(#roadPattern)"/>

    <!-- ===== KHU TIỆN ÍCH TRUNG TÂM ===== -->
    <!-- Hồ bơi hình oval -->
    <ellipse cx="50" cy="50" rx="8" ry="3.5" fill="url(#poolGrad)"/>
    <ellipse cx="50" cy="49.5" rx="7" ry="2.8" fill="#bae6fd" opacity=".4"/>
    <text x="50" y="51" text-anchor="middle" fill="white" font-size="1.4" font-weight="700">HỒ BƠI</text>
    <!-- Ghế tắm nắng quanh hồ -->
    ${[44, 46, 54, 56].map(x => `<rect x="${x}" y="46.5" width="1" height=".4" fill="#fff" stroke="#92400e" stroke-width=".1"/>`).join('')}
    ${[44, 46, 54, 56].map(x => `<rect x="${x}" y="53" width="1" height=".4" fill="#fff" stroke="#92400e" stroke-width=".1"/>`).join('')}

    <!-- Sân tennis góc trái -->
    <g>
      <rect x="3" y="46" width="8" height="8" fill="#22c55e" stroke="white" stroke-width=".2"/>
      <line x1="7" y1="46" x2="7" y2="54" stroke="white" stroke-width=".15"/>
      <line x1="3" y1="50" x2="11" y2="50" stroke="white" stroke-width=".15"/>
      <text x="7" y="50.5" text-anchor="middle" fill="white" font-size=".9" font-weight="700">TENNIS</text>
    </g>

    <!-- Sân chơi trẻ em góc phải -->
    <g>
      <rect x="89" y="46" width="8" height="8" fill="#fde68a" stroke="#92400e" stroke-width=".2" rx=".5"/>
      <circle cx="91.5" cy="48.5" r=".6" fill="#dc2626"/>
      <circle cx="94.5" cy="51.5" r=".6" fill="#2563eb"/>
      <circle cx="92.5" cy="51.5" r=".4" fill="#f59e0b"/>
      <text x="93" y="50.5" text-anchor="middle" fill="#92400e" font-size=".8" font-weight="700">PLAY</text>
    </g>

    <!-- ===== CÔNG VIÊN CÂY XANH ===== -->
    ${Array.from({length: 25}, (_, i) => {
      const x = 5 + (i % 13) * 7.5;
      const y = i < 13 ? 44 : 56;
      const r = 0.6 + (i % 3) * 0.2;
      return `
        <circle cx="${x}" cy="${y}" r="${r + .2}" fill="#0F3D14" opacity=".5"/>
        <circle cx="${x}" cy="${y - .1}" r="${r}" fill="#1B5E20"/>
        <circle cx="${x - .3}" cy="${y}" r="${r * .7}" fill="#22c55e" opacity=".7"/>
      `;
    }).join('')}

    <!-- ===== CỔNG CHÍNH ===== -->
    <g>
      <rect x="46" y="13" width="8" height="3" fill="#7c2d12" stroke="#451a03" stroke-width=".2" rx=".3"/>
      <rect x="46.5" y="11" width="1" height="2" fill="#451a03"/>
      <rect x="52.5" y="11" width="1" height="2" fill="#451a03"/>
      <line x1="46" y1="14.5" x2="54" y2="14.5" stroke="#fbbf24" stroke-width=".15"/>
      <text x="50" y="15" text-anchor="middle" fill="white" font-size="1" font-weight="700">CỔNG CHÍNH</text>
    </g>

    <!-- ===== LABELS KHU ===== -->
    <text x="50" y="24" text-anchor="middle" fill="#0F3D14" font-size="2.2" font-weight="800" opacity=".4" letter-spacing="1">KHU BẮC</text>
    <text x="50" y="78" text-anchor="middle" fill="#0F3D14" font-size="2.2" font-weight="800" opacity=".4" letter-spacing="1">KHU NAM</text>

    <!-- ===== NORTH ARROW ===== -->
    <g transform="translate(95, 5)">
      <circle r="2.5" fill="white" opacity=".95" stroke="#1B5E20" stroke-width=".2"/>
      <polygon points="0,-1.8 .8,1 0,.5 -.8,1" fill="#C8102E"/>
      <text y="-3" text-anchor="middle" font-size="1.3" font-weight="700" fill="#1B5E20">N</text>
    </g>

    <!-- ===== LOGO FUTA STAMP ===== -->
    <g transform="translate(5, 5)">
      <rect width="14" height="3" fill="white" opacity=".9" rx=".3"/>
      <text x="7" y="2.1" text-anchor="middle" font-size="1.4" font-weight="800" fill="#1B5E20" letter-spacing=".3">FUTA LAND</text>
    </g>
  `;

  // ===== Vẽ từng villa - kiểu kiến trúc top-down với chi tiết =====
  currentProject.villas.forEach(villa => {
    const matches = matchFilters(villa, filters);
    const dimmed = !matches && hasActiveVillaFilters(filters);
    const statusColor = STATUS_COLOR[villa.status];
    const opacity = dimmed ? '0.15' : '1';

    // Tâm polygon
    const coords = villa.polygon.split(' ').map(p => p.split(',').map(Number));
    const cx = coords.reduce((s, p) => s + p[0], 0) / coords.length;
    const cy = coords.reduce((s, p) => s + p[1], 0) / coords.length;

    // Tính bounding box
    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    const w = Math.max(...xs) - x, h = Math.max(...ys) - y;

    // Đường viền sân nền (lot boundary)
    html += `
      <g class="villa-group" ${dimmed ? 'opacity=".15"' : ''}>
        <!-- Sân vườn quanh nhà -->
        <rect x="${x - 0.5}" y="${y - 0.5}" width="${w + 1}" height="${h + 1}"
              fill="#86efac" stroke="white" stroke-width=".15" opacity=".7" rx=".3"/>
        <!-- Bóng đổ -->
        <rect x="${x + 1.5}" y="${y + 2}" width="${w * 0.7}" height="${h * 0.6}"
              fill="black" opacity=".25" rx=".2"/>
        <!-- Mái nhà (status color) - hình lục giác mô phỏng mái dốc -->
        <polygon class="villa-polygon"
                 points="${x + 1},${y + 2} ${x + w/2},${y + 0.5} ${x + w - 1},${y + 2} ${x + w - 1},${y + h - 2} ${x + w/2},${y + h - 0.5} ${x + 1},${y + h - 2}"
                 fill="${statusColor}"
                 opacity="${opacity}"
                 stroke="white"
                 stroke-width=".2"
                 onclick="handleVillaClick('${villa.id}')"
                 style="cursor:pointer"/>
        <!-- Đường kẻ mái -->
        <line x1="${x + 1}" y1="${y + h/2}" x2="${x + w - 1}" y2="${y + h/2}"
              stroke="white" stroke-width=".15" opacity=".6" pointer-events="none"/>
        <!-- Sân trước (driveway) -->
        <rect x="${x + w/2 - 1}" y="${y + h - 1}" width="2" height="2"
              fill="#94a3b8" stroke="#475569" stroke-width=".1" opacity=".8" pointer-events="none"/>
        <!-- Cây trong sân -->
        <circle cx="${x + 0.5}" cy="${y + 0.5}" r=".4" fill="#15803d" pointer-events="none"/>
        <circle cx="${x + w - 0.5}" cy="${y + 0.5}" r=".4" fill="#15803d" pointer-events="none"/>
        <!-- Label ID -->
        <text class="villa-label" x="${cx}" y="${cy + 0.8}" opacity="${dimmed ? '0.3' : '1'}" pointer-events="none">${villa.id.replace('V-','')}</text>
      </g>
    `;
  });

  // Legend nhỏ ở góc dưới
  html += `
    <g transform="translate(2, 87)">
      <rect width="22" height="3" fill="white" opacity=".85" rx=".3"/>
      <circle cx="1.5" cy="1.5" r=".6" fill="#16a34a"/>
      <text x="2.8" y="1.9" font-size="1" font-weight="700" fill="#1f2937">Còn</text>
      <circle cx="8" cy="1.5" r=".6" fill="#eab308"/>
      <text x="9.3" y="1.9" font-size="1" font-weight="700" fill="#1f2937">Giữ chỗ</text>
      <circle cx="16" cy="1.5" r=".6" fill="#dc2626"/>
      <text x="17.3" y="1.9" font-size="1" font-weight="700" fill="#1f2937">Đã bán</text>
    </g>
  `;

  svg.innerHTML = html;
}

function hasActiveVillaFilters(f) {
  return f.status || f.direction || f.minArea > 0 || f.maxPrice < Infinity;
}

function handleVillaClick(villaId) {
  const villa = currentProject.villas.find(v => v.id === villaId);
  if (villa) openUnitModal(villa, currentProject);
}

// ============================================================
// STATS BAR
// ============================================================
function updateStatsBar() {
  const filters = getActiveFilters();
  const visible = currentProject.villas.filter(v => matchFilters(v, filters));
  const total = visible.length;
  const available = visible.filter(v => v.status === 'available').length;
  const reserved = visible.filter(v => v.status === 'reserved').length;
  const sold = visible.filter(v => v.status === 'sold').length;

  const hasFilter = hasActiveVillaFilters(filters);
  const label = hasFilter ? 'Phù hợp' : 'Tổng';

  document.getElementById('villaStatsBar').innerHTML = `
    <span>${label}: <strong style="color: var(--gray-900)">${total}</strong></span>
    <span style="color: var(--green)">Còn: <strong>${available}</strong></span>
    <span style="color: var(--yellow)">Giữ chỗ: <strong>${reserved}</strong></span>
    <span style="color: var(--red)">Đã bán: <strong>${sold}</strong></span>
  `;
}

// ============================================================
// FILTER CALLBACK
// ============================================================
function applyVillaFilter() {
  renderVillaMap();
  updateStatsBar();
}
