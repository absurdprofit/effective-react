import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        // plugins: [['babel-plugin-react-compiler']],
      },
    }),
    viteTsconfigPaths()
  ],
  server: {
    proxy: {
      '/api/dog': {
        target: 'https://http.dog',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dog/, '')
      }
    },
  }
})
