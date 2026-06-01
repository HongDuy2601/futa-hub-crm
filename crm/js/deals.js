/* ============================================================
 * FUTA HUB CRM - DEALS / PIPELINE (Kanban)
 * ============================================================ */

const Deals = (function () {
  let salesFilter = '';

  function renderKanban() {
    const deals = Storage.getDeals().filter(d => !salesFilter || d.salesId === salesFilter);
    const sales = Storage.getSales();

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Pipeline Sale</h1>
          <p>${deals.length} deal · Kéo thả (chuột/chạm) hoặc bấm ⇄ để đổi giai đoạn</p>
        </div>
        <div class="page-actions">
          <select id="dlSales" class="btn btn-secondary" style="padding:.45rem .75rem">
            <option value="">Tất cả nhân viên</option>
            ${sales.map(s => `<option value="${s.id}" ${salesFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary" onclick="Deals.openCreateModal()">+ Thêm deal</button>
        </div>
      </div>

      <div class="kanban-board">
        ${DEAL_STAGES.map(stage => {
          const colDeals = deals.filter(d => d.stage === stage.key);
          const sum = colDeals.reduce((s, d) => s + d.amount, 0);
          return `
            <div class="kanban-col" data-stage="${stage.key}">
              <div class="kanban-col-header" style="border-bottom-color:${stage.color}">
                <div>
                  <div style="color:${stage.color}">${stage.label}</div>
                  ${sum > 0 ? `<div class="kanban-col-sum">${formatVND(sum)}</div>` : ''}
                </div>
                <span class="kanban-col-count">${colDeals.length}</span>
              </div>
              <div class="kanban-col-body" data-stage="${stage.key}">
                ${colDeals.map(d => renderCard(d, stage)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;

    document.getElementById('dlSales').onchange = e => {
      salesFilter = e.target.value;
      renderKanban();
    };

    attachDnD();
  }

  function renderCard(d, stage) {
    const sale = Storage.getSale(d.salesId);
    return `
      <div class="deal-card" style="border-left-color:${stage.color}" data-id="${d.id}">
        <div class="deal-card-top">
          <div class="deal-card-title">${d.leadName}</div>
          <button class="deal-move-btn" title="Chuyển giai đoạn" onclick="event.stopPropagation();Deals.openMoveMenu('${d.id}', this)">⇄</button>
        </div>
        <div class="deal-card-meta">${d.unitCode} · ${d.projectName}</div>
        <div class="deal-card-foot">
          <span class="deal-card-amount">${formatVND(d.amount)}</span>
          <div class="deal-card-sales" title="${sale ? sale.name : ''}">${sale ? sale.code.slice(0, 2) : '?'}</div>
        </div>
      </div>
    `;
  }

  /* ----------- POINTER-BASED DRAG (chuột + cảm ứng) ----------- */
  let drag = null; // { id, ghost, startX, startY, started, card }
  const THRESHOLD = 8;

  function attachDnD() {
    const board = document.querySelector('.kanban-board');
    if (!board) return;
    board.querySelectorAll('.deal-card').forEach(card => {
      card.addEventListener('pointerdown', onPointerDown);
    });
  }

  function onPointerDown(e) {
    if (e.button && e.button !== 0) return; // chỉ chuột trái
    if (e.target.closest('.deal-move-btn')) return; // bấm nút move thì bỏ qua
    const card = e.currentTarget;
    drag = {
      id: card.dataset.id,
      card,
      startX: e.clientX,
      startY: e.clientY,
      started: false,
      ghost: null,
      pointerId: e.pointerId
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.started) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      // bắt đầu kéo
      drag.started = true;
      drag.card.classList.add('dragging');
      document.body.classList.add('dragging-active');
      const rect = drag.card.getBoundingClientRect();
      const ghost = drag.card.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.style.width = rect.width + 'px';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      ghost.dataset.offsetX = (e.clientX - rect.left);
      ghost.dataset.offsetY = (e.clientY - rect.top);
      document.body.appendChild(ghost);
      drag.ghost = ghost;
    }
    e.preventDefault();
    // di chuyển ghost
    const ox = parseFloat(drag.ghost.dataset.offsetX);
    const oy = parseFloat(drag.ghost.dataset.offsetY);
    drag.ghost.style.left = (e.clientX - ox) + 'px';
    drag.ghost.style.top = (e.clientY - oy) + 'px';
    // highlight cột dưới con trỏ
    drag.ghost.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const col = el && el.closest('.kanban-col-body');
    document.querySelectorAll('.kanban-col-body').forEach(c => c.classList.toggle('drag-over', c === col));
  }

  function onPointerUp(e) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    if (!drag) return;
    const wasDragging = drag.started;
    const id = drag.id;

    if (drag.ghost) drag.ghost.remove();
    if (drag.card) drag.card.classList.remove('dragging');
    document.body.classList.remove('dragging-active');
    document.querySelectorAll('.kanban-col-body').forEach(c => c.classList.remove('drag-over'));

    if (!wasDragging) {
      drag = null;
      App.navigate('deal/' + id); // tap = mở chi tiết
      return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const col = el && el.closest('.kanban-col-body');
    drag = null;
    if (col && col.dataset.stage) {
      moveDeal(id, col.dataset.stage);
    }
  }

  /* ----------- QUICK MOVE MENU (fallback chắc chắn trên mobile) ----------- */
  function openMoveMenu(dealId, btn) {
    const deal = Storage.getDeal(dealId);
    if (!deal) return;
    document.querySelectorAll('.move-menu').forEach(m => m.remove());
    const menu = document.createElement('div');
    menu.className = 'move-menu';
    menu.innerHTML = DEAL_STAGES.map(s => `
      <button class="move-menu-item ${deal.stage === s.key ? 'current' : ''}" data-stage="${s.key}">
        <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></span>
        ${s.label} ${deal.stage === s.key ? '✓' : ''}
      </button>
    `).join('');
    document.body.appendChild(menu);
    const r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 4) + 'px';
    menu.style.left = Math.min(r.left, window.innerWidth - 190) + 'px';
    menu.querySelectorAll('.move-menu-item').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        menu.remove();
        moveDeal(dealId, item.dataset.stage);
      };
    });
    setTimeout(() => {
      document.addEventListener('click', function close() {
        menu.remove();
        document.removeEventListener('click', close);
      }, { once: true });
    }, 10);
  }

  /* ----------- CORE: move deal to stage + side effects ----------- */
  function moveDeal(dealId, newStage) {
    const deal = Storage.getDeal(dealId);
    if (!deal || deal.stage === newStage) return;
    const oldStage = deal.stage;
    deal.stage = newStage;
    Storage.saveDeal(deal);

    if (newStage === 'deposit') Storage.lockUnit(deal.unitId, deal.id, deal.salesId);
    else if (newStage === 'contract' || newStage === 'completed') Storage.sellUnit(deal.unitId, deal.id, deal.salesId);
    else if (newStage === 'cancelled' || newStage === 'new' || newStage === 'viewed') Storage.releaseUnit(deal.unitId);

    if (deal.leadId) {
      const oldL = (DEAL_STAGES.find(s => s.key === oldStage) || {}).label;
      const newL = (DEAL_STAGES.find(s => s.key === newStage) || {}).label;
      Storage.addActivity(deal.leadId, {
        type: 'stage', by: Storage.getCurrentUser().id,
        content: `Deal ${deal.code}: ${oldL} → ${newL}`
      });
      if (newStage === 'completed' || newStage === 'contract') {
        Storage.addNotification({
          type: 'deal_won',
          title: '🎉 Deal ' + deal.code + ' chốt thành công',
          body: deal.leadName + ' · ' + formatVND(deal.amount),
          dealId: deal.id
        });
      }
    }
    toast(`Đã chuyển sang "${(DEAL_STAGES.find(s => s.key === newStage) || {}).label}"`, 'success');
    renderKanban();
  }

  /* ----------- DETAIL ----------- */
  function renderDetail(id) {
    const deal = Storage.getDeal(id);
    if (!deal) {
      document.getElementById('pageContent').innerHTML =
        `<div class="empty"><div class="empty-icon">❓</div><h3>Không tìm thấy deal</h3></div>`;
      return;
    }
    const stage = DEAL_STAGES.find(s => s.key === deal.stage) || DEAL_STAGES[0];
    const lead = Storage.getLead(deal.leadId);
    const sale = Storage.getSale(deal.salesId);
    const units = Storage.getEnrichedUnits();
    const unit = units.find(u => u.id === deal.unitId);

    const html = `
      <div class="page-header">
        <div class="page-title">
          <p><a href="#/pipeline" style="color:var(--gray-500)">← Pipeline</a></p>
          <h1>Deal ${deal.code}</h1>
          <p>${deal.leadName} · ${deal.unitCode}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="Deals.openCreateModal('${deal.id}')">✏️ Sửa</button>
          <button class="btn btn-danger" onclick="Deals.removeDeal('${deal.id}')">🗑 Xóa</button>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <div class="card" style="margin-bottom:1rem">
            <div class="card-header">
              <h3>Thông tin deal</h3>
              <span class="pill" style="background:${stage.color}22;color:${stage.color}">${stage.label}</span>
            </div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item"><label>Khách hàng</label>
                  <div><a href="#/lead/${deal.leadId}" style="color:var(--futa-green);font-weight:600">${deal.leadName}</a></div>
                </div>
                <div class="info-item"><label>SĐT khách</label><div>${deal.leadPhone}</div></div>
                <div class="info-item"><label>Dự án</label><div>${deal.projectName}</div></div>
                <div class="info-item"><label>Mã căn</label><div><strong>${deal.unitCode}</strong></div></div>
                <div class="info-item"><label>Giá trị deal</label><div style="color:var(--futa-red);font-weight:700;font-size:1.1rem">${formatVND(deal.amount)}</div></div>
                <div class="info-item"><label>Hoa hồng dự kiến (2.5%)</label><div style="color:var(--futa-green);font-weight:700">${formatVND(deal.commission)}</div></div>
                <div class="info-item"><label>Sale</label><div>${sale ? sale.name + ' (' + sale.code + ')' : '—'}</div></div>
                <div class="info-item"><label>Hạn dự kiến chốt</label><div>${formatDate(deal.expectedCloseDate)}</div></div>
                <div class="info-item"><label>Tạo</label><div>${formatDate(deal.createdAt)}</div></div>
                <div class="info-item"><label>Cập nhật</label><div>${relativeTime(deal.updatedAt)}</div></div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Chuyển giai đoạn</h3></div>
            <div class="card-body">
              <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                ${DEAL_STAGES.map(s => `
                  <button class="pill" style="background:${s.color}22;color:${s.color};border:none;cursor:pointer;${deal.stage === s.key ? 'outline:2px solid ' + s.color + ';' : 'opacity:.7'}"
                    onclick="Deals.changeStage('${deal.id}', '${s.key}')">${s.label}</button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div>
          ${unit ? `
            <div class="card">
              <div class="card-header"><h3>Căn liên kết</h3></div>
              <div class="card-body">
                <div class="unit-card" style="cursor:default;border-color:var(--futa-green)">
                  <div class="unit-project">${unit.projectName}</div>
                  <div class="unit-code">${unit.code}</div>
                  <div class="unit-info">
                    <span>📐 ${unit.area}m²</span>
                    <span>🛏 ${unit.bedrooms}PN</span>
                    <span>🧭 ${unit.direction}</span>
                  </div>
                  <div class="unit-price">${formatVND(unit.price)}</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${lead ? `
            <div class="card" style="margin-top:1rem">
              <div class="card-header"><h3>Khách hàng</h3></div>
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
                  <div class="user-avatar" style="width:44px;height:44px;font-size:.9rem;background:var(--futa-green)">${initials(lead.name)}</div>
                  <div>
                    <strong style="font-size:1rem">${lead.name}</strong>
                    <div style="font-size:.8rem;color:var(--gray-500)">${lead.phone}</div>
                  </div>
                </div>
                <a href="#/lead/${lead.id}" class="btn btn-secondary btn-sm btn-block">Xem hồ sơ khách →</a>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;
  }

  function changeStage(dealId, newStage) {
    const deal = Storage.getDeal(dealId);
    if (!deal || deal.stage === newStage) return;
    deal.stage = newStage;
    Storage.saveDeal(deal);

    if (newStage === 'deposit') Storage.lockUnit(deal.unitId, deal.id, deal.salesId);
    else if (['contract', 'completed'].includes(newStage)) Storage.sellUnit(deal.unitId, deal.id, deal.salesId);
    else if (['cancelled', 'new', 'viewed'].includes(newStage)) Storage.releaseUnit(deal.unitId);

    toast('Đã đổi giai đoạn', 'success');
    renderDetail(dealId);
  }

  function removeDeal(id) {
    if (!confirm('Xóa deal này?')) return;
    const deal = Storage.getDeal(id);
    if (deal) Storage.releaseUnit(deal.unitId);
    Storage.deleteDeal(id);
    toast('Đã xóa deal', 'success');
    App.navigate('pipeline');
  }

  /* ----------- CREATE/EDIT MODAL ----------- */
  function openCreateModal(id, presetLeadId, presetUnitId) {
    const deal = id ? Storage.getDeal(id) : { stage: 'new' };
    const isNew = !id;
    const leads = Storage.getLeads();
    const units = Storage.getEnrichedUnits();
    const availableUnits = units.filter(u => u.status === 'available' || u.id === deal.unitId);
    const sales = Storage.getSales();
    const me = Storage.getCurrentUser();

    const body = `
      <div class="form-grid">
        <div class="form-field">
          <label>Khách hàng <span class="req">*</span></label>
          <select id="fLeadId">
            <option value="">— Chọn khách hàng —</option>
            ${leads.map(l => `<option value="${l.id}" ${(deal.leadId || presetLeadId) === l.id ? 'selected' : ''}>${l.code} · ${l.name} (${l.phone})</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Căn <span class="req">*</span></label>
          <select id="fUnitId">
            <option value="">— Chọn căn —</option>
            ${availableUnits.map(u => `<option value="${u.id}" ${(deal.unitId || presetUnitId) === u.id ? 'selected' : ''}>${u.projectName} · ${u.code} · ${formatVND(u.price)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Giai đoạn</label>
          <select id="fStage">
            ${DEAL_STAGES.map(s => `<option value="${s.key}" ${deal.stage === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Sale phụ trách</label>
          <select id="fSalesId">
            ${sales.map(s => `<option value="${s.id}" ${(deal.salesId || me.id) === s.id ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Hạn dự kiến chốt</label>
          <input type="date" id="fCloseDate" value="${deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : ''}">
        </div>
        <div class="form-field">
          <label>Giá deal (triệu, để trống = lấy giá căn)</label>
          <input type="number" id="fAmount" value="${deal.amount || ''}" min="0" step="100">
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Deals.saveFromModal('${id || ''}')">${isNew ? 'Tạo deal' : 'Lưu'}</button>
    `;
    Modal.show({ title: isNew ? '+ Tạo deal mới' : 'Sửa deal ' + deal.code, body, footer });
  }

  function saveFromModal(id) {
    const leadId = document.getElementById('fLeadId').value;
    const unitId = document.getElementById('fUnitId').value;
    if (!leadId || !unitId) {
      toast('Phải chọn khách hàng và căn', 'error');
      return;
    }
    const lead = Storage.getLead(leadId);
    const units = Storage.getEnrichedUnits();
    const unit = units.find(u => u.id === unitId);
    if (!lead || !unit) {
      toast('Dữ liệu không hợp lệ', 'error');
      return;
    }

    let deal = id ? Storage.getDeal(id) : null;
    const isNew = !deal;
    if (!deal) {
      const allDeals = Storage.getDeals();
      const maxN = allDeals.reduce((m, d) => Math.max(m, parseInt(d.code.replace(/\D/g, '')) || 0), 0);
      deal = {
        id: uid('D'),
        code: 'D' + String(maxN + 1).padStart(5, '0')
      };
    }

    deal.leadId = lead.id;
    deal.leadName = lead.name;
    deal.leadPhone = lead.phone;
    deal.unitId = unit.id;
    deal.unitCode = unit.code;
    deal.unitType = unit.type;
    deal.projectId = unit.projectId;
    deal.projectName = unit.projectName;
    deal.stage = document.getElementById('fStage').value;
    deal.salesId = document.getElementById('fSalesId').value;
    deal.expectedCloseDate = document.getElementById('fCloseDate').value || null;
    const amount = parseInt(document.getElementById('fAmount').value);
    deal.amount = amount > 0 ? amount : unit.price;
    deal.commission = Math.round(deal.amount * 0.025);

    Storage.saveDeal(deal);

    if (deal.stage === 'deposit') Storage.lockUnit(deal.unitId, deal.id, deal.salesId);
    else if (['contract', 'completed'].includes(deal.stage)) Storage.sellUnit(deal.unitId, deal.id, deal.salesId);

    Modal.hide();
    toast(isNew ? 'Đã tạo deal ' + deal.code : 'Đã lưu deal', 'success');

    if (isNew) App.navigate('deal/' + deal.id);
    else App.render();
  }

  return {
    renderKanban, renderDetail, openCreateModal, saveFromModal, changeStage, removeDeal,
    openMoveMenu
  };
})();
