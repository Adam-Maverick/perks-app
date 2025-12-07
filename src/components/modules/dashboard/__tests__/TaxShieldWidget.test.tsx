/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock all external dependencies BEFORE any other imports
vi.mock('@/db', () => ({ db: {} }));
vi.mock('@/server/actions/calculateEmployeeTaxContribution', () => ({
    calculateEmployeeTaxContribution: vi.fn(),
}));
vi.mock('@clerk/nextjs', () => ({
    useUser: () => ({ user: { id: 'test-user-123' } }),
}));
vi.mock('framer-motion', () => ({
    motion: {
        div: (props: any) => React.createElement('div', props),
    },
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: () => 0,
    useTransform: () => '₦0.00',
}));

// Mock the hook itself
vi.mock('@/hooks/queries/useEmployeeTaxContribution', () => ({
    useEmployeeTaxContribution: vi.fn(() => ({
        data: { taxSavings: 45000, totalSpent: 100000 },
        isLoading: false,
        error: null,
    })),
}));

// Now import the component
import TaxShieldWidget from '../TaxShieldWidget';
import { useEmployeeTaxContribution } from '@/hooks/queries/useEmployeeTaxContribution';

describe('TaxShieldWidget', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });
        vi.clearAllMocks();

        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    const renderWithQueryClient = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    it('should render loading state', () => {
        vi.mocked(useEmployeeTaxContribution).mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        } as any);

        const { container } = renderWithQueryClient(<TaxShieldWidget userId="test-user-123" />);
        // Component uses skeleton UI with animate-pulse, not text
        expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });

    it('should render tax savings widget', () => {
        vi.mocked(useEmployeeTaxContribution).mockReturnValue({
            data: { taxSavings: 45000, totalSpent: 100000 },
            isLoading: false,
            error: null,
        } as any);

        renderWithQueryClient(<TaxShieldWidget userId="test-user-123" />);
        expect(screen.getByText(/Tax Shield/i)).toBeTruthy();
    });

    it('should render error state', () => {
        vi.mocked(useEmployeeTaxContribution).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Failed to load'),
        } as any);

        renderWithQueryClient(<TaxShieldWidget userId="test-user-123" />);
        expect(screen.getByText(/unable to load/i)).toBeTruthy();
    });
});
