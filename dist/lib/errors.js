'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.errorHandler = exports.asyncHandler = exports.AppError = void 0;
class AppError extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
exports.AppError = AppError;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
const errorHandler = (err, _req, res, _next) =>
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || 'Internal server error' });
exports.errorHandler = errorHandler;
