import { getMerchantsWithDealCounts } from './merchants';
import { db } from '@/db';

// Mock DB chain
const mockGroupBy = vi.fn();
const mockLeftJoin = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('@/db', () => ({
    db: {
        select: (...args: any[]) => mockSelect(...args),
    },
}));

describe('getMerchantsWithDealCounts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain return values
        mockSelect.mockReturnValue({ from: mockFrom });
        mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
        mockLeftJoin.mockReturnValue({ groupBy: mockGroupBy });
    });

    it('should fetch merchants with deal counts', async () => {
        const mockData = [
            {
                id: 'm1',
                name: 'Merchant 1',
                logoUrl: 'url1',
                trustLevel: 'VERIFIED',
                dealCount: 5,
            },
        ];
        mockGroupBy.mockResolvedValue(mockData);

        const result = await getMerchantsWithDealCounts();

        expect(mockSelect).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalled();
        expect(mockLeftJoin).toHaveBeenCalled();
        expect(mockGroupBy).toHaveBeenCalled();
        expect(result).toEqual(mockData);
    });
});
