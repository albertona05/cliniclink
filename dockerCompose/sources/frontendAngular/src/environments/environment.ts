export const environment = {
  production: false,
  apiUrl: (globalThis as any)?.['env']?.['API_URL'] || 'http://192.168.2.2:3000'
};