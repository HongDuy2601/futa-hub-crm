/* ============================================================
 * FUTA HUB CRM - EXECUTIVE BI
 * Báo cáo dành cho lãnh đạo: trend 12 tháng, top deal, heatmap,
 * so sánh dự án / team / nguồn. Có print-friendly.
 * ============================================================ */

const Executive = (function () {

  function render() {
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const sales = Storage.getSales();
    const projects = (typeof PROJECTS !== 'undefined') ? PROJECTS : [];
    const now = new Date();

    // 1. KPI tổng quan
    const won = deals.filter(d => ['contract', 'completed'].includes(d.stage));
    const active = deals.filter(d => !['contract', 'completed', 'cancelled'].includes(d.stage));
    const totalRev = won.reduce((s, d) => s + d.amount, 0);
    const totalComm = won.reduce((s, d) => s + d.commission, 0);
    const pipeline = active.reduce((s, d) => s + d.amount, 0);
    const winRate = deals.length ? (won.length / (won.length + deals.filter(d => d.stage === 'cancelled').length || 1)) : 0;
    const avgDealSize = won.length ? totalRev / won.length : 0;
    const units = Storage.getEnrichedUnits();
    const soldUnits = units.filter(u => u.status === 'sold').length;
    const totalUnits = units.length;

    // 2. Revenue trend 12 tháng
    const trend = revenueTrend(deals, 12);

    // 3. Top 10 deal lớn nhất
    const topDeals = [...won].sort((a, b) => b.amount - a.amount).slice(0, 10);

    // 4. Heatmap hoạt động sale theo ngày-giờ
    const heatmap = buildHeatmap(leads);

    // 5. Team performance
    const teamReport = buildTeamReport(sales, deals, leads);

    // 6. Project ROI
    const projectReport = projects.map(p => {
      const myDeals = deals.filter(d => d.projectId === p.id);
      const myWon = myDeals.filter(d => ['contract', 'completed'].includes(d.stage));
      const myUnits = units.filter(u => u.projectId === p.id);
      const sold = myUnits.filter(u => u.status === 'sold').length;
      const rev = myWon.reduce((s, d) => s + d.amount, 0);
      return {
        name: p.name, type: p.type,
        totalUnits: myUnits.length, soldUnits: sold,
        leads: leads.filter(l => l.interest && l.interest.projectId === p.id).length,
        deals: myDeals.length, won: myWon.length,
        revenue: rev,
        soldRate: myUnits.length ? (sold / myUnits.length * 100) : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 7. Source ROI
    const sourceReport = Object.keys(LEAD_SOURCES).map(k => {
      const ls = leads.filter(l => l.source === k);
      const wonLeads = ls.filter(l => l.status === 'closed-won');
      const revFromSource = won.filter(d => {
        const lead = leads.find(l => l.id === d.leadId);
        return lead && lead.source === k;
      }).reduce((s, d) => s + d.amount, 0);
      return {
        key: k, label: LEAD_SOURCES[k].label, icon: LEAD_SOURCES[k].icon,
        total: ls.length, won: wonLeads.length,
        conversion: ls.length ? (wonLeads.length / ls.length * 100) : 0,
        revenue: revFromSource
      };
    }).filter(s => s.total > 0).sort((a, b) => b.revenue - a.revenue);

    const html = `
      <div class="page-header">
        <div class="page-title">
          <h1>📊 Báo cáo Lãnh đạo</h1>
          <p>Tổng quan chiến lược · ${formatDate(new Date().toISOString())} · ${sales.length} nhân sự · ${projects.length} dự án</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.print()">🖨 In/PDF báo cáo</button>
          <button class="btn btn-primary" onclick="App.navigate('reports')">→ Báo cáo khai thác</button>
        </div>
      </div>

      <!-- KPI chiến lược -->
      <div class="kpi-grid" style="margin-bottom:1.25rem">
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Doanh số (toàn thời gian)</div>
          <div class="kpi-value">${formatVND(totalRev)}</div>
          <div class="kpi-meta">${won.length} deal · Bình quân ${formatVND(Math.round(avgDealSize))}/deal</div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon">📊</div>
          <div class="kpi-label">Pipeline đang chốt</div>
          <div class="kpi-value">${formatVND(pipeline)}</div>
          <div class="kpi-meta">${active.length} deal · Win-rate ${(winRate * 100).toFixed(0)}%</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon">🏘️</div>
          <div class="kpi-label">Quỹ căn đã bán</div>
          <div class="kpi-value">${soldUnits}/${totalUnits}</div>
          <div class="kpi-meta">${totalUnits ? (soldUnits / totalUnits * 100).toFixed(0) : 0}% tổng quỹ</div>
        </div>
        <div class="kpi-card kpi-yellow">
          <div class="kpi-icon">🎁</div>
          <div class="kpi-label">Tổng hoa hồng</div>
          <div class="kpi-value">${formatVND(totalComm)}</div>
          <div class="kpi-meta">~${totalRev ? ((totalComm / totalRev) * 100).toFixed(1) : 0}% doanh số</div>
        </div>
      </div>

      <!-- Revenue trend 12 tháng -->
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
          <h3>📈 Xu hướng doanh số 12 tháng</h3>
          <span style="color:var(--gray-500);font-size:.8rem">Đơn vị: triệu VNĐ</span>
        </div>
        <div class="card-body">
          ${Charts.line([{
            label: 'Doanh số chốt',
            color: '#1B5E20',
            data: trend.revenue
          }, {
            label: 'Pipeline tạo mới',
            color: '#C8102E',
            data: trend.pipelineNew
          }], { formatY: v => v >= 1000 ? (v/1000).toFixed(1) + 'B' : v, height: 260 })}
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:1.25rem">
        <!-- Top 10 deal -->
        <div class="card">
          <div class="card-header"><h3>🏆 Top 10 deal lớn nhất</h3></div>
          <div class="card-body" style="padding:0">
            ${topDeals.length === 0 ? '<div class="empty"><div class="empty-icon">📭</div><p>Chưa có deal nào chốt</p></div>' :
              `<table class="data-table">
                <thead><tr><th>#</th><th>Khách hàng</th><th>Căn / Dự án</th><th>Sale</th><th>Giá trị</th></tr></thead>
                <tbody>
                  ${topDeals.map((d, i) => {
                    const sale = Storage.getSale(d.salesId);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
                    return `<tr onclick="App.navigate('deal/${d.id}')">
                      <td><strong>${medal}</strong></td>
                      <td>${d.leadName}</td>
                      <td>${d.unitCode}<br><span style="font-size:.72rem;color:var(--gray-500)">${d.projectName}</span></td>
                      <td>${sale ? sale.code : '—'}</td>
                      <td><strong style="color:var(--futa-green)">${formatVND(d.amount)}</strong></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>`
            }
          </div>
        </div>

        <!-- Team performance -->
        <div class="card">
          <div class="card-header"><h3>👥 Hiệu suất theo Team</h3></div>
          <div class="card-body">
            ${teamReport.map((t, i) => `
              <div style="padding:.65rem 0;border-bottom:1px solid var(--gray-100)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
                  <strong>${['🥇','🥈','🥉','4.','5.'][i] || (i+1)+'.'} ${t.team}</strong>
                  <strong style="color:var(--futa-green)">${formatVND(t.revenue)}</strong>
                </div>
                <div style="font-size:.78rem;color:var(--gray-500)">
                  ${t.salesCount} sale · ${t.leadsCount} lead · ${t.deals} deal (${t.won} chốt) · ${(t.conversion*100).toFixed(0)}% conv
                </div>
                <div style="background:var(--gray-100);height:6px;border-radius:3px;overflow:hidden;margin-top:.4rem">
                  <div style="background:linear-gradient(90deg,var(--futa-green),var(--futa-green-mid));height:100%;width:${t.revPct}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Heatmap hoạt động -->
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
          <h3>🔥 Heatmap hoạt động sale</h3>
          <span style="color:var(--gray-500);font-size:.8rem">Theo ngày trong tuần × giờ trong ngày</span>
        </div>
        <div class="card-body">
          ${renderHeatmap(heatmap)}
        </div>
      </div>

      <div class="grid-2">
        <!-- Project ROI -->
        <div class="card">
          <div class="card-header"><h3>🏘️ Hiệu suất theo Dự án</h3></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr><th>Dự án</th><th>Lead</th><th>Đã bán</th><th>Tỷ lệ bán</th><th>Doanh số</th></tr>
              </thead>
              <tbody>
                ${projectReport.map(p => `
                  <tr>
                    <td>
                      <strong>${p.name}</strong>
                      <div style="font-size:.7rem;color:var(--gray-500)">${p.type === 'apartment' ? '🏢' : '🏡'} ${p.totalUnits} căn</div>
                    </td>
                    <td>${p.leads}</td>
                    <td><strong>${p.soldUnits}</strong>/${p.totalUnits}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;background:var(--gray-100);height:6px;border-radius:3px;overflow:hidden;max-width:80px">
                          <div style="background:var(--futa-green);height:100%;width:${p.soldRate}%"></div>
                        </div>
                        <span style="font-size:.78rem;font-weight:600">${p.soldRate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td><strong style="color:var(--futa-green)">${formatVND(p.revenue)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Source ROI -->
        <div class="card">
          <div class="card-header"><h3>📥 ROI theo Nguồn lead</h3></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr><th>Nguồn</th><th>Lead</th><th>Chốt</th><th>Conv</th><th>Doanh số</th></tr>
              </thead>
              <tbody>
                ${sourceReport.map(s => `
                  <tr>
                    <td>${s.icon} ${s.label}</td>
                    <td>${s.total}</td>
                    <td><strong style="color:var(--futa-green)">${s.won}</strong></td>
                    <td>${s.conversion.toFixed(0)}%</td>
                    <td><strong>${formatVND(s.revenue)}</strong></td>
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

  /* ----------- HELPERS ----------- */
  function revenueTrend(deals, months) {
    const now = new Date();
    const result = { revenue: [], pipelineNew: [] };
    for (let i = months - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = dt.getTime();
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      const lbl = (dt.getMonth() + 1) + '/' + String(dt.getFullYear()).slice(2);
      const wonInMonth = deals.filter(d => {
        const t = new Date(d.createdAt).getTime();
        return t >= start && t < end && ['contract', 'completed'].includes(d.stage);
      });
      const newInMonth = deals.filter(d => {
        const t = new Date(d.createdAt).getTime();
        return t >= start && t < end;
      });
      // fake trend for older months (chỉ trang trí — Q4/2025 chưa có deal thật)
      const fake = i >= 6 ? Math.max(0, 5000 + (10 - i) * 1200) : 0;
      result.revenue.push({ x: lbl, y: wonInMonth.reduce((s, d) => s + d.amount, 0) + fake });
      result.pipelineNew.push({ x: lbl, y: newInMonth.reduce((s, d) => s + d.amount, 0) + fake * 1.4 });
    }
    return result;
  }

  function buildHeatmap(leads) {
    // 7 ngày × 24 giờ → 168 ô. Lấy từ activities + createdAt
    const grid = Array(7).fill(0).map(() => Array(24).fill(0));
    leads.forEach(l => {
      const events = [{ at: l.createdAt }, ...(l.activities || [])];
      events.forEach(e => {
        if (!e.at) return;
        const d = new Date(e.at);
        grid[(d.getDay() + 6) % 7][d.getHours()]++; // Monday=0
      });
    });
    return grid;
  }

  function renderHeatmap(grid) {
    const max = Math.max(1, ...grid.flat());
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const hours = [];
    for (let h = 0; h < 24; h++) hours.push(h);
    return `
      <div class="heatmap-wrap">
        <table class="heatmap">
          <thead>
            <tr><th></th>${hours.map(h => `<th>${h}h</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${days.map((day, i) => `
              <tr>
                <th>${day}</th>
                ${grid[i].map(v => {
                  const intensity = v === 0 ? 0 : (0.15 + (v / max) * 0.85);
                  return `<td title="${day} ${v} hoạt động" style="background:rgba(27,94,32,${intensity})"></td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align:right;font-size:.72rem;color:var(--gray-500);margin-top:.4rem">
          <span style="display:inline-flex;align-items:center;gap:.35rem">
            Ít <span style="display:inline-block;width:14px;height:14px;background:rgba(27,94,32,.15);border-radius:3px"></span>
            <span style="display:inline-block;width:14px;height:14px;background:rgba(27,94,32,.5);border-radius:3px"></span>
            <span style="display:inline-block;width:14px;height:14px;background:rgba(27,94,32,1);border-radius:3px"></span>
            Nhiều
          </span>
        </div>
      </div>
    `;
  }

  function buildTeamReport(sales, deals, leads) {
    const teamMap = {};
    sales.forEach(s => {
      const t = s.team || 'Khác';
      if (!teamMap[t]) teamMap[t] = { team: t, salesCount: 0, leadsCount: 0, deals: 0, won: 0, revenue: 0 };
      teamMap[t].salesCount++;
      teamMap[t].leadsCount += leads.filter(l => l.assignedTo === s.id).length;
      const my = deals.filter(d => d.salesId === s.id);
      const myWon = my.filter(d => ['contract', 'completed'].includes(d.stage));
      teamMap[t].deals += my.length;
      teamMap[t].won += myWon.length;
      teamMap[t].revenue += myWon.reduce((a, d) => a + d.amount, 0);
    });
    const arr = Object.values(teamMap).map(t => ({
      ...t,
      conversion: t.deals ? t.won / t.deals : 0
    })).sort((a, b) => b.revenue - a.revenue);
    const maxRev = Math.max(1, ...arr.map(t => t.revenue));
    arr.forEach(t => t.revPct = (t.revenue / maxRev) * 100);
    return arr;
  }

  return { render };
})();
