import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
    let onlineGetter: vi.SpyInstance;

    beforeEach(() => {
        // Mock navigator.onLine
        onlineGetter = vi.spyOn(navigator, 'onLine', 'get');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return initial online status from navigator.onLine', () => {
        onlineGetter.mockReturnValue(true);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(true);
    });

    it('should return initial offline status from navigator.onLine', () => {
        onlineGetter.mockReturnValue(false);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(false);
    });

    it('should update status when online event fires', () => {
        onlineGetter.mockReturnValue(false);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(false);

        // Simulate going online
        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
    });

    it('should update status when offline event fires', () => {
        onlineGetter.mockReturnValue(true);

        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(true);

        // Simulate going offline
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOnline).toBe(false);
    });

    it('should clean up event listeners on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useOnlineStatus());

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
});
