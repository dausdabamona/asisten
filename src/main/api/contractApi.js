/**
 * Contract API - Contract Management Operations
 *
 * Handles all CRUD operations for contracts
 */

const BaseApi = require('./baseApi');
const { contractSchemas, createValidator } = require('./validator');
const { BusinessError, ERROR_CODES } = require('../utils/errorHandler');

class ContractApi extends BaseApi {
  constructor(database) {
    super(database, 'contract');

    // Create validators
    this.validateCreate = createValidator(contractSchemas.create);
    this.validateUpdate = createValidator(contractSchemas.update);
    this.validateFilter = createValidator(contractSchemas.filter);
  }

  /**
   * Create a new contract
   */
  create(data) {
    return this.execute(() => {
      const validated = this.validateCreate(data);

      // Validate request exists and is approved
      const request = this.db.getRequestById(validated.request_id);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Procurement request not found',
          { request_id: validated.request_id }
        );
      }

      if (request.status !== 'approved') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only create contract for approved requests',
          { currentStatus: request.status }
        );
      }

      // Validate vendor exists and is active
      const vendor = this.db.getVendorById(validated.vendor_id);
      if (!vendor) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Vendor not found',
          { vendor_id: validated.vendor_id }
        );
      }

      if (!vendor.is_active) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_VENDOR_INACTIVE,
          'Cannot create contract with inactive vendor',
          { vendor_id: validated.vendor_id }
        );
      }

      // Validate dates
      if (new Date(validated.end_date) <= new Date(validated.start_date)) {
        throw new BusinessError(
          ERROR_CODES.VALIDATION_FAILED,
          'End date must be after start date',
          { start_date: validated.start_date, end_date: validated.end_date }
        );
      }

      return this.db.createContract(validated);
    }, { action: 'create', request_id: data.request_id });
  }

  /**
   * Get all contracts with optional filters
   */
  getAll(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter(filters);
      return this.db.getContracts(validated);
    }, { action: 'getAll', filters });
  }

  /**
   * Get a single contract by ID
   */
  getById(id) {
    return this.execute(() => {
      const contract = this.db.getContractById(id);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }
      return contract;
    }, { action: 'getById', id });
  }

  /**
   * Get contract with payments
   */
  getWithPayments(id) {
    return this.execute(() => {
      const contract = this.db.getContractById(id);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }

      // Get payments for this contract
      contract.payments = this.db.getPayments({ contract_id: id });

      // Get attachments
      contract.attachments = this.db.getAttachments({ contract_id: id });

      // Calculate payment summary
      contract.paymentSummary = this.calculatePaymentSummary(
        contract.contract_value,
        contract.payments
      );

      return contract;
    }, { action: 'getWithPayments', id });
  }

  /**
   * Update a contract
   */
  update(id, data) {
    return this.execute(() => {
      const validated = this.validateUpdate(data);

      // Check if contract exists
      const existing = this.db.getContractById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }

      // Validate status transition
      if (validated.status) {
        this.validateStatusTransition(existing.status, validated.status);
      }

      // Validate dates if being updated
      const startDate = validated.start_date || existing.start_date;
      const endDate = validated.end_date || existing.end_date;
      if (new Date(endDate) <= new Date(startDate)) {
        throw new BusinessError(
          ERROR_CODES.VALIDATION_FAILED,
          'End date must be after start date',
          { start_date: startDate, end_date: endDate }
        );
      }

      return this.db.updateContract(id, validated);
    }, { action: 'update', id });
  }

  /**
   * Activate a contract (sign it)
   */
  activate(id, signedBy, signedDate = null) {
    return this.execute(() => {
      const existing = this.db.getContractById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'draft') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only activate draft contracts',
          { currentStatus: existing.status }
        );
      }

      return this.db.updateContract(id, {
        status: 'active',
        signed_by: signedBy,
        signed_date: signedDate || new Date().toISOString().split('T')[0]
      });
    }, { action: 'activate', id });
  }

  /**
   * Complete a contract
   */
  complete(id) {
    return this.execute(() => {
      const contract = this.db.getContractById(id);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }

      if (contract.status !== 'active') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only complete active contracts',
          { currentStatus: contract.status }
        );
      }

      // Check if all payments are completed
      const payments = this.db.getPayments({ contract_id: id });
      const pendingPayments = payments.filter(p =>
        p.status === 'pending' || p.status === 'processing'
      );

      if (pendingPayments.length > 0) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_WORKFLOW_ERROR,
          'Cannot complete contract with pending payments',
          { pendingPaymentCount: pendingPayments.length }
        );
      }

      return this.db.db.transaction(() => {
        // Update contract status
        this.db.updateContract(id, { status: 'completed' });

        // Complete the related procurement request
        this.db.updateRequest(contract.request_id, { status: 'completed' });

        return { id, status: 'completed' };
      })();
    }, { action: 'complete', id });
  }

  /**
   * Terminate a contract
   */
  terminate(id, reason) {
    return this.execute(() => {
      const existing = this.db.getContractById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Contract with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'active') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only terminate active contracts',
          { currentStatus: existing.status }
        );
      }

      return this.db.updateContract(id, {
        status: 'terminated',
        notes: `${existing.notes || ''}\n[Terminated] ${new Date().toISOString()}: ${reason}`.trim()
      });
    }, { action: 'terminate', id });
  }

  /**
   * Check for expiring contracts
   */
  getExpiring(daysAhead = 30) {
    return this.execute(() => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const contracts = this.db.getContracts({ status: 'active' });
      return contracts.filter(c => {
        const endDate = new Date(c.end_date);
        return endDate <= futureDate && endDate >= new Date();
      });
    }, { action: 'getExpiring', daysAhead });
  }

  /**
   * Check for expired contracts and update status
   */
  processExpired() {
    return this.execute(() => {
      const today = new Date().toISOString().split('T')[0];
      const contracts = this.db.getContracts({ status: 'active' });

      const expired = contracts.filter(c => c.end_date < today);
      let updated = 0;

      for (const contract of expired) {
        this.db.updateContract(contract.id, { status: 'expired' });
        updated++;
      }

      return { processed: expired.length, updated };
    }, { action: 'processExpired' });
  }

  /**
   * Get contracts by vendor
   */
  getByVendor(vendorId) {
    return this.execute(() => {
      return this.db.getContracts({ vendor_id: vendorId });
    }, { action: 'getByVendor', vendorId });
  }

  /**
   * Get contracts by request
   */
  getByRequest(requestId) {
    return this.execute(() => {
      return this.db.getContracts({ request_id: requestId });
    }, { action: 'getByRequest', requestId });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
      draft: ['active', 'terminated'],
      active: ['completed', 'terminated', 'expired'],
      completed: [],
      terminated: [],
      expired: []
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessError(
        ERROR_CODES.BUSINESS_INVALID_STATUS,
        `Cannot transition from '${currentStatus}' to '${newStatus}'`,
        { currentStatus, newStatus, allowedTransitions: allowed }
      );
    }
  }

  /**
   * Calculate payment summary
   */
  calculatePaymentSummary(contractValue, payments) {
    const summary = {
      contractValue,
      totalPaid: 0,
      totalPending: 0,
      paymentCount: payments.length,
      paidCount: 0,
      pendingCount: 0
    };

    for (const payment of payments) {
      if (payment.status === 'paid') {
        summary.totalPaid += payment.amount;
        summary.paidCount++;
      } else if (payment.status === 'pending' || payment.status === 'processing') {
        summary.totalPending += payment.amount;
        summary.pendingCount++;
      }
    }

    summary.remaining = contractValue - summary.totalPaid;
    summary.percentPaid = contractValue > 0
      ? Math.round((summary.totalPaid / contractValue) * 100)
      : 0;

    return summary;
  }
}

// Export singleton instance
module.exports = new ContractApi(null);
module.exports.ContractApi = ContractApi;
