/* ============================================================
 * FUTA HUB CRM - LEADS (Khách hàng) module
 * ============================================================ */

const Leads = (function () {
  let filters = { search: '', status: '', source: '', salesId: '', temp: '', custType: '', industry: '' };
  let selected = new Set();

  function applyFilters(all) {
    return all.filter(l => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [l.name, l.phone, l.code, l.contactName,
          l.business && l.business.taxCode, l.business && l.business.companyName].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.status && l.status !== filters.status) return false;
      if (filters.source && l.source !== filters.source) return false;
      if (filters.salesId && l.assignedTo !== filters.salesId) return false;
      if (filters.temp && AI.scoreLead(l).temp !== filters.temp) return false;
      if (filters.custType && (l.customerType || 'individual') !== filters.custType) return false;
      if (filters.industry && (!l.business || l.business.industry !== filters.industry)) return false;
      return true;
    });
  }

  function renderList() {
    const all = Storage.getLeads();
    const filtered = applyFilters(all);
    // bỏ khỏi selected những id không còn hiển thị
    selected.forEach(id => { if (!filtered.find(l => l.id === id)) selected.delete(id); });
    const views = Storage.getSavedViews();

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Khách hàng</h1>
          <p>${filtered.length} / ${all.length} khách hàng</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="AI.openExtractModal()">🤖 AI trích xuất</button>
          <button class="btn btn-secondary" onclick="Leads.exportCSV()">⬇ Xuất CSV</button>
          <button class="btn btn-primary" onclick="Leads.openCreateModal()">+ Thêm khách hàng</button>
        </div>
      </div>

      ${views.length ? `
        <div class="saved-views">
          <span class="sv-label">Bộ lọc lưu:</span>
          ${views.map(v => `
            <span class="sv-chip" onclick="Leads.applyView('${v.id}')">
              ⭐ ${v.name}
              <span class="sv-del" onclick="event.stopPropagation();Leads.deleteView('${v.id}')">×</span>
            </span>
          `).join('')}
        </div>
      ` : ''}

      <div class="table-wrap">
        <div class="table-tools">
          <input type="text" id="ldSearch" placeholder="🔍 Tìm theo tên, SĐT, mã..." value="${filters.search}" style="min-width:220px">
          <select id="ldStatus">
            <option value="">Mọi trạng thái</option>
            ${Object.entries(LEAD_STATUS).map(([k, v]) =>
              `<option value="${k}" ${filters.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
          <select id="ldSource">
            <option value="">Mọi nguồn</option>
            ${Object.entries(LEAD_SOURCES).map(([k, v]) =>
              `<option value="${k}" ${filters.source === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
          <select id="ldSales">
            <option value="">Mọi nhân viên</option>
            ${Storage.getSales().map(s =>
              `<option value="${s.id}" ${filters.salesId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
          <select id="ldTemp">
            <option value="">Mọi mức AI</option>
            <option value="hot"  ${filters.temp === 'hot' ? 'selected' : ''}>🔥 Nóng</option>
            <option value="warm" ${filters.temp === 'warm' ? 'selected' : ''}>Ấm</option>
            <option value="cold" ${filters.temp === 'cold' ? 'selected' : ''}>Lạnh</option>
          </select>
          <select id="ldCustType">
            <option value="">Mọi loại KH</option>
            <option value="individual" ${filters.custType === 'individual' ? 'selected' : ''}>👤 Cá nhân</option>
            <option value="business"   ${filters.custType === 'business' ? 'selected' : ''}>🏢 Doanh nghiệp</option>
          </select>
          <select id="ldIndustry">
            <option value="">Mọi ngành nghề</option>
            ${BUSINESS_INDUSTRIES.map(b => `<option value="${b.key}" ${filters.industry === b.key ? 'selected' : ''}>${b.label}</option>`).join('')}
          </select>
          <div class="spacer"></div>
          <button class="btn btn-ghost btn-sm" onclick="Leads.saveCurrentView()">⭐ Lưu bộ lọc</button>
          <button class="btn btn-ghost btn-sm" onclick="Leads.clearFilters()">↺ Xoá lọc</button>
        </div>

        <div class="bulk-bar" id="bulkBar" hidden>
          <span><strong id="bulkCount">0</strong> đã chọn</span>
          <div class="spacer"></div>
          <select id="bulkSales" class="btn btn-secondary" style="padding:.4rem .6rem">
            <option value="">Gán cho sale...</option>
            ${Storage.getSales().map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
          <select id="bulkStatus" class="btn btn-secondary" style="padding:.4rem .6rem">
            <option value="">Đổi trạng thái...</option>
            ${Object.entries(LEAD_STATUS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" onclick="Leads.bulkExport()">⬇ Xuất</button>
          <button class="btn btn-danger btn-sm" onclick="Leads.bulkDelete()">🗑 Xóa</button>
          <button class="btn btn-ghost btn-sm" onclick="Leads.clearSelection()">Bỏ chọn</button>
        </div>

        ${filtered.length === 0 ? `
          <div class="empty">
            <div class="empty-icon">🔍</div>
            <h3>Không tìm thấy khách hàng</h3>
            <p>Thử bỏ bớt điều kiện lọc</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:36px"><input type="checkbox" id="selAll"></th>
                <th>Mã</th>
                <th>Loại</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>AI Score</th>
                <th>Nguồn</th>
                <th>Quan tâm</th>
                <th>Ngân sách</th>
                <th>Trạng thái</th>
                <th>Sale</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(l => renderRow(l)).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;

    document.getElementById('ldSearch').addEventListener('input', e => {
      filters.search = e.target.value;
      clearTimeout(window._ldT);
      window._ldT = setTimeout(renderList, 200);
    });
    document.getElementById('ldStatus').onchange = e => { filters.status = e.target.value; renderList(); };
    document.getElementById('ldSource').onchange = e => { filters.source = e.target.value; renderList(); };
    document.getElementById('ldSales').onchange = e => { filters.salesId = e.target.value; renderList(); };
    document.getElementById('ldTemp').onchange = e => { filters.temp = e.target.value; renderList(); };
    document.getElementById('ldCustType').onchange = e => { filters.custType = e.target.value; renderList(); };
    document.getElementById('ldIndustry').onchange = e => { filters.industry = e.target.value; renderList(); };

    const selAll = document.getElementById('selAll');
    if (selAll) {
      selAll.onclick = (e) => {
        e.stopPropagation();
        if (selAll.checked) filtered.forEach(l => selected.add(l.id));
        else selected.clear();
        renderList();
      };
    }
    // wire bulk action selects
    const bs = document.getElementById('bulkSales');
    if (bs) bs.onchange = (e) => { if (e.target.value) Leads.bulkAssign(e.target.value); };
    const bst = document.getElementById('bulkStatus');
    if (bst) bst.onchange = (e) => { if (e.target.value) Leads.bulkStatus(e.target.value); };

    updateBulkBar();
  }

  function renderRow(l) {
    const status = LEAD_STATUS[l.status];
    const source = LEAD_SOURCES[l.source];
    const sale = Storage.getSale(l.assignedTo);
    const checked = selected.has(l.id) ? 'checked' : '';
    const ctype = CUSTOMER_TYPES[l.customerType || 'individual'];
    const subInfo = l.customerType === 'business' && l.business
      ? `<div style="font-size:.7rem;color:var(--gray-500);margin-top:2px">${l.business.industryLabel}${l.contactName ? ' · LH: ' + l.contactName : ''}</div>`
      : '';
    const unitsBadge = (l.interest && l.interest.unitCount > 1)
      ? ` <span class="pill" style="background:#fef3c7;color:#92400e;font-size:.65rem;padding:1px 6px">×${l.interest.unitCount} căn</span>`
      : '';
    return `
      <tr class="${selected.has(l.id) ? 'row-selected' : ''}">
        <td onclick="event.stopPropagation()"><input type="checkbox" class="rowChk" data-id="${l.id}" ${checked} onclick="Leads.toggleSelect('${l.id}')"></td>
        <td onclick="App.navigate('lead/${l.id}')"><strong>${l.code}</strong></td>
        <td onclick="App.navigate('lead/${l.id}')"><span class="pill" style="background:${ctype.color}22;color:${ctype.color}">${ctype.icon} ${ctype.label}</span></td>
        <td onclick="App.navigate('lead/${l.id}')">
          <div style="display:flex;align-items:center;gap:.5rem">
            <div class="user-avatar" style="width:32px;height:32px;font-size:.72rem;background:${ctype.color}">${initials(l.name)}</div>
            <div>
              <strong>${l.name}</strong>
              ${subInfo}
            </div>
          </div>
        </td>
        <td onclick="App.navigate('lead/${l.id}')">${l.phone}</td>
        <td onclick="App.navigate('lead/${l.id}')">${AI.scoreBadge(l)}</td>
        <td onclick="App.navigate('lead/${l.id}')"><span class="pill pill-source-${l.source}">${source.icon} ${source.label}</span></td>
        <td onclick="App.navigate('lead/${l.id}')">${l.interest.projectName || '—'}</td>
        <td onclick="App.navigate('lead/${l.id}')"><strong>${formatVND(l.interest.budget)}</strong>${unitsBadge}</td>
        <td onclick="App.navigate('lead/${l.id}')"><span class="pill pill-${status.color}">${status.label}</span></td>
        <td onclick="App.navigate('lead/${l.id}')">${sale ? sale.code : '—'}</td>
        <td onclick="App.navigate('lead/${l.id}')" style="color:var(--gray-500);font-size:.8rem">${relativeTime(l.updatedAt)}</td>
      </tr>
    `;
  }

  /* ----------- BULK SELECTION ----------- */
  function toggleSelect(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    // cập nhật class dòng + bulk bar mà không re-render toàn bộ
    const chk = document.querySelector(`.rowChk[data-id="${id}"]`);
    if (chk) chk.closest('tr').classList.toggle('row-selected', selected.has(id));
    updateBulkBar();
  }
  function clearSelection() {
    selected.clear();
    renderList();
  }
  function updateBulkBar() {
    const bar = document.getElementById('bulkBar');
    const count = document.getElementById('bulkCount');
    if (!bar) return;
    bar.hidden = selected.size === 0;
    if (count) count.textContent = selected.size;
  }
  function bulkAssign(salesId) {
    const n = Storage.bulkUpdateLeads([...selected], { assignedTo: salesId });
    const sale = Storage.getSale(salesId);
    toast(`Đã gán ${n} khách cho ${sale ? sale.name : ''}`, 'success');
    selected.clear();
    renderList();
  }
  function bulkStatus(status) {
    const n = Storage.bulkUpdateLeads([...selected], { status });
    toast(`Đã đổi ${n} khách sang "${LEAD_STATUS[status].label}"`, 'success');
    selected.clear();
    renderList();
  }
  function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Xóa ${selected.size} khách hàng đã chọn?`)) return;
    Storage.bulkDeleteLeads([...selected]);
    toast(`Đã xóa ${selected.size} khách hàng`, 'success');
    selected.clear();
    renderList();
  }
  function bulkExport() {
    exportCSV([...selected]);
  }

  /* ----------- SAVED VIEWS ----------- */
  function saveCurrentView() {
    const name = prompt('Tên bộ lọc (VD: "Khách nóng dự án A"):');
    if (!name) return;
    Storage.saveView({ name, filters: { ...filters } });
    toast('Đã lưu bộ lọc', 'success');
    renderList();
  }
  function applyView(id) {
    const v = Storage.getSavedViews().find(x => x.id === id);
    if (!v) return;
    filters = { search: '', status: '', source: '', salesId: '', temp: '', custType: '', industry: '', ...v.filters };
    renderList();
  }
  function deleteView(id) {
    Storage.deleteView(id);
    toast('Đã xóa bộ lọc', 'success');
    renderList();
  }

  function clearFilters() {
    filters = { search: '', status: '', source: '', salesId: '', temp: '', custType: '', industry: '' };
    renderList();
  }

  function toggleCustType(t) {
    const sec = document.getElementById('fBusinessSection');
    if (sec) sec.hidden = (t !== 'business');
    const lbl = document.getElementById('fNameLabel');
    if (lbl) lbl.innerHTML = (t === 'business' ? 'Người đại diện liên hệ' : 'Họ tên') + ' <span class="req">*</span>';
    document.querySelectorAll('.cts-opt').forEach(el => {
      const v = el.querySelector('input').value;
      el.classList.toggle('active', v === t);
    });
  }

  function exportCSV(ids) {
    let leads = Storage.getLeads();
    if (ids && ids.length) leads = leads.filter(l => ids.includes(l.id));
    const headers = ['Mã', 'Họ tên', 'SĐT', 'Email', 'Nguồn', 'Trạng thái', 'AI Score', 'Sao', 'Quan tâm', 'Ngân sách', 'Sale phụ trách', 'Tạo lúc'];
    const rows = leads.map(l => [
      l.code,
      l.name,
      l.phone,
      l.email,
      LEAD_SOURCES[l.source].label,
      LEAD_STATUS[l.status].label,
      AI.scoreLead(l).score,
      l.rating,
      l.interest.projectName,
      l.interest.budget + 'tr',
      (Storage.getSale(l.assignedTo) || {}).name || '',
      formatDate(l.createdAt)
    ]);
    const csv = '﻿' + [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `futa-leads-${Date.now()}.csv`;
    a.click();
    toast('Đã xuất ' + leads.length + ' khách hàng', 'success');
  }

  /* ----------- DETAIL VIEW (360°) ----------- */
  let currentTab = 'overview';

  function renderDetail(id, tab) {
    if (tab) currentTab = tab;
    const lead = Storage.getLead(id);
    if (!lead) {
      document.getElementById('pageContent').innerHTML =
        `<div class="empty"><div class="empty-icon">❓</div><h3>Không tìm thấy khách hàng</h3></div>`;
      return;
    }
    const status = LEAD_STATUS[lead.status];
    const source = LEAD_SOURCES[lead.source];
    const sale = Storage.getSale(lead.assignedTo);
    const deals = Storage.getDeals().filter(d => d.leadId === lead.id);
    const tasks = Storage.getTasks().filter(t => t.leadId === lead.id);
    const activities = [...(lead.activities || [])].sort((a, b) => new Date(b.at) - new Date(a.at));
    const ext = lead.extended || {};

    const isBusiness = lead.customerType === 'business';
    const tabs = [
      { key: 'overview',  label: '📋 Tổng quan' },
      ...(isBusiness ? [{ key: 'business', label: '🏢 Doanh nghiệp' }] : []),
      { key: 'finance',   label: '💰 Tài chính' },
      ...(!isBusiness ? [{ key: 'family',  label: '👨‍👩‍👧 Gia đình' }] : []),
      { key: 'history',   label: '⏰ Lịch sử' },
      { key: 'deals',     label: '🎯 Deal & Task' },
      { key: 'docs',      label: '📎 Tài liệu' },
      { key: 'notes',     label: '📝 Ghi chú nội bộ' }
    ];
    // Nếu user đang ở tab không hợp lệ (DN xem family hoặc cá nhân xem business) thì revert
    if (!tabs.find(t => t.key === currentTab)) currentTab = 'overview';

    const html = `
      <div class="page-header">
        <div class="page-title">
          <p><a href="#/leads" style="color:var(--gray-500)">← Khách hàng</a></p>
          <h1>${lead.name} <span class="pill pill-${status.color}" style="font-size:.75rem;vertical-align:middle">${status.label}</span></h1>
          <p>${lead.code} · Tạo ${relativeTime(lead.createdAt)} · Sale: ${sale ? sale.name : '—'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="Communication.open('${lead.id}', 'call')">📞 Gọi</button>
          <button class="btn btn-secondary" onclick="Communication.open('${lead.id}', 'sms')">💬 SMS</button>
          <button class="btn btn-secondary" onclick="Communication.open('${lead.id}', 'zalo')">🟦 Zalo</button>
          <button class="btn btn-secondary" onclick="Communication.open('${lead.id}', 'email')">✉️ Email</button>
          <button class="btn btn-primary" onclick="Leads.openEditModal('${lead.id}')">✏️ Sửa</button>
        </div>
      </div>

      <div class="detail-head card" style="padding:1.25rem;margin-bottom:1rem">
        <div class="detail-avatar" style="background:${CUSTOMER_TYPES[lead.customerType || 'individual'].color}">${initials(lead.name)}</div>
        <div class="detail-info" style="flex:1">
          <h2>${lead.name}</h2>
          <div class="meta">
            ${lead.customerType === 'business' && lead.contactName ? '👤 ' + lead.contactName + ' · ' : ''}📞 ${lead.phone} · ✉️ ${lead.email}
          </div>
          <div style="display:flex;gap:.75rem;align-items:center;margin-top:.5rem;flex-wrap:wrap">
            <span class="pill" style="background:${CUSTOMER_TYPES[lead.customerType || 'individual'].color}22;color:${CUSTOMER_TYPES[lead.customerType || 'individual'].color}">${CUSTOMER_TYPES[lead.customerType || 'individual'].icon} ${CUSTOMER_TYPES[lead.customerType || 'individual'].label}</span>
            ${lead.business && lead.business.industryLabel ? '<span class="pill" style="background:#f3e8ff;color:#6b21a8">🏷 ' + lead.business.industryLabel + '</span>' : ''}
            ${lead.business && lead.business.sizeLabel ? '<span class="pill" style="background:#dbeafe;color:#1e40af">' + lead.business.sizeLabel + '</span>' : ''}
            <span class="rating-stars">${stars(lead.rating)}</span>
            ${AI.scoreBadge(lead)}
            <span class="pill pill-source-${lead.source}">${source.icon} ${source.label}</span>
            ${ext.purchaseHistory ? '<span class="pill pill-won">🏆 KH cũ</span>' : ''}
            ${ext.needFinancing ? '<span class="pill pill-interested">🏦 Cần vay NH</span>' : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px">Ngân sách</div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--futa-red)">${formatVND(lead.interest.budget)}</div>
          <div style="font-size:.75rem;color:var(--gray-500)">${lead.interest.projectName || 'Chưa rõ dự án'}${lead.interest && lead.interest.unitCount > 1 ? ' · ×' + lead.interest.unitCount + ' căn' : ''}</div>
        </div>
      </div>

      <div class="card">
        <div class="tab-bar">
          ${tabs.map(t => `
            <button class="tab-btn ${currentTab === t.key ? 'active' : ''}" onclick="Leads.switchTab('${lead.id}', '${t.key}')">${t.label}</button>
          `).join('')}
        </div>
        <div class="card-body">
          ${renderTab(currentTab, lead, deals, tasks, activities, sale, ext)}
        </div>
      </div>
    `;
    document.getElementById('pageContent').innerHTML = html;
  }

  function renderTab(tab, lead, deals, tasks, activities, sale, ext) {
    if (tab === 'overview') return renderOverview(lead, sale, ext);
    if (tab === 'business') return renderBusinessTab(lead);
    if (tab === 'finance') return renderFinance(lead, ext);
    if (tab === 'family') return renderFamily(lead, ext);
    if (tab === 'history') return renderHistory(lead, activities);
    if (tab === 'deals') return renderDealsTasks(lead, deals, tasks);
    if (tab === 'docs') return renderDocs(lead);
    if (tab === 'notes') return renderNotes(lead, ext);
    return '';
  }

  function renderOverview(lead, sale, ext) {
    return `
      <div class="grid-2">
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">Thông tin cơ bản</h4>
          <div class="info-grid">
            <div class="info-item"><label>Họ tên</label><div>${lead.name}</div></div>
            <div class="info-item"><label>Số CCCD</label><div>${ext.cccd || '—'}</div></div>
            <div class="info-item"><label>SĐT</label><div>📞 ${lead.phone}</div></div>
            <div class="info-item"><label>Email</label><div>✉️ ${lead.email || '—'}</div></div>
            <div class="info-item"><label>Địa chỉ</label><div>📍 ${ext.address || '—'}</div></div>
            <div class="info-item"><label>Nghề nghiệp</label><div>💼 ${ext.occupation || '—'}</div></div>
            <div class="info-item"><label>Công ty</label><div>${ext.company || '—'}</div></div>
            <div class="info-item"><label>Người giới thiệu</label><div>${ext.referrer || '—'}</div></div>
          </div>
        </div>
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">Quan tâm & Mục đích</h4>
          <div class="info-grid">
            <div class="info-item"><label>Dự án quan tâm</label><div>🏘️ ${lead.interest.projectName || '—'}</div></div>
            <div class="info-item"><label>Ngân sách</label><div><strong>${formatVND(lead.interest.budget)}</strong></div></div>
            <div class="info-item"><label>Số phòng ngủ mong muốn</label><div>🛏 ${lead.interest.bedrooms || '—'}</div></div>
            <div class="info-item"><label>Hướng ưa thích</label><div>🧭 ${ext.preferredDirection || '—'}</div></div>
            <div class="info-item"><label>Mục đích mua</label><div>🎯 ${ext.purpose || '—'}</div></div>
            <div class="info-item"><label>Sale phụ trách</label><div>${sale ? '👤 ' + sale.name + ' (' + sale.code + ')' : '—'}</div></div>
          </div>

          <div style="margin-top:1rem">
            <h4 style="color:var(--futa-green-dark);margin-bottom:.5rem">Đổi trạng thái</h4>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              ${Object.entries(LEAD_STATUS).map(([k, v]) => `
                <button class="pill pill-${v.color}" style="border:none;cursor:pointer;${lead.status === k ? 'outline:2px solid var(--futa-green-dark);' : 'opacity:.65'}"
                  onclick="Leads.changeStatus('${lead.id}', '${k}')">${v.label}</button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderBusinessTab(lead) {
    const b = lead.business || {};
    const indLabel = b.industryLabel || (BUSINESS_INDUSTRIES.find(i => i.key === b.industry) || {}).label || '—';
    const sizeLabel = b.sizeLabel || (BUSINESS_SIZES.find(s => s.key === b.size) || {}).label || '—';
    const age = b.foundedYear ? (new Date().getFullYear() - b.foundedYear) + ' năm' : '—';
    return `
      <div class="grid-2">
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">🏢 Hồ sơ doanh nghiệp</h4>
          <div class="info-grid">
            <div class="info-item full" style="grid-column:1 / -1"><label>Tên đầy đủ</label><div style="font-weight:700">${b.companyName || lead.name}</div></div>
            <div class="info-item"><label>Mã số thuế</label><div>${b.taxCode || '—'}</div></div>
            <div class="info-item"><label>Năm thành lập</label><div>${b.foundedYear || '—'} ${b.foundedYear ? '· ' + age : ''}</div></div>
            <div class="info-item"><label>Ngành nghề</label><div>${indLabel}</div></div>
            <div class="info-item"><label>Quy mô</label><div>${sizeLabel}</div></div>
            <div class="info-item"><label>Vốn điều lệ</label><div style="font-weight:700;color:var(--futa-green)">${b.capital ? formatVND(b.capital) : '—'}</div></div>
            <div class="info-item"><label>Số NV ước tính</label><div>${b.employees || '—'}</div></div>
            <div class="info-item full" style="grid-column:1 / -1"><label>Trụ sở</label><div>📍 ${b.headquarters || '—'}</div></div>
            <div class="info-item"><label>Website</label><div>${b.website ? '<a href="https://' + b.website + '" target="_blank" rel="noopener" style="color:var(--futa-green)">' + b.website + '</a>' : '—'}</div></div>
            <div class="info-item"><label>Hạn mức công nợ</label><div>${b.creditLimit ? formatVND(b.creditLimit) : '—'}</div></div>
          </div>
        </div>
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">👤 Người đại diện liên hệ</h4>
          <div class="info-grid">
            <div class="info-item full" style="grid-column:1 / -1"><label>Họ tên</label><div style="font-weight:600">${lead.contactName || '—'}</div></div>
            <div class="info-item"><label>SĐT</label><div>📞 ${lead.phone}</div></div>
            <div class="info-item"><label>Email</label><div>${lead.email || '—'}</div></div>
          </div>

          <h4 style="color:var(--futa-green-dark);margin:1.25rem 0 .5rem">🎯 Mục đích mua BĐS</h4>
          <div style="background:var(--gray-50);padding:.85rem 1rem;border-radius:10px;font-size:.92rem">${b.purpose || 'Chưa rõ'}</div>

          <h4 style="color:var(--futa-green-dark);margin:1.25rem 0 .5rem">💡 Gợi ý sale</h4>
          <div style="font-size:.88rem;line-height:1.6;color:var(--gray-700)">
            ${b.size === 'large' || b.size === 'medium' ? '<div>• KH lớn — chuẩn bị HĐ B2B, phòng khách VIP đón tiếp</div>' : ''}
            ${b.industry === 'real_estate' || b.industry === 'finance' ? '<div>• Ngành cùng lĩnh vực — biết giá, tập trung vào ROI và điều khoản pháp lý</div>' : ''}
            ${(lead.interest && lead.interest.unitCount > 1) ? '<div>• Mua nhiều căn (' + lead.interest.unitCount + ' căn) — đề xuất chính sách CK khối lượng</div>' : ''}
            ${b.creditLimit > 0 ? '<div>• Có hạn mức công nợ ' + formatVND(b.creditLimit) + ' — có thể chia thanh toán nhiều đợt</div>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderFinance(lead, ext) {
    const incomeMonths = ext.monthlyIncome ? Math.ceil(lead.interest.budget / ext.monthlyIncome) : null;
    return `
      <div class="grid-2">
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">Khả năng tài chính</h4>
          <div class="info-grid">
            <div class="info-item"><label>Thu nhập / tháng</label><div style="font-weight:700;color:var(--futa-green)">${ext.monthlyIncome ? ext.monthlyIncome + ' triệu' : '—'}</div></div>
            <div class="info-item"><label>Ngân sách BĐS</label><div style="font-weight:700;color:var(--futa-red)">${formatVND(lead.interest.budget)}</div></div>
            <div class="info-item"><label>Cần vay ngân hàng?</label><div>${ext.needFinancing ? '✅ Có' : '❌ Không'}</div></div>
            <div class="info-item"><label>Ngân hàng ưu tiên</label><div>${ext.preferredBank || '—'}</div></div>
            <div class="info-item full" style="grid-column:1 / -1"><label>Số tháng thu nhập = giá BĐS</label>
              <div>
                ${incomeMonths ? `<strong>${incomeMonths} tháng</strong> thu nhập` : '—'}
                <span style="font-size:.75rem;color:var(--gray-500)">(tham chiếu khả năng chi trả)</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">Đề xuất chính sách</h4>
          <div style="background:var(--gray-50);padding:1rem;border-radius:10px">
            ${ext.needFinancing ? `
              <div style="display:flex;gap:.5rem;align-items:start;margin-bottom:.5rem">
                <span>🏦</span><div><strong>Gói vay 70%</strong> từ ${ext.preferredBank || 'NH đối tác'}, lãi suất ưu đãi 8.5%/năm trong 24 tháng đầu</div>
              </div>
            ` : ''}
            <div style="display:flex;gap:.5rem;align-items:start;margin-bottom:.5rem">
              <span>💰</span><div><strong>CK 5%</strong> nếu thanh toán nhanh 95% trong 6 tháng</div>
            </div>
            <div style="display:flex;gap:.5rem;align-items:start;margin-bottom:.5rem">
              <span>🎁</span><div><strong>Tặng 1 chỗ đậu xe</strong> (cho căn ≥ 100m²)</div>
            </div>
            <div style="display:flex;gap:.5rem;align-items:start">
              <span>📋</span><div><strong>Lịch thanh toán chia 8 đợt</strong> theo tiến độ thi công</div>
            </div>
          </div>

          <div style="margin-top:1rem">
            <h4 style="color:var(--futa-green-dark);margin-bottom:.5rem">Lịch sử mua BĐS</h4>
            ${ext.purchaseHistory ? `
              <div class="card" style="padding:.85rem;background:var(--futa-green-light)">
                <strong>🏆 Khách hàng cũ FUTA Land</strong>
                <div style="font-size:.85rem;margin-top:.3rem">Đã từng mua 1 BĐS · KH có thể là người giới thiệu / tái mua</div>
              </div>
            ` : `
              <div style="color:var(--gray-500);font-size:.85rem">Chưa từng mua BĐS tại FUTA Land</div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderFamily(lead, ext) {
    return `
      <div class="info-grid">
        <div class="info-item"><label>Tình trạng hôn nhân</label><div>💑 ${ext.spouse || '—'}</div></div>
        <div class="info-item"><label>Số con</label><div>👶 ${ext.children !== undefined ? ext.children : '—'}</div></div>
        <div class="info-item"><label>Lý do mua</label><div>${ext.purpose || '—'}</div></div>
        <div class="info-item"><label>Hướng ưa thích</label><div>${ext.preferredDirection || '—'}</div></div>
      </div>
      <div style="margin-top:1rem;padding:1rem;background:var(--gray-50);border-radius:10px">
        <h4 style="color:var(--futa-green-dark);margin-bottom:.5rem">💡 Gợi ý từ AI</h4>
        ${ext.children >= 2 ? `
          <div style="font-size:.88rem;margin-bottom:.4rem">
            👨‍👩‍👧‍👦 Gia đình ${ext.children + 1}-${ext.children + 2} người — nên giới thiệu căn ≥ ${ext.children >= 3 ? '120' : '90'}m², ≥ 3 PN
          </div>
        ` : ''}
        ${ext.purpose === 'Để ở' ? `
          <div style="font-size:.88rem;margin-bottom:.4rem">
            🏠 Mua để ở — ưu tiên dự án có tiện ích nội khu (hồ bơi, gym, trường học)
          </div>
        ` : ext.purpose === 'Đầu tư cho thuê' ? `
          <div style="font-size:.88rem;margin-bottom:.4rem">
            💵 Đầu tư cho thuê — ưu tiên căn 1-2 PN, gần trung tâm, ROI 6-8%/năm
          </div>
        ` : ''}
        ${ext.children ? `
          <div style="font-size:.88rem">
            👶 Có con nhỏ — chú trọng an ninh, gần trường, sân chơi
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderHistory(lead, activities) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h4 style="color:var(--futa-green-dark)">Timeline tương tác (${activities.length})</h4>
        <button class="btn btn-primary btn-sm" onclick="Leads.openActivityModal('${lead.id}')">+ Thêm hoạt động</button>
      </div>
      ${activities.length === 0 ? '<div class="empty"><div class="empty-icon">📭</div><p>Chưa có hoạt động</p></div>' :
        `<div class="timeline">
          ${activities.map(a => {
            const t = ACTIVITY_TYPES[a.type] || ACTIVITY_TYPES.note;
            const by = Storage.getSale(a.by);
            return `
              <div class="timeline-item">
                <div class="timeline-icon">${t.icon}</div>
                <div class="timeline-body">
                  <strong>${t.label}</strong>
                  ${a.content ? `<div style="margin-top:.25rem;font-size:.88rem">${a.content}</div>` : ''}
                  <div class="timeline-meta">${by ? by.name + ' (' + by.code + ')' : '—'} · ${relativeTime(a.at)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>`
      }
    `;
  }

  function renderDealsTasks(lead, deals, tasks) {
    const openTasks = tasks.filter(t => !t.done);
    const doneTasks = tasks.filter(t => t.done);

    return `
      <div class="grid-2">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h4 style="color:var(--futa-green-dark)">Deal liên quan (${deals.length})</h4>
            <button class="btn btn-ghost btn-sm" onclick="Deals.openCreateModal(null, '${lead.id}')">+ Tạo deal</button>
          </div>
          ${deals.length === 0 ? '<div class="empty"><div class="empty-icon">🎯</div><p>Chưa có deal</p></div>' :
            deals.map(d => {
              const stage = DEAL_STAGES.find(s => s.key === d.stage);
              return `
                <div class="card" style="margin-bottom:.6rem;padding:.85rem 1rem;cursor:pointer;border-left:3px solid ${stage.color}" onclick="App.navigate('deal/${d.id}')">
                  <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                      <strong>${d.code}</strong>
                      <div style="font-size:.85rem;color:var(--gray-700);margin-top:.2rem">${d.unitCode} · ${d.projectName}</div>
                    </div>
                    <span class="pill" style="background:${stage.color}22;color:${stage.color}">${stage.label}</span>
                  </div>
                  <div style="display:flex;gap:.75rem;font-size:.78rem;color:var(--gray-500);margin-top:.5rem">
                    <span>💰 <strong style="color:var(--futa-green)">${formatVND(d.amount)}</strong></span>
                    <span>🎁 HH ${formatVND(d.commission)}</span>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h4 style="color:var(--futa-green-dark)">Task (${openTasks.length} mở)</h4>
            <button class="btn btn-ghost btn-sm" onclick="Tasks.openCreateModal('${lead.id}')">+ Thêm task</button>
          </div>
          ${tasks.length === 0 ? '<div class="empty"><div class="empty-icon">📋</div><p>Chưa có task</p></div>' :
            tasks.map(t => {
              const type = TASK_TYPES[t.type] || TASK_TYPES.other;
              const due = new Date(t.dueAt);
              const isOverdue = !t.done && due.getTime() < Date.now();
              return `
                <div class="task-row ${t.done ? 'done' : ''} ${isOverdue ? 'overdue' : ''}">
                  <input type="checkbox" ${t.done ? 'checked' : ''} onchange="Tasks.toggle('${t.id}'); Leads.renderDetail('${lead.id}')">
                  <span class="task-icon" style="background:${type.color}22;color:${type.color}">${type.icon}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:.88rem">${t.title}</div>
                    <div style="font-size:.72rem;color:var(--gray-500)">
                      ${due.toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}
                      ${isOverdue ? '· <strong style="color:var(--red)">QUÁ HẠN</strong>' : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;
  }

  function renderDocs(lead) {
    // Mock: hợp đồng, CMND, biên bản
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h4 style="color:var(--futa-green-dark)">Tài liệu khách hàng</h4>
        <button class="btn btn-primary btn-sm">+ Upload file</button>
      </div>
      <div class="doc-grid">
        <div class="doc-tile">
          <div class="doc-icon" style="background:#fee2e2;color:#dc2626">📄</div>
          <div style="flex:1">
            <strong>CMND_${lead.code}.pdf</strong>
            <div style="font-size:.72rem;color:var(--gray-500)">2.1 MB · 12/05/2026</div>
          </div>
          <button class="btn btn-ghost btn-sm">⬇</button>
        </div>
        <div class="doc-tile">
          <div class="doc-icon" style="background:#dbeafe;color:#2563eb">📋</div>
          <div style="flex:1">
            <strong>Phieu_dang_ky.pdf</strong>
            <div style="font-size:.72rem;color:var(--gray-500)">850 KB · 14/05/2026</div>
          </div>
          <button class="btn btn-ghost btn-sm">⬇</button>
        </div>
        <div class="doc-tile">
          <div class="doc-icon" style="background:#fef3c7;color:#ca8a04">📃</div>
          <div style="flex:1">
            <strong>Bien_ban_hen.docx</strong>
            <div style="font-size:.72rem;color:var(--gray-500)">220 KB · 20/05/2026</div>
          </div>
          <button class="btn btn-ghost btn-sm">⬇</button>
        </div>
      </div>
      <div style="margin-top:1rem;padding:.85rem;background:var(--gray-50);border-radius:10px;font-size:.85rem;color:var(--gray-700)">
        💡 <strong>Tích hợp với Document Composer:</strong>
        <a href="../documents/index.html" style="color:var(--futa-green);font-weight:600">Soạn HĐ mới</a>
        từ template, auto fill thông tin từ deal — sắp ra mắt Phase 3.
      </div>
    `;
  }

  function renderNotes(lead, ext) {
    return `
      <h4 style="color:var(--futa-green-dark);margin-bottom:.75rem">Ghi chú nội bộ (chỉ team thấy)</h4>
      <textarea id="internalNotes" rows="8" style="width:100%;padding:.75rem;border:1px solid var(--gray-200);border-radius:10px;font-family:inherit" placeholder="Ghi chú dành cho team Sale: tính cách, lưu ý đặc biệt, lịch sử khó tính...">${ext.internalNotes || ''}</textarea>
      <div style="text-align:right;margin-top:.5rem">
        <button class="btn btn-primary" onclick="Leads.saveInternalNotes('${lead.id}')">💾 Lưu ghi chú</button>
      </div>
    `;
  }

  function switchTab(leadId, tab) {
    currentTab = tab;
    renderDetail(leadId);
  }

  function saveInternalNotes(leadId) {
    const lead = Storage.getLead(leadId);
    if (!lead) return;
    if (!lead.extended) lead.extended = {};
    lead.extended.internalNotes = document.getElementById('internalNotes').value;
    Storage.saveLead(lead);
    toast('Đã lưu ghi chú', 'success');
  }

  function changeStatus(leadId, status) {
    const lead = Storage.getLead(leadId);
    if (!lead) return;
    const oldStatus = lead.status;
    if (oldStatus === status) return;
    lead.status = status;
    Storage.saveLead(lead);
    Storage.addActivity(leadId, {
      type: 'stage',
      by: Storage.getCurrentUser().id,
      content: `Chuyển từ "${LEAD_STATUS[oldStatus].label}" → "${LEAD_STATUS[status].label}"`
    });
    toast('Đã đổi trạng thái', 'success');
    renderDetail(leadId);
  }

  /* ----------- CREATE/EDIT MODAL ----------- */
  function openCreateModal() {
    openModal({});
  }
  function openEditModal(id) {
    const lead = Storage.getLead(id);
    if (lead) openModal(lead);
  }

  function openModal(lead) {
    const isNew = !lead.id;
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
    const sales = Storage.getSales();
    const ct = lead.customerType || 'individual';
    const b = lead.business || {};

    const body = `
      <div class="cust-type-switch">
        <label class="cts-opt ${ct === 'individual' ? 'active' : ''}">
          <input type="radio" name="fCustType" value="individual" ${ct === 'individual' ? 'checked' : ''} onchange="Leads.toggleCustType('individual')">
          👤 Cá nhân
        </label>
        <label class="cts-opt ${ct === 'business' ? 'active' : ''}">
          <input type="radio" name="fCustType" value="business" ${ct === 'business' ? 'checked' : ''} onchange="Leads.toggleCustType('business')">
          🏢 Doanh nghiệp
        </label>
      </div>

      <div class="form-grid" id="fBusinessSection" ${ct === 'business' ? '' : 'hidden'}>
        <div class="form-field full">
          <label>Tên công ty <span class="req">*</span></label>
          <input type="text" id="fCompanyName" value="${b.companyName || ''}" placeholder="VD: Công ty TNHH ABC">
        </div>
        <div class="form-field">
          <label>Mã số thuế</label>
          <input type="text" id="fTaxCode" value="${b.taxCode || ''}" placeholder="0123456789">
        </div>
        <div class="form-field">
          <label>Ngành nghề</label>
          <select id="fIndustry">
            <option value="">— Chưa chọn —</option>
            ${BUSINESS_INDUSTRIES.map(i => `<option value="${i.key}" ${b.industry === i.key ? 'selected' : ''}>${i.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Quy mô</label>
          <select id="fBusinessSize">
            <option value="">— Chưa chọn —</option>
            ${BUSINESS_SIZES.map(s => `<option value="${s.key}" ${b.size === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Vốn điều lệ (triệu VNĐ)</label>
          <input type="number" id="fCapital" value="${b.capital || ''}" min="0" step="1000">
        </div>
        <div class="form-field">
          <label>Năm thành lập</label>
          <input type="number" id="fFoundedYear" value="${b.foundedYear || ''}" min="1900" max="2100">
        </div>
        <div class="form-field full">
          <label>Trụ sở</label>
          <input type="text" id="fHeadquarters" value="${b.headquarters || ''}" placeholder="VD: TP.HCM, Việt Nam">
        </div>
        <div class="form-field full">
          <label>Mục đích mua / sử dụng BĐS</label>
          <input type="text" id="fPurpose" value="${b.purpose || ''}" placeholder="VD: Đầu tư cho thuê / Mua văn phòng">
        </div>
        <div class="form-field">
          <label>Website</label>
          <input type="text" id="fWebsite" value="${b.website || ''}">
        </div>
        <div class="form-field">
          <label>Hạn mức công nợ (triệu)</label>
          <input type="number" id="fCreditLimit" value="${b.creditLimit || ''}" min="0">
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field full">
          <label id="fNameLabel">${ct === 'business' ? 'Người đại diện liên hệ' : 'Họ tên'} <span class="req">*</span></label>
          <input type="text" id="fName" value="${ct === 'business' ? (lead.contactName || lead.name || '') : (lead.name || '')}" required>
        </div>
        <div class="form-field">
          <label>SĐT <span class="req">*</span></label>
          <input type="tel" id="fPhone" value="${lead.phone || ''}" required>
        </div>
        <div class="form-field">
          <label>Email</label>
          <input type="email" id="fEmail" value="${lead.email || ''}">
        </div>
        <div class="form-field">
          <label>Nguồn <span class="req">*</span></label>
          <select id="fSource">
            ${Object.entries(LEAD_SOURCES).map(([k, v]) =>
              `<option value="${k}" ${lead.source === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Trạng thái</label>
          <select id="fStatus">
            ${Object.entries(LEAD_STATUS).map(([k, v]) =>
              `<option value="${k}" ${lead.status === k ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Dự án quan tâm</label>
          <select id="fProject">
            <option value="">— Chưa rõ —</option>
            ${projects.map(p =>
              `<option value="${p.id}" ${(lead.interest && lead.interest.projectId) === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Ngân sách (triệu VNĐ)</label>
          <input type="number" id="fBudget" value="${(lead.interest && lead.interest.budget) || ''}" min="0" step="100">
          <span class="hint">VD: 5000 = 5 tỷ</span>
        </div>
        <div class="form-field">
          <label>Số phòng ngủ</label>
          <select id="fBedrooms">
            ${[1, 2, 3, 4, 5].map(n =>
              `<option value="${n}" ${(lead.interest && lead.interest.bedrooms) === n ? 'selected' : ''}>${n} PN</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Số căn quan tâm</label>
          <input type="number" id="fUnitCount" value="${(lead.interest && lead.interest.unitCount) || 1}" min="1" step="1">
          <span class="hint">DN thường mua nhiều căn 1 lúc</span>
        </div>
        <div class="form-field">
          <label>Sao đánh giá</label>
          <select id="fRating">
            ${[1, 2, 3, 4, 5].map(n =>
              `<option value="${n}" ${(lead.rating || 3) === n ? 'selected' : ''}>${stars(n)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Sale phụ trách</label>
          <select id="fSales">
            ${sales.map(s =>
              `<option value="${s.id}" ${lead.assignedTo === s.id ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Leads.saveFromModal('${lead.id || ''}')">${isNew ? 'Tạo mới' : 'Lưu'}</button>
    `;

    Modal.show({
      title: isNew ? '+ Thêm khách hàng mới' : 'Sửa khách hàng — ' + lead.code,
      body, footer
    });
  }

  function saveFromModal(id) {
    const name = document.getElementById('fName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    if (!name || !phone) {
      toast('Vui lòng nhập tên và SĐT', 'error');
      return;
    }
    const projectId = document.getElementById('fProject').value;
    const project = (typeof PROJECTS !== 'undefined') ? PROJECTS.find(p => p.id === projectId) : null;

    let lead = id ? Storage.getLead(id) : null;
    const isNew = !lead;
    if (!lead) {
      const allLeads = Storage.getLeads();
      const maxN = allLeads.reduce((m, l) => {
        const n = parseInt(l.code.replace(/\D/g, '')) || 0;
        return Math.max(m, n);
      }, 0);
      lead = {
        id: uid('L'),
        code: 'L' + String(maxN + 1).padStart(5, '0'),
        activities: []
      };
    }

    // Loại KH
    const custType = (document.querySelector('input[name="fCustType"]:checked') || {value: 'individual'}).value;
    lead.customerType = custType;
    if (custType === 'business') {
      const companyName = (document.getElementById('fCompanyName').value || '').trim();
      if (!companyName) { toast('Nhập tên công ty', 'error'); return; }
      const indKey = document.getElementById('fIndustry').value;
      const indObj = BUSINESS_INDUSTRIES.find(x => x.key === indKey);
      const sizeKey = document.getElementById('fBusinessSize').value;
      const sizeObj = BUSINESS_SIZES.find(x => x.key === sizeKey);
      lead.business = {
        companyName,
        taxCode: document.getElementById('fTaxCode').value.trim(),
        industry: indKey || '',
        industryLabel: indObj ? indObj.label : '',
        size: sizeKey || '',
        sizeLabel: sizeObj ? sizeObj.label : '',
        employees: sizeObj ? sizeObj.employees : 0,
        capital: parseInt(document.getElementById('fCapital').value) || 0,
        foundedYear: parseInt(document.getElementById('fFoundedYear').value) || null,
        headquarters: document.getElementById('fHeadquarters').value.trim(),
        purpose: document.getElementById('fPurpose').value.trim(),
        website: document.getElementById('fWebsite').value.trim(),
        creditLimit: parseInt(document.getElementById('fCreditLimit').value) || 0
      };
      lead.name = companyName;
      lead.contactName = name;
    } else {
      lead.business = null;
      lead.contactName = null;
      lead.name = name;
    }

    lead.phone = phone;
    lead.email = document.getElementById('fEmail').value.trim();
    lead.source = document.getElementById('fSource').value;
    lead.status = document.getElementById('fStatus').value;
    lead.rating = parseInt(document.getElementById('fRating').value);
    lead.assignedTo = document.getElementById('fSales').value;
    lead.interest = {
      projectId: projectId || null,
      projectName: project ? project.name : '',
      budget: parseInt(document.getElementById('fBudget').value) || 0,
      bedrooms: parseInt(document.getElementById('fBedrooms').value),
      unitCount: Math.max(parseInt(document.getElementById('fUnitCount').value) || 1, 1)
    };

    // Nếu có pending extended data từ OCR → merge vào
    if (isNew && window._pendingExtended) {
      lead.extended = Object.assign({}, lead.extended || {}, window._pendingExtended);
      window._pendingExtended = null;
    }

    Storage.saveLead(lead);
    Modal.hide();
    toast(isNew ? 'Đã tạo khách hàng' : 'Đã lưu thay đổi', 'success');

    if (isNew) App.navigate('lead/' + lead.id);
    else App.render();
  }

  /* ----------- ACTIVITY MODAL ----------- */
  function openActivityModal(leadId) {
    const body = `
      <div class="form-grid">
        <div class="form-field">
          <label>Loại hoạt động</label>
          <select id="fActType">
            ${Object.entries(ACTIVITY_TYPES).filter(([k]) => k !== 'stage').map(([k, v]) =>
              `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full">
          <label>Nội dung</label>
          <textarea id="fActContent" rows="3" placeholder="VD: Đã gọi tư vấn 15 phút, KH muốn xem 2 căn vào cuối tuần..."></textarea>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Leads.saveActivity('${leadId}')">Ghi nhận</button>
    `;
    Modal.show({ title: '+ Ghi hoạt động', body, footer });
  }

  function saveActivity(leadId) {
    const type = document.getElementById('fActType').value;
    const content = document.getElementById('fActContent').value.trim();
    Storage.addActivity(leadId, {
      type, content,
      by: Storage.getCurrentUser().id
    });
    Modal.hide();
    toast('Đã ghi hoạt động', 'success');
    renderDetail(leadId);
  }

  return {
    renderList, renderDetail, openCreateModal, openEditModal, openModal,
    saveFromModal, clearFilters, exportCSV, changeStatus,
    openActivityModal, saveActivity,
    switchTab, saveInternalNotes,
    toggleSelect, clearSelection, bulkAssign, bulkStatus, bulkDelete, bulkExport,
    saveCurrentView, applyView, deleteView,
    toggleCustType
  };
})();
