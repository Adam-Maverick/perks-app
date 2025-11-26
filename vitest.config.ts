import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
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
