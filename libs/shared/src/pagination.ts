/**
 * Pagination utilities for API responses
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  offset?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationQuery(query: PaginationQuery): PaginationOptions {
  const page = Math.max(1, parseInt(query.page || '1', 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit || '10', 10) || DEFAULT_LIMIT)
  );
  const offset = query.offset ? parseInt(query.offset, 10) : undefined;

  return offset !== undefined ? { page, limit, offset } : { page, limit };
}

/**
 * Calculate pagination metadata
 */
export function createPaginationMeta(
  total: number,
  options: PaginationOptions
): PaginatedResponse<any>['pagination'] {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(total, options),
  };
}

/**
 * Calculate offset for database queries
 */
export function getOffset(options: PaginationOptions): number {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, offset } = options;

  if (offset !== undefined) {
    return offset;
  }

  return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(options: PaginationOptions): PaginationOptions {
  const page = Math.max(1, options.page || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit || DEFAULT_LIMIT));

  return { ...options, page, limit };
}
