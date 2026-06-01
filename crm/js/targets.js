/* ============================================================
 * FUTA HUB CRM - SALE TARGETS + GAMIFICATION
 * KPI cá nhân + Leaderboard + Badges
 * ============================================================ */

const Targets = (function () {

  function calcSaleStats(salesId, month, year) {
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const myDeals = deals.filter(d => d.salesId === salesId);
    const wonDeals = myDeals.filter(d => ['contract', 'completed'].includes(d.stage));
    const activeDeals = myDeals.filter(d => !['contract', 'completed', 'cancelled'].includes(d.stage));
    const myLeads = leads.filter(l => l.assignedTo === salesId);

    return {
      leads: myLeads.length,
      deals: myDeals.length,
      activeDeals: activeDeals.length,
      wonDeals: wonDeals.length,
      revenue: wonDeals.reduce((s, d) => s + d.amount, 0),
      commission: wonDeals.reduce((s, d) => s + d.commission, 0),
      pipeline: activeDeals.reduce((s, d) => s + d.amount, 0)
    };
  }

  function render() {
    const sales = Storage.getSales();
    const targets = Storage.getTargets();
    const me = Storage.getCurrentUser();

    const board = sales.map(s => {
      const stats = calcSaleStats(s.id);
      const target = targets.find(t => t.salesId === s.id && t.month === new Date().getMonth() + 1);
      const revenuePct = target ? (stats.revenue / target.revenueTarget * 100) : 0;
      const dealPct = target ? (stats.wonDeals / target.dealTarget * 100) : 0;
      const leadPct = target ? (stats.leads / target.leadTarget * 100) : 0;
      const badge = badgeFor(stats.wonDeals);
      return { ...s, stats, target, revenuePct, dealPct, leadPct, badge };
    }).sort((a, b) => b.revenuePct - a.revenuePct);

    const myStats = board.find(b => b.id === me.id);

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Target & Bảng xếp hạng</h1>
          <p>KPI cá nhân tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()} · Cập nhật realtime</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="Targets.openEditTargetModal('${me.id}')">⚙️ Sửa target</button>
        </div>
      </div>

      ${myStats && myStats.target ? renderMyCard(myStats) : ''}

      <div class="card" style="margin-top:1.25rem">
        <div class="card-header">
          <h3>🏆 Bảng xếp hạng team</h3>
          <span style="color:var(--gray-500);font-size:.82rem">Sắp xếp theo % đạt target</span>
        </div>
        <div class="card-body">
          ${board.map((s, i) => renderRankRow(s, i)).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:1.25rem">
        <div class="card-header">
          <h3>🎖️ Hệ thống danh hiệu</h3>
        </div>
        <div class="card-body">
          <div class="badge-grid">
            ${Object.entries(BADGES).map(([k, b]) => `
              <div class="badge-tile" style="border-color:${b.color}">
                <div class="badge-icon" style="background:${b.color}22">${b.icon}</div>
                <div class="badge-name" style="color:${b.color}">${b.name}</div>
                <div class="badge-req">≥ ${b.min} deal chốt</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;
  }

  function renderMyCard(s) {
    return `
      <div class="card" style="background:linear-gradient(135deg, var(--futa-green-light) 0%, white 100%);border-left:5px solid var(--futa-green)">
        <div class="card-body" style="padding:1.5rem">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap">
            <div class="user-avatar" style="width:64px;height:64px;font-size:1.4rem;background:var(--futa-green)">${initials(s.name)}</div>
            <div style="flex:1">
              <h2 style="color:var(--futa-green-dark)">${s.name}</h2>
              <div style="display:flex;gap:.5rem;align-items:center;margin-top:.25rem">
                <span style="display:inline-flex;align-items:center;gap:.35rem;background:${s.badge.color}22;color:${s.badge.color};padding:.25rem .65rem;border-radius:99px;font-weight:700;font-size:.82rem">
                  ${s.badge.icon} ${s.badge.name}
                </span>
                <span style="color:var(--gray-500);font-size:.85rem">${s.team} · ${s.code}</span>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1.25rem">
            <div style="text-align:center">
              ${Charts.progressRing(s.revenuePct, { size: 130, thickness: 12 })}
              <div style="margin-top:.5rem;font-size:.8rem;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:1px">Doanh số</div>
              <div style="font-weight:700;color:var(--futa-green-dark)">${formatVND(s.stats.revenue)}</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Mục tiêu: ${formatVND(s.target.revenueTarget)}</div>
            </div>
            <div style="text-align:center">
              ${Charts.progressRing(s.dealPct, { size: 130, thickness: 12, color: '#C8102E' })}
              <div style="margin-top:.5rem;font-size:.8rem;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:1px">Deal chốt</div>
              <div style="font-weight:700;color:var(--futa-red)">${s.stats.wonDeals} / ${s.target.dealTarget}</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Còn ${Math.max(s.target.dealTarget - s.stats.wonDeals, 0)} deal</div>
            </div>
            <div style="text-align:center">
              ${Charts.progressRing(s.leadPct, { size: 130, thickness: 12, color: '#2563eb' })}
              <div style="margin-top:.5rem;font-size:.8rem;color:var(--gray-500);font-weight:600;text-transform:uppercase;letter-spacing:1px">Lead phụ trách</div>
              <div style="font-weight:700;color:#2563eb">${s.stats.leads} / ${s.target.leadTarget}</div>
              <div style="font-size:.75rem;color:var(--gray-500)">Hoa hồng: ${formatVND(s.stats.commission)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRankRow(s, idx) {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
    const me = Storage.getCurrentUser();
    const isMe = s.id === me.id;
    return `
      <div class="rank-row ${isMe ? 'rank-me' : ''}">
        <div class="rank-pos">${medal || (idx + 1)}</div>
        <div class="user-avatar" style="background:${s.badge.color}">${initials(s.name)}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:.5rem;align-items:center">
            <strong>${s.name}</strong>
            <span style="background:${s.badge.color}22;color:${s.badge.color};padding:1px 8px;border-radius:99px;font-size:.7rem;font-weight:700">${s.badge.icon} ${s.badge.name}</span>
            ${isMe ? '<span style="background:var(--futa-green);color:white;padding:1px 8px;border-radius:99px;font-size:.7rem">BẠN</span>' : ''}
          </div>
          <div style="font-size:.75rem;color:var(--gray-500);margin-top:.15rem">${s.team} · ${s.stats.wonDeals} deal chốt · ${formatVND(s.stats.commission)} hoa hồng</div>
        </div>
        <div style="text-align:right;min-width:120px">
          <div style="font-weight:800;color:var(--futa-green-dark);font-size:1.1rem">${formatVND(s.stats.revenue)}</div>
          <div style="font-size:.7rem;color:var(--gray-500)">${s.revenuePct.toFixed(0)}% target</div>
        </div>
        <div style="width:120px">
          <div style="background:var(--gray-100);height:8px;border-radius:4px;overflow:hidden">
            <div style="background:linear-gradient(90deg, var(--futa-green), var(--futa-green-mid));height:100%;width:${Math.min(s.revenuePct, 100)}%;transition:width .4s"></div>
          </div>
        </div>
      </div>
    `;
  }

  function openEditTargetModal(salesId) {
    const targets = Storage.getTargets();
    const now = new Date();
    let target = targets.find(t => t.salesId === salesId && t.month === now.getMonth() + 1 && t.year === now.getFullYear());
    if (!target) {
      target = {
        id: uid('TG'), salesId, month: now.getMonth() + 1, year: now.getFullYear(),
        revenueTarget: 10000, dealTarget: 3, leadTarget: 15
      };
    }
    const body = `
      <p style="color:var(--gray-500);font-size:.85rem;margin-bottom:1rem">Đặt mục tiêu tháng ${target.month}/${target.year}</p>
      <div class="form-grid">
        <div class="form-field">
          <label>Mục tiêu doanh số (triệu VNĐ)</label>
          <input type="number" id="ftgRev" value="${target.revenueTarget}" min="0" step="1000">
        </div>
        <div class="form-field">
          <label>Mục tiêu số deal chốt</label>
          <input type="number" id="ftgDeal" value="${target.dealTarget}" min="0" step="1">
        </div>
        <div class="form-field full">
          <label>Mục tiêu lead mới</label>
          <input type="number" id="ftgLead" value="${target.leadTarget}" min="0" step="1">
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="Modal.hide()">Hủy</button>
      <button class="btn btn-primary" onclick="Targets.saveTarget('${target.id}')">Lưu</button>
    `;
    Modal.show({ title: 'Sửa target tháng', body, footer });

    window._editTarget = target;
  }

  function saveTarget(id) {
    const t = window._editTarget;
    t.revenueTarget = parseInt(document.getElementById('ftgRev').value) || 0;
    t.dealTarget = parseInt(document.getElementById('ftgDeal').value) || 0;
    t.leadTarget = parseInt(document.getElementById('ftgLead').value) || 0;
    Storage.saveTarget(t);
    Modal.hide();
    toast('Đã cập nhật target', 'success');
    render();
  }

  return { render, openEditTargetModal, saveTarget };
})();
