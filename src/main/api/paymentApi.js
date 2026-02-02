/**
 * Payment API - Payment Operations
 *
 * Handles all CRUD operations for payments
 */

const BaseApi = require('./baseApi');
const { paymentSchemas, createValidator } = require('./validator');
const { BusinessError, ERROR_CODES } = require('../utils/errorHandler');

class PaymentApi extends BaseApi {
  constructor(database) {
    super(database, 'payment');

    // Create validators
    this.validateCreate = createValidator(paymentSchemas.create);
    this.validateUpdate = createValidator(paymentSchemas.update);
    this.validateFilter = createValidator(paymentSchemas.filter);
  }

  /**
   * Create a new payment
   */
  create(data) {
    return this.execute(() => {
      const validated = this.validateCreate(data);

      // Validate contract exists and is active
      const contract = this.db.getContractById(validated.contract_id);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Contract not found',
          { contract_id: validated.contract_id }
        );
      }

      if (contract.status !== 'active') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only create payments for active contracts',
          { contractStatus: contract.status }
        );
      }

      // Check if payment would exceed contract value
      const existingPayments = this.db.getPayments({ contract_id: validated.contract_id });
      const totalExisting = existingPayments
        .filter(p => p.status !== 'cancelled')
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalExisting + validated.amount > contract.contract_value) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_PAYMENT_EXCEEDED,
          'Total payments would exceed contract value',
          {
            contractValue: contract.contract_value,
            existingTotal: totalExisting,
            newAmount: validated.amount,
            wouldExceedBy: (totalExisting + validated.amount) - contract.contract_value
          }
        );
      }

      return this.db.createPayment(validated);
    }, { action: 'create', contract_id: data.contract_id });
  }

  /**
   * Get all payments with optional filters
   */
  getAll(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter(filters);
      return this.db.getPayments(validated);
    }, { action: 'getAll', filters });
  }

  /**
   * Get a single payment by ID
   */
  getById(id) {
    return this.execute(() => {
      const payment = this.db.getPaymentById(id);
      if (!payment) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }
      return payment;
    }, { action: 'getById', id });
  }

  /**
   * Get payments by contract
   */
  getByContract(contractId) {
    return this.execute(() => {
      const payments = this.db.getPayments({ contract_id: contractId });

      // Get contract for summary
      const contract = this.db.getContractById(contractId);

      return {
        payments,
        summary: contract ? this.calculatePaymentSummary(contract.contract_value, payments) : null
      };
    }, { action: 'getByContract', contractId });
  }

  /**
   * Update a payment
   */
  update(id, data) {
    return this.execute(() => {
      const validated = this.validateUpdate(data);

      // Check if payment exists
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      // Cannot update paid or cancelled payments
      if (existing.status === 'paid' || existing.status === 'cancelled') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          `Cannot update ${existing.status} payment`,
          { currentStatus: existing.status }
        );
      }

      // Validate status transition
      if (validated.status) {
        this.validateStatusTransition(existing.status, validated.status);
      }

      // If amount is being changed, validate it doesn't exceed contract
      if (validated.amount && validated.amount !== existing.amount) {
        const contract = this.db.getContractById(existing.contract_id);
        const otherPayments = this.db.getPayments({ contract_id: existing.contract_id });
        const otherTotal = otherPayments
          .filter(p => p.id !== id && p.status !== 'cancelled')
          .reduce((sum, p) => sum + p.amount, 0);

        if (otherTotal + validated.amount > contract.contract_value) {
          throw new BusinessError(
            ERROR_CODES.BUSINESS_PAYMENT_EXCEEDED,
            'Updated amount would exceed contract value',
            {
              contractValue: contract.contract_value,
              otherPaymentsTotal: otherTotal,
              newAmount: validated.amount
            }
          );
        }
      }

      return this.db.updatePayment(id, validated);
    }, { action: 'update', id });
  }

  /**
   * Process a payment (mark as processing)
   */
  process(id, processedBy) {
    return this.execute(() => {
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'pending') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only process pending payments',
          { currentStatus: existing.status }
        );
      }

      return this.db.updatePayment(id, {
        status: 'processing',
        processed_by: processedBy
      });
    }, { action: 'process', id });
  }

  /**
   * Complete a payment (mark as paid)
   */
  complete(id, referenceNumber, paymentDate = null) {
    return this.execute(() => {
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'processing') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only complete payments that are processing',
          { currentStatus: existing.status }
        );
      }

      return this.db.updatePayment(id, {
        status: 'paid',
        reference_number: referenceNumber,
        payment_date: paymentDate || new Date().toISOString().split('T')[0]
      });
    }, { action: 'complete', id });
  }

  /**
   * Mark payment as failed
   */
  fail(id, reason) {
    return this.execute(() => {
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'processing') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only fail payments that are processing',
          { currentStatus: existing.status }
        );
      }

      return this.db.updatePayment(id, {
        status: 'failed',
        notes: `${existing.notes || ''}\n[Failed] ${new Date().toISOString()}: ${reason}`.trim()
      });
    }, { action: 'fail', id });
  }

  /**
   * Cancel a payment
   */
  cancel(id, reason) {
    return this.execute(() => {
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      const allowedStatuses = ['pending', 'failed'];
      if (!allowedStatuses.includes(existing.status)) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          `Cannot cancel ${existing.status} payment`,
          { currentStatus: existing.status }
        );
      }

      return this.db.updatePayment(id, {
        status: 'cancelled',
        notes: `${existing.notes || ''}\n[Cancelled] ${new Date().toISOString()}: ${reason}`.trim()
      });
    }, { action: 'cancel', id });
  }

  /**
   * Retry a failed payment
   */
  retry(id) {
    return this.execute(() => {
      const existing = this.db.getPaymentById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Payment with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'failed') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only retry failed payments',
          { currentStatus: existing.status }
        );
      }

      return this.db.updatePayment(id, {
        status: 'pending',
        notes: `${existing.notes || ''}\n[Retry] ${new Date().toISOString()}`.trim()
      });
    }, { action: 'retry', id });
  }

  /**
   * Get overdue payments
   */
  getOverdue() {
    return this.execute(() => {
      const today = new Date().toISOString().split('T')[0];
      const payments = this.db.getPayments({ status: 'pending' });

      return payments.filter(p => p.due_date && p.due_date < today);
    }, { action: 'getOverdue' });
  }

  /**
   * Get upcoming payments (due within N days)
   */
  getUpcoming(daysAhead = 7) {
    return this.execute(() => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const todayStr = today.toISOString().split('T')[0];
      const futureStr = futureDate.toISOString().split('T')[0];

      const payments = this.db.getPayments({ status: 'pending' });
      return payments.filter(p =>
        p.due_date && p.due_date >= todayStr && p.due_date <= futureStr
      );
    }, { action: 'getUpcoming', daysAhead });
  }

  /**
   * Get payment statistics for a contract
   */
  getContractPaymentStats(contractId) {
    return this.execute(() => {
      const contract = this.db.getContractById(contractId);
      if (!contract) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          'Contract not found',
          { contractId }
        );
      }

      const payments = this.db.getPayments({ contract_id: contractId });
      return this.calculatePaymentSummary(contract.contract_value, payments);
    }, { action: 'getContractPaymentStats', contractId });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['paid', 'failed'],
      failed: ['pending', 'cancelled'],
      paid: [],
      cancelled: []
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
      totalProcessing: 0,
      totalFailed: 0,
      paymentCount: payments.length,
      paidCount: 0,
      pendingCount: 0
    };

    for (const payment of payments) {
      switch (payment.status) {
        case 'paid':
          summary.totalPaid += payment.amount;
          summary.paidCount++;
          break;
        case 'pending':
          summary.totalPending += payment.amount;
          summary.pendingCount++;
          break;
        case 'processing':
          summary.totalProcessing += payment.amount;
          break;
        case 'failed':
          summary.totalFailed += payment.amount;
          break;
      }
    }

    summary.remaining = contractValue - summary.totalPaid;
    summary.percentPaid = contractValue > 0
      ? Math.round((summary.totalPaid / contractValue) * 100)
      : 0;
    summary.isFullyPaid = summary.remaining <= 0;

    return summary;
  }
}

// Export singleton instance
module.exports = new PaymentApi(null);
module.exports.PaymentApi = PaymentApi;
