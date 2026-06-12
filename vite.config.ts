import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { queriesApiMiddleware } from './server/queriesStore.mjs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'queries-api',
      configureServer(server) {
        server.middlewares.use(queriesApiMiddleware());
      },
    },
  ],
});
