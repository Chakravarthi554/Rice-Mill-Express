/**
 * Pagination Guardrails Middleware
 * 
 * Enforces sane pagination defaults on all GET requests:
 * - Max limit: 50 items per page
 * - Default limit: 20
 * - Default page: 1
 * - Injects parsed values into req.pagination for controllers to use
 */
const paginationGuardrails = (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const MAX_LIMIT = 50;
  const DEFAULT_LIMIT = 20;
  const DEFAULT_PAGE = 1;

  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  // Sanitize page
  if (isNaN(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  // Sanitize and cap limit
  if (isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const skip = (page - 1) * limit;

  // Inject parsed pagination into request object
  req.pagination = {
    page,
    limit,
    skip,
  };

  // Also update query params so downstream code using req.query.limit/page works
  req.query.page = String(page);
  req.query.limit = String(limit);

  next();
};

/**
 * Helper to build pagination meta object for responses
 * @param {number} totalCount - Total number of documents
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {object} meta pagination object
 */
const buildPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { paginationGuardrails, buildPaginationMeta };
