/* ============================================================
 * FUTA HUB CRM - LOGIN SCREEN
 * - Email + password (mock): password mặc định = mã NV viết thường (vd: phd, nma)
 *   hoặc dùng "futa" cho mọi user (demo)
 * - Demo dropdown: chọn nhanh user để xem theo vai trò
 * - Remember me: giữ session, refresh không bắt login lại
 * ============================================================ */

const Login = (function () {
  const KEY = 'futa_crm_session';

  function isLoggedIn() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      // Hết hạn sau 30 ngày nếu remember; 1 ngày nếu không
      const ttl = s.remember ? 30 * 86400000 : 86400000;
      if (Date.now() - s.loginAt > ttl) { localStorage.removeItem(KEY); return false; }
      const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
      const user = sales.find(u => u.id === s.userId);
      if (!user) return false;
      Storage.setCurrentUser(user);
      return true;
    } catch (e) { return false; }
  }

  function saveSession(userId, remember) {
    localStorage.setItem(KEY, JSON.stringify({ userId, remember, loginAt: Date.now() }));
  }

  function logout() {
    if (!confirm('Đăng xuất khỏi FUTA Hub?')) return;
    localStorage.removeItem(KEY);
    location.reload();
  }

  /* ----------- Mock password ----------- */
  // Quy ước: password = mã NV viết thường (vd: 'phd', 'nma'). Hoặc 'futa' cho mọi user.
  function checkPassword(user, pwd) {
    if (!pwd) return false;
    const p = pwd.trim().toLowerCase();
    if (p === 'futa') return true; // password chung demo
    if (p === (user.code || '').toLowerCase()) return true;
    return false;
  }

  /* ----------- Render full-screen login ----------- */
  function render() {
    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const orgs = (typeof Storage.getOrgs === 'function') ? Storage.getOrgs() : [];

    // Group sales theo org cho dropdown
    const groups = {};
    sales.forEach(s => {
      const oid = s.orgId || 'other';
      if (!groups[oid]) groups[oid] = [];
      groups[oid].push(s);
    });

    const html = `
      <div class="login-screen">
        <div class="login-bg-pattern"></div>

        <div class="login-card">
          <div class="login-brand">
            <img src="../assets/img/logo-futa-land.png" alt="FUTA Land">
            <div>
              <h1>FUTA Hub CRM</h1>
              <p>Đăng nhập để bắt đầu</p>
            </div>
          </div>

          <div class="login-tabs">
            <button class="login-tab active" data-tab="credentials" onclick="Login.switchTab('credentials')">📧 Email & Mật khẩu</button>
            <button class="login-tab" data-tab="demo" onclick="Login.switchTab('demo')">⚡ Chọn nhanh (demo)</button>
          </div>

          <div class="login-body">
            <!-- Tab Email/Password -->
            <div id="loginCredTab" class="login-tab-body">
              <div class="form-field">
                <label>Email</label>
                <input type="email" id="loginEmail" placeholder="ten@futaland.vn" autocomplete="email">
              </div>
              <div class="form-field">
                <label>Mật khẩu</label>
                <input type="password" id="loginPassword" placeholder="••••••" autocomplete="current-password">
                <span class="hint">Demo: mật khẩu là <strong>mã NV</strong> viết thường (vd: <code>phd</code>) hoặc <code>futa</code></span>
              </div>
              <label class="login-remember">
                <input type="checkbox" id="loginRemember" checked>
                <span>Ghi nhớ đăng nhập 30 ngày trên máy này</span>
              </label>
              <div id="loginError" class="login-error" hidden></div>
              <button class="btn btn-primary login-submit" onclick="Login.submitCredentials()">Đăng nhập</button>
            </div>

            <!-- Tab Demo -->
            <div id="loginDemoTab" class="login-tab-body" hidden>
              <p style="color:var(--gray-600);font-size:.85rem;margin-bottom:.75rem">
                Bỏ qua mật khẩu, chọn tài khoản để vào nhanh với vai trò tương ứng:
              </p>
              <div class="form-field">
                <label>Tài khoản</label>
                <select id="loginDemoUser">
                  ${Object.entries(groups).map(([oid, list]) => {
                    const o = orgs.find(x => x.id === oid);
                    return `<optgroup label="${o ? (ORG_TYPES[o.type] || {}).icon + ' ' + o.name : 'Khác'}">
                      ${list.map(s => {
                        const r = (typeof ROLES !== 'undefined') ? ROLES.find(x => x.id === s.roleId) : null;
                        return `<option value="${s.id}">${s.name}${r ? ' — ' + r.name : ''}</option>`;
                      }).join('')}
                    </optgroup>`;
                  }).join('')}
                </select>
              </div>
              <button class="btn btn-primary login-submit" onclick="Login.submitDemo()">⚡ Vào với tư cách này</button>
            </div>
          </div>

          <div class="login-footer">
            <div>FUTA Land · Chất lượng là danh dự</div>
            <div style="opacity:.6;font-size:.7rem">v1.9 · Demo internal</div>
          </div>
        </div>

        <div class="login-aside">
          <h2>Hệ sinh thái FUTA Hub</h2>
          <ul>
            <li>📊 <strong>Quản lý khách hàng</strong> đa kênh, AI scoring</li>
            <li>🎯 <strong>Pipeline sale</strong> kéo-thả, deal & cọc</li>
            <li>🏘️ <strong>Quỹ căn</strong> đồng bộ Sa bàn số</li>
            <li>📅 <strong>Lịch & Task</strong>, communication center</li>
            <li>📈 <strong>Báo cáo lãnh đạo</strong> + AI insight</li>
            <li>🛡️ <strong>Phân quyền</strong> đa cấp CĐT / sàn / TVV</li>
          </ul>
          <div class="login-aside-foot">
            <div>Hỗ trợ: <strong>1900 6067</strong></div>
            <a href="huong-dan-test.html">📖 Xem hướng dẫn dành cho người test →</a>
          </div>
        </div>
      </div>
    `;
    document.body.innerHTML = html;

    // Wire Enter để submit
    document.getElementById('loginPassword').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitCredentials();
    });
    document.getElementById('loginEmail').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    // Focus email
    setTimeout(() => document.getElementById('loginEmail').focus(), 100);
  }

  function switchTab(t) {
    document.querySelectorAll('.login-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
    document.getElementById('loginCredTab').hidden = t !== 'credentials';
    document.getElementById('loginDemoTab').hidden = t !== 'demo';
  }

  function showError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  }

  function submitCredentials() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('loginRemember').checked;
    if (!email || !password) { showError('Nhập đầy đủ email và mật khẩu'); return; }

    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const user = sales.find(s => (s.email || '').toLowerCase() === email);
    if (!user) { showError('Email không tồn tại trong hệ thống'); return; }
    if (!checkPassword(user, password)) {
      showError('Sai mật khẩu. Gợi ý: dùng mã NV viết thường (vd: ' + (user.code || '').toLowerCase() + ') hoặc "futa"');
      return;
    }

    loginAs(user, remember);
  }

  function submitDemo() {
    const userId = document.getElementById('loginDemoUser').value;
    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const user = sales.find(s => s.id === userId);
    if (!user) { showError('Tài khoản không tồn tại'); return; }
    loginAs(user, true);
  }

  function loginAs(user, remember) {
    Storage.setCurrentUser(user);
    saveSession(user.id, remember);
    // Reload để boot lại bình thường (sẽ qua isLoggedIn check)
    location.reload();
  }

  return { render, isLoggedIn, logout, switchTab, submitCredentials, submitDemo };
})();
