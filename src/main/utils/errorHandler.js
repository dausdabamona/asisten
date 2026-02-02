/**
 * Centralized Error Handler for PPK Assistant
 *
 * Provides:
 * - Custom error classes for different error types
 * - Error classification and categorization
 * - User-friendly error messages
 * - Consistent error response format
 * - Error logging integration
 */

const { mainLogger } = require('../logger');

// Error codes
const ERROR_CODES = {
  // Database errors (1xxx)
  DB_CONNECTION_FAILED: 'E1001',
  DB_QUERY_FAILED: 'E1002',
  DB_TRANSACTION_FAILED: 'E1003',
  DB_CONSTRAINT_VIOLATION: 'E1004',
  DB_NOT_FOUND: 'E1005',
  DB_DUPLICATE_ENTRY: 'E1006',
  DB_FOREIGN_KEY_VIOLATION: 'E1007',
  DB_MIGRATION_FAILED: 'E1008',
  DB_BACKUP_FAILED: 'E1009',
  DB_RESTORE_FAILED: 'E1010',

  // Validation errors (2xxx)
  VALIDATION_FAILED: 'E2001',
  VALIDATION_REQUIRED_FIELD: 'E2002',
  VALIDATION_INVALID_FORMAT: 'E2003',
  VALIDATION_OUT_OF_RANGE: 'E2004',
  VALIDATION_INVALID_TYPE: 'E2005',
  VALIDATION_TIER_VALUE_MISMATCH: 'E2006',

  // Authentication errors (3xxx)
  AUTH_INVALID_CREDENTIALS: 'E3001',
  AUTH_SESSION_EXPIRED: 'E3002',
  AUTH_UNAUTHORIZED: 'E3003',
  AUTH_FORBIDDEN: 'E3004',

  // Business logic errors (4xxx)
  BUSINESS_INVALID_STATUS: 'E4001',
  BUSINESS_WORKFLOW_ERROR: 'E4002',
  BUSINESS_BUDGET_EXCEEDED: 'E4003',
  BUSINESS_CONTRACT_EXPIRED: 'E4004',
  BUSINESS_PAYMENT_EXCEEDED: 'E4005',
  BUSINESS_VENDOR_INACTIVE: 'E4006',

  // File operation errors (5xxx)
  FILE_NOT_FOUND: 'E5001',
  FILE_READ_ERROR: 'E5002',
  FILE_WRITE_ERROR: 'E5003',
  FILE_DELETE_ERROR: 'E5004',
  FILE_SIZE_EXCEEDED: 'E5005',
  FILE_TYPE_NOT_ALLOWED: 'E5006',

  // System errors (9xxx)
  SYSTEM_UNKNOWN_ERROR: 'E9001',
  SYSTEM_INTERNAL_ERROR: 'E9002',
  SYSTEM_RESOURCE_EXHAUSTED: 'E9003',
  SYSTEM_TIMEOUT: 'E9004'
};

// User-friendly messages in Indonesian
const ERROR_MESSAGES = {
  [ERROR_CODES.DB_CONNECTION_FAILED]: 'Gagal terhubung ke database. Silakan restart aplikasi.',
  [ERROR_CODES.DB_QUERY_FAILED]: 'Gagal mengeksekusi query database.',
  [ERROR_CODES.DB_TRANSACTION_FAILED]: 'Transaksi database gagal.',
  [ERROR_CODES.DB_CONSTRAINT_VIOLATION]: 'Data tidak memenuhi syarat validasi database.',
  [ERROR_CODES.DB_NOT_FOUND]: 'Data tidak ditemukan.',
  [ERROR_CODES.DB_DUPLICATE_ENTRY]: 'Data sudah ada sebelumnya.',
  [ERROR_CODES.DB_FOREIGN_KEY_VIOLATION]: 'Data terkait dengan data lain yang tidak valid.',
  [ERROR_CODES.DB_MIGRATION_FAILED]: 'Gagal memperbarui struktur database.',
  [ERROR_CODES.DB_BACKUP_FAILED]: 'Gagal membuat backup database.',
  [ERROR_CODES.DB_RESTORE_FAILED]: 'Gagal memulihkan database dari backup.',

  [ERROR_CODES.VALIDATION_FAILED]: 'Validasi data gagal.',
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'Field wajib tidak boleh kosong.',
  [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Format data tidak valid.',
  [ERROR_CODES.VALIDATION_OUT_OF_RANGE]: 'Nilai di luar rentang yang diizinkan.',
  [ERROR_CODES.VALIDATION_INVALID_TYPE]: 'Tipe data tidak valid.',
  [ERROR_CODES.VALIDATION_TIER_VALUE_MISMATCH]: 'Nilai tidak sesuai dengan tier yang dipilih.',

  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Email atau password salah.',
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Sesi telah berakhir. Silakan login kembali.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Anda tidak memiliki akses.',
  [ERROR_CODES.AUTH_FORBIDDEN]: 'Akses ditolak.',

  [ERROR_CODES.BUSINESS_INVALID_STATUS]: 'Status tidak valid untuk operasi ini.',
  [ERROR_CODES.BUSINESS_WORKFLOW_ERROR]: 'Kesalahan pada alur kerja.',
  [ERROR_CODES.BUSINESS_BUDGET_EXCEEDED]: 'Anggaran tidak mencukupi.',
  [ERROR_CODES.BUSINESS_CONTRACT_EXPIRED]: 'Kontrak telah berakhir.',
  [ERROR_CODES.BUSINESS_PAYMENT_EXCEEDED]: 'Total pembayaran melebihi nilai kontrak.',
  [ERROR_CODES.BUSINESS_VENDOR_INACTIVE]: 'Vendor tidak aktif.',

  [ERROR_CODES.FILE_NOT_FOUND]: 'File tidak ditemukan.',
  [ERROR_CODES.FILE_READ_ERROR]: 'Gagal membaca file.',
  [ERROR_CODES.FILE_WRITE_ERROR]: 'Gagal menyimpan file.',
  [ERROR_CODES.FILE_DELETE_ERROR]: 'Gagal menghapus file.',
  [ERROR_CODES.FILE_SIZE_EXCEEDED]: 'Ukuran file terlalu besar.',
  [ERROR_CODES.FILE_TYPE_NOT_ALLOWED]: 'Tipe file tidak diizinkan.',

  [ERROR_CODES.SYSTEM_UNKNOWN_ERROR]: 'Terjadi kesalahan yang tidak diketahui.',
  [ERROR_CODES.SYSTEM_INTERNAL_ERROR]: 'Terjadi kesalahan internal sistem.',
  [ERROR_CODES.SYSTEM_RESOURCE_EXHAUSTED]: 'Sumber daya sistem habis.',
  [ERROR_CODES.SYSTEM_TIMEOUT]: 'Operasi melebihi batas waktu.'
};

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(code, message, details = null, originalError = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.userMessage = ERROR_MESSAGES[code] || message;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Database Error
 */
class DatabaseError extends AppError {
  constructor(code, message, details = null, originalError = null) {
    super(code, message, details, originalError);
    this.name = 'DatabaseError';
  }

  static fromSqliteError(error, operation = 'query') {
    const message = error.message || 'Unknown database error';

    // Classify SQLite errors
    if (message.includes('UNIQUE constraint failed')) {
      return new DatabaseError(
        ERROR_CODES.DB_DUPLICATE_ENTRY,
        message,
        { operation, constraint: 'UNIQUE' },
        error
      );
    }

    if (message.includes('FOREIGN KEY constraint failed')) {
      return new DatabaseError(
        ERROR_CODES.DB_FOREIGN_KEY_VIOLATION,
        message,
        { operation, constraint: 'FOREIGN KEY' },
        error
      );
    }

    if (message.includes('NOT NULL constraint failed')) {
      return new DatabaseError(
        ERROR_CODES.DB_CONSTRAINT_VIOLATION,
        message,
        { operation, constraint: 'NOT NULL' },
        error
      );
    }

    if (message.includes('CHECK constraint failed')) {
      return new DatabaseError(
        ERROR_CODES.DB_CONSTRAINT_VIOLATION,
        message,
        { operation, constraint: 'CHECK' },
        error
      );
    }

    if (message.includes('SQLITE_BUSY')) {
      return new DatabaseError(
        ERROR_CODES.DB_TRANSACTION_FAILED,
        'Database is busy',
        { operation },
        error
      );
    }

    // Trigger validation errors
    if (message.includes('Tier 1 requests must have')) {
      return new ValidationError(
        ERROR_CODES.VALIDATION_TIER_VALUE_MISMATCH,
        message,
        { tier: 'tier1', maxValue: 10000000 }
      );
    }

    if (message.includes('Tier 2 requests must have')) {
      return new ValidationError(
        ERROR_CODES.VALIDATION_TIER_VALUE_MISMATCH,
        message,
        { tier: 'tier2', minValue: 10000000, maxValue: 50000000 }
      );
    }

    if (message.includes('Tier 3 requests must have')) {
      return new ValidationError(
        ERROR_CODES.VALIDATION_TIER_VALUE_MISMATCH,
        message,
        { tier: 'tier3', minValue: 50000000 }
      );
    }

    if (message.includes('Total payments cannot exceed')) {
      return new BusinessError(
        ERROR_CODES.BUSINESS_PAYMENT_EXCEEDED,
        message,
        { operation }
      );
    }

    if (message.includes('Cannot delete vendor')) {
      return new BusinessError(
        ERROR_CODES.BUSINESS_VENDOR_INACTIVE,
        message,
        { operation }
      );
    }

    if (message.includes('NPWP must be')) {
      return new ValidationError(
        ERROR_CODES.VALIDATION_INVALID_FORMAT,
        message,
        { field: 'npwp', format: '15 digits' }
      );
    }

    if (message.includes('end_date must be after')) {
      return new ValidationError(
        ERROR_CODES.VALIDATION_INVALID_FORMAT,
        message,
        { field: 'end_date' }
      );
    }

    // Default database error
    return new DatabaseError(
      ERROR_CODES.DB_QUERY_FAILED,
      message,
      { operation },
      error
    );
  }
}

/**
 * Validation Error
 */
class ValidationError extends AppError {
  constructor(code, message, details = null) {
    super(code, message, details);
    this.name = 'ValidationError';
  }

  static requiredField(fieldName) {
    return new ValidationError(
      ERROR_CODES.VALIDATION_REQUIRED_FIELD,
      `Field '${fieldName}' is required`,
      { field: fieldName }
    );
  }

  static invalidFormat(fieldName, expectedFormat) {
    return new ValidationError(
      ERROR_CODES.VALIDATION_INVALID_FORMAT,
      `Field '${fieldName}' has invalid format`,
      { field: fieldName, expectedFormat }
    );
  }

  static outOfRange(fieldName, min, max, actual) {
    return new ValidationError(
      ERROR_CODES.VALIDATION_OUT_OF_RANGE,
      `Field '${fieldName}' is out of range`,
      { field: fieldName, min, max, actual }
    );
  }

  static invalidType(fieldName, expectedType, actualType) {
    return new ValidationError(
      ERROR_CODES.VALIDATION_INVALID_TYPE,
      `Field '${fieldName}' has invalid type`,
      { field: fieldName, expectedType, actualType }
    );
  }
}

/**
 * Authentication Error
 */
class AuthError extends AppError {
  constructor(code, message, details = null) {
    super(code, message, details);
    this.name = 'AuthError';
  }

  static invalidCredentials() {
    return new AuthError(
      ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      'Invalid email or password'
    );
  }

  static sessionExpired() {
    return new AuthError(
      ERROR_CODES.AUTH_SESSION_EXPIRED,
      'Session has expired'
    );
  }

  static unauthorized() {
    return new AuthError(
      ERROR_CODES.AUTH_UNAUTHORIZED,
      'Unauthorized access'
    );
  }

  static forbidden(action) {
    return new AuthError(
      ERROR_CODES.AUTH_FORBIDDEN,
      `Access forbidden for action: ${action}`,
      { action }
    );
  }
}

/**
 * Business Logic Error
 */
class BusinessError extends AppError {
  constructor(code, message, details = null) {
    super(code, message, details);
    this.name = 'BusinessError';
  }

  static invalidStatus(currentStatus, allowedStatuses) {
    return new BusinessError(
      ERROR_CODES.BUSINESS_INVALID_STATUS,
      `Invalid status transition from '${currentStatus}'`,
      { currentStatus, allowedStatuses }
    );
  }

  static budgetExceeded(available, requested) {
    return new BusinessError(
      ERROR_CODES.BUSINESS_BUDGET_EXCEEDED,
      'Budget exceeded',
      { available, requested }
    );
  }

  static contractExpired(contractId, endDate) {
    return new BusinessError(
      ERROR_CODES.BUSINESS_CONTRACT_EXPIRED,
      'Contract has expired',
      { contractId, endDate }
    );
  }
}

/**
 * File Operation Error
 */
class FileError extends AppError {
  constructor(code, message, details = null, originalError = null) {
    super(code, message, details, originalError);
    this.name = 'FileError';
  }

  static notFound(filePath) {
    return new FileError(
      ERROR_CODES.FILE_NOT_FOUND,
      `File not found: ${filePath}`,
      { filePath }
    );
  }

  static sizeExceeded(maxSize, actualSize) {
    return new FileError(
      ERROR_CODES.FILE_SIZE_EXCEEDED,
      'File size exceeded',
      { maxSize, actualSize }
    );
  }

  static typeNotAllowed(fileType, allowedTypes) {
    return new FileError(
      ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
      `File type not allowed: ${fileType}`,
      { fileType, allowedTypes }
    );
  }
}

/**
 * Error Handler - Central processing for all errors
 */
class ErrorHandler {
  constructor(logger = mainLogger) {
    this.logger = logger;
  }

  /**
   * Handle and process an error
   */
  handle(error, context = {}) {
    let processedError;

    // Convert to AppError if not already
    if (error instanceof AppError) {
      processedError = error;
    } else if (error instanceof Error) {
      // Check if it's a SQLite error
      if (error.message && (
        error.message.includes('SQLITE') ||
        error.message.includes('constraint') ||
        error.message.includes('UNIQUE') ||
        error.message.includes('FOREIGN KEY')
      )) {
        processedError = DatabaseError.fromSqliteError(error, context.operation);
      } else {
        processedError = new AppError(
          ERROR_CODES.SYSTEM_UNKNOWN_ERROR,
          error.message,
          context,
          error
        );
      }
    } else {
      processedError = new AppError(
        ERROR_CODES.SYSTEM_UNKNOWN_ERROR,
        String(error),
        context
      );
    }

    // Log the error
    this.logger.error(processedError.message, {
      code: processedError.code,
      name: processedError.name,
      details: processedError.details,
      context,
      stack: processedError.stack
    });

    return processedError;
  }

  /**
   * Create a consistent error response for IPC
   */
  createErrorResponse(error, context = {}) {
    const processedError = this.handle(error, context);

    return {
      success: false,
      error: {
        code: processedError.code,
        message: processedError.userMessage,
        details: processedError.details,
        timestamp: processedError.timestamp
      }
    };
  }

  /**
   * Create a success response
   */
  createSuccessResponse(data, meta = {}) {
    return {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Wrap an async function with error handling
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        const result = await fn(...args);
        return this.createSuccessResponse(result);
      } catch (error) {
        return this.createErrorResponse(error, context);
      }
    };
  }

  /**
   * Wrap a sync function with error handling
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        const result = fn(...args);
        return this.createSuccessResponse(result);
      } catch (error) {
        return this.createErrorResponse(error, context);
      }
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

module.exports = {
  // Error classes
  AppError,
  DatabaseError,
  ValidationError,
  AuthError,
  BusinessError,
  FileError,

  // Error codes and messages
  ERROR_CODES,
  ERROR_MESSAGES,

  // Handler
  ErrorHandler,
  errorHandler,

  // Helper functions
  createErrorResponse: (error, context) => errorHandler.createErrorResponse(error, context),
  createSuccessResponse: (data, meta) => errorHandler.createSuccessResponse(data, meta),
  handleError: (error, context) => errorHandler.handle(error, context)
};
