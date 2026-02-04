import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative base path to ensure assets load correctly on GitHub Pages (e.g. /repo-name/)
  base: '/relationshipledger/', 
  server: {
    host: true, // This enables access from local network (iPhone)
    port: 5173
  },
  build: {
    outDir: 'dist',
  }
});