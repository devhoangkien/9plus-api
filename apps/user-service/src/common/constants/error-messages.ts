export const ERROR_MESSAGES = {
    AUTH: {
      UNAUTHORIZED: {
        CODE: 'UNAUTHORIZED',
        MESSAGE: 'Unauthorized access. Please log in.',
      },
      FORBIDDEN: {
        CODE: 'FORBIDDEN',
        MESSAGE: 'You do not have permission to perform this action.',
      },
      INVALID_CREDENTIALS: {
        CODE: 'INVALID_CREDENTIALS',
        MESSAGE: 'Invalid credentials. Please check your email and password.',
      },
    },
    USER: {
      NOT_FOUND: {
        CODE: 'USER_NOT_FOUND',
        MESSAGE: 'User not found.',
      },
      EMAIL_EXISTS: {
        CODE: 'EMAIL_EXISTS',
        MESSAGE: 'Email already exists. Please use a different email.',
      },
    },
    VALIDATION: {
      INVALID_INPUT: {
        CODE: 'INVALID_INPUT',
        MESSAGE: 'Invalid input data. Please check your request.',
      },
    },
    GENERAL: {
      INTERNAL_SERVER_ERROR: {
        CODE: 'INTERNAL_SERVER_ERROR',
        MESSAGE: 'Internal server error. Please try again later.',
      },
    },
    ROLE: {
      NOT_FOUND: {
        CODE: 'ROLE_NOT_FOUND',
        MESSAGE: 'Role not found.',
      },
      INVALID_ROLE: {
        CODE: 'INVALID_ROLE',
        MESSAGE: 'Invalid role provided.',
      },
    },
  };
  