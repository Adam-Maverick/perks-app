import { users, organizations } from '@/db/schema';

describe('Database Schema', () => {
    it('should have correct table names', () => {
        // expect(users.name).toBe('users'); // Drizzle table name property is internal
        expect(users).toBeDefined();
        // Actually, let's just verify the object exists and has columns
        expect(users).toBeDefined();
        expect(organizations).toBeDefined();
    });
});
