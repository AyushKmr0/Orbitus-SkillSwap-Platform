// asyncHandler — wraps async route handlers to auto-catch errors
// backend/src/utils/asyncHandler.js

/**
 * Wraps an async Express route handler and forwards any thrown errors
 * to Express's next() error middleware — no need to write try/catch in every controller.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     // your async logic here — errors are automatically caught
 *   }));
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
