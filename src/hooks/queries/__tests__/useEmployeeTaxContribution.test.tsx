import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeeTaxContribution } from '../useEmployeeTaxContribution';

// Mock the server action
vi.mock('@/server/actions/calculateEmployeeTaxContribution', () => ({
  calculateEmployeeTaxContribution: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEmployeeTaxContribution', () => {
  it('should return tax contribution data on success', async () => {
    const mockData = { taxSavings: 45, totalSpent: 30 };
    const { calculateEmployeeTaxContribution } = await import('@/server/actions/calculateEmployeeTaxContribution');

    vi.mocked(calculateEmployeeTaxContribution).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useEmployeeTaxContribution('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('should handle error states', async () => {
    const { calculateEmployeeTaxContribution } = await import('@/server/actions/calculateEmployeeTaxContribution');

    vi.mocked(calculateEmployeeTaxContribution).mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const { result } = renderHook(() => useEmployeeTaxContribution('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toContain('Database error');
  });
});