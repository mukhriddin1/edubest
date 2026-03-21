import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages раздаёт сайт по пути /edubest/
  // Замени 'edubest' на название своего репозитория
  base: '/edubest/',
})
