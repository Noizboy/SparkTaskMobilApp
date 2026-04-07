export const AUTH_CONFIG = {
  DEMO_CREDENTIALS: {
    email: 'demo@demo.com',
    password: 'demo',
  },
  API_ENDPOINTS: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VALIDATE_TOKEN: '/api/auth/validate',
    REFRESH_TOKEN: '/api/auth/refresh',
  },
  STORAGE_KEYS: {
    AUTH_TOKEN: 'sparkTaskAuth',
    USER_ID: 'userId',
    USER_EMAIL: 'userEmail',
    REMEMBER_ME: 'rememberMe',
    ONBOARDING_COMPLETED: 'onboardingCompleted',
  },
};
