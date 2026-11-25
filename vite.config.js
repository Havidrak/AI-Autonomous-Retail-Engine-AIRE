import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (env.BROWSER) {
    process.env.BROWSER = env.BROWSER
  }

  if (env.BROWSER_ARGS) {
    process.env.BROWSER_ARGS = env.BROWSER_ARGS
  }

  return {
    plugins: [react()],
    server: {
      open: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      open: true,
    },
  }
})
