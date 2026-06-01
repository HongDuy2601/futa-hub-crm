/* ============================================================
 * FUTA HUB CRM - TASKS & CALENDAR
 * ============================================================ */

const Tasks = (function () {
  let viewMode = 'list'; // list | calendar
  let calMonth = new Date().getMonth();
  let calYear = new Date().getFullYear();
  let filter = 'all'; // all | today | overdue | upcoming | done

  function render() {
    const me = Storage.getCurrentUser();
    const allTasks = Storage.getTasks().filter(t => t.assignedTo === me.id || true); // show all team tasks
    const now = Date.now();
    const dayMs = 86400000;

    const buckets = {
      today: [],
      overdue: [],
      upcoming: [],
      done: []
    };
    allTasks.forEach(t => {
      const due = new Date(t.dueAt).getTime();
      if (t.done) { buckets.done.push(t); return; }
      if (due < now - dayMs/2) { buckets.overdue.push(t); return; }
      if (due < now + dayMs) { buckets.today.push(t); return; }
      buckets.upcoming.push(t);
    });

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Lịch & Task</h1>
          <p>${buckets.overdue.length} quá hạn · ${buckets.today.length} hôm nay · ${buckets.upcoming.length} sắp tới</p>
        </div>
        <div class="page-actions">
          <div class="tab-switch">
            <button class="tab-btn ${viewMode === 'list' ? 'active' : ''}" onclick="Tasks.switchView('list')">📋 Danh sách</button>
            <button class="tab-btn ${viewMode === 'calendar' ? 'active' : ''}" onclick="Tasks.switchView('calendar')">📅 Lịch tháng</button>
          </div>
          <button class="btn btn-primary" onclick="Tasks.openCreateModal()">+ Thêm task</button>
        </div>
      </div>

      ${viewMode === 'list' ? renderList(buckets) : renderCalendar(allTasks)}
    `;

    document.getElementById('pageContent').innerHTML = html;
  }

  function renderList(buckets) {
    const renderBucket = (title, list, color, badge) => {
      if (list.length === 0) return '';
      return `
        <div class="task-bucket">
          <h3 style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;color:${color}">
            ${title}
            <span class="nav-badge" style="background:${color};color:white">${list.length}</span>
          </h3>
          <div class="task-list">
            ${list.map(t => renderTaskRow(t)).join('')}
          </div>
        </div>
      `;
    };

    return `
      ${renderBucket('🚨 Quá hạn', buckets.overdue, '#dc2626')}
      ${renderBucket('📍 Hôm nay', buckets.today, '#f59e0b')}
      ${renderBucket('📅 Sắp tới', buckets.upcoming, '#3b82f6')}
      ${renderBucket('✅ Đã xong', buckets.done.slice(0, 10), '#16a34a')}
    `;
  }

  function renderTaskRow(t) {
    const type = TASK_TYPES[t.type] || TASK_TYPES.other;
    const prio = TASK_PRIORITY[t.priority];
    const lead = t.leadId ? Storage.getLead(t.leadId) : null;
    const due = new Date(t.dueAt);

    return `
      <div class="task-row ${t.done ? 'done' : ''}">
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="Tasks.toggle('${t.id}')">
        <span class="task-icon" style="background:${type.color}22;color:${type.color}">${type.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.92rem">${t.title}</div>
          <div style="font-size:.75rem;color:var(--gray-500);display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.2rem">
            <span>📅 ${due.toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}</span>
            <span style="color:${prio.color}">● ${prio.label}</span>
            ${lead ? `<span>· <a href="#/lead/${lead.id}" style="color:var(--futa-green)">${lead.name}</a></span>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Tasks.openEditModal('${t.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="Tasks.remove('${t.id}')" style="color:var(--red)">🗑</button>
      </div>
    `;
  }

  function renderCalendar(allTasks) {
    const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    const todayMatch = today.getMonth() === calMonth && today.getFullYear() === calYear ? today.getDate() : null;

    // Group tasks by date
    const byDate = {};
    allTasks.forEach(t => {
      const d = new Date(t.dueAt);
      if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
        const key = d.getDate();
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(t);
      }
    });

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(`<div class="cal-cell cal-empty"></div>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const tasks = byDate[d] || [];
      const isToday = d === todayMatch;
      cells.push(`
        <div class="cal-cell ${isToday ? 'cal-today' : ''}">
          <div class="cal-date">${d}</div>
          <div class="cal-tasks">
            ${tasks.slice(0, 3).map(t => {
              const type = TASK_TYPES[t.type] || TASK_TYPES.other;
              return `<div class="cal-task ${t.done ? 'done' : ''}" style="background:${type.color}" onclick="Tasks.openEditModal('${t.id}')">${type.icon} ${t.title.length > 14 ? t.title.slice(0,13) + '…' : t.title}</div>`;
            }).join('')}
            ${tasks.length > 3 ? `<div style="font-size:.7rem;color:var(--gray-500);padding:0 4px">+${tasks.length - 3} khác</div>` : ''}
          </div>
        </div>
      `);
    }

    return `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;gap:.5rem;align-items:center">
            <button class="btn btn-ghost btn-sm" onclick="Tasks.calNav(-1)">‹</button>
            <h3>${monthNames[calMonth]} ${calYear}</h3>
            <button class="btn btn-ghost btn-sm" onclick="Tasks.calNav(1)">›</button>
            <button class="btn btn-secondary btn-sm" onclick="Tasks.calToday()">Hôm nay</button>
          </div>
        </div>
        <div class="cal-grid">
          <div class="cal-head">T2</div><div class="cal-head">T3</div><div class="cal-head">T4</div>
          <div class="cal-head">T5</div><div class="cal-head">T6</div><div class="cal-head">T7</div>
          <div class="cal-head" style="color:var(--futa-red)">CN</div>
          ${cells.join('')}
        </div>
      </div>
    `;
  }

  function switchView(v) {
    viewMode = v;
    render();
  }

  function calNav(dir) {
    calMonth += dir;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    render();
  }
  function calToday() {
    const now = new Date();
    calMonth = now.getMonth();
    calYear = now.getFullYear();
    render();
  }

  function toggle(id) {
    Storage.toggleTask(id);
    toast('Đã cập nhật task', 'success');
    render();
  }
  function remove(id) {
    if (!confirm('Xóa task này?')) return;
    Storage.deleteTask(id);
    toast('Đã xóa task', 'success');
    render();
  }

  function openCreateModal(presetLeadId) {
    openModal({}, presetLeadId);
  }
  function openEditModal(id) {
    const t = Storage.getTasks().find(x => x.id === id);
    if (t) openModal(t);
  }

  function openModal(task, presetLeadId) {
    const isNew = !task.id;
    const leads = Storage.getLeads();
    const sales = Storage.getSales();
    const me = Storage.getCurrentUser();
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 2, 0, 0);

    const body = `
      <div class="form-grid">
        <div class="form-field full">
          <label>Tiêu đề <span class="req">*</span></label>
          <input type="text" id="ftTitle" value="${task.title || ''}" placeholder="VD: Gọi tư vấn KH Nguyễn Văn A">
        </div>
        <div class="form-field">
          <label>Loại</label>
          <select id="ftType">
            ${Object.entries(TASK_TYPES).map(([k, v]) =>
              `<option value="${k}" ${task.type === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Ưu tiên</label>
          <select id="ftPriority">
            ${Object.entries(TASK_PRIORITY).map(([k, v]) =>
              `<option value="${k}" ${(task.priority || 'medium') === k ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Hạn chót <span class="req">*</span></label>
          <input type="datetime-local" id="ftDue" value="${task.dueAt ? task.dueAt.slice(0, 16) : defaultDate.toISOString().slice(0, 16)}">
        </div>
        <div class="form-field">
          <label>Sale phụ trách</label>
          <select id="ftSales">
            ${sales.map(s => `<option value="${s.id}" ${(task.assignedTo || me.id) === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full">
          <label>Gắn khách hàng</label>
          <select id="ftLead">
            <option value="">— Không gắn —</option>
            ${leads.map(l => `<option value="${l.id}" ${(task.leadId || presetLeadId) === l.id ? 'selected' : ''}>${l.code} · ${l.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field full">
          <label>Ghi chú</label>
          <textarea id="ftNote" rows="2" placeholder="Ghi chú thêm...">${task.note || ''}</textarea>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Tasks.saveFromModal('${task.id || ''}')">${isNew ? 'Tạo task' : 'Lưu'}</button>
    `;
    Modal.show({ title: isNew ? '+ Thêm task' : 'Sửa task', body, footer });
  }

  function saveFromModal(id) {
    const title = document.getElementById('ftTitle').value.trim();
    const due = document.getElementById('ftDue').value;
    if (!title || !due) {
      toast('Nhập tiêu đề và hạn chót', 'error');
      return;
    }
    let task = id ? Storage.getTasks().find(t => t.id === id) : null;
    if (!task) task = { id: uid('T'), done: false };
    task.title = title;
    task.type = document.getElementById('ftType').value;
    task.priority = document.getElementById('ftPriority').value;
    task.dueAt = new Date(due).toISOString();
    task.assignedTo = document.getElementById('ftSales').value;
    task.leadId = document.getElementById('ftLead').value || null;
    task.note = document.getElementById('ftNote').value;
    Storage.saveTask(task);
    Modal.hide();
    toast(id ? 'Đã lưu task' : 'Đã tạo task', 'success');
    render();
  }

  return {
    render, switchView, calNav, calToday,
    toggle, remove, openCreateModal, openEditModal, saveFromModal
  };
})();
