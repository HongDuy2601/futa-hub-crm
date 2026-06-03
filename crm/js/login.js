/* ============================================================
 * FUTA HUB CRM - LOGIN SCREEN (v2)
 * Redesign: glass card + animated mesh bg + SVG skyline + stats
 * ============================================================ */

const Login = (function () {
  const KEY = 'futa_crm_session';

  function isLoggedIn() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
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

  function checkPassword(user, pwd) {
    if (!pwd) return false;
    const p = pwd.trim().toLowerCase();
    if (p === 'futa') return true;
    if (p === (user.code || '').toLowerCase()) return true;
    return false;
  }

  /* ----------- Render ----------- */
  function render() {
    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const orgs = (typeof Storage.getOrgs === 'function') ? Storage.getOrgs() : [];

    // Group cho dropdown demo
    const groups = {};
    sales.forEach(s => {
      const oid = s.orgId || 'other';
      if (!groups[oid]) groups[oid] = [];
      groups[oid].push(s);
    });

    // Stats nổi bật
    const stats = {
      sales: sales.length,
      orgs: orgs.length,
      projects: (typeof PROJECTS !== 'undefined') ? PROJECTS.length : 0,
      units: 176 // tổng quỹ căn từ Sa bàn
    };

    const html = `
      <div class="lg-shell">
        <!-- Animated background -->
        <div class="lg-bg">
          <div class="lg-orb lg-orb-1"></div>
          <div class="lg-orb lg-orb-2"></div>
          <div class="lg-orb lg-orb-3"></div>
          <svg class="lg-grid" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(255,255,255,.04)" stroke-width=".4"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>

        <!-- Left: form card -->
        <div class="lg-left">
          <div class="lg-card">
            <div class="lg-card-head">
              <div class="lg-logo-wrap">
                <img src="../assets/img/logo-futa-land.png" alt="FUTA Land" class="lg-logo">
                <div class="lg-logo-ring"></div>
              </div>
              <h1 class="lg-title">FUTA <span>Hub</span></h1>
              <p class="lg-subtitle">CRM Sale Nội Bộ · v2.0</p>
            </div>

            <div class="lg-tabs">
              <button class="lg-tab active" data-tab="cred" onclick="Login.switchTab('cred')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Email & Mật khẩu
              </button>
              <button class="lg-tab" data-tab="demo" onclick="Login.switchTab('demo')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                Chọn nhanh
              </button>
            </div>

            <!-- Tab Credentials -->
            <div id="loginCredTab" class="lg-body">
              <label class="lg-field">
                <span class="lg-label">EMAIL</span>
                <div class="lg-input-wrap">
                  <svg class="lg-input-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  <input type="email" id="loginEmail" placeholder="ten@futaland.vn" autocomplete="email">
                </div>
              </label>

              <label class="lg-field">
                <span class="lg-label">MẬT KHẨU</span>
                <div class="lg-input-wrap">
                  <svg class="lg-input-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
                  <input type="password" id="loginPassword" placeholder="••••••" autocomplete="current-password">
                  <button type="button" class="lg-eye" onclick="Login.toggleEye()" title="Hiện/ẩn">
                    <svg id="lgEyeIcon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                  </button>
                </div>
                <span class="lg-hint">Demo: mật khẩu là <code>mã NV</code> viết thường (vd <code>phd</code>) hoặc <code>futa</code></span>
              </label>

              <label class="lg-check">
                <input type="checkbox" id="loginRemember" checked>
                <span class="lg-check-box"></span>
                <span>Ghi nhớ đăng nhập 30 ngày</span>
              </label>

              <div id="loginError" class="lg-error" hidden></div>

              <button class="lg-btn" onclick="Login.submitCredentials()">
                <span>Đăng nhập</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </button>

              <div class="lg-suggest">
                <strong>💡 Gợi ý nhanh:</strong>
                <button onclick="Login.fillCred('admin@futaland.vn','tdn')">👑 Admin CĐT</button>
                <button onclick="Login.fillCred('duy.phamhong@futaland.vn','phd')">👔 GĐ sàn FUTA</button>
                <button onclick="Login.fillCred('khoa@abcland.vn','dvk')">🤝 GĐ sàn ABC</button>
                <button onclick="Login.fillCred('tu.le@futaland.vn','lct')">👤 TVV</button>
              </div>
            </div>

            <!-- Tab Demo -->
            <div id="loginDemoTab" class="lg-body" hidden>
              <p class="lg-demo-note">
                Bỏ qua mật khẩu. Chọn tài khoản để vào ngay với vai trò tương ứng.
              </p>
              <label class="lg-field">
                <span class="lg-label">CHỌN TÀI KHOẢN</span>
                <div class="lg-input-wrap">
                  <svg class="lg-input-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <select id="loginDemoUser">
                    ${Object.entries(groups).map(([oid, list]) => {
                      const o = orgs.find(x => x.id === oid);
                      return `<optgroup label="${o ? ((ORG_TYPES[o.type] || {}).icon || '') + ' ' + o.name : 'Khác'}">
                        ${list.map(s => {
                          const r = (typeof ROLES !== 'undefined') ? ROLES.find(x => x.id === s.roleId) : null;
                          return `<option value="${s.id}">${s.name}${r ? ' — ' + r.name : ''}</option>`;
                        }).join('')}
                      </optgroup>`;
                    }).join('')}
                  </select>
                </div>
              </label>
              <button class="lg-btn" onclick="Login.submitDemo()">
                <span>Vào với tư cách này</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </button>
            </div>

            <div class="lg-foot">
              <span>FUTA Land · Chất lượng là danh dự</span>
              <span class="lg-foot-ver">v2.0</span>
            </div>
          </div>
        </div>

        <!-- Right: hero illustration + stats -->
        <div class="lg-right">
          <div class="lg-right-inner">
            <div class="lg-badge">✨ FUTA Hub · CRM Sale Nội Bộ</div>
            <h2 class="lg-headline">
              Quản lý <span class="lg-gradient">khách hàng</span> &<br>
              vận hành <span class="lg-gradient">đa sàn</span><br>
              trên một nền tảng.
            </h2>
            <p class="lg-tagline">
              Tích hợp Sa bàn số · Pipeline · AI Insight · Báo cáo lãnh đạo ·
              Phân quyền đa cấp giữa CĐT và mạng lưới sàn phân phối.
            </p>

            <!-- Skyline SVG -->
            <div class="lg-skyline">
              <svg viewBox="0 0 600 220" preserveAspectRatio="xMidYEnd meet">
                <defs>
                  <linearGradient id="skybg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(255,255,255,.08)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                  </linearGradient>
                  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#fbbf24"/>
                    <stop offset="100%" stop-color="#f59e0b"/>
                  </linearGradient>
                  <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(255,255,255,.18)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,.04)"/>
                  </linearGradient>
                </defs>
                <!-- Sun glow -->
                <circle cx="480" cy="120" r="45" fill="url(#sun)" opacity=".22"/>
                <circle cx="480" cy="120" r="28" fill="url(#sun)" opacity=".5"/>
                <circle cx="480" cy="120" r="18" fill="url(#sun)"/>
                <!-- Back row -->
                <g opacity=".55">
                  <rect x="40"  y="100" width="50" height="120" fill="url(#b1)" rx="3"/>
                  <rect x="100" y="80"  width="40" height="140" fill="url(#b1)" rx="3"/>
                  <rect x="150" y="110" width="55" height="110" fill="url(#b1)" rx="3"/>
                  <rect x="215" y="90"  width="45" height="130" fill="url(#b1)" rx="3"/>
                  <rect x="270" y="120" width="60" height="100" fill="url(#b1)" rx="3"/>
                  <rect x="340" y="95"  width="50" height="125" fill="url(#b1)" rx="3"/>
                  <rect x="400" y="115" width="42" height="105" fill="url(#b1)" rx="3"/>
                  <rect x="452" y="85"  width="48" height="135" fill="url(#b1)" rx="3"/>
                  <rect x="510" y="105" width="55" height="115" fill="url(#b1)" rx="3"/>
                </g>
                <!-- Front taller buildings -->
                <g>
                  <rect x="60"  y="60"  width="55" height="160" fill="rgba(255,255,255,.16)" rx="4"/>
                  <rect x="130" y="40"  width="45" height="180" fill="rgba(255,255,255,.2)" rx="4"/>
                  <rect x="185" y="70"  width="60" height="150" fill="rgba(255,255,255,.14)" rx="4"/>
                  <rect x="260" y="30"  width="50" height="190" fill="rgba(255,255,255,.22)" rx="4"/>
                  <rect x="325" y="55"  width="55" height="165" fill="rgba(255,255,255,.18)" rx="4"/>
                  <rect x="395" y="75"  width="48" height="145" fill="rgba(255,255,255,.14)" rx="4"/>
                </g>
                <!-- Windows pattern on front buildings -->
                <g fill="rgba(255,255,255,.35)">
                  ${Array.from({length: 6}).map((_,i)=>Array.from({length: 4}).map((_,j)=>`<rect x="${68+j*12}" y="${72+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                  ${Array.from({length: 7}).map((_,i)=>Array.from({length: 3}).map((_,j)=>`<rect x="${137+j*12}" y="${52+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                  ${Array.from({length: 6}).map((_,i)=>Array.from({length: 4}).map((_,j)=>`<rect x="${193+j*12}" y="${82+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                  ${Array.from({length: 7}).map((_,i)=>Array.from({length: 3}).map((_,j)=>`<rect x="${268+j*12}" y="${42+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                  ${Array.from({length: 6}).map((_,i)=>Array.from({length: 4}).map((_,j)=>`<rect x="${333+j*12}" y="${67+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                  ${Array.from({length: 6}).map((_,i)=>Array.from({length: 3}).map((_,j)=>`<rect x="${403+j*12}" y="${87+i*22}" width="6" height="10" rx="1"/>`).join('')).join('')}
                </g>
              </svg>
            </div>

            <div class="lg-stats">
              <div class="lg-stat">
                <div class="lg-stat-num">${stats.orgs}</div>
                <div class="lg-stat-label">Đơn vị bán hàng</div>
              </div>
              <div class="lg-stat">
                <div class="lg-stat-num">${stats.sales}</div>
                <div class="lg-stat-label">Nhân sự sale</div>
              </div>
              <div class="lg-stat">
                <div class="lg-stat-num">${stats.projects}</div>
                <div class="lg-stat-label">Dự án</div>
              </div>
              <div class="lg-stat">
                <div class="lg-stat-num">${stats.units}</div>
                <div class="lg-stat-label">Sản phẩm</div>
              </div>
            </div>

            <div class="lg-right-foot">
              <div>📞 Hỗ trợ: <strong>1900 6067</strong></div>
              <a href="huong-dan-test.html">Hướng dẫn cho người test →</a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.innerHTML = html;

    // Wire keyboard
    document.getElementById('loginPassword').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitCredentials();
    });
    document.getElementById('loginEmail').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    setTimeout(() => document.getElementById('loginEmail').focus(), 200);
  }

  function switchTab(t) {
    document.querySelectorAll('.lg-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === t));
    document.getElementById('loginCredTab').hidden = t !== 'cred';
    document.getElementById('loginDemoTab').hidden = t !== 'demo';
  }

  function toggleEye() {
    const inp = document.getElementById('loginPassword');
    const icon = document.getElementById('lgEyeIcon');
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
    } else {
      inp.type = 'password';
      icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>';
    }
  }

  function fillCred(email, pwd) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = pwd;
    document.getElementById('loginPassword').focus();
  }

  function showError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.hidden = false;
    el.style.animation = 'lgShake .4s';
    setTimeout(() => { el.hidden = true; el.style.animation = ''; }, 4000);
  }

  function submitCredentials() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('loginRemember').checked;
    if (!email || !password) { showError('Vui lòng nhập email và mật khẩu'); return; }

    const sales = (Storage._raw && Storage._raw.getSales) ? Storage._raw.getSales() : Storage.getSales();
    const user = sales.find(s => (s.email || '').toLowerCase() === email);
    if (!user) { showError('Email không tồn tại trong hệ thống'); return; }
    if (!checkPassword(user, password)) {
      showError('Sai mật khẩu. Gợi ý: dùng mã NV "' + (user.code || '').toLowerCase() + '" hoặc "futa"');
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
    // Animation thoát: fade trước khi reload
    document.querySelector('.lg-shell').style.transition = 'opacity .4s';
    document.querySelector('.lg-shell').style.opacity = '0';
    setTimeout(() => location.reload(), 400);
  }

  return { render, isLoggedIn, logout, switchTab, submitCredentials, submitDemo, toggleEye, fillCred };
})();
