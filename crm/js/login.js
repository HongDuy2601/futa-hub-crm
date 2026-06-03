/* ============================================================
 * FUTA HUB CRM - LOGIN SCREEN (v3 — centered card on hero background)
 * Card đăng nhập đứng giữa, background là hero dự án FUTA Land
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

    const groups = {};
    sales.forEach(s => {
      const oid = s.orgId || 'other';
      if (!groups[oid]) groups[oid] = [];
      groups[oid].push(s);
    });

    const html = `
      <div class="lg-page">
        <!-- HERO BACKGROUND: dự án FUTA Land -->
        <div class="lg-hero">
          ${heroSVG()}
          <div class="lg-hero-overlay"></div>
        </div>

        <!-- TOP BAR -->
        <div class="lg-topbar">
          <div class="lg-topbar-brand">
            <img src="../assets/img/logo-futa-land.png" alt="FUTA Land">
            <strong>FUTA Land</strong>
            <span>· Chất lượng là danh dự</span>
          </div>
          <div class="lg-topbar-meta">
            📞 Hotline <strong>1900 6067</strong> ·
            <a href="huong-dan-test.html">Hướng dẫn cho người test ↗</a>
          </div>
        </div>

        <!-- CARD ĐĂNG NHẬP Ở GIỮA -->
        <div class="lg-center">
          <div class="lg-card">
            <div class="lg-card-head">
              <div class="lg-logo-wrap">
                <img src="../assets/img/logo-futa-land.png" alt="FUTA Land" class="lg-logo">
              </div>
              <h1 class="lg-title">FUTA Hub <span>CRM</span></h1>
              <p class="lg-subtitle">Hệ thống quản lý sale &amp; khách hàng nội bộ</p>
            </div>

            <div class="lg-tabs">
              <button class="lg-tab active" data-tab="cred" onclick="Login.switchTab('cred')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Email &amp; Mật khẩu
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
                <strong>Gợi ý:</strong>
                <button onclick="Login.fillCred('admin@futaland.vn','tdn')">👑 Admin</button>
                <button onclick="Login.fillCred('duy.phamhong@futaland.vn','phd')">👔 GĐ FUTA</button>
                <button onclick="Login.fillCred('khoa@abcland.vn','dvk')">🤝 GĐ ABC</button>
                <button onclick="Login.fillCred('tu.le@futaland.vn','lct')">👤 TVV</button>
              </div>
            </div>

            <!-- Tab Demo -->
            <div id="loginDemoTab" class="lg-body" hidden>
              <p class="lg-demo-note">Bỏ qua mật khẩu. Chọn tài khoản để vào ngay với vai trò tương ứng.</p>
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
              <span>© 2026 FUTA Land</span>
              <span class="lg-foot-ver">v2.1</span>
            </div>
          </div>
        </div>

        <!-- BOTTOM BAR: stack of project chips -->
        <div class="lg-bottom">
          <div class="lg-projects">
            <div class="lg-proj-chip">
              <span class="lg-proj-icon">🏢</span>
              <div><strong>FUTA Sky Garden</strong><div>Quận 2 · Bàn giao Q4/2026</div></div>
            </div>
            <div class="lg-proj-chip">
              <span class="lg-proj-icon">🏡</span>
              <div><strong>FUTA Riverside Villas</strong><div>Đảo Kim Cương · Bàn giao Q2/2027</div></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.innerHTML = html;

    document.getElementById('loginPassword').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitCredentials();
    });
    document.getElementById('loginEmail').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    setTimeout(() => document.getElementById('loginEmail').focus(), 200);
  }

  /* ----------- SVG HERO: skyline dự án FUTA Land ----------- */
  function heroSVG() {
    return `
      <svg class="lg-hero-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#0a3814"/>
            <stop offset="35%" stop-color="#1B5E20"/>
            <stop offset="70%" stop-color="#2E7D32"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
          <linearGradient id="sunglow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#fbbf24" stop-opacity=".0"/>
            <stop offset="60%" stop-color="#fbbf24" stop-opacity=".25"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity=".5"/>
          </linearGradient>
          <linearGradient id="bldFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#1f4d24"/>
            <stop offset="100%" stop-color="#0a2c0e"/>
          </linearGradient>
          <linearGradient id="bldMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#2E7D32" stop-opacity=".6"/>
            <stop offset="100%" stop-color="#1B5E20" stop-opacity=".4"/>
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stop-color="#0a3814" stop-opacity=".4"/>
            <stop offset="100%" stop-color="#072408"/>
          </linearGradient>
          <radialGradient id="sunBall" cx=".5" cy=".5">
            <stop offset="0%"  stop-color="#fef3c7"/>
            <stop offset="60%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity=".7"/>
          </radialGradient>
        </defs>

        <!-- Bầu trời -->
        <rect width="1600" height="900" fill="url(#sky)"/>

        <!-- Mặt trời -->
        <ellipse cx="1200" cy="520" rx="600" ry="380" fill="url(#sunglow)"/>
        <circle cx="1200" cy="520" r="90" fill="url(#sunBall)"/>

        <!-- Mây mỏng -->
        <g fill="rgba(255,255,255,.08)">
          <ellipse cx="300" cy="200" rx="180" ry="14"/>
          <ellipse cx="600" cy="160" rx="220" ry="12"/>
          <ellipse cx="1000" cy="240" rx="160" ry="10"/>
        </g>

        <!-- Hàng tòa nhà sau (xa) -->
        <g opacity=".5">
          ${apartmentBuildings(50, 540, 70, 280, 7, '#2E7D32', '#1B5E20', .4)}
        </g>

        <!-- Hàng tòa nhà giữa -->
        <g opacity=".75">
          ${apartmentBuildings(120, 480, 90, 340, 5, '#1f4d24', '#0F3D14', .65)}
        </g>

        <!-- Hàng tòa nhà trước (cao nhất, sắc nét) -->
        ${frontTowers()}

        <!-- Cảnh quan: cây + mặt nước phản chiếu -->
        <g>
          <rect x="0" y="780" width="1600" height="120" fill="url(#water)"/>
          <!-- gợn nước -->
          <g stroke="rgba(255,255,255,.08)" stroke-width="1" fill="none">
            <path d="M 0 820 Q 200 815 400 820 T 800 820 T 1200 820 T 1600 820"/>
            <path d="M 0 850 Q 200 845 400 850 T 800 850 T 1200 850 T 1600 850"/>
            <path d="M 0 875 Q 200 870 400 875 T 800 875 T 1200 875 T 1600 875"/>
          </g>
          <!-- cây 2 bên -->
          ${trees()}
        </g>

        <!-- Đèn cửa sổ (highlight) -->
        ${windowLights()}
      </svg>
    `;
  }

  function apartmentBuildings(startX, baseY, minH, maxH, count, color1, color2, opacity) {
    let svg = '';
    const totalW = 1600 - startX * 2;
    const w = totalW / count - 8;
    for (let i = 0; i < count; i++) {
      const x = startX + i * (w + 8);
      const h = minH + ((i * 53) % (maxH - minH));
      const y = baseY - h;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="${h + 120}" fill="${i % 2 === 0 ? color1 : color2}" opacity="${opacity}" rx="3"/>`;
    }
    return svg;
  }

  function frontTowers() {
    // 5 tòa cao FUTA Sky Garden lấy giữa khung
    const towers = [
      { x: 200, y: 280, w: 110, h: 500 },
      { x: 340, y: 200, w: 130, h: 580 },
      { x: 500, y: 320, w: 110, h: 460 },
      { x: 640, y: 180, w: 150, h: 600 },
      { x: 820, y: 260, w: 120, h: 520 },
      { x: 970, y: 220, w: 130, h: 560 },
      { x: 1130, y: 300, w: 120, h: 480 },
      { x: 1280, y: 250, w: 140, h: 530 },
    ];
    return towers.map(t => `
      <g>
        <rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="url(#bldFront)" rx="4"/>
        <!-- vạch viền dọc 1 bên -->
        <rect x="${t.x}" y="${t.y}" width="3" height="${t.h}" fill="rgba(255,255,255,.12)"/>
        <!-- mái -->
        <rect x="${t.x - 4}" y="${t.y - 6}" width="${t.w + 8}" height="6" fill="#0a2c0e"/>
        <!-- antenna -->
        <line x1="${t.x + t.w/2}" y1="${t.y - 6}" x2="${t.x + t.w/2}" y2="${t.y - 28}" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
      </g>
    `).join('');
  }

  function windowLights() {
    // Sinh windows cho 8 tòa với pattern khác nhau
    const towers = [
      { x: 200, y: 280, w: 110, h: 500 },
      { x: 340, y: 200, w: 130, h: 580 },
      { x: 500, y: 320, w: 110, h: 460 },
      { x: 640, y: 180, w: 150, h: 600 },
      { x: 820, y: 260, w: 120, h: 520 },
      { x: 970, y: 220, w: 130, h: 560 },
      { x: 1130, y: 300, w: 120, h: 480 },
      { x: 1280, y: 250, w: 140, h: 530 },
    ];
    let svg = '';
    towers.forEach((t, i) => {
      const cols = Math.floor(t.w / 22);
      const rows = Math.floor(t.h / 28);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Lit pattern (deterministic)
          const lit = ((r * 7 + c * 13 + i * 17) % 11) < 4;
          const fill = lit ? 'rgba(251, 191, 36, .85)' : 'rgba(255,255,255,.06)';
          svg += `<rect x="${t.x + 10 + c * 22}" y="${t.y + 20 + r * 28}" width="10" height="14" rx="1" fill="${fill}"/>`;
        }
      }
    });
    return svg;
  }

  function trees() {
    let svg = '';
    // cây bên trái
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 28;
      const h = 70 + (i % 3) * 20;
      svg += treeAt(x, 800, h);
    }
    // cây bên phải
    for (let i = 0; i < 6; i++) {
      const x = 1450 + i * 28;
      const h = 70 + (i % 3) * 20;
      svg += treeAt(x, 800, h);
    }
    return svg;
  }

  function treeAt(x, baseY, h) {
    return `
      <g>
        <rect x="${x - 1}" y="${baseY - h * .4}" width="3" height="${h * .4}" fill="#1a2e15"/>
        <ellipse cx="${x}" cy="${baseY - h * .6}" rx="${h * .25}" ry="${h * .35}" fill="#0a3814"/>
        <ellipse cx="${x}" cy="${baseY - h * .75}" rx="${h * .2}" ry="${h * .3}" fill="#0f4a18"/>
      </g>
    `;
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
      icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2z"/>';
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
    const page = document.querySelector('.lg-page');
    if (page) { page.style.transition = 'opacity .4s'; page.style.opacity = '0'; }
    setTimeout(() => location.reload(), 400);
  }

  return { render, isLoggedIn, logout, switchTab, submitCredentials, submitDemo, toggleEye, fillCred };
})();
