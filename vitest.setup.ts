import '@testing-library/jest-dom';

// Mock browser APIs only when running in jsdom environment
// Server-side tests use Node environment where window doesn't exist
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { }, // Deprecated
            removeListener: () => { }, // Deprecated
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
        }),
    });
}
