import { AppError } from './app-error.js';

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(400, `Resource not found with id: ${err.value}`);
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(409, `Duplicate value entered for ${field}. Please use another value.`);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error = new AppError(400, `Validation Error: ${messages.join(', ')}`, messages);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError(401, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError(401, 'Authentication token expired');
  }

  // Standardize non-AppError exceptions
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    const message = error.message || 'Internal Server Error';
    error = new AppError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
