/**
 * User API - User Management Operations
 *
 * Handles all CRUD operations for users
 */

const BaseApi = require('./baseApi');
const { userSchemas, createValidator } = require('./validator');
const { AuthError, BusinessError, ERROR_CODES } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

class UserApi extends BaseApi {
  constructor(database) {
    super(database, 'user');

    // Create validators
    this.validateCreate = createValidator(userSchemas.create);
    this.validateUpdate = createValidator(userSchemas.update);
    this.validateLogin = createValidator(userSchemas.login);
  }

  /**
   * Create a new user
   */
  create(data) {
    return this.execute(() => {
      const validated = this.validateCreate(data);

      // Check if email already exists
      const existing = this.db.db.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).get(validated.email);

      if (existing) {
        throw new BusinessError(
          ERROR_CODES.DB_DUPLICATE_ENTRY,
          'Email already exists',
          { email: validated.email }
        );
      }

      // In production, hash the password
      // validated.password = await bcrypt.hash(validated.password, 10);

      const id = uuidv4();
      const stmt = this.db.db.prepare(`
        INSERT INTO users (id, email, password, name, role, unit)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        validated.email,
        validated.password,
        validated.name,
        validated.role,
        validated.unit || null
      );

      return {
        id,
        email: validated.email,
        name: validated.name,
        role: validated.role,
        unit: validated.unit
      };
    }, { action: 'create', email: data.email });
  }

  /**
   * Get all users
   */
  getAll(filters = {}) {
    return this.execute(() => {
      let query = `
        SELECT id, email, name, role, unit, active, created_at, updated_at
        FROM users
        WHERE 1=1
      `;
      const params = [];

      if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
      }

      if (filters.unit) {
        query += ' AND unit = ?';
        params.push(filters.unit);
      }

      if (filters.active !== undefined) {
        query += ' AND active = ?';
        params.push(filters.active ? 1 : 0);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ' ORDER BY name ASC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      return this.db.db.prepare(query).all(...params);
    }, { action: 'getAll', filters });
  }

  /**
   * Get a single user by ID
   */
  getById(id) {
    return this.execute(() => {
      const user = this.db.db.prepare(`
        SELECT id, email, name, role, unit, active, created_at, updated_at
        FROM users WHERE id = ?
      `).get(id);

      if (!user) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      return user;
    }, { action: 'getById', id });
  }

  /**
   * Get a user by email
   */
  getByEmail(email) {
    return this.execute(() => {
      const user = this.db.db.prepare(`
        SELECT id, email, name, role, unit, active, created_at, updated_at
        FROM users WHERE email = ?
      `).get(email);

      if (!user) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with email ${email} not found`,
          { email }
        );
      }

      return user;
    }, { action: 'getByEmail', email });
  }

  /**
   * Update a user
   */
  update(id, data) {
    return this.execute(() => {
      const validated = this.validateUpdate(data);

      // Check if user exists
      const existing = this.db.db.prepare('SELECT id FROM users WHERE id = ?').get(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      // Check email uniqueness if being updated
      if (validated.email) {
        const emailExists = this.db.db.prepare(
          'SELECT id FROM users WHERE email = ? AND id != ?'
        ).get(validated.email, id);

        if (emailExists) {
          throw new BusinessError(
            ERROR_CODES.DB_DUPLICATE_ENTRY,
            'Email already exists',
            { email: validated.email }
          );
        }
      }

      // In production, hash the password if provided
      // if (validated.password) {
      //   validated.password = await bcrypt.hash(validated.password, 10);
      // }

      const fields = Object.keys(validated).filter(k => validated[k] !== undefined);
      if (fields.length === 0) {
        return { changes: 0 };
      }

      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => validated[f]);

      const stmt = this.db.db.prepare(`
        UPDATE users
        SET ${setClause}, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      const result = stmt.run(...values, id);
      return { changes: result.changes };
    }, { action: 'update', id });
  }

  /**
   * Delete a user
   */
  delete(id) {
    return this.execute(() => {
      // Check if user exists
      const existing = this.db.db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      // Prevent deleting the last admin
      if (existing.role === 'admin') {
        const adminCount = this.db.db.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1"
        ).get();

        if (adminCount.count <= 1) {
          throw new BusinessError(
            ERROR_CODES.BUSINESS_WORKFLOW_ERROR,
            'Cannot delete the last admin user',
            { id }
          );
        }
      }

      const result = this.db.db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { changes: result.changes };
    }, { action: 'delete', id });
  }

  /**
   * Deactivate a user (soft delete)
   */
  deactivate(id) {
    return this.execute(() => {
      const existing = this.db.db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      // Prevent deactivating the last admin
      if (existing.role === 'admin') {
        const activeAdminCount = this.db.db.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1"
        ).get();

        if (activeAdminCount.count <= 1) {
          throw new BusinessError(
            ERROR_CODES.BUSINESS_WORKFLOW_ERROR,
            'Cannot deactivate the last active admin',
            { id }
          );
        }
      }

      const result = this.db.db.prepare(`
        UPDATE users SET active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?
      `).run(id);

      return { changes: result.changes };
    }, { action: 'deactivate', id });
  }

  /**
   * Activate a user
   */
  activate(id) {
    return this.execute(() => {
      const existing = this.db.db.prepare('SELECT id FROM users WHERE id = ?').get(id);
      if (!existing) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      const result = this.db.db.prepare(`
        UPDATE users SET active = 1, updated_at = datetime('now', 'localtime') WHERE id = ?
      `).run(id);

      return { changes: result.changes };
    }, { action: 'activate', id });
  }

  /**
   * Authenticate user (login)
   */
  authenticate(email, password) {
    return this.execute(() => {
      this.validateLogin({ email, password });

      const user = this.db.db.prepare(`
        SELECT id, email, password, name, role, unit, active
        FROM users WHERE email = ?
      `).get(email);

      if (!user) {
        throw AuthError.invalidCredentials();
      }

      // In production, use bcrypt.compare
      // const isValid = await bcrypt.compare(password, user.password);
      const isValid = user.password === password;

      if (!isValid) {
        throw AuthError.invalidCredentials();
      }

      if (!user.active) {
        throw new AuthError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'Account is deactivated',
          { email }
        );
      }

      // Return user without password
      delete user.password;

      return {
        user,
        authenticated: true
      };
    }, { action: 'authenticate', email });
  }

  /**
   * Change password
   */
  changePassword(id, currentPassword, newPassword) {
    return this.execute(() => {
      const user = this.db.db.prepare('SELECT password FROM users WHERE id = ?').get(id);

      if (!user) {
        throw new BusinessError(
          ERROR_CODES.DB_NOT_FOUND,
          `User with ID ${id} not found`,
          { id }
        );
      }

      // Verify current password
      // In production: await bcrypt.compare(currentPassword, user.password)
      if (user.password !== currentPassword) {
        throw AuthError.invalidCredentials();
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new BusinessError(
          ERROR_CODES.VALIDATION_FAILED,
          'Password must be at least 6 characters',
          { minLength: 6 }
        );
      }

      // In production: await bcrypt.hash(newPassword, 10)
      const result = this.db.db.prepare(`
        UPDATE users SET password = ?, updated_at = datetime('now', 'localtime') WHERE id = ?
      `).run(newPassword, id);

      return { changes: result.changes };
    }, { action: 'changePassword', id });
  }

  /**
   * Get users by role
   */
  getByRole(role) {
    return this.execute(() => {
      return this.db.db.prepare(`
        SELECT id, email, name, role, unit, active, created_at
        FROM users
        WHERE role = ? AND active = 1
        ORDER BY name ASC
      `).all(role);
    }, { action: 'getByRole', role });
  }

  /**
   * Get users by unit
   */
  getByUnit(unit) {
    return this.execute(() => {
      return this.db.db.prepare(`
        SELECT id, email, name, role, unit, active, created_at
        FROM users
        WHERE unit = ? AND active = 1
        ORDER BY name ASC
      `).all(unit);
    }, { action: 'getByUnit', unit });
  }

  /**
   * Get user activity (requests made by user)
   */
  getActivity(id, limit = 20) {
    return this.execute(() => {
      const requests = this.db.db.prepare(`
        SELECT * FROM procurement_requests
        WHERE requester_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(id, limit);

      const approvals = this.db.db.prepare(`
        SELECT wa.*, pr.request_number, pr.item_name
        FROM workflow_approvals wa
        JOIN procurement_requests pr ON wa.request_id = pr.id
        WHERE wa.approver_id = ?
        ORDER BY wa.approved_at DESC
        LIMIT ?
      `).all(id, limit);

      return { requests, approvals };
    }, { action: 'getActivity', id });
  }

  /**
   * Get user statistics
   */
  getStats() {
    return this.execute(() => {
      const stats = this.db.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN role = 'ppk' THEN 1 ELSE 0 END) as ppk,
          SUM(CASE WHEN role = 'ppspm' THEN 1 ELSE 0 END) as ppspm,
          SUM(CASE WHEN role = 'unit_head' THEN 1 ELSE 0 END) as unit_heads,
          SUM(CASE WHEN role = 'operator' THEN 1 ELSE 0 END) as operators
        FROM users
      `).get();

      return stats;
    }, { action: 'getStats' });
  }
}

// Export singleton instance
module.exports = new UserApi(null);
module.exports.UserApi = UserApi;
