/**
 * Request API - Procurement Request Operations
 *
 * Handles all CRUD operations for procurement requests
 */

const BaseApi = require('./baseApi');
const { requestSchemas, createValidator } = require('./validator');
const { BusinessError, ERROR_CODES } = require('../utils/errorHandler');

class RequestApi extends BaseApi {
  constructor(database) {
    super(database, 'request');

    // Create validators
    this.validateCreate = createValidator(requestSchemas.create);
    this.validateUpdate = createValidator(requestSchemas.update);
    this.validateFilter = createValidator(requestSchemas.filter);
  }

  /**
   * Create a new procurement request
   */
  create(data) {
    return this.execute(() => {
      // Validate input
      const validated = this.validateCreate(data);

      // Additional business validation for tier values
      this.validateTierValue(validated.tier, validated.estimated_value);

      // Create request
      return this.db.createRequest(validated);
    }, { action: 'create', tier: data.tier });
  }

  /**
   * Get all requests with optional filters
   */
  getAll(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter(filters);
      return this.db.getRequests(validated);
    }, { action: 'getAll', filters });
  }

  /**
   * Get a single request by ID
   */
  getById(id) {
    return this.execute(() => {
      const request = this.db.getRequestById(id);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }
      return request;
    }, { action: 'getById', id });
  }

  /**
   * Get request with all related data (approvals, attachments, contracts)
   */
  getWithDetails(id) {
    return this.execute(() => {
      const request = this.db.getRequestWithDetails(id);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }
      return request;
    }, { action: 'getWithDetails', id });
  }

  /**
   * Update a request
   */
  update(id, data) {
    return this.execute(() => {
      // Validate input
      const validated = this.validateUpdate(data);

      // Check if request exists
      const existing = this.db.getRequestById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      // Validate status transition
      if (validated.status) {
        this.validateStatusTransition(existing.status, validated.status);
      }

      // Validate tier value if estimated_value is being updated
      if (validated.estimated_value) {
        this.validateTierValue(existing.tier, validated.estimated_value);
      }

      return this.db.updateRequest(id, validated);
    }, { action: 'update', id });
  }

  /**
   * Delete a request
   */
  delete(id) {
    return this.execute(() => {
      // Check if request exists
      const existing = this.db.getRequestById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      // Only allow deletion of draft requests
      if (existing.status !== 'draft') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only delete requests with draft status',
          { currentStatus: existing.status }
        );
      }

      return this.db.deleteRequest(id);
    }, { action: 'delete', id });
  }

  /**
   * Submit request for approval
   */
  submit(id) {
    return this.execute(() => {
      const existing = this.db.getRequestById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'draft') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only submit requests with draft status',
          { currentStatus: existing.status }
        );
      }

      // Create workflow approval steps based on tier
      const steps = this.createWorkflowSteps(existing.tier);

      return this.db.db.transaction(() => {
        // Update status to pending
        this.db.updateRequest(id, { status: 'pending', current_step: 1 });

        // Create approval steps
        for (const step of steps) {
          this.db.db.prepare(`
            INSERT INTO workflow_approvals (id, request_id, step_number, approver_role, action)
            VALUES (?, ?, ?, ?, 'pending')
          `).run(
            require('uuid').v4(),
            id,
            step.step_number,
            step.approver_role
          );
        }

        return { id, status: 'pending', steps: steps.length };
      })();
    }, { action: 'submit', id });
  }

  /**
   * Approve a request step
   */
  approve(id, approverId, comments = null) {
    return this.execute(() => {
      const request = this.db.getRequestWithDetails(id);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      if (request.status !== 'pending') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only approve pending requests',
          { currentStatus: request.status }
        );
      }

      // Find current pending step
      const pendingStep = request.approvals.find(a => a.action === 'pending');
      if (!pendingStep) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_WORKFLOW_ERROR,
          'No pending approval step found',
          { id }
        );
      }

      return this.db.db.transaction(() => {
        // Update approval step
        this.db.db.prepare(`
          UPDATE workflow_approvals
          SET action = 'approve', approver_id = ?, comments = ?, approved_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(approverId, comments, pendingStep.id);

        // Update request current step
        this.db.updateRequest(id, { current_step: request.current_step + 1 });

        return { id, step: pendingStep.step_number, action: 'approved' };
      })();
    }, { action: 'approve', id, approverId });
  }

  /**
   * Reject a request
   */
  reject(id, approverId, reason) {
    return this.execute(() => {
      const request = this.db.getRequestWithDetails(id);
      if (!request) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      if (request.status !== 'pending') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only reject pending requests',
          { currentStatus: request.status }
        );
      }

      // Find current pending step
      const pendingStep = request.approvals.find(a => a.action === 'pending');
      if (!pendingStep) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_WORKFLOW_ERROR,
          'No pending approval step found',
          { id }
        );
      }

      return this.db.db.transaction(() => {
        // Update approval step
        this.db.db.prepare(`
          UPDATE workflow_approvals
          SET action = 'reject', approver_id = ?, comments = ?, approved_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(approverId, reason, pendingStep.id);

        // Update request status
        this.db.updateRequest(id, {
          status: 'rejected',
          rejection_reason: reason
        });

        return { id, step: pendingStep.step_number, action: 'rejected' };
      })();
    }, { action: 'reject', id, approverId });
  }

  /**
   * Cancel a request
   */
  cancel(id, reason) {
    return this.execute(() => {
      const existing = this.db.getRequestById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      const allowedStatuses = ['draft', 'pending'];
      if (!allowedStatuses.includes(existing.status)) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          `Cannot cancel request with status '${existing.status}'`,
          { currentStatus: existing.status, allowedStatuses }
        );
      }

      return this.db.updateRequest(id, {
        status: 'cancelled',
        rejection_reason: reason
      });
    }, { action: 'cancel', id });
  }

  /**
   * Mark request as completed
   */
  complete(id) {
    return this.execute(() => {
      const existing = this.db.getRequestById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Request with ID ${id} not found`,
          { id }
        );
      }

      if (existing.status !== 'in_progress') {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_INVALID_STATUS,
          'Can only complete requests that are in progress',
          { currentStatus: existing.status }
        );
      }

      return this.db.updateRequest(id, { status: 'completed' });
    }, { action: 'complete', id });
  }

  /**
   * Get request statistics
   */
  getStats(filters = {}) {
    return this.execute(() => {
      return this.db.getStats();
    }, { action: 'getStats' });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Validate tier value constraints
   */
  validateTierValue(tier, value) {
    const constraints = {
      tier1: { min: 0, max: 10000000, message: 'Tier 1 value must be < Rp 10 juta' },
      tier2: { min: 10000000, max: 50000000, message: 'Tier 2 value must be Rp 10-50 juta' },
      tier3: { min: 50000000, max: Infinity, message: 'Tier 3 value must be >= Rp 50 juta' }
    };

    const constraint = constraints[tier];
    if (!constraint) {
      throw new BusinessError(
        ERROR_CODES.VALIDATION_FAILED,
        `Invalid tier: ${tier}`,
        { tier }
      );
    }

    if (value < constraint.min || value >= constraint.max) {
      throw new BusinessError(
        ERROR_CODES.VALIDATION_TIER_VALUE_MISMATCH,
        constraint.message,
        { tier, value, ...constraint }
      );
    }
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      rejected: ['draft'], // Allow revision
      completed: [],
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
   * Create workflow steps based on tier
   */
  createWorkflowSteps(tier) {
    const workflows = {
      tier1: [
        { step_number: 1, approver_role: 'unit_head' }
      ],
      tier2: [
        { step_number: 1, approver_role: 'unit_head' },
        { step_number: 2, approver_role: 'ppk' }
      ],
      tier3: [
        { step_number: 1, approver_role: 'unit_head' },
        { step_number: 2, approver_role: 'ppk' },
        { step_number: 3, approver_role: 'ppspm' }
      ]
    };

    return workflows[tier] || workflows.tier1;
  }
}

// Export singleton instance (will be initialized with database later)
module.exports = new RequestApi(null);
module.exports.RequestApi = RequestApi;
