import { useQuery } from '@tanstack/react-query';
import { calculateEmployeeTaxContribution } from '@/server/actions/calculateEmployeeTaxContribution';

export function useEmployeeTaxContribution(userId: string) {
  return useQuery({
    queryKey: ['employee', 'tax-contribution', userId],
    queryFn: async () => {
      const result = await calculateEmployeeTaxContribution({ userId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate tax contribution');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}