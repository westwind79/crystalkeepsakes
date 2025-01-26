// utils/apiUtils.js
const handleApiError = (error) => {
  if (!error.response) {
    throw new AppError(
      'Network error occurred',
      ErrorTypes.NETWORK
    );
  }

  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      throw new AppError(
        'Invalid request',
        ErrorTypes.VALIDATION,
        data
      );
    case 401:
      // Handle unauthorized
      break;
    case 403:
      // Handle forbidden
      break;
    case 404:
      // Handle not found
      break;
    default:
      throw new AppError(
        'An unexpected error occurred',
        ErrorTypes.UNKNOWN,
        { status, data }
      );
  }
};