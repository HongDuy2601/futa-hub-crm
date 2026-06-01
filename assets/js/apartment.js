/* ============================================================
 * FUTA LAND - SA BÀN CHUNG CƯ
 * Logic: chọn tầng → render các căn → click căn xem chi tiết
 * ============================================================ */

let selectedFloor = null;

// Init
(function init() {
  currentProject = getProjectFromURL('apartment');
  if (!currentProject) {
    document.body.innerHTML = '<div class="empty"><h3>Không tìm thấy dự án chung cư</h3></div>';
    return;
  }

  // Inject shared header
  document.getElementById('headerSlot').innerHTML = renderSharedHeader('apartment');
  renderProjectHeader(currentProject);

  // Inject filter bar
  document.getElementById('filterSlot').innerHTML = buildFilterBar(applyFilter);

  // Render building diagram
  renderBuildingDiagram();

  // Mặc định chọn tầng cao nhất (đẹp hơn)
  selectFloor(currentProject.totalFloors);
})();

// ============================================================
// VẼ TÒA NHÀ (SVG bên trái)
// ============================================================
function renderBuildingDiagram() {
  const total = currentProject.totalFloors;
  const buildingHeight = 240;  // SVG height for floors
  const floorH = buildingHeight / total;
  const floorsGroup = document.getElementById('buildingFloors');
  let html = '';

  for (let f = total; f >= 1; f--) {
    const y = 25 + (total - f) * floorH;
    const floor = currentProject.floors[f - 1];
    const stats = countFloorStatus(floor);

    // Color theo tỉ lệ căn còn trống
    const ratio = stats.available / floor.units.length;
    let fill = '#3b3b5c';
    if (ratio > 0.5) fill = '#22c55e88';
    else if (ratio > 0.2) fill = '#eab30888';
    else if (ratio === 0) fill = '#dc262688';
    else fill = '#3b3b5c';

    html += `
      <rect class="floor-rect" data-floor="${f}"
            x="10" y="${y}" width="100" height="${floorH - 1}"
            fill="${fill}" stroke="#1a1a2e" stroke-width=".5"
            onclick="selectFloor(${f})"/>
      <text class="floor-label" x="60" y="${y + floorH/2 + 2}">Tầng ${f}</text>
    `;
  }
  floorsGroup.innerHTML = html;
}

function countFloorStatus(floor) {
  return {
    available: floor.units.filter(u => u.status === 'available').length,
    reserved:  floor.units.filter(u => u.status === 'reserved').length,
    sold:      floor.units.filter(u => u.status === 'sold').length,
    total: floor.units.length
  };
}

// ============================================================
// CHỌN TẦNG
// ============================================================
function selectFloor(floorNumber) {
  selectedFloor = floorNumber;

  // Highlight floor trong building diagram
  document.querySelectorAll('.floor-rect').forEach(r => {
    r.classList.toggle('active', parseInt(r.dataset.floor) === floorNumber);
  });

  const floor = currentProject.floors[floorNumber - 1];
  document.getElementById('floorTitle').textContent = `Mặt bằng Tầng ${floorNumber}`;

  const stats = countFloorStatus(floor);
  document.getElementById('floorStatsBar').innerHTML = `
    <span>Tổng: <strong>${stats.total}</strong></span>
    <span style="color: var(--green)">Còn: <strong>${stats.available}</strong></span>
    <span style="color: var(--yellow)">Giữ chỗ: <strong>${stats.reserved}</strong></span>
    <span style="color: var(--red)">Đã bán: <strong>${stats.sold}</strong></span>
  `;
  document.getElementById('floorStats').innerHTML = `
    Tầng ${floorNumber} · ${stats.available}/${stats.total} căn còn
  `;

  renderUnits();
}

// ============================================================
// RENDER CĂN HỘ TRONG TẦNG (theo filter)
// ============================================================
function renderUnits() {
  const floor = currentProject.floors[selectedFloor - 1];
  const filters = getActiveFilters();
  const grid = document.getElementById('unitsGrid');

  let html = '';
  let visibleCount = 0;

  floor.units.forEach(unit => {
    const matches = matchFilters(unit, filters);
    if (matches) visibleCount++;
    const dimmed = !matches && hasActiveFilters(filters) ? 'dimmed' : '';
    const statusColor = STATUS_COLOR[unit.status];

    html += `
      <div class="unit-card ${dimmed}" onclick="handleUnitClick('${unit.id}')">
        <div class="unit-status" style="background:${statusColor}"></div>
        <h4>${unit.code}</h4>
        <div class="unit-meta">
          ${unit.area} m² · ${unit.bedrooms}PN · ${unit.direction}
        </div>
        <div class="unit-meta" style="margin-bottom:.5rem;">
          View ${unit.view}
        </div>
        <div class="unit-price">${formatPrice(unit.price)}</div>
      </div>
    `;
  });

  if (visibleCount === 0 && hasActiveFilters(filters)) {
    html = `<div class="empty" style="grid-column: 1/-1;">
      <h3>Không có căn nào phù hợp tiêu chí lọc</h3>
      <p>Thử nới lỏng điều kiện hoặc chọn tầng khác</p>
    </div>`;
  }

  grid.innerHTML = html;
}

function hasActiveFilters(f) {
  return f.status || f.direction || f.minArea > 0 || f.maxPrice < Infinity;
}

function handleUnitClick(unitId) {
  const floor = currentProject.floors[selectedFloor - 1];
  const unit = floor.units.find(u => u.id === unitId);
  if (unit) openUnitModal(unit, currentProject);
}

// ============================================================
// FILTER CALLBACK
// ============================================================
function applyFilter() {
  renderUnits();

  // Cập nhật màu tòa nhà theo bộ lọc - highlight tầng có nhiều căn match
  const filters = getActiveFilters();
  if (!hasActiveFilters(filters)) {
    renderBuildingDiagram();
  } else {
    currentProject.floors.forEach((floor, idx) => {
      const f = idx + 1;
      const matchCount = floor.units.filter(u => matchFilters(u, filters)).length;
      const rect = document.querySelector(`.floor-rect[data-floor="${f}"]`);
      if (!rect) return;

      if (matchCount === 0) {
        rect.setAttribute('fill', '#3b3b5c');
        rect.setAttribute('opacity', '0.3');
      } else {
        rect.setAttribute('fill', '#F58220');
        rect.setAttribute('opacity', Math.min(0.4 + (matchCount / floor.units.length) * 0.6, 1));
      }
    });
  }

  // Re-apply selected floor highlight (re-render xoá class active)
  document.querySelectorAll('.floor-rect').forEach(r => {
    r.classList.toggle('active', parseInt(r.dataset.floor) === selectedFloor);
  });
}
