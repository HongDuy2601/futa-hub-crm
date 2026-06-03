/* ============================================================
 * APP — router + render + bindings cho Email Marketing
 * ============================================================ */
(() => {
  const view = document.getElementById('view');
  const toastEl = document.getElementById('toast');

  /* ------------------- Toast ------------------- */
  let toastTimer;
  const toast = (msg, type = 'info', ms = 2600) => {
    toastEl.textContent = msg;
    toastEl.className = 'toast ' + (type === 'error' ? 'error' : type === 'success' ? 'success' : '');
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  };

  /* ------------------- Router ------------------- */
  const routes = {
    '': renderCompose,
    '#/': renderCompose,
    '#/recipients': renderRecipients,
    '#/templates': renderTemplates,
    '#/history': renderHistory,
    '#/settings': renderSettings,
    '#/deploy': renderDeployGuide,
  };

  const route = () => {
    const hash = location.hash || '#/';
    const handler = routes[hash] || renderCompose;
    document.querySelectorAll('.topnav a[data-nav]').forEach(a => {
      const target = a.getAttribute('href');
      a.classList.toggle('active', target === hash || (hash === '#/' && target === '#/'));
    });
    view.innerHTML = '';
    handler();
  };

  window.addEventListener('hashchange', route);

  /* ------------------- Helpers ------------------- */
  const cloneTpl = (id) => {
    const tpl = document.getElementById(id);
    if (!tpl) return document.createDocumentFragment();
    return tpl.content.cloneNode(true);
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN');
  };

  /* =================================================
   *                  VIEW: COMPOSE
   * ================================================= */
  let composeState = {
    subject: '',
    body: '',
    activeTemplateId: '',
    previewIdx: 0,
  };

  function renderCompose() {
    view.appendChild(cloneTpl('tpl-compose'));

    const subjectInput = document.getElementById('subjectInput');
    const bodyInput = document.getElementById('bodyInput');
    const placeholderHints = document.getElementById('placeholderHints');
    const previewPicker = document.getElementById('previewPicker');
    const templatePicker = document.getElementById('templatePicker');
    const sendBtn = document.getElementById('sendBtn');
    const testSendBtn = document.getElementById('testSendBtn');
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');

    // Restore state
    subjectInput.value = composeState.subject;
    bodyInput.value = composeState.body;

    renderRecipientSummary();
    rebuildPlaceholderHints();
    rebuildPreviewPicker();
    rebuildTemplatePicker();
    refreshPreview();
    refreshSendCount();

    // Listeners
    subjectInput.addEventListener('input', () => { composeState.subject = subjectInput.value; refreshPreview(); });
    bodyInput.addEventListener('input',    () => { composeState.body    = bodyInput.value;    refreshPreview(); });

    previewPicker.addEventListener('change', (e) => {
      composeState.previewIdx = Number(e.target.value);
      refreshPreview();
    });

    templatePicker.addEventListener('change', (e) => {
      const id = e.target.value;
      composeState.activeTemplateId = id;
      if (!id) return;
      const tpl = TemplateEngine.get(id);
      if (!tpl) return;
      subjectInput.value = tpl.subject || '';
      bodyInput.value = tpl.body || '';
      composeState.subject = subjectInput.value;
      composeState.body = bodyInput.value;
      refreshPreview();
      toast(`Đã tải mẫu "${tpl.name}"`, 'success');
    });

    saveTemplateBtn.addEventListener('click', () => {
      const name = prompt('Đặt tên cho mẫu email:', composeState.activeTemplateId ? TemplateEngine.get(composeState.activeTemplateId)?.name : '');
      if (!name) return;
      const saved = TemplateEngine.save({
        id: composeState.activeTemplateId || null,
        name: name.trim(),
        subject: composeState.subject,
        body: composeState.body,
      });
      composeState.activeTemplateId = saved.id;
      rebuildTemplatePicker();
      templatePicker.value = saved.id;
      toast('Đã lưu mẫu email', 'success');
    });

    sendBtn.addEventListener('click', handleSendBatch);
    testSendBtn.addEventListener('click', handleSendTest);
  }

  function renderRecipientSummary() {
    const box = document.getElementById('recipientSummary');
    if (!box) return;
    const all = Recipients.all();
    const sel = Recipients.selected();
    const invalid = all.filter(r => !Recipients.isValidEmail(r.email));
    if (all.length === 0) {
      box.innerHTML = '<p class="muted">Chưa có người nhận. <a href="#/recipients">Thêm ngay →</a></p>';
      return;
    }
    box.innerHTML = `
      <div class="summary-stat"><span class="num">${all.length}</span><span class="label">Tổng</span></div>
      <div class="summary-stat"><span class="num">${sel.length}</span><span class="label">Đã chọn gửi</span></div>
      <div class="summary-stat" style="border-left-color: var(--futa-red)"><span class="num">${invalid.length}</span><span class="label">Email lỗi</span></div>
    `;
  }

  function rebuildPlaceholderHints() {
    const box = document.getElementById('placeholderHints');
    if (!box) return;
    const keys = Recipients.getVariableKeys();
    if (keys.length === 0) { box.innerHTML = '<span class="muted">Thêm người nhận để hiện biến →</span>'; return; }
    box.innerHTML = keys.map(k => `<span class="placeholder-chip" data-key="${k}">{{${k}}}</span>`).join('');
    box.querySelectorAll('.placeholder-chip').forEach(chip => {
      chip.addEventListener('click', () => insertPlaceholder('{{' + chip.dataset.key + '}}'));
    });
  }

  function insertPlaceholder(token) {
    const focused = document.activeElement;
    const target = (focused && (focused.id === 'subjectInput' || focused.id === 'bodyInput'))
      ? focused
      : document.getElementById('bodyInput');
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = target.value.slice(0, start) + token + target.value.slice(end);
    target.focus();
    target.setSelectionRange(start + token.length, start + token.length);
    if (target.id === 'subjectInput') composeState.subject = target.value;
    else composeState.body = target.value;
    refreshPreview();
  }

  function rebuildPreviewPicker() {
    const sel = document.getElementById('previewPicker');
    if (!sel) return;
    const sels = Recipients.selected();
    if (sels.length === 0) {
      sel.innerHTML = '<option>— Chưa có người nhận đã chọn —</option>';
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    sel.innerHTML = sels.map((r, i) => `<option value="${i}">${escapeAttr(r.ten || '(không tên)')} — ${escapeAttr(r.email)}</option>`).join('');
    if (composeState.previewIdx >= sels.length) composeState.previewIdx = 0;
    sel.value = composeState.previewIdx;
  }

  function rebuildTemplatePicker() {
    const sel = document.getElementById('templatePicker');
    if (!sel) return;
    const tpls = TemplateEngine.list();
    sel.innerHTML = '<option value="">— Email mới —</option>' +
      tpls.map(t => `<option value="${t.id}">${escapeAttr(t.name)}</option>`).join('');
    sel.value = composeState.activeTemplateId || '';
  }

  function refreshPreview() {
    const sels = Recipients.selected();
    const r = sels[composeState.previewIdx] || sels[0];
    const prevTo = document.getElementById('prevTo');
    const prevSubject = document.getElementById('prevSubject');
    const prevBody = document.getElementById('prevBody');
    if (!prevBody) return;
    if (!r) {
      prevTo.textContent = '—';
      prevSubject.textContent = composeState.subject || '—';
      prevBody.innerHTML = '<em class="muted">Chưa có người nhận để xem trước.</em>';
      return;
    }
    const vars = Recipients.variableMapFor(r);
    prevTo.textContent = `${r.ten || ''} <${r.email}>`;
    prevSubject.innerHTML = TemplateEngine.render(composeState.subject || '(chưa nhập tiêu đề)', vars);
    prevBody.innerHTML = TemplateEngine.render(composeState.body || '<em>Soạn nội dung email...</em>', vars);
  }

  function refreshSendCount() {
    const el = document.getElementById('sendCount');
    if (el) el.textContent = Recipients.selected().length;
  }

  /* ------------ Send actions ------------ */
  async function handleSendBatch() {
    const settings = Storage.getSettings();
    if (!settings.scriptUrl) {
      toast('Chưa cấu hình Apps Script URL. Vào Cài đặt.', 'error');
      location.hash = '#/settings';
      return;
    }
    if (!composeState.subject.trim()) { toast('Nhập tiêu đề email', 'error'); return; }
    if (!composeState.body.trim()) { toast('Nhập nội dung email', 'error'); return; }
    const recipients = Recipients.selected();
    if (recipients.length === 0) { toast('Chưa có người nhận hợp lệ', 'error'); return; }

    if (!confirm(`Gửi email cho ${recipients.length} người? Hành động không hoàn tác.`)) return;

    openSendModal(recipients.length);
    const startedAt = new Date().toISOString();

    const result = await Sender.sendBatch(
      { subject: composeState.subject, body: composeState.body, recipients, settings },
      (current, total, r) => updateSendProgress(current, total, r),
    );

    finalizeSendModal(result);

    const hist = Storage.getHistory();
    hist.unshift({
      id: 'h_' + Math.random().toString(36).slice(2, 10),
      startedAt,
      finishedAt: new Date().toISOString(),
      subject: composeState.subject,
      body: composeState.body,
      total: recipients.length,
      ok: result.ok,
      fail: result.fail,
      results: result.results,
    });
    Storage.setHistory(hist.slice(0, 50));
  }

  async function handleSendTest() {
    const settings = Storage.getSettings();
    if (!settings.scriptUrl) { toast('Chưa cấu hình Apps Script URL', 'error'); location.hash = '#/settings'; return; }
    if (!settings.testEmail) { toast('Chưa cấu hình email test', 'error'); location.hash = '#/settings'; return; }
    if (!composeState.subject.trim() || !composeState.body.trim()) { toast('Cần có cả tiêu đề và nội dung', 'error'); return; }

    const sel = Recipients.selected();
    const sample = sel[composeState.previewIdx] || sel[0];
    toast('Đang gửi email test...', 'info');
    try {
      await Sender.sendTest({ subject: composeState.subject, body: composeState.body, settings, sampleRecipient: sample });
      toast(`Đã gửi test tới ${settings.testEmail}`, 'success');
    } catch (e) {
      toast('Lỗi gửi test: ' + e.message, 'error', 5000);
    }
  }

  /* ------------ Send modal ------------ */
  function openSendModal(total) {
    const m = document.getElementById('sendModal');
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = `0 / ${total}`;
    document.getElementById('sendLog').innerHTML = '';
    document.getElementById('cancelSendBtn').hidden = false;
    document.getElementById('closeSendBtn').hidden = true;
    m.hidden = false;

    document.getElementById('cancelSendBtn').onclick = () => Sender.abort();
    document.getElementById('closeSendBtn').onclick = () => { m.hidden = true; };
  }

  function updateSendProgress(current, total, r) {
    const pct = Math.round((current / total) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressText').textContent = `${current} / ${total} (${pct}%)`;
    const log = document.getElementById('sendLog');
    const line = document.createElement('div');
    line.className = 'log-line ' + (r.ok ? 'log-ok' : 'log-err');
    line.textContent = (r.ok ? '✓ ' : '✗ ') + r.email + (r.error ? ' — ' + r.error : '');
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  function finalizeSendModal(result) {
    document.getElementById('cancelSendBtn').hidden = true;
    document.getElementById('closeSendBtn').hidden = false;
    const log = document.getElementById('sendLog');
    const line = document.createElement('div');
    line.className = 'log-line';
    line.style.fontWeight = '700';
    line.style.marginTop = '.5rem';
    line.textContent = `Hoàn tất: ${result.ok} thành công, ${result.fail} lỗi.`;
    log.appendChild(line);
    if (result.fail === 0) toast(`Đã gửi ${result.ok} email thành công`, 'success', 4000);
    else toast(`Hoàn tất: ${result.ok} OK, ${result.fail} lỗi`, result.ok === 0 ? 'error' : 'info', 5000);
  }

  /* =================================================
   *               VIEW: RECIPIENTS
   * ================================================= */
  function renderRecipients() {
    view.appendChild(cloneTpl('tpl-recipients'));

    document.getElementById('csvUpload').addEventListener('change', handleCsvUpload);
    document.getElementById('addManualBtn').addEventListener('click', () => openManualModal());
    document.getElementById('syncCrmBtn').addEventListener('click', handleSyncCrm);
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      if (confirm('Xóa toàn bộ danh sách người nhận?')) {
        Recipients.clear();
        rebuildRecipientsTable();
        toast('Đã xóa hết', 'success');
      }
    });
    document.getElementById('selectAll').addEventListener('change', (e) => {
      Recipients.selectAll(e.target.checked);
      rebuildRecipientsTable();
    });
    document.getElementById('searchRecipients').addEventListener('input', (e) => rebuildRecipientsTable(e.target.value));
    document.getElementById('downloadSampleBtn').addEventListener('click', downloadSample);

    bindModalCloses();
    document.getElementById('manualSaveBtn').addEventListener('click', handleManualSave);

    rebuildRecipientsTable();
  }

  function rebuildRecipientsTable(filter = '') {
    const list = Recipients.all();
    const body = document.getElementById('recipientsBody');
    const empty = document.getElementById('recipientsEmpty');
    const stats = document.getElementById('recipientStats');
    const table = document.getElementById('recipientsTable');
    if (!body) return;

    if (list.length === 0) {
      empty.style.display = 'block';
      table.style.display = 'none';
      stats.textContent = '0 người';
      return;
    }
    empty.style.display = 'none';
    table.style.display = 'table';

    const q = filter.trim().toLowerCase();
    const filtered = q
      ? list.filter(r =>
          (r.email || '').toLowerCase().includes(q) ||
          (r.ten || '').toLowerCase().includes(q) ||
          (r.du_an || '').toLowerCase().includes(q))
      : list;

    body.innerHTML = filtered.map(r => {
      const invalid = !Recipients.isValidEmail(r.email);
      const customStr = Object.keys(r.custom || {}).length
        ? Object.entries(r.custom).map(([k, v]) => `${k}=${v}`).join(', ')
        : '';
      return `
        <tr data-id="${r.id}" class="${invalid ? 'invalid' : ''}">
          <td><input type="checkbox" class="row-select" ${r._selected ? 'checked' : ''} ${invalid ? 'disabled' : ''}></td>
          <td>${escapeHtml(r.email)} ${invalid ? '<span style="color:var(--futa-red);font-size:.8em">⚠</span>' : ''}</td>
          <td>${escapeHtml(r.ten || '')}</td>
          <td>${escapeHtml(r.du_an || '')}</td>
          <td>${escapeHtml(r.sdt || '')}</td>
          <td class="custom-cell" title="${escapeAttr(customStr)}">${escapeHtml(customStr)}</td>
          <td><button class="row-delete" data-act="del">✕</button></td>
        </tr>
      `;
    }).join('');

    body.querySelectorAll('.row-select').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.closest('tr').dataset.id;
        Recipients.toggleSelect(id, e.target.checked);
      });
    });
    body.querySelectorAll('[data-act="del"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        Recipients.remove(id);
        rebuildRecipientsTable(filter);
        toast('Đã xóa', 'info');
      });
    });

    const sel = Recipients.selected().length;
    stats.textContent = `${list.length} người (chọn: ${sel}, lọc: ${filtered.length})`;
  }

  async function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await Recipients.importFile(file);
      toast(`Đã thêm ${res.added}, cập nhật ${res.updated}, bỏ qua ${res.skipped}`, 'success', 4000);
      rebuildRecipientsTable();
    } catch (err) {
      toast('Lỗi import: ' + err.message, 'error', 5000);
    }
    e.target.value = '';
  }

  async function handleSyncCrm() {
    try {
      toast('Đang đồng bộ từ CRM Supabase...', 'info');
      const res = await Recipients.syncFromCrm();
      toast(`Đồng bộ xong: +${res.added} mới, ${res.updated} cập nhật (tổng ${res.total})`, 'success', 4500);
      rebuildRecipientsTable();
    } catch (err) {
      toast('Lỗi đồng bộ CRM: ' + err.message, 'error', 5500);
    }
  }

  function openManualModal() {
    document.getElementById('manualEmail').value = '';
    document.getElementById('manualName').value = '';
    document.getElementById('manualProject').value = '';
    document.getElementById('manualPhone').value = '';
    document.getElementById('manualCustom').value = '';
    document.getElementById('manualModal').hidden = false;
  }

  function handleManualSave() {
    const email = document.getElementById('manualEmail').value.trim();
    if (!email) { toast('Cần nhập email', 'error'); return; }
    let custom = {};
    const customRaw = document.getElementById('manualCustom').value.trim();
    if (customRaw) {
      try { custom = JSON.parse(customRaw); }
      catch { toast('JSON trường tùy chỉnh không hợp lệ', 'error'); return; }
    }
    const raw = {
      email,
      ten: document.getElementById('manualName').value.trim(),
      du_an: document.getElementById('manualProject').value.trim(),
      sdt: document.getElementById('manualPhone').value.trim(),
      ...custom,
    };
    const res = Recipients.add(raw);
    if (!res.ok) { toast('Không thêm được: ' + res.reason, 'error'); return; }
    document.getElementById('manualModal').hidden = true;
    rebuildRecipientsTable();
    toast(res.updated ? 'Đã cập nhật' : 'Đã thêm', 'success');
  }

  function downloadSample() {
    const csv = Recipients.buildSampleCsv();
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'futa-email-mau.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* =================================================
   *               VIEW: TEMPLATES
   * ================================================= */
  function renderTemplates() {
    view.appendChild(cloneTpl('tpl-templates'));
    const grid = document.getElementById('templatesGrid');
    const tpls = TemplateEngine.list();
    if (tpls.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📝</div>
        <h3>Chưa có mẫu nào</h3>
        <p>Quay lại <a href="#/">Soạn & Gửi</a>, viết email và bấm "Lưu mẫu" để dùng lại sau.</p>
      </div>`;
      return;
    }
    grid.innerHTML = tpls.map(t => `
      <div class="template-card" data-id="${t.id}">
        <h4>${escapeHtml(t.name)}</h4>
        <div class="tpl-subject">${escapeHtml(t.subject || '(không tiêu đề)')}</div>
        <div class="tpl-preview">${escapeHtml(stripTags(t.body || '').slice(0, 200))}</div>
        <div class="muted" style="font-size:.78rem">Cập nhật ${fmtDate(t.updatedAt)}</div>
        <div class="tpl-actions">
          <button class="btn btn-secondary btn-sm" data-act="use">Dùng mẫu này</button>
          <button class="btn btn-ghost btn-sm" data-act="del">Xóa</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-act="use"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.template-card').dataset.id;
        composeState.activeTemplateId = id;
        const tpl = TemplateEngine.get(id);
        composeState.subject = tpl.subject || '';
        composeState.body = tpl.body || '';
        location.hash = '#/';
      });
    });
    grid.querySelectorAll('[data-act="del"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.template-card').dataset.id;
        if (!confirm('Xóa mẫu này?')) return;
        TemplateEngine.remove(id);
        renderTemplates();
        toast('Đã xóa mẫu', 'info');
      });
    });
  }

  /* =================================================
   *               VIEW: HISTORY
   * ================================================= */
  function renderHistory() {
    view.appendChild(cloneTpl('tpl-history'));
    const body = document.getElementById('historyBody');
    const empty = document.getElementById('historyEmpty');
    const hist = Storage.getHistory();
    if (hist.length === 0) {
      empty.hidden = false;
      return;
    }
    body.innerHTML = hist.map(h => `
      <tr data-id="${h.id}">
        <td>${fmtDate(h.startedAt)}</td>
        <td>${escapeHtml(h.subject || '(không tiêu đề)')}</td>
        <td>${h.total}</td>
        <td style="color:var(--futa-green-mid);font-weight:700">${h.ok}</td>
        <td style="color:var(--futa-red);font-weight:700">${h.fail}</td>
        <td><button class="btn btn-ghost btn-sm" data-act="detail">Chi tiết</button></td>
      </tr>
    `).join('');
    body.querySelectorAll('[data-act="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        const h = hist.find(x => x.id === id);
        if (!h) return;
        const lines = h.results.map(r => (r.ok ? '✓ ' : '✗ ') + r.email + (r.error ? ' — ' + r.error : '')).join('\n');
        alert(`Tiêu đề: ${h.subject}\nThời gian: ${fmtDate(h.startedAt)}\n\n` + lines);
      });
    });
  }

  /* =================================================
   *               VIEW: SETTINGS
   * ================================================= */
  function renderSettings() {
    view.appendChild(cloneTpl('tpl-settings'));

    const s = Storage.getSettings();
    document.getElementById('scriptUrl').value = s.scriptUrl || '';
    document.getElementById('senderName').value = s.senderName || '';
    document.getElementById('testEmail').value = s.testEmail || '';
    document.getElementById('throttleMs').value = s.throttleMs ?? 500;

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      const next = {
        scriptUrl: document.getElementById('scriptUrl').value.trim(),
        senderName: document.getElementById('senderName').value.trim(),
        testEmail: document.getElementById('testEmail').value.trim(),
        throttleMs: Math.max(0, Number(document.getElementById('throttleMs').value) | 0),
      };
      Storage.setSettings(next);
      toast('Đã lưu cài đặt', 'success');
    });

    document.getElementById('testConnectionBtn').addEventListener('click', async () => {
      const url = document.getElementById('scriptUrl').value.trim();
      const box = document.getElementById('connectionStatus');
      box.hidden = false;
      box.className = 'conn-status';
      box.textContent = 'Đang kiểm tra...';
      try {
        const res = await Sender.testConnection(url);
        box.className = 'conn-status ok';
        box.innerHTML = `✓ Kết nối OK. Tài khoản gửi: <strong>${escapeHtml(res.email || '(không rõ)')}</strong>`;
      } catch (e) {
        box.className = 'conn-status fail';
        box.textContent = '✗ Lỗi: ' + e.message;
      }
    });

    const crm = Storage.getCrmConfig();
    document.getElementById('supabaseUrl').value = crm.url || '';
    document.getElementById('supabaseKey').value = crm.key || '';
    document.getElementById('supabaseTable').value = crm.table || 'leads';
    document.getElementById('saveCrmBtn').addEventListener('click', () => {
      Storage.setCrmConfig({
        url: document.getElementById('supabaseUrl').value.trim(),
        key: document.getElementById('supabaseKey').value.trim(),
        table: document.getElementById('supabaseTable').value.trim() || 'leads',
      });
      toast('Đã lưu cấu hình CRM', 'success');
    });
  }

  /* =================================================
   *               VIEW: DEPLOY GUIDE
   * ================================================= */
  function renderDeployGuide() {
    view.appendChild(cloneTpl('tpl-deploy'));

    // Load Apps Script code into preview <pre>
    const preview = document.getElementById('scriptPreview');
    fetch('apps-script.gs')
      .then(r => r.ok ? r.text() : Promise.reject(new Error('Không tải được apps-script.gs')))
      .then(code => { preview.textContent = code; preview.dataset.code = code; })
      .catch(err => { preview.textContent = '⚠️ ' + err.message + '\nMở file apps-script.gs trong folder email/ thủ công.'; });

    document.getElementById('copyScriptBtn').addEventListener('click', async () => {
      const btn = document.getElementById('copyScriptBtn');
      try {
        let code = preview.dataset.code;
        if (!code) {
          const res = await fetch('apps-script.gs');
          if (!res.ok) throw new Error('Không tải được apps-script.gs');
          code = await res.text();
          preview.dataset.code = code;
          preview.textContent = code;
        }
        await navigator.clipboard.writeText(code);
        btn.textContent = '✓ Đã copy!';
        setTimeout(() => { btn.textContent = '📋 Copy code Apps Script'; }, 2200);
        toast('Đã copy code. Dán vào Code.gs trên script.google.com', 'success', 3500);
      } catch (e) {
        toast('Lỗi copy: ' + e.message + ' — hãy mở file apps-script.gs thủ công', 'error', 4500);
      }
    });
  }

  /* =================================================
   *               UTILITIES
   * ================================================= */
  function bindModalCloses() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal-overlay').hidden = true;
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(ov => {
      ov.addEventListener('click', (e) => { if (e.target === ov) ov.hidden = true; });
    });
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function stripTags(html) { return String(html).replace(/<[^>]+>/g, ''); }

  /* =================================================
   *               BOOT
   * ================================================= */
  Recipients.init();
  route();
})();
