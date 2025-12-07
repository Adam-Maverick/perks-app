import { validateEmailDomain } from './email-domain';

describe('validateEmailDomain', () => {
    it('should validate a correct work email', async () => {
        const result = await validateEmailDomain('employee@company.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should reject invalid email format', async () => {
        const result = await validateEmailDomain('invalid-email');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid email format');
    });

    it('should reject public domains', async () => {
        const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

        for (const domain of publicDomains) {
            const result = await validateEmailDomain(`user@${domain}`);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Public email domains are not supported');
        }
    });

    it('should be case insensitive for domains', async () => {
        const result = await validateEmailDomain('user@GMAIL.COM');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Public email domains are not supported');
    });
});
