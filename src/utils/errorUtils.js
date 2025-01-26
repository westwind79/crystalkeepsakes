// utils/errorUtils.js
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  NETWORK: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
  }

  static isNetworkError(error) {
    return error.type === ErrorTypes.NETWORK;
  }

  static isValidationError(error) {
    return error.type === ErrorTypes.VALIDATION;
  }
}