/**
 * Database Module - Main Entry Point
 * Exports PPKDatabase class with all CRUD operations
 */

const DatabaseConnection = require('./connection');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class PPKDatabase extends DatabaseConnection {
  constructor(options = {}) {
    super(options);
  }

  // ==================== Request Operations ====================

  createRequest(data) {
    const stmt = this.db.prepare(`
      INSERT INTO procurement_requests (
        id, request_number, tier, requester_id, unit, item_name,
        description, specifications, quantity, estimated_value, budget_code,
        budget_source, status, urgency, target_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const requestNumber = data.request_number || this.generateRequestNumber(data.tier);

    const result = stmt.run(
      id,
      requestNumber,
      data.tier,
      data.requester_id,
      data.unit,
      data.item_name,
      data.description || null,
      data.specifications || null,
      data.quantity || 1,
      data.estimated_value,
      data.budget_code,
      data.budget_source || null,
      data.status || 'draft',
      data.urgency || 'normal',
      data.target_date || null
    );

    return { id, request_number: requestNumber, changes: result.changes };
  }

  getRequests(filters = {}) {
    let query = 'SELECT * FROM procurement_requests WHERE 1=1';
    const params = [];

    if (filters.tier) {
      query += ' AND tier = ?';
      params.push(filters.tier);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.unit) {
      query += ' AND unit = ?';
      params.push(filters.unit);
    }

    if (filters.requester_id) {
      query += ' AND requester_id = ?';
      params.push(filters.requester_id);
    }

    if (filters.from_date) {
      query += ' AND created_at >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ' AND created_at <= ?';
      params.push(filters.to_date);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    return this.db.prepare(query).all(...params);
  }

  getRequestById(id) {
    return this.db.prepare('SELECT * FROM procurement_requests WHERE id = ?').get(id);
  }

  getRequestWithDetails(id) {
    const request = this.getRequestById(id);
    if (!request) return null;

    request.approvals = this.db.prepare(
      'SELECT * FROM workflow_approvals WHERE request_id = ? ORDER BY step_number'
    ).all(id);

    request.attachments = this.db.prepare(
      'SELECT * FROM attachments WHERE request_id = ? ORDER BY uploaded_at DESC'
    ).all(id);

    request.contracts = this.db.prepare(
      'SELECT * FROM contracts WHERE request_id = ? ORDER BY created_at DESC'
    ).all(id);

    return request;
  }

  updateRequest(id, updates) {
    const allowedFields = [
      'item_name', 'description', 'specifications', 'quantity',
      'estimated_value', 'budget_code', 'budget_source', 'status',
      'urgency', 'target_date', 'rejection_reason', 'current_step'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE procurement_requests
      SET ${setClause}, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    return { changes: stmt.run(...values, id).changes };
  }

  deleteRequest(id) {
    return this.db.prepare('DELETE FROM procurement_requests WHERE id = ?').run(id);
  }

  generateRequestNumber(tier) {
    const year = new Date().getFullYear();
    const prefix = tier.toUpperCase().replace('TIER', 'T');

    const count = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM procurement_requests
      WHERE tier = ? AND strftime('%Y', created_at) = ?
    `).get(tier, year.toString());

    const sequence = String(count.count + 1).padStart(3, '0');
    return `${prefix}/${year}/${sequence}`;
  }

  // ==================== Vendor Operations ====================

  createVendor(data) {
    const stmt = this.db.prepare(`
      INSERT INTO vendors (
        id, name, npwp, address, phone, email,
        bank_name, bank_account, bank_account_name, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();

    const result = stmt.run(
      id,
      data.name,
      data.npwp || null,
      data.address || null,
      data.phone || null,
      data.email || null,
      data.bank_name || null,
      data.bank_account || null,
      data.bank_account_name || null,
      data.notes || null
    );

    return { id, changes: result.changes };
  }

  getVendors(filters = {}) {
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR npwp LIKE ? OR email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.min_rating) {
      query += ' AND performance_rating >= ?';
      params.push(filters.min_rating);
    }

    query += ' ORDER BY name ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  getVendorById(id) {
    return this.db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  }

  updateVendor(id, updates) {
    const allowedFields = [
      'name', 'npwp', 'address', 'phone', 'email',
      'bank_name', 'bank_account', 'bank_account_name',
      'performance_rating', 'is_active', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    return { changes: this.db.prepare(`UPDATE vendors SET ${setClause} WHERE id = ?`).run(...values, id).changes };
  }

  deleteVendor(id) {
    return this.db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
  }

  // ==================== Contract Operations ====================

  createContract(data) {
    const stmt = this.db.prepare(`
      INSERT INTO contracts (
        id, request_id, contract_number, vendor_id, contract_value,
        start_date, end_date, payment_method, payment_terms, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const contractNumber = data.contract_number || this.generateContractNumber();

    const result = stmt.run(
      id,
      data.request_id,
      contractNumber,
      data.vendor_id,
      data.contract_value,
      data.start_date,
      data.end_date,
      data.payment_method,
      data.payment_terms || null,
      data.status || 'draft',
      data.notes || null
    );

    this.updateRequest(data.request_id, { status: 'in_progress' });

    return { id, contract_number: contractNumber, changes: result.changes };
  }

  generateContractNumber() {
    const year = new Date().getFullYear();
    const count = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM contracts
      WHERE strftime('%Y', created_at) = ?
    `).get(year.toString());

    const sequence = String(count.count + 1).padStart(4, '0');
    return `SPK/${year}/${sequence}`;
  }

  getContracts(filters = {}) {
    let query = `
      SELECT c.*, v.name as vendor_name, pr.item_name, pr.request_number
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN procurement_requests pr ON c.request_id = pr.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.vendor_id) {
      query += ' AND c.vendor_id = ?';
      params.push(filters.vendor_id);
    }

    if (filters.request_id) {
      query += ' AND c.request_id = ?';
      params.push(filters.request_id);
    }

    query += ' ORDER BY c.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return this.db.prepare(query).all(...params);
  }

  getContractById(id) {
    return this.db.prepare(`
      SELECT c.*, v.name as vendor_name, v.npwp as vendor_npwp,
             pr.item_name, pr.request_number
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN procurement_requests pr ON c.request_id = pr.id
      WHERE c.id = ?
    `).get(id);
  }

  updateContract(id, updates) {
    const allowedFields = [
      'contract_value', 'start_date', 'end_date', 'payment_method',
      'payment_terms', 'status', 'signed_date', 'signed_by', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    return { changes: this.db.prepare(`UPDATE contracts SET ${setClause} WHERE id = ?`).run(...values, id).changes };
  }

  // ==================== Payment Operations ====================

  createPayment(data) {
    const stmt = this.db.prepare(`
      INSERT INTO payments (
        id, contract_id, payment_number, amount, due_date,
        payment_method, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const paymentNumber = data.payment_number || this.generatePaymentNumber(data.contract_id);

    const result = stmt.run(
      id,
      data.contract_id,
      paymentNumber,
      data.amount,
      data.due_date || null,
      data.payment_method || null,
      data.status || 'pending',
      data.notes || null
    );

    return { id, payment_number: paymentNumber, changes: result.changes };
  }

  generatePaymentNumber(contractId) {
    const count = this.db.prepare(
      'SELECT COUNT(*) as count FROM payments WHERE contract_id = ?'
    ).get(contractId);

    return `PAY-${String(count.count + 1).padStart(2, '0')}`;
  }

  getPayments(filters = {}) {
    let query = `
      SELECT p.*, c.contract_number, c.contract_value
      FROM payments p
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.contract_id) {
      query += ' AND p.contract_id = ?';
      params.push(filters.contract_id);
    }

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY p.created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  getPaymentById(id) {
    return this.db.prepare(`
      SELECT p.*, c.contract_number, c.contract_value, c.vendor_id
      FROM payments p
      LEFT JOIN contracts c ON p.contract_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  updatePayment(id, updates) {
    const allowedFields = [
      'amount', 'payment_date', 'due_date', 'status',
      'payment_method', 'reference_number', 'processed_by', 'notes'
    ];

    const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
    const values = fields.map(f => updates[f]);

    if (fields.length === 0) {
      return { changes: 0 };
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    return { changes: this.db.prepare(`UPDATE payments SET ${setClause} WHERE id = ?`).run(...values, id).changes };
  }

  // ==================== Attachment Operations ====================

  createAttachment(data) {
    const stmt = this.db.prepare(`
      INSERT INTO attachments (
        id, request_id, contract_id, payment_id, file_type,
        file_name, original_name, file_path, file_size, mime_type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = data.id || uuidv4();
    const fileName = data.file_name || `${id}-${data.original_name}`;

    const result = stmt.run(
      id,
      data.request_id || null,
      data.contract_id || null,
      data.payment_id || null,
      data.file_type,
      fileName,
      data.original_name,
      data.file_path,
      data.file_size || null,
      data.mime_type || null,
      data.uploaded_by
    );

    return { id, file_name: fileName, changes: result.changes };
  }

  getAttachments(filters = {}) {
    let query = `
      SELECT a.*, u.name as uploader_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.request_id) {
      query += ' AND a.request_id = ?';
      params.push(filters.request_id);
    }

    if (filters.contract_id) {
      query += ' AND a.contract_id = ?';
      params.push(filters.contract_id);
    }

    if (filters.payment_id) {
      query += ' AND a.payment_id = ?';
      params.push(filters.payment_id);
    }

    if (filters.file_type) {
      query += ' AND a.file_type = ?';
      params.push(filters.file_type);
    }

    query += ' ORDER BY a.uploaded_at DESC';

    return this.db.prepare(query).all(...params);
  }

  deleteAttachment(id) {
    const attachment = this.db.prepare('SELECT file_path FROM attachments WHERE id = ?').get(id);

    if (attachment && fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    return this.db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }

  // ==================== Statistics ====================

  getStats() {
    return this.db.prepare(`
      SELECT
        tier,
        status,
        COUNT(*) as count,
        SUM(estimated_value) as total_value
      FROM procurement_requests
      GROUP BY tier, status
    `).all();
  }

  getDashboardStats() {
    const requestStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(estimated_value) as total_value
      FROM procurement_requests
    `).get();

    const contractStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_contracts,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_contracts,
        SUM(contract_value) as total_contract_value
      FROM contracts
    `).get();

    const paymentStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments
      FROM payments
    `).get();

    const vendorStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_vendors,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_vendors,
        AVG(performance_rating) as avg_rating
      FROM vendors
    `).get();

    return {
      requests: requestStats,
      contracts: contractStats,
      payments: paymentStats,
      vendors: vendorStats
    };
  }
}

module.exports = PPKDatabase;
