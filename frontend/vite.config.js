import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/data': 'http://localhost:5000',
      '/webhook': 'http://localhost:5000',
      '/fields-config': 'http://localhost:5000'
    }
  }
});
