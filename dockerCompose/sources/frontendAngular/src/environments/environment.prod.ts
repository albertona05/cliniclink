export const environment = {
  production: true,
  apiUrl: (globalThis as any)?.['env']?.['API_URL'] || 'http://192.168.1.1:3000'
};