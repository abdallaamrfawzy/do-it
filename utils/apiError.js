const { StatusCodes } = require('http-status-codes');
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.statusText = `${this.status}`.startsWith('4') ? 'Fail' : 'Error';
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

class BadRequestError extends ApiError {
  constructor(message) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

class UnAuthorizedError extends ApiError {
  constructor(message) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

class InternalServerError extends ApiError {
  constructor(message) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

module.exports = {
  ApiError,
  NotFoundError,
  BadRequestError,
  UnAuthorizedError,
  InternalServerError
};
