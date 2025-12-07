
import { getClientIp } from "../rate-limit";

describe("Rate Limiting Utilities", () => {
    describe("getClientIp", () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("should extract IP from x-forwarded-for header", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1",
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe("192.168.1.1");
        });

        it("should extract IP from x-real-ip header", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-real-ip": "192.168.1.2",
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe("192.168.1.2");
        });

        it("should prefer x-forwarded-for over x-real-ip", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "192.168.1.1",
                    "x-real-ip": "192.168.1.2",
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe("192.168.1.1");
        });

        it("should return 'unknown' when no IP headers present", () => {
            const request = new Request("http://localhost");

            const ip = getClientIp(request);
            expect(ip).toBe("unknown");
        });

        it("should handle multiple IPs in x-forwarded-for", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe("192.168.1.1");
        });

        it("should trim whitespace from IP addresses", () => {
            const request = new Request("http://localhost", {
                headers: {
                    "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
                },
            });

            const ip = getClientIp(request);
            expect(ip).toBe("192.168.1.1");
        });
    });
});
