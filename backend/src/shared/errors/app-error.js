export class AppError extends Error {
  constructor(
    statusCode = 500,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    if (typeof statusCode === 'string' && typeof message === 'number') {
      const temp = statusCode;
      statusCode = message;
      message = temp;
    }
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Alias for seamless backward compatibility with existing codebase
export const ApiError = AppError;
export default AppError;
