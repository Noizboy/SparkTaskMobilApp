export interface DemoUser {
  email: string;
  password: string;
  id: string;
  name: string;
  role: string;
  company: string;
  phone: string;
}

export const AUTH_CONFIG = {
  DEMO_CREDENTIALS: {
    email: 'sofia@demo.com',
    password: 'demo',
  },
  /** Offline-first demo accounts — checked before hitting the real API. */
  DEMO_USERS: [
    { email: 'sofia@demo.com',          password: 'demo', id: 'demo-sofia',   name: 'Sofia Gomez',       role: 'cleaner', company: 'SparkTask', phone: '+1 (555) 200-1003' },
    { email: 'maria@demo.com',          password: 'demo', id: 'demo-maria',   name: 'Maria Garcia',      role: 'cleaner', company: 'SparkTask', phone: '+1 (555) 200-1001' },
    { email: 'carlos@demo.com',         password: 'demo', id: 'demo-carlos',  name: 'Carlos Lopez',      role: 'cleaner', company: 'SparkTask', phone: '+1 (555) 200-1002' },
    { email: 'diego@demo.com',          password: 'demo', id: 'demo-diego',   name: 'Diego Hernandez',   role: 'cleaner', company: 'SparkTask', phone: '+1 (555) 200-1004' },
    { email: 'alejandro@sparktask.com', password: 'demo', id: 'demo-admin',   name: 'Admin SparkTask',   role: 'admin',   company: 'SparkTask', phone: '+1 (555) 100-0001' },
  ] as DemoUser[],
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
