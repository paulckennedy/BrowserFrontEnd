/**
 * Environment-specific test configurations
 */

export const testConfig = {
  development: {
    baseURL: 'http://localhost:8080',
    timeout: 30000,
    retries: 1,
    workers: 2
  },
  
  staging: {
    baseURL: 'https://staging.yourapp.com',
    timeout: 60000,
    retries: 2,
    workers: 1
  },
  
  production: {
    baseURL: 'https://yourapp.com',
    timeout: 60000,
    retries: 3,
    workers: 1
  }
};

export const getConfig = (env = 'development') => {
  return testConfig[env] || testConfig.development;
};