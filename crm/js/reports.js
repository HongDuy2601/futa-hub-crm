/* ============================================================
 * FUTA HUB CRM - REPORTS
 * Báo cáo doanh số, hiệu suất sale, conversion
 * ============================================================ */

const Reports = (function () {

  function render() {
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const sales = Storage.getSales();

    /* By sales person */
    const salesReport = sales.map(s => {
      const myDeals = deals.filter(d => d.salesId === s.id);
      const won = myDeals.filter(d => ['contract', 'completed'].includes(d.stage));
      const lost = myDeals.filter(d => d.stage === 'cancelled');
      const active = myDeals.filter(d => !['contract', 'completed', 'cancelled'].includes(d.stage));
      const myLeads = leads.filter(l => l.assignedTo === s.id);
      return {
        ...s,
        leads: myLeads.length,
        deals: myDeals.length,
        active: active.length,
        won: won.length,
        lost: lost.length,
        revenue: won.reduce((sum, d) => sum + d.amount, 0),
        commission: won.reduce((sum, d) => sum + d.commission, 0),
        pipeline: active.reduce((sum, d) => sum + d.amount, 0),
        conversion: myDeals.length > 0 ? (won.length / myDeals.length * 100) : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    /* By project */
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
    const projectReport = projects.map(p => {
      const myDeals = deals.filter(d => d.projectId === p.id);
      const won = myDeals.filter(d => ['contract', 'completed'].includes(d.stage));
      const myLeads = leads.filter(l => l.interest && l.interest.projectId === p.id);
      return {
        ...p,
        leads: myLeads.length,
        deals: myDeals.length,
        won: won.length,
        revenue: won.reduce((sum, d) => sum + d.amount, 0)
      };
    });

    /* By source */
    const sourceReport = Object.keys(LEAD_SOURCES).map(s => {
      const myLeads = leads.filter(l => l.source === s);
      const wonLeads = myLeads.filter(l => l.status === 'closed-won');
      return {
        key: s,
        label: LEAD_SOURCES[s].label,
        icon: LEAD_SOURCES[s].icon,
        total: myLeads.length,
        won: wonLeads.length,
        conversion: myLeads.length > 0 ? (wonLeads.length / myLeads.length * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);

    const totalRevenue = salesReport.reduce((s, x) => s + x.revenue, 0);
    const totalCommission = salesReport.reduce((s, x) => s + x.commission, 0);
    const totalPipeline = salesReport.reduce((s, x) => s + x.pipeline, 0);
    const totalWon = salesReport.reduce((s, x) => s + x.won, 0);

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>Báo cáo doanh số</h1>
          <p>Tổng hợp · ${formatDate(new Date().toISOString())}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.print()">🖨 In báo cáo</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Doanh số đã chốt</div>
          <div class="kpi-value">${formatVND(totalRevenue)}</div>
          <div class="kpi-meta">${totalWon} deal thành công</div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon">📊</div>
          <div class="kpi-label">Pipeline đang chốt</div>
          <div class="kpi-value">${formatVND(totalPipeline)}</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">🎁</div>
          <div class="kpi-label">Tổng hoa hồng</div>
          <div class="kpi-value">${formatVND(totalCommission)}</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon">👥</div>
          <div class="kpi-label">Sale đang hoạt động</div>
          <div class="kpi-value">${sales.length}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
          <h3>🏆 Hiệu suất nhân viên Sale</h3>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nhân viên</th>
                <th>Team</th>
                <th>Lead</th>
                <th>Deal</th>
                <th>Đang chốt</th>
                <th>Đã chốt</th>
                <th>Hủy</th>
                <th>Conversion</th>
                <th>Pipeline</th>
                <th>Doanh số</th>
                <th>Hoa hồng</th>
              </tr>
            </thead>
            <tbody>
              ${salesReport.map((s, i) => `
                <tr>
                  <td><strong>${i + 1}</strong></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:.5rem">
                      <div class="user-avatar" style="width:28px;height:28px;font-size:.7rem">${initials(s.name)}</div>
                      <strong>${s.name}</strong>
                    </div>
                  </td>
                  <td>${s.team}</td>
                  <td>${s.leads}</td>
                  <td>${s.deals}</td>
                  <td>${s.active}</td>
                  <td><strong style="color:var(--futa-green)">${s.won}</strong></td>
                  <td>${s.lost}</td>
                  <td>${s.conversion.toFixed(0)}%</td>
                  <td>${formatVND(s.pipeline)}</td>
                  <td><strong>${formatVND(s.revenue)}</strong></td>
                  <td style="color:var(--futa-red);font-weight:600">${formatVND(s.commission)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3>🏘️ Theo dự án</h3></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dự án</th>
                  <th>Lead</th>
                  <th>Deal</th>
                  <th>Đã chốt</th>
                  <th>Doanh số</th>
                </tr>
              </thead>
              <tbody>
                ${projectReport.map(p => `
                  <tr>
                    <td>
                      <strong>${p.name}</strong>
                      <div style="font-size:.72rem;color:var(--gray-500)">${p.type === 'apartment' ? '🏢 Chung cư' : '🏡 Biệt thự'}</div>
                    </td>
                    <td>${p.leads}</td>
                    <td>${p.deals}</td>
                    <td><strong style="color:var(--futa-green)">${p.won}</strong></td>
                    <td><strong>${formatVND(p.revenue)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>📥 Hiệu quả nguồn lead</h3></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nguồn</th>
                  <th>Tổng lead</th>
                  <th>Chốt</th>
                  <th>Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                ${sourceReport.map(s => `
                  <tr>
                    <td>${s.icon} ${s.label}</td>
                    <td>${s.total}</td>
                    <td><strong style="color:var(--futa-green)">${s.won}</strong></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;background:var(--gray-100);height:6px;border-radius:3px;overflow:hidden;max-width:100px">
                          <div style="background:var(--futa-green);height:100%;width:${s.conversion}%"></div>
                        </div>
                        <span style="font-size:.8rem;font-weight:600;min-width:36px">${s.conversion.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('pageContent').innerHTML = html;
  }

  return { render };
})();
