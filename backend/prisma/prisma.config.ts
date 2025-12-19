import { defineConfig } from 'prisma'

export default defineConfig({
  seed: 'ts-node prisma/seed.ts'
})
