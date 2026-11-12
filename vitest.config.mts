import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            // steps.ts requires a real browser and is covered by e2e tests
            exclude: ['src/steps.ts'],
            thresholds: {
                branches: 90,
                functions: 90,
                lines: 90
            }
        }
    }
});
