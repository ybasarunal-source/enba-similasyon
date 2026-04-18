import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
      'react': path.resolve(process.cwd(), 'node_modules/react'),
      'react-dom': path.resolve(process.cwd(), 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 5700,
    strictPort: true,
    host: true,
    hmr: {
      clientPort: 5700,
      protocol: 'ws'
    },
    open: true
  }
})
