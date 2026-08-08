import { defineConfig } from 'orval';

/**
 * Generates the typed client from the running backend's OpenAPI spec.
 * Run with `bun gen:api` while hermes-backend is up on :8080.
 */
export default defineConfig({
  hermes: {
    input: 'http://localhost:8080/v3/api-docs',
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      client: 'axios-functions',
      override: {
        mutator: { path: './src/api/axios-instance.ts', name: 'customInstance' },
      },
    },
  },
});
