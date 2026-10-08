import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/AI-New-Productive-Forces/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
