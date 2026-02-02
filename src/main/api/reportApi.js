/**
 * Report API - Reports and Analytics
 *
 * Provides reporting and analytics functions
 */

const BaseApi = require('./baseApi');
const { BusinessError, ERROR_CODES } = require('../utils/errorHandler');

class ReportApi extends BaseApi {
  constructor(database) {
    super(database, 'report');
  }

  /**
   * Get dashboard statistics
   */
  getDashboard() {
    return this.execute(() => {
      return this.db.getDashboardStats();
    }, { action: 'getDashboard' });
  }

  /**
   * Get procurement summary by tier
   */
  getProcurementByTier(filters = {}) {
    return this.execute(() => {
      const { from_date, to_date, status } = filters;

      let query = `
        SELECT
          tier,
          COUNT(*) as count,
          SUM(estimated_value) as total_value,
          AVG(estimated_value) as avg_value,
          MIN(estimated_value) as min_value,
          MAX(estimated_value) as max_value
        FROM procurement_requests
        WHERE 1=1
      `;
      const params = [];

      if (from_date) {
        query += ' AND created_at >= ?';
        params.push(from_date);
      }

      if (to_date) {
        query += ' AND created_at <= ?';
        params.push(to_date);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' GROUP BY tier ORDER BY tier';

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getProcurementByTier', filters });
  }

  /**
   * Get procurement summary by status
   */
  getProcurementByStatus(filters = {}) {
    return this.execute(() => {
      const { from_date, to_date, tier } = filters;

      let query = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(estimated_value) as total_value
        FROM procurement_requests
        WHERE 1=1
      `;
      const params = [];

      if (from_date) {
        query += ' AND created_at >= ?';
        params.push(from_date);
      }

      if (to_date) {
        query += ' AND created_at <= ?';
        params.push(to_date);
      }

      if (tier) {
        query += ' AND tier = ?';
        params.push(tier);
      }

      query += ' GROUP BY status ORDER BY count DESC';

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getProcurementByStatus', filters });
  }

  /**
   * Get procurement summary by unit
   */
  getProcurementByUnit(filters = {}) {
    return this.execute(() => {
      const { from_date, to_date, tier, status } = filters;

      let query = `
        SELECT
          unit,
          COUNT(*) as count,
          SUM(estimated_value) as total_value,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM procurement_requests
        WHERE 1=1
      `;
      const params = [];

      if (from_date) {
        query += ' AND created_at >= ?';
        params.push(from_date);
      }

      if (to_date) {
        query += ' AND created_at <= ?';
        params.push(to_date);
      }

      if (tier) {
        query += ' AND tier = ?';
        params.push(tier);
      }

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' GROUP BY unit ORDER BY total_value DESC';

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getProcurementByUnit', filters });
  }

  /**
   * Get monthly trend
   */
  getMonthlyTrend(year = new Date().getFullYear()) {
    return this.execute(() => {
      const query = `
        SELECT
          strftime('%m', created_at) as month,
          COUNT(*) as count,
          SUM(estimated_value) as total_value,
          SUM(CASE WHEN tier = 'tier1' THEN 1 ELSE 0 END) as tier1_count,
          SUM(CASE WHEN tier = 'tier2' THEN 1 ELSE 0 END) as tier2_count,
          SUM(CASE WHEN tier = 'tier3' THEN 1 ELSE 0 END) as tier3_count
        FROM procurement_requests
        WHERE strftime('%Y', created_at) = ?
        GROUP BY month
        ORDER BY month
      `;

      const results = this.db.db.prepare(query).all(year.toString());

      // Fill in missing months
      const months = {};
      for (let i = 1; i <= 12; i++) {
        const monthStr = i.toString().padStart(2, '0');
        months[monthStr] = {
          month: monthStr,
          count: 0,
          total_value: 0,
          tier1_count: 0,
          tier2_count: 0,
          tier3_count: 0
        };
      }

      for (const row of results) {
        months[row.month] = row;
      }

      return Object.values(months);
    }, { action: 'getMonthlyTrend', year });
  }

  /**
   * Get vendor performance report
   */
  getVendorPerformance(filters = {}) {
    return this.execute(() => {
      const query = `
        SELECT
          v.id,
          v.name,
          v.npwp,
          v.performance_rating,
          COUNT(c.id) as total_contracts,
          SUM(c.contract_value) as total_value,
          SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed_contracts,
          SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_contracts,
          AVG(c.contract_value) as avg_contract_value
        FROM vendors v
        LEFT JOIN contracts c ON v.id = c.vendor_id
        WHERE v.is_active = 1
        GROUP BY v.id
        ORDER BY total_value DESC
        LIMIT ?
      `;

      return this.db.db.prepare(query).all(filters.limit || 20);
    }, { action: 'getVendorPerformance', filters });
  }

  /**
   * Get budget utilization report
   */
  getBudgetUtilization(fiscalYear = new Date().getFullYear()) {
    return this.execute(() => {
      const budgets = this.db.db.prepare(`
        SELECT * FROM budget_allocation WHERE fiscal_year = ?
      `).all(fiscalYear);

      // Get actual spending per budget code
      const spending = this.db.db.prepare(`
        SELECT
          budget_code,
          SUM(estimated_value) as total_requested,
          SUM(CASE WHEN status IN ('approved', 'in_progress', 'completed') THEN estimated_value ELSE 0 END) as total_committed
        FROM procurement_requests
        WHERE strftime('%Y', created_at) = ?
        GROUP BY budget_code
      `).all(fiscalYear.toString());

      // Merge data
      const spendingMap = {};
      for (const s of spending) {
        spendingMap[s.budget_code] = s;
      }

      return budgets.map(budget => {
        const spent = spendingMap[budget.budget_code] || { total_requested: 0, total_committed: 0 };
        const remaining = budget.total_allocation - (spent.total_committed || 0);
        const utilizationPercent = budget.total_allocation > 0
          ? Math.round((spent.total_committed / budget.total_allocation) * 100)
          : 0;

        return {
          ...budget,
          total_requested: spent.total_requested || 0,
          total_committed: spent.total_committed || 0,
          remaining,
          utilization_percent: utilizationPercent
        };
      });
    }, { action: 'getBudgetUtilization', fiscalYear });
  }

  /**
   * Get contract status report
   */
  getContractStatus(filters = {}) {
    return this.execute(() => {
      let query = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(contract_value) as total_value
        FROM contracts
        WHERE 1=1
      `;
      const params = [];

      if (filters.from_date) {
        query += ' AND created_at >= ?';
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        query += ' AND created_at <= ?';
        params.push(filters.to_date);
      }

      query += ' GROUP BY status ORDER BY count DESC';

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getContractStatus', filters });
  }

  /**
   * Get payment status report
   */
  getPaymentStatus(filters = {}) {
    return this.execute(() => {
      let query = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount
        FROM payments
        WHERE 1=1
      `;
      const params = [];

      if (filters.from_date) {
        query += ' AND created_at >= ?';
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        query += ' AND created_at <= ?';
        params.push(filters.to_date);
      }

      query += ' GROUP BY status ORDER BY total_amount DESC';

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getPaymentStatus', filters });
  }

  /**
   * Get overdue items summary
   */
  getOverdueItems() {
    return this.execute(() => {
      const today = new Date().toISOString().split('T')[0];

      // Overdue payments
      const overduePayments = this.db.db.prepare(`
        SELECT
          p.*,
          c.contract_number,
          v.name as vendor_name
        FROM payments p
        JOIN contracts c ON p.contract_id = c.id
        LEFT JOIN vendors v ON c.vendor_id = v.id
        WHERE p.status = 'pending'
          AND p.due_date < ?
        ORDER BY p.due_date ASC
      `).all(today);

      // Expiring contracts
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const expiringContracts = this.db.db.prepare(`
        SELECT
          c.*,
          v.name as vendor_name
        FROM contracts c
        LEFT JOIN vendors v ON c.vendor_id = v.id
        WHERE c.status = 'active'
          AND c.end_date <= ?
        ORDER BY c.end_date ASC
      `).all(futureDate.toISOString().split('T')[0]);

      // Pending approvals
      const pendingApprovals = this.db.db.prepare(`
        SELECT
          pr.*,
          wa.step_number,
          wa.approver_role
        FROM procurement_requests pr
        JOIN workflow_approvals wa ON pr.id = wa.request_id
        WHERE pr.status = 'pending'
          AND wa.action = 'pending'
        ORDER BY pr.created_at ASC
      `).all();

      return {
        overduePayments,
        expiringContracts,
        pendingApprovals,
        summary: {
          overduePaymentsCount: overduePayments.length,
          expiringContractsCount: expiringContracts.length,
          pendingApprovalsCount: pendingApprovals.length
        }
      };
    }, { action: 'getOverdueItems' });
  }

  /**
   * Get activity log
   */
  getActivityLog(filters = {}) {
    return this.execute(() => {
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const query = `
        SELECT * FROM audit_log
        ORDER BY changed_at DESC
        LIMIT ? OFFSET ?
      `;

      return this.db.db.prepare(query).all(limit, offset);
    }, { action: 'getActivityLog', filters });
  }

  /**
   * Export report data as CSV format
   */
  exportToCsv(reportType, filters = {}) {
    return this.execute(() => {
      let data;

      switch (reportType) {
        case 'procurement':
          data = this.db.getRequests(filters);
          break;
        case 'contracts':
          data = this.db.getContracts(filters);
          break;
        case 'payments':
          data = this.db.getPayments(filters);
          break;
        case 'vendors':
          data = this.db.getVendors(filters);
          break;
        default:
          throw new BusinessError(
            ERROR_CODES.VALIDATION_FAILED,
            `Unknown report type: ${reportType}`,
            { reportType }
          );
      }

      if (data.length === 0) {
        return { csv: '', rowCount: 0 };
      }

      // Generate CSV
      const headers = Object.keys(data[0]);
      const rows = data.map(row =>
        headers.map(h => {
          const value = row[h];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );

      const csv = [headers.join(','), ...rows].join('\n');

      return { csv, rowCount: data.length };
    }, { action: 'exportToCsv', reportType });
  }
}

// Export singleton instance
module.exports = new ReportApi(null);
module.exports.ReportApi = ReportApi;
