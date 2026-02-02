/**
 * Vendor API - Vendor Management Operations
 *
 * Handles all CRUD operations for vendors/suppliers
 */

const BaseApi = require('./baseApi');
const { vendorSchemas, createValidator } = require('./validator');
const { BusinessError, ERROR_CODES } = require('../utils/errorHandler');

class VendorApi extends BaseApi {
  constructor(database) {
    super(database, 'vendor');

    // Create validators
    this.validateCreate = createValidator(vendorSchemas.create);
    this.validateUpdate = createValidator(vendorSchemas.update);
    this.validateFilter = createValidator(vendorSchemas.filter);
  }

  /**
   * Create a new vendor
   */
  create(data) {
    return this.execute(() => {
      const validated = this.validateCreate(data);
      return this.db.createVendor(validated);
    }, { action: 'create', name: data.name });
  }

  /**
   * Get all vendors with optional filters
   */
  getAll(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter(filters);
      return this.db.getVendors(validated);
    }, { action: 'getAll', filters });
  }

  /**
   * Get active vendors only
   */
  getActive(filters = {}) {
    return this.execute(() => {
      const validated = this.validateFilter({ ...filters, is_active: true });
      return this.db.getVendors(validated);
    }, { action: 'getActive' });
  }

  /**
   * Get a single vendor by ID
   */
  getById(id) {
    return this.execute(() => {
      const vendor = this.db.getVendorById(id);
      if (!vendor) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }
      return vendor;
    }, { action: 'getById', id });
  }

  /**
   * Get vendor with contract history
   */
  getWithContracts(id) {
    return this.execute(() => {
      const vendor = this.db.getVendorById(id);
      if (!vendor) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      // Get contracts for this vendor
      vendor.contracts = this.db.getContracts({ vendor_id: id });

      // Calculate statistics
      vendor.stats = this.calculateVendorStats(vendor.contracts);

      return vendor;
    }, { action: 'getWithContracts', id });
  }

  /**
   * Update a vendor
   */
  update(id, data) {
    return this.execute(() => {
      const validated = this.validateUpdate(data);

      // Check if vendor exists
      const existing = this.db.getVendorById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      return this.db.updateVendor(id, validated);
    }, { action: 'update', id });
  }

  /**
   * Delete a vendor
   */
  delete(id) {
    return this.execute(() => {
      // Check if vendor exists
      const existing = this.db.getVendorById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      // Check for active contracts (handled by trigger, but we provide better error)
      const activeContracts = this.db.getContracts({
        vendor_id: id,
        status: 'active'
      });

      if (activeContracts.length > 0) {
        throw new BusinessError(
          ERROR_CODES.BUSINESS_VENDOR_INACTIVE,
          'Cannot delete vendor with active contracts',
          { activeContractCount: activeContracts.length }
        );
      }

      return this.db.deleteVendor(id);
    }, { action: 'delete', id });
  }

  /**
   * Deactivate a vendor (soft delete)
   */
  deactivate(id) {
    return this.execute(() => {
      const existing = this.db.getVendorById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      return this.db.updateVendor(id, { is_active: false });
    }, { action: 'deactivate', id });
  }

  /**
   * Activate a vendor
   */
  activate(id) {
    return this.execute(() => {
      const existing = this.db.getVendorById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      return this.db.updateVendor(id, { is_active: true });
    }, { action: 'activate', id });
  }

  /**
   * Update vendor performance rating
   */
  updateRating(id, rating, notes = null) {
    return this.execute(() => {
      if (rating < 0 || rating > 5) {
        throw new BusinessError(
          ERROR_CODES.VALIDATION_OUT_OF_RANGE,
          'Rating must be between 0 and 5',
          { rating, min: 0, max: 5 }
        );
      }

      const existing = this.db.getVendorById(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `Vendor with ID ${id} not found`,
          { id }
        );
      }

      const updates = { performance_rating: rating };
      if (notes) {
        updates.notes = `${existing.notes || ''}\n[Rating Update] ${new Date().toISOString()}: ${notes}`.trim();
      }

      return this.db.updateVendor(id, updates);
    }, { action: 'updateRating', id, rating });
  }

  /**
   * Search vendors by name, NPWP, or email
   */
  search(query) {
    return this.execute(() => {
      return this.db.getVendors({ search: query, is_active: true });
    }, { action: 'search', query });
  }

  /**
   * Get vendors with good performance (rating >= threshold)
   */
  getTopPerformers(minRating = 4) {
    return this.execute(() => {
      return this.db.getVendors({
        is_active: true,
        min_rating: minRating
      });
    }, { action: 'getTopPerformers', minRating });
  }

  /**
   * Check if NPWP already exists
   */
  checkNpwpExists(npwp, excludeId = null) {
    return this.execute(() => {
      const vendors = this.db.getVendors({ search: npwp });
      const exists = vendors.some(v =>
        v.npwp === npwp && v.id !== excludeId
      );
      return { exists, npwp };
    }, { action: 'checkNpwpExists', npwp });
  }

  // ==================== Private Helper Methods ====================

  /**
   * Calculate vendor statistics from contracts
   */
  calculateVendorStats(contracts) {
    const stats = {
      totalContracts: contracts.length,
      activeContracts: 0,
      completedContracts: 0,
      totalValue: 0,
      completedValue: 0
    };

    for (const contract of contracts) {
      stats.totalValue += contract.contract_value || 0;

      if (contract.status === 'active') {
        stats.activeContracts++;
      } else if (contract.status === 'completed') {
        stats.completedContracts++;
        stats.completedValue += contract.contract_value || 0;
      }
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new VendorApi(null);
module.exports.VendorApi = VendorApi;
