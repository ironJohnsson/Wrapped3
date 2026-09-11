import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'wrapped-api-middleware',
      async configureServer(server) {
        const { default: apiApp } = await import('./server/app.js');
        server.middlewares.use(apiApp);
      },
    },
  ],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
})
