/**
 * Shared test helpers for asserting validation error structure consistency.
 *
 * All API routes should return validation errors in this unified format:
 * { success: false, error: 'Validation failed', details: [{field, message}] }
 */

import assert from 'node:assert';

/**
 * Assert that a response contains a valid validation error structure.
 *
 * @param {object} response - Express response object from dispatchRequest
 * @param {object} expectations - Optional specific assertions
 * @param {number} [expectations.status=400] - Expected HTTP status code
 * @param {string[]} [expectations.fields] - Expected field names in details array
 * @param {boolean} [expectations.hasDetails=true] - Whether details array is required
 */
export function assertValidationError(response, expectations = {}) {
  const { status = 400, fields, hasDetails = true } = expectations;

  // Assert HTTP status
  assert.strictEqual(response.status, status, `Expected status ${status}, got ${response.status}`);

  // Assert response has body
  assert(response.body, 'Response body is missing');

  // Assert success is false
  assert.strictEqual(
    response.body.success,
    false,
    'Expected success to be false for validation errors'
  );

  // Assert error message exists
  assert(response.body.error, 'Expected error message in response');

  // Assert details array if expected
  if (hasDetails) {
    assert(
      Array.isArray(response.body.details) || response.body.message,
      'Expected details array or message string for validation errors'
    );

    // If details array exists, validate structure
    if (Array.isArray(response.body.details)) {
      response.body.details.forEach(detail => {
        assert(
          detail.field || detail.message,
          'Each detail should have field and/or message property'
        );
      });

      // If specific fields are expected, verify them
      if (fields && fields.length > 0) {
        const actualFields = response.body.details.map(d => d.field);
        fields.forEach(expectedField => {
          assert(
            actualFields.includes(expectedField),
            `Expected field '${expectedField}' in validation errors, got: ${actualFields.join(', ')}`
          );
        });
      }
    }
  }
}

/**
 * Assert that a response indicates successful validation and processing.
 *
 * @param {object} response - Express response object from dispatchRequest
 * @param {object} expectations - Optional specific assertions
 * @param {number} [expectations.status] - Expected HTTP status code (200 or 201)
 * @param {boolean} [expectations.hasData=true] - Whether data object is required
 */
export function assertValidationSuccess(response, expectations = {}) {
  const { status, hasData = true } = expectations;

  // Assert HTTP status is success (200 or 201)
  if (status) {
    assert.strictEqual(
      response.status,
      status,
      `Expected status ${status}, got ${response.status}`
    );
  } else {
    assert(
      response.status === 200 || response.status === 201,
      `Expected 200 or 201, got ${response.status}`
    );
  }

  // Assert response has body
  assert(response.body, 'Response body is missing');

  // Assert success is true (if present)
  if (response.body.success !== undefined) {
    assert.strictEqual(response.body.success, true, 'Expected success to be true');
  }

  // Assert data exists if expected
  if (hasData) {
    assert(response.body.data !== undefined, 'Expected data property in successful response');
  }
}

/**
 * Create a test case factory for validation testing.
 * Reduces boilerplate in test files.
 *
 * @param {object} app - Express app instance
 * @param {Function} dispatchRequest - Request dispatch helper
 * @returns {object} Test case factory functions
 */
export function createValidationTestFactory(app, dispatchRequest) {
  return {
    /**
     * Test that a route rejects missing required field.
     */
    async testMissingField(route, method, fieldName, validPayload) {
      const invalidPayload = { ...validPayload };
      delete invalidPayload[fieldName];

      const response = await dispatchRequest(app, {
        method,
        url: route,
        body: invalidPayload,
      });

      assertValidationError(response, {
        fields: [fieldName],
      });
    },

    /**
     * Test that a route accepts valid payload.
     */
    async testValidPayload(route, method, validPayload, expectedStatus = 200) {
      const response = await dispatchRequest(app, {
        method,
        url: route,
        body: validPayload,
      });

      assertValidationSuccess(response, {
        status: expectedStatus,
      });
    },
  };
}
