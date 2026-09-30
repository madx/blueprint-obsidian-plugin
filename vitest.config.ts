import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      obsidian: './src/tests/mocks/obsidian',
    },
  },
  test: {
    coverage: {
      exclude: ['src/tests/testUtils.ts', 'src/tests/mocks/', 'src/SectionExtension.ts'],
    },
  },
})
