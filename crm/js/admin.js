/* ============================================================
 * FUTA HUB CRM - ADMIN: Phân quyền
 * 3 tab: Đơn vị + Nhân sự / Vai trò / Phân công dự án
 * Chỉ Admin CĐT mới vào được (đã guard ở app.js render).
 * ============================================================ */

const Admin = (function () {
  let currentTab = 'orgs';

  function render() {
    const tabs = [
      { key: 'orgs', label: '🏢 Đơn vị & Nhân sự' },
      { key: 'roles', label: '🛡 Vai trò & Quyền' },
      { key: 'projects', label: '🗂 Phân công dự án' }
    ];
    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>🛡 Phân quyền hệ thống</h1>
          <p>Quản lý cây tổ chức · vai trò · phân công dự án giữa CĐT và các sàn phân phối</p>
        </div>
      </div>

      <div class="card">
        <div class="tab-bar">
          ${tabs.map(t => `
            <button class="tab-btn ${currentTab === t.key ? 'active' : ''}" onclick="Admin.switchTab('${t.key}')">${t.label}</button>
          `).join('')}
        </div>
        <div class="card-body">
          ${currentTab === 'orgs' ? renderOrgs()
            : currentTab === 'roles' ? renderRoles()
            : renderProjects()}
        </div>
      </div>
    `;
    document.getElementById('pageContent').innerHTML = html;
  }

  function switchTab(t) { currentTab = t; render(); }

  /* ============================================================
   * TAB 1 — ĐƠN VỊ & NHÂN SỰ
   * ============================================================ */
  function renderOrgs() {
    const orgs = Storage.getOrgs();
    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const teams = Storage.getTeamsAll();

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <strong>${orgs.length}</strong> đơn vị · <strong>${teams.length}</strong> team · <strong>${sales.length}</strong> nhân sự
        </div>
        <div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary btn-sm" onclick="Admin.openOrgModal()">+ Thêm đơn vị</button>
          <button class="btn btn-secondary btn-sm" onclick="Admin.openTeamModal()">+ Thêm team</button>
          <button class="btn btn-primary btn-sm" onclick="Admin.openSaleModal()">+ Thêm nhân sự</button>
        </div>
      </div>

      <div class="org-tree">
        ${orgs.map(o => renderOrgNode(o, teams, sales)).join('')}
      </div>
    `;
  }

  function renderOrgNode(o, teams, sales) {
    const orgType = ORG_TYPES[o.type] || ORG_TYPES.distributor;
    const myTeams = teams.filter(t => t.orgId === o.id);
    const directSales = sales.filter(s => s.orgId === o.id && !s.teamId);
    return `
      <div class="org-node ${o.type === 'distributor' ? 'distributor' : ''}">
        <div class="org-node-head">
          <span style="font-size:1.2rem">${orgType.icon}</span>
          <strong>${o.name}</strong>
          <span class="pill" style="background:${orgType.color}22;color:${orgType.color};font-size:.7rem">${orgType.label}</span>
          <span style="color:var(--gray-500);font-size:.78rem;margin-left:auto">${o.contact || ''}</span>
          <button class="btn btn-ghost btn-sm" onclick="Admin.openOrgModal('${o.id}')">✏️</button>
          ${!['ORG-FUTA','ORG-FUTA-SALE'].includes(o.id) ? `<button class="btn btn-ghost btn-sm" onclick="Admin.deleteOrg('${o.id}')" style="color:var(--red)">🗑</button>` : ''}
        </div>
        <div class="org-children">
          ${directSales.length ? `
            <div style="font-size:.78rem;color:var(--gray-500);margin-bottom:.4rem">📋 Trực thuộc đơn vị (không qua team):</div>
            ${directSales.map(s => renderSaleRow(s)).join('')}
          ` : ''}
          ${myTeams.map(t => {
            const tSales = sales.filter(s => s.teamId === t.id);
            return `
              <div style="margin-top:.5rem">
                <div style="display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;background:#eff6ff;border-radius:6px">
                  <span>👥</span>
                  <strong style="font-size:.85rem">${t.name}</strong>
                  <span style="color:var(--gray-500);font-size:.75rem">${tSales.length} thành viên</span>
                  <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="Admin.openTeamModal('${t.id}')">✏️</button>
                  <button class="btn btn-ghost btn-sm" onclick="Admin.deleteTeam('${t.id}')" style="color:var(--red)">🗑</button>
                </div>
                <div style="margin-left:1rem;margin-top:.3rem">
                  ${tSales.map(s => renderSaleRow(s)).join('')}
                </div>
              </div>
            `;
          }).join('')}
          ${(!directSales.length && !myTeams.length) ? '<div style="font-size:.78rem;color:var(--gray-500);font-style:italic">Chưa có team / nhân sự</div>' : ''}
        </div>
      </div>
    `;
  }

  function renderSaleRow(s) {
    const r = (typeof ROLES !== 'undefined') ? ROLES.find(x => x.id === s.roleId) : null;
    return `
      <div style="display:flex;align-items:center;gap:.5rem;padding:.3rem .5rem;font-size:.85rem;border-bottom:1px solid var(--gray-100)">
        <div style="width:26px;height:26px;border-radius:50%;background:${r ? r.color : 'var(--gray-500)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem">${initials(s.name)}</div>
        <div style="flex:1">
          <strong>${s.name}</strong>
          <span class="role-badge" style="background:${r ? r.color : '#ccc'}22;color:${r ? r.color : '#666'};margin-left:.4rem;font-size:.68rem">${r ? r.icon + ' ' + r.name : '—'}</span>
          <div style="font-size:.7rem;color:var(--gray-500)">${s.code} · ${s.email} · ${s.phone}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Admin.openSaleModal('${s.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="Admin.deleteSale('${s.id}')" style="color:var(--red)">🗑</button>
      </div>
    `;
  }

  /* ============================================================
   * TAB 2 — VAI TRÒ & QUYỀN
   * ============================================================ */
  function renderRoles() {
    const pages = [
      { key: 'leads',      label: 'Khách hàng' },
      { key: 'pipeline',   label: 'Pipeline' },
      { key: 'tasks',      label: 'Lịch & Task' },
      { key: 'inventory',  label: 'Quỹ căn' },
      { key: 'reports',    label: 'Báo cáo khai thác' },
      { key: 'executive',  label: 'Báo cáo Lãnh đạo' },
      { key: 'targets',    label: 'Target & Ranking' },
      { key: 'admin',      label: 'Phân quyền' },
      { key: 'settings',   label: 'Cài đặt' }
    ];

    return `
      <div style="margin-bottom:1rem;color:var(--gray-700)">
        Mỗi vai trò có <strong>phạm vi data</strong> (scope) và <strong>quyền truy cập trang</strong> tương ứng.
        Quy tắc: <strong>scope</strong> quyết định "thấy data của ai", <strong>level</strong> quyết định "vào trang nào".
      </div>

      <h4 style="color:var(--futa-green-dark);margin:1rem 0 .5rem">🎯 6 vai trò</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:.85rem;margin-bottom:1.5rem">
        ${ROLES.map(r => `
          <div style="background:${r.color}11;border:1px solid ${r.color}44;border-radius:10px;padding:.85rem 1rem">
            <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
              <span style="font-size:1.4rem">${r.icon}</span>
              <strong style="color:${r.color}">${r.name}</strong>
            </div>
            <div style="font-size:.78rem;color:var(--gray-700);margin-bottom:.25rem">${r.desc}</div>
            <div style="font-size:.72rem;color:var(--gray-500)">
              Level <strong>${r.level}</strong> · Scope: <strong>${scopeLabel(r.scope)}</strong>
            </div>
          </div>
        `).join('')}
      </div>

      <h4 style="color:var(--futa-green-dark);margin:1.5rem 0 .5rem">🔐 Ma trận quyền vào trang</h4>
      <div class="role-matrix" style="grid-template-columns:1.4fr repeat(${ROLES.length}, minmax(70px, 1fr))">
        <div class="matrix-head">Trang</div>
        ${ROLES.map(r => `<div class="matrix-head" title="${r.name}" style="color:${r.color}">${r.icon}<br><span style="font-size:.7rem">${r.id}</span></div>`).join('')}
        ${pages.map(p => `
          <div class="matrix-row-head">${p.label}</div>
          ${ROLES.map(r => {
            const tmpMe = { roleId: r.id };
            // Tính minLevel dùng cùng logic Perm.canViewPage
            const minLevel = ({
              leads:30, pipeline:30, tasks:30, inventory:30, targets:30,
              reports:50, executive:70, admin:100, settings:70
            })[p.key];
            const ok = (minLevel === undefined) || r.level >= minLevel;
            return `<div style="text-align:center" class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '—'}</div>`;
          }).join('')}
        `).join('')}
      </div>
    `;
  }

  function scopeLabel(scope) {
    return ({
      all: 'Toàn hệ thống',
      all_readonly: 'Xem toàn hệ thống',
      project: 'Theo dự án giao',
      org: 'Toàn sàn',
      team: 'Toàn team',
      self: 'Chỉ data cá nhân'
    })[scope] || scope;
  }

  /* ============================================================
   * TAB 3 — PHÂN CÔNG DỰ ÁN
   * ============================================================ */
  function renderProjects() {
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
    const orgs = Storage.getOrgs().filter(o => o.type !== 'developer'); // CĐT đương nhiên có hết
    const assigns = Storage.getProjectAssignments();
    const has = (orgId, projectId) => assigns.find(a => a.orgId === orgId && a.projectId === projectId);

    return `
      <p style="color:var(--gray-700);margin-bottom:1rem">
        Cấu hình: <strong>mỗi sàn được bán những dự án nào</strong>. Tick để cho phép.
      </p>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sàn / Đơn vị</th>
              ${projects.map(p => `<th style="text-align:center">${p.type === 'apartment' ? '🏢' : '🏡'} ${p.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${orgs.map(o => {
              const ot = ORG_TYPES[o.type] || {};
              return `
                <tr>
                  <td>
                    <strong>${ot.icon || ''} ${o.name}</strong>
                    <div style="font-size:.7rem;color:var(--gray-500)">${ot.label || ''}</div>
                  </td>
                  ${projects.map(p => `
                    <td style="text-align:center">
                      <input type="checkbox" ${has(o.id, p.id) ? 'checked' : ''}
                        onchange="Admin.toggleAssign('${o.id}', '${p.id}', this.checked)">
                    </td>
                  `).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:1rem;padding:.85rem 1rem;background:var(--futa-green-light);border-radius:8px;font-size:.85rem">
        💡 <strong>Lưu ý:</strong> CĐT (FUTA Land) và sàn nội bộ luôn thấy mọi dự án — không cần cấu hình.
        Sàn phân phối chỉ thấy dự án đã được tick.
      </div>
    `;
  }

  function toggleAssign(orgId, projectId, on) {
    if (on) Storage.saveAssignment(orgId, projectId);
    else Storage.deleteAssignment(orgId, projectId);
    toast('Đã cập nhật phân công', 'success');
  }

  /* ============================================================
   * MODALS: ORG / TEAM / SALE CRUD
   * ============================================================ */
  function openOrgModal(id) {
    const o = id ? Storage.getOrg(id) : { type: 'distributor' };
    const isNew = !id;
    const body = `
      <div class="form-grid">
        <div class="form-field full"><label>Tên đơn vị <span class="req">*</span></label>
          <input type="text" id="fOrgName" value="${o.name || ''}" placeholder="VD: ABC Land Phân phối">
        </div>
        <div class="form-field"><label>Loại</label>
          <select id="fOrgType">
            ${Object.entries(ORG_TYPES).map(([k, v]) => `<option value="${k}" ${o.type === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Đơn vị mẹ</label>
          <select id="fOrgParent">
            <option value="">— Không có —</option>
            ${Storage.getOrgs().filter(x => x.id !== o.id).map(x => `<option value="${x.id}" ${o.parentId === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full"><label>Liên hệ</label>
          <input type="text" id="fOrgContact" value="${o.contact || ''}" placeholder="Email / SĐT">
        </div>
      </div>
    `;
    Modal.show({
      title: isNew ? '+ Thêm đơn vị' : 'Sửa đơn vị',
      body,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
        <button class="btn btn-primary" onclick="Admin.saveOrg('${id || ''}')">${isNew ? 'Tạo' : 'Lưu'}</button>
      `
    });
  }

  function saveOrg(id) {
    const name = document.getElementById('fOrgName').value.trim();
    if (!name) { toast('Nhập tên', 'error'); return; }
    const o = id ? Storage.getOrg(id) : {};
    o.name = name;
    o.type = document.getElementById('fOrgType').value;
    o.parentId = document.getElementById('fOrgParent').value || null;
    o.contact = document.getElementById('fOrgContact').value.trim();
    Storage.saveOrg(o);
    Modal.hide(); toast('Đã lưu đơn vị', 'success'); render();
  }

  function deleteOrg(id) {
    if (!confirm('Xóa đơn vị này? (team và nhân sự thuộc về sẽ không bị xóa nhưng mất liên kết)')) return;
    Storage.deleteOrg(id);
    toast('Đã xóa', 'success'); render();
  }

  function openTeamModal(id) {
    const t = id ? Storage.getTeam(id) : {};
    const isNew = !id;
    const body = `
      <div class="form-grid">
        <div class="form-field full"><label>Tên team <span class="req">*</span></label>
          <input type="text" id="fTeamName" value="${t.name || ''}" placeholder="VD: KD-01 Quận 2">
        </div>
        <div class="form-field full"><label>Thuộc đơn vị <span class="req">*</span></label>
          <select id="fTeamOrg">
            ${Storage.getOrgs().filter(o => o.type !== 'developer').map(o => `<option value="${o.id}" ${t.orgId === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
    Modal.show({
      title: isNew ? '+ Thêm team' : 'Sửa team',
      body,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
        <button class="btn btn-primary" onclick="Admin.saveTeam('${id || ''}')">${isNew ? 'Tạo' : 'Lưu'}</button>
      `
    });
  }

  function saveTeam(id) {
    const name = document.getElementById('fTeamName').value.trim();
    const orgId = document.getElementById('fTeamOrg').value;
    if (!name || !orgId) { toast('Nhập đủ thông tin', 'error'); return; }
    const t = id ? Storage.getTeam(id) : {};
    t.name = name; t.orgId = orgId;
    Storage.saveTeam(t);
    Modal.hide(); toast('Đã lưu team', 'success'); render();
  }

  function deleteTeam(id) {
    if (!confirm('Xóa team này?')) return;
    Storage.deleteTeam(id);
    toast('Đã xóa', 'success'); render();
  }

  function openSaleModal(id) {
    const allSales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const s = id ? allSales.find(x => x.id === id) : { roleId: 'tvv', orgId: 'ORG-FUTA-SALE' };
    const isNew = !id;
    const orgs = Storage.getOrgs();
    const teams = Storage.getTeamsByOrg(s.orgId);
    const body = `
      <div class="form-grid">
        <div class="form-field"><label>Họ tên <span class="req">*</span></label>
          <input type="text" id="fSName" value="${s.name || ''}">
        </div>
        <div class="form-field"><label>Mã NV</label>
          <input type="text" id="fSCode" value="${s.code || ''}" maxlength="6">
        </div>
        <div class="form-field"><label>Email</label>
          <input type="email" id="fSEmail" value="${s.email || ''}">
        </div>
        <div class="form-field"><label>SĐT</label>
          <input type="tel" id="fSPhone" value="${s.phone || ''}">
        </div>
        <div class="form-field"><label>Đơn vị</label>
          <select id="fSOrg" onchange="Admin.refreshSaleTeams(this.value)">
            ${orgs.map(o => `<option value="${o.id}" ${s.orgId === o.id ? 'selected' : ''}>${o.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Team</label>
          <select id="fSTeam">
            <option value="">— Trực thuộc đơn vị —</option>
            ${teams.map(t => `<option value="${t.id}" ${s.teamId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full"><label>Vai trò</label>
          <select id="fSRole">
            ${ROLES.map(r => `<option value="${r.id}" ${s.roleId === r.id ? 'selected' : ''}>${r.icon} ${r.name} — ${r.desc}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
    Modal.show({
      title: isNew ? '+ Thêm nhân sự' : 'Sửa nhân sự',
      body,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
        <button class="btn btn-primary" onclick="Admin.saveSale('${id || ''}')">${isNew ? 'Tạo' : 'Lưu'}</button>
      `
    });
  }

  function refreshSaleTeams(orgId) {
    const teams = Storage.getTeamsByOrg(orgId);
    const sel = document.getElementById('fSTeam');
    sel.innerHTML = '<option value="">— Trực thuộc đơn vị —</option>' +
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  function saveSale(id) {
    const name = document.getElementById('fSName').value.trim();
    if (!name) { toast('Nhập tên', 'error'); return; }
    const allSales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const s = id ? allSales.find(x => x.id === id) : {};
    s.name = name;
    s.code = document.getElementById('fSCode').value.trim() || initials(name);
    s.email = document.getElementById('fSEmail').value.trim();
    s.phone = document.getElementById('fSPhone').value.trim();
    s.orgId = document.getElementById('fSOrg').value;
    s.teamId = document.getElementById('fSTeam').value || null;
    s.roleId = document.getElementById('fSRole').value;
    const team = s.teamId ? Storage.getTeam(s.teamId) : null;
    s.team = team ? team.name : ((Storage.getOrg(s.orgId) || {}).name || '');
    Storage.saveSale(s);
    Modal.hide(); toast('Đã lưu nhân sự', 'success'); render();
  }

  function deleteSale(id) {
    if (!confirm('Xóa nhân sự này?')) return;
    Storage.deleteSale(id);
    toast('Đã xóa', 'success'); render();
  }

  return {
    render, switchTab,
    openOrgModal, saveOrg, deleteOrg,
    openTeamModal, saveTeam, deleteTeam,
    openSaleModal, saveSale, deleteSale, refreshSaleTeams,
    toggleAssign
  };
})();
