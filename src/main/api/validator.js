/**
 * Validation Module for PPK Assistant
 *
 * Provides lightweight validation similar to Zod/Joi
 * without external dependencies
 */

const { ValidationError, ERROR_CODES } = require('../utils/errorHandler');

/**
 * Schema Builder - Fluent API for creating validation schemas
 */
class Schema {
  constructor() {
    this.rules = [];
    this.isOptional = false;
    this.defaultValue = undefined;
  }

  /**
   * Mark field as optional
   */
  optional() {
    this.isOptional = true;
    return this;
  }

  /**
   * Set default value
   */
  default(value) {
    this.defaultValue = value;
    this.isOptional = true;
    return this;
  }

  /**
   * Add custom validation rule
   */
  addRule(validator, message) {
    this.rules.push({ validator, message });
    return this;
  }

  /**
   * Validate a value
   */
  validate(value, fieldName = 'value') {
    // Handle undefined/null
    if (value === undefined || value === null) {
      if (this.defaultValue !== undefined) {
        return { valid: true, value: this.defaultValue };
      }
      if (this.isOptional) {
        return { valid: true, value: null };
      }
      return {
        valid: false,
        error: ValidationError.requiredField(fieldName)
      };
    }

    // Run all rules
    for (const rule of this.rules) {
      const result = rule.validator(value);
      if (!result) {
        return {
          valid: false,
          error: new ValidationError(
            ERROR_CODES.VALIDATION_FAILED,
            rule.message.replace('{field}', fieldName),
            { field: fieldName, value }
          )
        };
      }
    }

    return { valid: true, value };
  }
}

/**
 * String Schema
 */
class StringSchema extends Schema {
  constructor() {
    super();
    this.addRule(v => typeof v === 'string', '{field} must be a string');
  }

  min(length) {
    this.addRule(v => v.length >= length, `{field} must be at least ${length} characters`);
    return this;
  }

  max(length) {
    this.addRule(v => v.length <= length, `{field} must be at most ${length} characters`);
    return this;
  }

  email() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.addRule(v => emailRegex.test(v), '{field} must be a valid email');
    return this;
  }

  pattern(regex, message = '{field} has invalid format') {
    this.addRule(v => regex.test(v), message);
    return this;
  }

  enum(values) {
    this.addRule(v => values.includes(v), `{field} must be one of: ${values.join(', ')}`);
    return this;
  }

  nonempty() {
    this.addRule(v => v.trim().length > 0, '{field} cannot be empty');
    return this;
  }

  uuid() {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    this.addRule(v => uuidRegex.test(v), '{field} must be a valid UUID');
    return this;
  }

  npwp() {
    this.addRule(v => {
      const digits = v.replace(/[.\-]/g, '');
      return /^\d{15}$/.test(digits);
    }, '{field} must be a valid 15-digit NPWP');
    return this;
  }

  phone() {
    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    this.addRule(v => phoneRegex.test(v.replace(/[\s\-]/g, '')), '{field} must be a valid phone number');
    return this;
  }

  trim() {
    const originalValidate = this.validate.bind(this);
    this.validate = (value, fieldName) => {
      if (typeof value === 'string') {
        value = value.trim();
      }
      return originalValidate(value, fieldName);
    };
    return this;
  }
}

/**
 * Number Schema
 */
class NumberSchema extends Schema {
  constructor() {
    super();
    this.addRule(v => typeof v === 'number' && !isNaN(v), '{field} must be a valid number');
  }

  min(value) {
    this.addRule(v => v >= value, `{field} must be at least ${value}`);
    return this;
  }

  max(value) {
    this.addRule(v => v <= value, `{field} must be at most ${value}`);
    return this;
  }

  positive() {
    this.addRule(v => v > 0, '{field} must be positive');
    return this;
  }

  negative() {
    this.addRule(v => v < 0, '{field} must be negative');
    return this;
  }

  integer() {
    this.addRule(v => Number.isInteger(v), '{field} must be an integer');
    return this;
  }

  between(min, max) {
    this.addRule(v => v >= min && v <= max, `{field} must be between ${min} and ${max}`);
    return this;
  }
}

/**
 * Boolean Schema
 */
class BooleanSchema extends Schema {
  constructor() {
    super();
    this.addRule(v => typeof v === 'boolean', '{field} must be a boolean');
  }
}

/**
 * Date Schema
 */
class DateSchema extends Schema {
  constructor() {
    super();
    this.addRule(v => {
      if (v instanceof Date) return !isNaN(v.getTime());
      if (typeof v === 'string') {
        const date = new Date(v);
        return !isNaN(date.getTime());
      }
      return false;
    }, '{field} must be a valid date');
  }

  after(date) {
    const compareDate = date instanceof Date ? date : new Date(date);
    this.addRule(v => new Date(v) > compareDate, `{field} must be after ${compareDate.toISOString()}`);
    return this;
  }

  before(date) {
    const compareDate = date instanceof Date ? date : new Date(date);
    this.addRule(v => new Date(v) < compareDate, `{field} must be before ${compareDate.toISOString()}`);
    return this;
  }

  future() {
    this.addRule(v => new Date(v) > new Date(), '{field} must be in the future');
    return this;
  }

  past() {
    this.addRule(v => new Date(v) < new Date(), '{field} must be in the past');
    return this;
  }
}

/**
 * Array Schema
 */
class ArraySchema extends Schema {
  constructor(itemSchema = null) {
    super();
    this.itemSchema = itemSchema;
    this.addRule(v => Array.isArray(v), '{field} must be an array');
  }

  min(length) {
    this.addRule(v => v.length >= length, `{field} must have at least ${length} items`);
    return this;
  }

  max(length) {
    this.addRule(v => v.length <= length, `{field} must have at most ${length} items`);
    return this;
  }

  nonempty() {
    this.addRule(v => v.length > 0, '{field} cannot be empty');
    return this;
  }

  validate(value, fieldName = 'value') {
    const baseResult = super.validate(value, fieldName);
    if (!baseResult.valid) return baseResult;

    // Validate each item if item schema is provided
    if (this.itemSchema && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = this.itemSchema.validate(value[i], `${fieldName}[${i}]`);
        if (!itemResult.valid) return itemResult;
      }
    }

    return baseResult;
  }
}

/**
 * Object Schema
 */
class ObjectSchema extends Schema {
  constructor(shape = {}) {
    super();
    this.shape = shape;
    this.strictMode = false;
    this.addRule(v => typeof v === 'object' && v !== null && !Array.isArray(v), '{field} must be an object');
  }

  strict() {
    this.strictMode = true;
    return this;
  }

  validate(value, fieldName = 'object') {
    const baseResult = super.validate(value, fieldName);
    if (!baseResult.valid) return baseResult;

    const validated = {};
    const errors = [];

    // Validate each field in shape
    for (const [key, schema] of Object.entries(this.shape)) {
      const result = schema.validate(value[key], key);
      if (!result.valid) {
        errors.push(result.error);
      } else {
        validated[key] = result.value;
      }
    }

    // Check for extra fields in strict mode
    if (this.strictMode) {
      const extraKeys = Object.keys(value).filter(k => !this.shape[k]);
      if (extraKeys.length > 0) {
        errors.push(new ValidationError(
          ERROR_CODES.VALIDATION_FAILED,
          `Unknown fields: ${extraKeys.join(', ')}`,
          { extraKeys }
        ));
      }
    } else {
      // Copy extra fields
      for (const key of Object.keys(value)) {
        if (!this.shape[key]) {
          validated[key] = value[key];
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: new ValidationError(
          ERROR_CODES.VALIDATION_FAILED,
          'Validation failed',
          { errors: errors.map(e => e.toJSON()) }
        )
      };
    }

    return { valid: true, value: validated };
  }

  extend(additionalShape) {
    return new ObjectSchema({ ...this.shape, ...additionalShape });
  }

  pick(keys) {
    const newShape = {};
    for (const key of keys) {
      if (this.shape[key]) {
        newShape[key] = this.shape[key];
      }
    }
    return new ObjectSchema(newShape);
  }

  omit(keys) {
    const newShape = { ...this.shape };
    for (const key of keys) {
      delete newShape[key];
    }
    return new ObjectSchema(newShape);
  }
}

/**
 * Schema factory functions
 */
const v = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  date: () => new DateSchema(),
  array: (itemSchema) => new ArraySchema(itemSchema),
  object: (shape) => new ObjectSchema(shape),

  // Shortcuts
  id: () => new StringSchema().uuid(),
  email: () => new StringSchema().email(),
  npwp: () => new StringSchema().npwp().optional(),
  phone: () => new StringSchema().phone().optional(),

  // Custom validator
  custom: (validator, message = 'Validation failed') => {
    const schema = new Schema();
    schema.addRule(validator, message);
    return schema;
  }
};

// ==================== Domain-specific Schemas ====================

/**
 * User Schemas
 */
const userSchemas = {
  create: v.object({
    email: v.string().email(),
    password: v.string().min(6).max(100),
    name: v.string().min(2).max(100),
    role: v.string().enum(['admin', 'ppk', 'ppspm', 'unit_head', 'operator']),
    unit: v.string().optional()
  }),

  update: v.object({
    email: v.string().email().optional(),
    password: v.string().min(6).max(100).optional(),
    name: v.string().min(2).max(100).optional(),
    role: v.string().enum(['admin', 'ppk', 'ppspm', 'unit_head', 'operator']).optional(),
    unit: v.string().optional(),
    active: v.boolean().optional()
  }),

  login: v.object({
    email: v.string().email(),
    password: v.string().nonempty()
  })
};

/**
 * Procurement Request Schemas
 */
const requestSchemas = {
  create: v.object({
    tier: v.string().enum(['tier1', 'tier2', 'tier3']),
    requester_id: v.string().uuid(),
    unit: v.string().enum(['TU', 'Akademik', 'Lab', 'Perpustakaan']),
    item_name: v.string().min(3).max(200),
    description: v.string().max(1000).optional(),
    specifications: v.string().max(2000).optional(),
    quantity: v.number().integer().positive().default(1),
    estimated_value: v.number().positive(),
    budget_code: v.string().nonempty(),
    budget_source: v.string().optional(),
    urgency: v.string().enum(['normal', 'urgent', 'very_urgent']).default('normal'),
    target_date: v.date().optional()
  }),

  update: v.object({
    item_name: v.string().min(3).max(200).optional(),
    description: v.string().max(1000).optional(),
    specifications: v.string().max(2000).optional(),
    quantity: v.number().integer().positive().optional(),
    estimated_value: v.number().positive().optional(),
    budget_code: v.string().optional(),
    budget_source: v.string().optional(),
    status: v.string().enum(['draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']).optional(),
    urgency: v.string().enum(['normal', 'urgent', 'very_urgent']).optional(),
    target_date: v.date().optional(),
    rejection_reason: v.string().optional()
  }),

  filter: v.object({
    tier: v.string().enum(['tier1', 'tier2', 'tier3']).optional(),
    status: v.string().enum(['draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']).optional(),
    unit: v.string().optional(),
    requester_id: v.string().uuid().optional(),
    from_date: v.date().optional(),
    to_date: v.date().optional(),
    limit: v.number().integer().positive().max(1000).optional(),
    offset: v.number().integer().min(0).optional()
  })
};

/**
 * Vendor Schemas
 */
const vendorSchemas = {
  create: v.object({
    name: v.string().min(2).max(200),
    npwp: v.npwp(),
    address: v.string().max(500).optional(),
    phone: v.phone(),
    email: v.string().email().optional(),
    bank_name: v.string().max(100).optional(),
    bank_account: v.string().max(50).optional(),
    bank_account_name: v.string().max(100).optional(),
    notes: v.string().max(1000).optional()
  }),

  update: v.object({
    name: v.string().min(2).max(200).optional(),
    npwp: v.npwp(),
    address: v.string().max(500).optional(),
    phone: v.phone(),
    email: v.string().email().optional(),
    bank_name: v.string().max(100).optional(),
    bank_account: v.string().max(50).optional(),
    bank_account_name: v.string().max(100).optional(),
    performance_rating: v.number().between(0, 5).optional(),
    is_active: v.boolean().optional(),
    notes: v.string().max(1000).optional()
  }),

  filter: v.object({
    is_active: v.boolean().optional(),
    search: v.string().optional(),
    min_rating: v.number().between(0, 5).optional(),
    limit: v.number().integer().positive().max(1000).optional()
  })
};

/**
 * Contract Schemas
 */
const contractSchemas = {
  create: v.object({
    request_id: v.string().uuid(),
    vendor_id: v.string().uuid(),
    contract_value: v.number().positive(),
    start_date: v.date(),
    end_date: v.date(),
    payment_method: v.string().enum(['cash', 'transfer', 'cheque', 'termin']),
    payment_terms: v.string().max(500).optional(),
    notes: v.string().max(1000).optional()
  }),

  update: v.object({
    contract_value: v.number().positive().optional(),
    start_date: v.date().optional(),
    end_date: v.date().optional(),
    payment_method: v.string().enum(['cash', 'transfer', 'cheque', 'termin']).optional(),
    payment_terms: v.string().max(500).optional(),
    status: v.string().enum(['draft', 'active', 'completed', 'terminated', 'expired']).optional(),
    signed_date: v.date().optional(),
    signed_by: v.string().uuid().optional(),
    notes: v.string().max(1000).optional()
  }),

  filter: v.object({
    status: v.string().enum(['draft', 'active', 'completed', 'terminated', 'expired']).optional(),
    vendor_id: v.string().uuid().optional(),
    request_id: v.string().uuid().optional(),
    limit: v.number().integer().positive().max(1000).optional()
  })
};

/**
 * Payment Schemas
 */
const paymentSchemas = {
  create: v.object({
    contract_id: v.string().uuid(),
    amount: v.number().positive(),
    due_date: v.date().optional(),
    payment_method: v.string().enum(['cash', 'transfer', 'cheque']).optional(),
    notes: v.string().max(500).optional()
  }),

  update: v.object({
    amount: v.number().positive().optional(),
    payment_date: v.date().optional(),
    due_date: v.date().optional(),
    status: v.string().enum(['pending', 'processing', 'paid', 'failed', 'cancelled']).optional(),
    payment_method: v.string().enum(['cash', 'transfer', 'cheque']).optional(),
    reference_number: v.string().max(100).optional(),
    processed_by: v.string().uuid().optional(),
    notes: v.string().max(500).optional()
  }),

  filter: v.object({
    contract_id: v.string().uuid().optional(),
    status: v.string().enum(['pending', 'processing', 'paid', 'failed', 'cancelled']).optional(),
    from_date: v.date().optional(),
    to_date: v.date().optional()
  })
};

/**
 * Attachment Schemas
 */
const attachmentSchemas = {
  create: v.object({
    request_id: v.string().uuid().optional(),
    contract_id: v.string().uuid().optional(),
    payment_id: v.string().uuid().optional(),
    file_type: v.string().enum(['proposal', 'quotation', 'invoice', 'receipt', 'contract', 'report', 'photo', 'other']),
    original_name: v.string().nonempty(),
    file_path: v.string().nonempty(),
    file_size: v.number().integer().positive().optional(),
    mime_type: v.string().optional(),
    uploaded_by: v.string().uuid()
  }),

  filter: v.object({
    request_id: v.string().uuid().optional(),
    contract_id: v.string().uuid().optional(),
    payment_id: v.string().uuid().optional(),
    file_type: v.string().enum(['proposal', 'quotation', 'invoice', 'receipt', 'contract', 'report', 'photo', 'other']).optional()
  })
};

/**
 * Validate data against a schema
 */
function validate(schema, data) {
  return schema.validate(data);
}

/**
 * Create a validation middleware
 */
function createValidator(schema) {
  return (data) => {
    const result = schema.validate(data);
    if (!result.valid) {
      throw result.error;
    }
    return result.value;
  };
}

module.exports = {
  // Schema builder
  v,

  // Schema classes
  Schema,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  DateSchema,
  ArraySchema,
  ObjectSchema,

  // Domain schemas
  userSchemas,
  requestSchemas,
  vendorSchemas,
  contractSchemas,
  paymentSchemas,
  attachmentSchemas,

  // Utilities
  validate,
  createValidator
};
