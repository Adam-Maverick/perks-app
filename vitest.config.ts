import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        environmentMatchGlobs: [
            // Server-side tests use node environment
            ['src/server/**', 'node'],
            ['src/inngest/**', 'node'],
            ['src/app/api/**', 'node'],
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            thresholds: {
                lines: 75,
                functions: 30,
                branches: 70,
                statements: 75,
            },
            exclude: [
                'node_modules/',
                'dist/',
                '.next/',
                'coverage/',
                '**/*.config.ts',
                '**/*.config.js',
                '**/*.d.ts',
                '**/types.ts',
                '**/*.type.ts',
                '**/index.ts', // Barrel exports
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
