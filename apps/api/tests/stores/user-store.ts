/**
 * Repository-style test shim for UserStore
 * Provides a mock adapter implementing the repository pattern expected by unit tests.
 *
 * NOTE: This is a temporary compatibility layer. Long-term goal is to standardize
 * on named exports from source TS files and update all tests to use the canonical API.
 */

class UserStore {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    if (typeof this.db.create === 'function') {
      return await this.db.create(data);
    }
    throw new Error('create() not implemented on mock database');
  }

  async getById(id) {
    if (typeof this.db.getById === 'function') {
      return await this.db.getById(id);
    }
    throw new Error('getById() not implemented on mock database');
  }

  async getByEmail(email) {
    if (typeof this.db.getByEmail === 'function') {
      return await this.db.getByEmail(email);
    }
    throw new Error('getByEmail() not implemented on mock database');
  }

  async getByUsername(username) {
    if (typeof this.db.getByUsername === 'function') {
      return await this.db.getByUsername(username);
    }
    throw new Error('getByUsername() not implemented on mock database');
  }

  async getAll(filter = {}) {
    if (typeof this.db.getAll === 'function') {
      return await this.db.getAll(filter);
    }
    throw new Error('getAll() not implemented on mock database');
  }

  async update(id, data) {
    if (typeof this.db.update === 'function') {
      return await this.db.update(id, data);
    }
    throw new Error('update() not implemented on mock database');
  }

  async delete(id) {
    if (typeof this.db.delete === 'function') {
      return await this.db.delete(id);
    }
    throw new Error('delete() not implemented on mock database');
  }

  async getByRole(role) {
    if (typeof this.db.getByRole === 'function') {
      return await this.db.getByRole(role);
    }
    throw new Error('getByRole() not implemented on mock database');
  }

  validateUserData(data) {
    if (!data.email || !data.username) {
      throw new Error('Missing required fields');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }
    if (data.username && data.username.length < 3) {
      throw new Error('Invalid username');
    }
  }
}

export default UserStore;
