// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfflineBanner } from '../OfflineBanner';
import * as useOnlineStatusModule from '@/hooks/useOnlineStatus';

// Mock the useOnlineStatus hook
vi.mock('@/hooks/useOnlineStatus');

describe('OfflineBanner', () => {
    it('should render when offline', () => {
        vi.spyOn(useOnlineStatusModule, 'useOnlineStatus').mockReturnValue({ isOnline: false });

        render(<OfflineBanner />);

        expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
        expect(screen.getByText(/showing cached deals/i)).toBeInTheDocument();
    });

    it('should not render when online', () => {
        vi.spyOn(useOnlineStatusModule, 'useOnlineStatus').mockReturnValue({ isOnline: true });

        const { container } = render(<OfflineBanner />);

        expect(container.firstChild).toBeNull();
    });

    it('should have correct styling classes when offline', () => {
        vi.spyOn(useOnlineStatusModule, 'useOnlineStatus').mockReturnValue({ isOnline: false });

        const { container } = render(<OfflineBanner />);

        const banner = container.querySelector('.fixed.top-0');
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass('bg-vibrant-coral');
        expect(banner).toHaveClass('z-50');
    });

    it('should display wifi-off icon when offline', () => {
        vi.spyOn(useOnlineStatusModule, 'useOnlineStatus').mockReturnValue({ isOnline: false });

        const { container } = render(<OfflineBanner />);

        const icon = container.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('text-electric-royal-blue');
    });
});
