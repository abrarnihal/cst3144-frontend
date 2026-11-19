import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const pagesBase = process.env.GITHUB_ACTIONS === 'true'
  ? '/cst3144-frontend/'
  : '/'

export default defineConfig({
  plugins: [vue()],
  base: pagesBase,
})