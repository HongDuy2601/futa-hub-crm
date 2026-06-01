/* ============================================================
 * FUTA HUB CRM - SETTINGS
 * Cấu hình công ty + commission + templates SMS/Zalo
 * ============================================================ */

const Settings = (function () {

  function render() {
    const s = Storage.getSettings();
    const sales = Storage.getSales();

    const sync = s.sync || {};
    const ai = s.ai || {};
    const syncStatus = (typeof Sync !== 'undefined') ? Sync.status() : { label: 'N/A', color: '#999' };

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Cài đặt</h1>
          <p>Cấu hình hệ thống · Đồng bộ cloud · AI · Template · Data</p>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:1.25rem">
        <div class="card">
          <div class="card-header">
            <h3>☁️ Đồng bộ Supabase (online tùy chọn)</h3>
            <span class="pill" style="background:${syncStatus.color}22;color:${syncStatus.color}">● ${syncStatus.label}</span>
          </div>
          <div class="card-body">
            <p style="color:var(--gray-500);font-size:.83rem;margin-bottom:.85rem">
              Mặc định CRM chạy <strong>offline 100%</strong> (LocalStorage). Muốn nhiều máy dùng chung data, kết nối Supabase free tier:
            </p>
            <div class="form-grid">
              <div class="form-field full"><label>Project URL</label><input type="text" id="syncUrl" placeholder="https://xxxx.supabase.co" value="${sync.url || ''}"></div>
              <div class="form-field full"><label>Anon Key</label><input type="password" id="syncKey" placeholder="eyJhbGci..." value="${sync.anonKey || ''}"></div>
              <div class="form-field full">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                  <input type="checkbox" id="syncAuto" ${sync.autoSync ? 'checked' : ''}> Tự động đồng bộ khi có thay đổi
                </label>
              </div>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.85rem">
              <button class="btn btn-secondary btn-sm" onclick="Settings.saveSync()">💾 Lưu</button>
              <button class="btn btn-secondary btn-sm" onclick="Settings.testSync()">🔌 Test kết nối</button>
              <button class="btn btn-primary btn-sm" onclick="Sync.manualSync()">🔄 Đồng bộ ngay</button>
              <button class="btn btn-secondary btn-sm" onclick="Settings.seedCloud()">🌱 Seed demo lên cloud</button>
              <button class="btn btn-ghost btn-sm" onclick="Settings.showSQL()">📋 Xem SQL tạo bảng</button>
            </div>
            ${sync.lastSync ? `<div style="font-size:.72rem;color:var(--gray-500);margin-top:.5rem">Đồng bộ lần cuối: ${formatDateTime(sync.lastSync)}</div>` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>🤖 AI Assistant</h3></div>
          <div class="card-body">
            <p style="color:var(--gray-500);font-size:.83rem;margin-bottom:.85rem">
              Lead scoring & trợ lý hỏi-đáp data chạy <strong>offline sẵn</strong>. Bật thêm LLM để chatbot trả lời tự do:
            </p>
            <div class="form-grid">
              <div class="form-field full">
                <label>Nhà cung cấp</label>
                <select id="aiProvider" onchange="Settings.toggleAIFields()">
                  <option value="offline" ${(ai.provider || 'offline') === 'offline' ? 'selected' : ''}>Offline (chỉ hỏi data CRM)</option>
                  <option value="ollama" ${ai.provider === 'ollama' ? 'selected' : ''}>Ollama (local, miễn phí)</option>
                  <option value="gemini" ${ai.provider === 'gemini' ? 'selected' : ''}>Google Gemini (free tier)</option>
                </select>
              </div>
              <div class="form-field full ai-ollama" ${ai.provider === 'ollama' ? '' : 'hidden'}>
                <label>Ollama URL</label>
                <input type="text" id="aiOllamaUrl" placeholder="http://localhost:11434" value="${ai.ollamaUrl || 'http://localhost:11434'}">
              </div>
              <div class="form-field full ai-ollama" ${ai.provider === 'ollama' ? '' : 'hidden'}>
                <label>Model</label>
                <input type="text" id="aiOllamaModel" placeholder="llama3.1" value="${ai.ollamaModel || 'llama3.1'}">
              </div>
              <div class="form-field full ai-gemini" ${ai.provider === 'gemini' ? '' : 'hidden'}>
                <label>Gemini API Key (free tại aistudio.google.com)</label>
                <input type="password" id="aiGeminiKey" placeholder="AIza..." value="${ai.geminiKey || ''}">
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:.85rem" onclick="Settings.saveAI()">💾 Lưu cấu hình AI</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <div class="card" style="margin-bottom:1rem">
            <div class="card-header"><h3>🏢 Thông tin công ty</h3></div>
            <div class="card-body">
              <div class="form-grid">
                <div class="form-field full"><label>Tên công ty</label><input type="text" id="stCompany" value="${s.companyName || ''}"></div>
                <div class="form-field full"><label>Địa chỉ</label><input type="text" id="stAddress" value="${s.address || ''}"></div>
                <div class="form-field"><label>Hotline</label><input type="text" id="stHotline" value="${s.hotline || ''}"></div>
                <div class="form-field"><label>Tỷ lệ hoa hồng (%)</label><input type="number" id="stCommission" value="${s.commissionRate || 2.5}" step="0.1" min="0"></div>
                <div class="form-field"><label>Số ngày giữ chỗ tối đa</label><input type="number" id="stReservation" value="${s.reservationDays || 7}" min="1"></div>
              </div>
              <button class="btn btn-primary" style="margin-top:.85rem" onclick="Settings.saveCompany()">💾 Lưu cấu hình</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>💬 Template tin nhắn SMS/Zalo</h3>
              <button class="btn btn-ghost btn-sm" onclick="Settings.openTemplateModal()">+ Thêm template</button>
            </div>
            <div class="card-body" style="padding:0">
              ${(s.smsTemplates || []).map(t => `
                <div style="padding:.85rem 1rem;border-bottom:1px solid var(--gray-100)">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem">
                    <strong>${t.name}</strong>
                    <div>
                      <button class="btn btn-ghost btn-sm" onclick="Settings.openTemplateModal('${t.id}')">✏️</button>
                      <button class="btn btn-ghost btn-sm" onclick="Settings.deleteTemplate('${t.id}')" style="color:var(--red)">🗑</button>
                    </div>
                  </div>
                  <div style="font-size:.82rem;color:var(--gray-700);white-space:pre-wrap">${t.content}</div>
                  <div style="font-size:.7rem;color:var(--gray-500);margin-top:.35rem">Biến: ${[...t.content.matchAll(/\\{(\\w+)\\}/g)].map(m => '{' + m[1] + '}').join(', ') || '—'}</div>
                </div>
              `).join('')}
              ${(s.smsTemplates || []).length === 0 ? '<div class="empty"><div class="empty-icon">📝</div><p>Chưa có template</p></div>' : ''}
            </div>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:1rem">
            <div class="card-header"><h3>👥 Nhân viên Sale</h3></div>
            <div class="card-body" style="padding:0">
              ${sales.map(sale => `
                <div style="padding:.75rem 1rem;border-bottom:1px solid var(--gray-100);display:flex;align-items:center;gap:.75rem">
                  <div class="user-avatar" style="width:36px;height:36px;font-size:.75rem;background:var(--futa-green)">${initials(sale.name)}</div>
                  <div style="flex:1">
                    <strong>${sale.name}</strong>
                    <div style="font-size:.75rem;color:var(--gray-500)">${sale.team} · ${sale.code} · ${sale.phone}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="margin-bottom:1rem">
            <div class="card-header"><h3>📦 Dữ liệu</h3></div>
            <div class="card-body">
              <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:.85rem">
                CRM đang chạy offline 100% qua LocalStorage. Khi triển khai thật, đổi sang Supabase free tier.
              </p>
              <div style="display:flex;flex-direction:column;gap:.5rem">
                <button class="btn btn-secondary" onclick="Settings.exportData()">⬇ Xuất toàn bộ data (JSON)</button>
                <button class="btn btn-secondary" onclick="Settings.importData()">⬆ Nhập data (JSON)</button>
                <input type="file" id="importFile" accept=".json" hidden onchange="Settings.handleImport(event)">
                <button class="btn btn-danger" onclick="Settings.resetAll()">🔄 Khởi tạo lại data demo</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>ℹ️ Về phiên bản</h3></div>
            <div class="card-body" style="font-size:.85rem;line-height:1.7">
              <div><strong>FUTA Hub CRM</strong> v1.5 · Phase 1 Pro</div>
              <div style="color:var(--gray-500)">Cập nhật: 06/2026</div>
              <hr style="margin:.75rem 0;border:none;border-top:1px solid var(--gray-100)">
              <div><strong>Modules:</strong> Dashboard · Lead · Pipeline · Tasks · Inventory · Target · Reports · Comm Center · Notifications</div>
              <div style="margin-top:.5rem"><strong>Tích hợp:</strong>
                <a href="../index.html" style="color:var(--futa-green)">Sa bàn số</a> ·
                <a href="../documents/index.html" style="color:var(--futa-green)">Soạn văn bản</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('pageContent').innerHTML = html;
  }

  function saveCompany() {
    const s = Storage.getSettings();
    s.companyName = document.getElementById('stCompany').value;
    s.address = document.getElementById('stAddress').value;
    s.hotline = document.getElementById('stHotline').value;
    s.commissionRate = parseFloat(document.getElementById('stCommission').value) || 2.5;
    s.reservationDays = parseInt(document.getElementById('stReservation').value) || 7;
    Storage.saveSettings(s);
    toast('Đã lưu cấu hình', 'success');
  }

  function openTemplateModal(id) {
    const s = Storage.getSettings();
    const tpl = id ? (s.smsTemplates || []).find(t => t.id === id) : { name: '', content: '' };
    const body = `
      <div class="form-grid">
        <div class="form-field full">
          <label>Tên template</label>
          <input type="text" id="ftplName" value="${tpl.name || ''}" placeholder="VD: Mời xem nhà">
        </div>
        <div class="form-field full">
          <label>Nội dung</label>
          <textarea id="ftplContent" rows="5" placeholder="Có thể dùng biến: {customer}, {sale_name}, {project}, {phone}, {date}, {unit}, {phase}">${tpl.content || ''}</textarea>
          <span class="hint">Biến có sẵn: {customer} {sale_name} {project} {phone} {date} {unit} {phase}</span>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Settings.saveTemplate('${id || ''}')">Lưu</button>
    `;
    Modal.show({ title: id ? 'Sửa template' : '+ Thêm template', body, footer });
  }

  function saveTemplate(id) {
    const name = document.getElementById('ftplName').value.trim();
    const content = document.getElementById('ftplContent').value.trim();
    if (!name || !content) { toast('Nhập tên và nội dung', 'error'); return; }
    const s = Storage.getSettings();
    s.smsTemplates = s.smsTemplates || [];
    if (id) {
      const i = s.smsTemplates.findIndex(t => t.id === id);
      if (i >= 0) s.smsTemplates[i] = { ...s.smsTemplates[i], name, content };
    } else {
      s.smsTemplates.push({ id: uid('tpl'), name, content });
    }
    Storage.saveSettings(s);
    Modal.hide();
    toast('Đã lưu template', 'success');
    render();
  }

  function deleteTemplate(id) {
    if (!confirm('Xóa template này?')) return;
    const s = Storage.getSettings();
    s.smsTemplates = (s.smsTemplates || []).filter(t => t.id !== id);
    Storage.saveSettings(s);
    toast('Đã xóa template', 'success');
    render();
  }

  function exportData() {
    const data = {
      leads: Storage.getLeads(),
      deals: Storage.getDeals(),
      sales: Storage.getSales(),
      tasks: Storage.getTasks(),
      notifications: Storage.getNotifications(),
      targets: Storage.getTargets(),
      settings: Storage.getSettings(),
      inventoryOverrides: Storage.getInventoryOverrides(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'futa-crm-backup-' + Date.now() + '.json';
    a.click();
    toast('Đã xuất backup', 'success');
  }

  function importData() {
    document.getElementById('importFile').click();
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('Import sẽ ghi đè data hiện tại. Tiếp tục?')) return;
        if (data.leads) localStorage.setItem(Storage.KEYS.leads, JSON.stringify(data.leads));
        if (data.deals) localStorage.setItem(Storage.KEYS.deals, JSON.stringify(data.deals));
        if (data.tasks) localStorage.setItem(Storage.KEYS.tasks, JSON.stringify(data.tasks));
        if (data.notifications) localStorage.setItem(Storage.KEYS.notifs, JSON.stringify(data.notifications));
        if (data.targets) localStorage.setItem(Storage.KEYS.targets, JSON.stringify(data.targets));
        if (data.settings) localStorage.setItem(Storage.KEYS.settings, JSON.stringify(data.settings));
        toast('Đã import data', 'success');
        location.reload();
      } catch (err) {
        toast('File không hợp lệ: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm('Xóa toàn bộ data CRM và sinh lại demo?')) return;
    Storage.resetAll();
    toast('Đã reset', 'success');
    setTimeout(() => location.reload(), 400);
  }

  /* ----------- SUPABASE SYNC ----------- */
  function saveSync() {
    const s = Storage.getSettings();
    s.sync = s.sync || {};
    s.sync.url = document.getElementById('syncUrl').value.trim();
    s.sync.anonKey = document.getElementById('syncKey').value.trim();
    s.sync.autoSync = document.getElementById('syncAuto').checked;
    Storage.saveSettings(s);
    toast('Đã lưu cấu hình Supabase', 'success');
    render();
  }
  function testSync() {
    saveSync();
    toast('Đang kiểm tra kết nối...', 'success');
    Sync.testConnection()
      .then(() => toast('✅ Kết nối Supabase thành công!', 'success'))
      .catch(e => toast('❌ ' + e.message, 'error'));
  }
  function seedCloud() {
    if (!Sync.isConfigured()) { toast('Hãy lưu cấu hình Supabase trước', 'error'); return; }
    if (!confirm('Đẩy dữ liệu demo hiện tại lên Supabase làm data dùng chung ban đầu?')) return;
    toast('Đang seed lên cloud...', 'success');
    Sync.seedCloud()
      .then(n => toast('✅ Đã đẩy ' + n + ' bản ghi lên cloud', 'success'))
      .catch(e => toast('❌ ' + e.message, 'error'));
  }

  function showSQL() {
    const body = `
      <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:.75rem">
        Vào <strong>Supabase → SQL Editor</strong>, dán đoạn SQL sau và Run để tạo bảng đồng bộ:
      </p>
      <pre style="background:var(--gray-900);color:#a7f3d0;padding:1rem;border-radius:10px;overflow-x:auto;font-size:.78rem;line-height:1.5">${Sync.schemaSQL().replace(/</g, '&lt;')}</pre>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Đóng</button>
      <button class="btn btn-primary" onclick="navigator.clipboard.writeText(\`${Sync.schemaSQL().replace(/`/g, '\\`')}\`).then(()=>toast('Đã copy SQL','success'))">📋 Copy SQL</button>
    `;
    Modal.show({ title: 'SQL tạo bảng Supabase', body, footer, size: 'lg' });
  }

  /* ----------- AI CONFIG ----------- */
  function toggleAIFields() {
    const provider = document.getElementById('aiProvider').value;
    document.querySelectorAll('.ai-ollama').forEach(el => el.hidden = provider !== 'ollama');
    document.querySelectorAll('.ai-gemini').forEach(el => el.hidden = provider !== 'gemini');
  }
  function saveAI() {
    const s = Storage.getSettings();
    s.ai = s.ai || {};
    s.ai.provider = document.getElementById('aiProvider').value;
    const ou = document.getElementById('aiOllamaUrl'); if (ou) s.ai.ollamaUrl = ou.value.trim();
    const om = document.getElementById('aiOllamaModel'); if (om) s.ai.ollamaModel = om.value.trim();
    const gk = document.getElementById('aiGeminiKey'); if (gk) s.ai.geminiKey = gk.value.trim();
    Storage.saveSettings(s);
    toast('Đã lưu cấu hình AI', 'success');
  }

  return {
    render, saveCompany, openTemplateModal, saveTemplate, deleteTemplate,
    exportData, importData, handleImport, resetAll,
    saveSync, testSync, seedCloud, showSQL, toggleAIFields, saveAI
  };
})();
