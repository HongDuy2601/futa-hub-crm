/* ============================================================
 * FUTA HUB CRM - REPORTS
 * Báo cáo doanh số, hiệu suất sale, conversion
 * ============================================================ */

const Reports = (function () {

  /* ----------- HELPERS ----------- */
  function inRange(iso, fromMs, toMs) {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= fromMs && t < toMs;
  }

  function buildCustomerTypeReport(leads, deals) {
    const types = ['individual', 'business'];
    return types.map(t => {
      const tLeads = leads.filter(l => (l.customerType || 'individual') === t);
      const wonLeads = tLeads.filter(l => l.status === 'closed-won');
      const tDeals = deals.filter(d => {
        const l = leads.find(x => x.id === d.leadId);
        return l && (l.customerType || 'individual') === t;
      });
      const wonDeals = tDeals.filter(d => ['contract', 'completed'].includes(d.stage));
      const totalBudget = tLeads.reduce((s, l) => s + (l.interest && l.interest.budget || 0), 0);
      return {
        key: t,
        label: CUSTOMER_TYPES[t].label,
        icon: CUSTOMER_TYPES[t].icon,
        color: CUSTOMER_TYPES[t].color,
        leads: tLeads.length,
        wonLeads: wonLeads.length,
        deals: tDeals.length,
        wonDeals: wonDeals.length,
        revenue: wonDeals.reduce((s, d) => s + d.amount, 0),
        avgBudget: tLeads.length ? Math.round(totalBudget / tLeads.length) : 0,
        conversion: tLeads.length ? (wonLeads.length / tLeads.length * 100) : 0
      };
    });
  }

  function buildIndustryReport(leads) {
    const map = {};
    leads.filter(l => l.customerType === 'business' && l.business).forEach(l => {
      const k = l.business.industry || 'other';
      if (!map[k]) map[k] = { count: 0, won: 0, budget: 0, lbl: l.business.industryLabel };
      map[k].count++;
      map[k].budget += (l.interest && l.interest.budget) || 0;
      if (l.status === 'closed-won') map[k].won++;
    });
    return Object.entries(map).map(([k, v]) => ({
      key: k, label: v.lbl, count: v.count, won: v.won, budget: v.budget,
      conversion: v.count ? (v.won / v.count * 100) : 0
    })).sort((a, b) => b.budget - a.budget);
  }

  function buildPeriodComparison(leads, deals) {
    // 30 ngày gần nhất so với 30 ngày trước đó
    const now = Date.now();
    const day = 86400000;
    const cur = { from: now - 30 * day, to: now };
    const prev = { from: now - 60 * day, to: now - 30 * day };
    const fn = (range) => {
      const ls = leads.filter(l => inRange(l.createdAt, range.from, range.to));
      const ds = deals.filter(d => inRange(d.createdAt, range.from, range.to));
      const wonD = ds.filter(d => ['contract', 'completed'].includes(d.stage));
      return {
        leads: ls.length,
        deals: ds.length,
        wonDeals: wonD.length,
        revenue: wonD.reduce((s, d) => s + d.amount, 0)
      };
    };
    const c = fn(cur), p = fn(prev);
    const delta = (a, b) => b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b * 100);
    return {
      cur: c, prev: p,
      d_leads: delta(c.leads, p.leads),
      d_deals: delta(c.deals, p.deals),
      d_won: delta(c.wonDeals, p.wonDeals),
      d_revenue: delta(c.revenue, p.revenue)
    };
  }

  function buildFunnel(leads) {
    const stages = Object.keys(LEAD_STATUS);
    return stages.map(s => ({
      key: s,
      label: LEAD_STATUS[s].label,
      count: leads.filter(l => l.status === s).length
    }));
  }

  /* ----------- EXPORT CSV ----------- */
  function exportTable(name, headers, rows) {
    const csv = '﻿' + [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `futa-report-${name}-${Date.now()}.csv`;
    a.click();
    toast('Đã xuất CSV', 'success');
  }
  function exportSalesReport() {
    const sales = Storage.getSales();
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const rows = sales.map(s => {
      const my = deals.filter(d => d.salesId === s.id);
      const won = my.filter(d => ['contract', 'completed'].includes(d.stage));
      const myLeads = leads.filter(l => l.assignedTo === s.id);
      return [s.code, s.name, s.team, myLeads.length, my.length, won.length, formatVND(won.reduce((a, d) => a + d.amount, 0)), formatVND(won.reduce((a, d) => a + d.commission, 0))];
    });
    exportTable('sales', ['Mã sale', 'Tên', 'Team', 'Lead', 'Deal', 'Đã chốt', 'Doanh số', 'Hoa hồng'], rows);
  }
  function exportCustReport() {
    const leads = Storage.getLeads();
    const rows = leads.map(l => [
      l.code, l.name, l.contactName || '',
      CUSTOMER_TYPES[l.customerType || 'individual'].label,
      l.business ? l.business.taxCode : '', l.business ? l.business.industryLabel : '',
      l.phone, l.email, LEAD_STATUS[l.status].label, LEAD_SOURCES[l.source].label,
      formatVND(l.interest.budget), l.interest.unitCount || 1, AI.scoreLead(l).score
    ]);
    exportTable('khach-hang', ['Mã', 'Tên KH', 'Người LH', 'Loại', 'MST', 'Ngành', 'SĐT', 'Email', 'Trạng thái', 'Nguồn', 'Ngân sách', 'Số căn', 'AI Score'], rows);
  }

  function render() {
    const deals = Storage.getDeals();
    const leads = Storage.getLeads();
    const sales = Storage.getSales();
    const custTypeReport = buildCustomerTypeReport(leads, deals);
    const industryReport = buildIndustryReport(leads);
    const periodCmp = buildPeriodComparison(leads, deals);
    const funnel = buildFunnel(leads);
    const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

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
          <h1>Báo cáo khai thác KHTN</h1>
          <p>Tổng hợp · ${formatDate(new Date().toISOString())} · So sánh 30 ngày gần nhất với 30 ngày trước</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="Reports.exportSalesReport()">⬇ Xuất Sale CSV</button>
          <button class="btn btn-secondary" onclick="Reports.exportCustReport()">⬇ Xuất KH CSV</button>
          <button class="btn btn-secondary" onclick="window.print()">🖨 In báo cáo</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Lead mới (30 ngày)</div>
          <div class="kpi-value">${periodCmp.cur.leads}</div>
          <div class="kpi-meta ${periodCmp.d_leads >= 0 ? 'up' : 'down'}">${periodCmp.d_leads >= 0 ? '↑' : '↓'} ${Math.abs(periodCmp.d_leads).toFixed(0)}% so kỳ trước (${periodCmp.prev.leads})</div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-label">Deal mới (30 ngày)</div>
          <div class="kpi-value">${periodCmp.cur.deals}</div>
          <div class="kpi-meta ${periodCmp.d_deals >= 0 ? 'up' : 'down'}">${periodCmp.d_deals >= 0 ? '↑' : '↓'} ${Math.abs(periodCmp.d_deals).toFixed(0)}% (${periodCmp.prev.deals} kỳ trước)</div>
        </div>
        <div class="kpi-card kpi-yellow">
          <div class="kpi-label">Deal đã chốt (30 ngày)</div>
          <div class="kpi-value">${periodCmp.cur.wonDeals}</div>
          <div class="kpi-meta ${periodCmp.d_won >= 0 ? 'up' : 'down'}">${periodCmp.d_won >= 0 ? '↑' : '↓'} ${Math.abs(periodCmp.d_won).toFixed(0)}% (${periodCmp.prev.wonDeals} kỳ trước)</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-label">Doanh số (30 ngày)</div>
          <div class="kpi-value">${formatVND(periodCmp.cur.revenue)}</div>
          <div class="kpi-meta ${periodCmp.d_revenue >= 0 ? 'up' : 'down'}">${periodCmp.d_revenue >= 0 ? '↑' : '↓'} ${Math.abs(periodCmp.d_revenue).toFixed(0)}% (${formatVND(periodCmp.prev.revenue)} kỳ trước)</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:1.25rem">
        <div class="card">
          <div class="card-header"><h3>👥 Cá nhân vs Doanh nghiệp</h3></div>
          <div class="card-body">
            ${custTypeReport.map(t => `
              <div style="border-bottom:1px solid var(--gray-100);padding:.75rem 0">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
                  <span style="font-weight:700;color:${t.color}">${t.icon} ${t.label}</span>
                  <strong>${t.leads} KH</strong>
                </div>
                <div class="info-grid" style="gap:.35rem .85rem">
                  <div class="info-item"><label>Đã chốt</label><div style="color:var(--futa-green);font-weight:600">${t.wonLeads}/${t.leads} (${t.conversion.toFixed(0)}%)</div></div>
                  <div class="info-item"><label>Doanh số</label><div style="font-weight:600">${formatVND(t.revenue)}</div></div>
                  <div class="info-item"><label>NS TB/KH</label><div>${formatVND(t.avgBudget)}</div></div>
                  <div class="info-item"><label>Deal</label><div>${t.deals} (${t.wonDeals} chốt)</div></div>
                </div>
                <div style="background:var(--gray-100);height:6px;border-radius:3px;overflow:hidden;margin-top:.5rem">
                  <div style="background:${t.color};height:100%;width:${t.conversion}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>📊 Phễu chuyển đổi</h3></div>
          <div class="card-body">
            ${funnel.map((f, i) => {
              const pct = (f.count / maxFunnel) * 100;
              const dropRate = i > 0 && funnel[i - 1].count > 0 ? ((funnel[i - 1].count - f.count) / funnel[i - 1].count * 100) : null;
              return `
                <div style="margin-bottom:.65rem">
                  <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:.25rem">
                    <span>${f.label}</span>
                    <span><strong>${f.count}</strong>${dropRate !== null && dropRate > 0 ? ' <span style="font-size:.72rem;color:var(--red)">↓' + dropRate.toFixed(0) + '%</span>' : ''}</span>
                  </div>
                  <div style="background:var(--gray-100);height:18px;border-radius:9px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,var(--futa-green-dark),var(--futa-green));height:100%;width:${pct}%;transition:width .4s"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      ${industryReport.length ? `
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header"><h3>🏷 KH Doanh nghiệp theo ngành nghề</h3></div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ngành nghề</th>
                <th>Số DN</th>
                <th>Đã chốt</th>
                <th>Tỷ lệ chốt</th>
                <th>Tổng ngân sách</th>
              </tr>
            </thead>
            <tbody>
              ${industryReport.map(i => `
                <tr>
                  <td><strong>${i.label}</strong></td>
                  <td>${i.count}</td>
                  <td><strong style="color:var(--futa-green)">${i.won}</strong></td>
                  <td>${i.conversion.toFixed(0)}%</td>
                  <td><strong>${formatVND(i.budget)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <div class="kpi-grid" style="margin-bottom:1.25rem">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-label">Tổng doanh số (toàn thời gian)</div>
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

  return { render, exportSalesReport, exportCustReport };
})();
