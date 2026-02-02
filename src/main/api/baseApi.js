/**
 * Base API Class
 *
 * Provides common functionality for all API modules:
 * - Database access
 * - Error handling
 * - Response formatting
 * - Logging
 */

const { databaseLogger } = require('../logger');
const {
  createSuccessResponse,
  createErrorResponse,
  DatabaseError,
  ValidationError
} = require('../utils/errorHandler');

class BaseApi {
  constructor(database, entityName) {
    this.db = database;
    this.entityName = entityName;
    this.logger = databaseLogger.child(`api:${entityName}`);
  }

  /**
   * Set database instance (called after database is initialized)
   */
  setDatabase(database) {
    this.db = database;
  }

  /**
   * Ensure database is available
   */
  ensureDatabase() {
    if (!this.db) {
      throw new DatabaseError(
        'E1001',
        'Database not initialized',
        { entity: this.entityName }
      );
    }
  }

  /**
   * Execute database operation with error handling
   */
  execute(operation, context = {}) {
    this.ensureDatabase();

    try {
      const result = operation();
      this.logger.debug(`${context.action || 'Operation'} successful`, context);
      return createSuccessResponse(result, { entity: this.entityName, ...context });
    } catch (error) {
      this.logger.error(`${context.action || 'Operation'} failed`, {
        error: error.message,
        ...context
      });
      return createErrorResponse(error, { entity: this.entityName, ...context });
    }
  }

  /**
   * Execute async database operation with error handling
   */
  async executeAsync(operation, context = {}) {
    this.ensureDatabase();

    try {
      const result = await operation();
      this.logger.debug(`${context.action || 'Operation'} successful`, context);
      return createSuccessResponse(result, { entity: this.entityName, ...context });
    } catch (error) {
      this.logger.error(`${context.action || 'Operation'} failed`, {
        error: error.message,
        ...context
      });
      return createErrorResponse(error, { entity: this.entityName, ...context });
    }
  }

  /**
   * Validate input data
   */
  validate(schema, data) {
    const result = schema.validate(data);
    if (!result.valid) {
      throw result.error;
    }
    return result.value;
  }

  /**
   * Execute within a transaction
   */
  executeInTransaction(operations, context = {}) {
    this.ensureDatabase();

    try {
      const result = this.db.db.transaction(() => {
        return operations();
      })();

      this.logger.debug(`Transaction successful`, context);
      return createSuccessResponse(result, { entity: this.entityName, ...context });
    } catch (error) {
      this.logger.error(`Transaction failed`, {
        error: error.message,
        ...context
      });
      return createErrorResponse(error, { entity: this.entityName, ...context });
    }
  }

  /**
   * Create pagination metadata
   */
  createPaginationMeta(total, limit, offset) {
    return {
      total,
      limit: limit || total,
      offset: offset || 0,
      hasMore: (offset || 0) + (limit || total) < total
    };
  }
}

module.exports = BaseApi;
