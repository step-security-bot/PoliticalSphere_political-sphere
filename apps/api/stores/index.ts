// Minimal store index to satisfy module resolution in tests.
// Tests mock this module via vi.mock; at runtime this stub prevents ESM resolution errors.

/**
 * API surface for interacting with bill records in tests.
 *
 * This lightweight type describes the minimal set of operations the codebase
 * expects from a bill persistence layer. Test doubles or in-memory stores used
 * during unit tests should implement this shape.
 */
export type BillsApi = {
  create: (...args: unknown[]) => Promise<unknown>;
  getById: (id: string) => Promise<unknown | null>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<boolean>;
  getAll: () => Promise<unknown[]>;
  getByStatus: (status: string) => Promise<unknown[]>;
};

/**
 * API surface for user persistence used in tests.
 *
 * Provides the minimal repository operations required by tests and stubs in
 * the codebase. Implementations may be simple in-memory maps or mocks.
 */
export type UsersApi = {
  create: (data: unknown) => Promise<unknown>;
  getById: (id: string) => Promise<unknown | null>;
  getByUsername?: (u: string) => Promise<unknown | null>;
  getByEmail?: (e: string) => Promise<unknown | null>;
  update: (id: string, data: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<boolean>;
  getAll: () => Promise<unknown[]>;
};

/**
 * Generic moderation API surface for test doubles. The concrete methods vary
 * between test suites; use a `Record<string, Function>` shape to allow flexible
 * mocking.
 */
export type ModerationApi = Record<string, (...args: unknown[]) => Promise<unknown>>;

/**
 * Generic compliance API shape used by tests. Implemented by mocks that provide
 * the small set of endpoints required for compliance checks during testing.
 */
export type ComplianceApi = Record<string, (...args: unknown[]) => Promise<unknown>>;

/**
 * Generic age verification API shape for tests. Mock implementations should
 * provide the necessary methods used by the application under test.
 */
export type AgeVerificationApi = Record<string, (...args: unknown[]) => Promise<unknown>>;

/**
 * Test-only helper that exposes the minimal database API used by the server.
 *
 * This function is a runtime stub and MUST be mocked in tests; it throws when
 * invoked by accident. It exists only to provide a stable import surface for
 * modules that depend on a `getDatabase` helper during unit testing.
 */
export function getDatabase(): {
  bills: BillsApi;
  users: UsersApi;
  moderation: ModerationApi;
  compliance: ComplianceApi;
  ageVerification: AgeVerificationApi;
} {
  throw new Error('getDatabase() is a stub for tests and should be mocked');
}
