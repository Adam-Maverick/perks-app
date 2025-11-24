import { useState, useEffect } from 'react';

interface LocationState {
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    error: string | null;
    loading: boolean;
}

const LOCATION_STORAGE_KEY = 'perks_user_location';

export function useLocation() {
    const [location, setLocation] = useState<LocationState>({
        city: null,
        state: null,
        latitude: null,
        longitude: null,
        error: null,
        loading: false,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setLocation(prev => ({ ...prev, ...parsed, loading: false }));
            } catch (e) {
                console.error('Failed to parse stored location', e);
            }
        }
    }, []);

    const requestLocation = async () => {
        setLocation(prev => ({ ...prev, loading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // In a real app, we would reverse geocode here to get city/state
                // For now, we'll just store coordinates and mock city/state or use an IP fallback API
                // Let's try to get approximate location from a free API if possible, or just use coords

                try {
                    // Fallback/Reverse Geocoding via free API (e.g., bigdatacloud or similar if needed)
                    // For this story, we'll primarily rely on coordinates for distance, 
                    // but the AC mentions "Lagos, Ikeja" so we might want city names.
                    // For MVP, we will just store the coordinates.

                    const newLocation = {
                        latitude,
                        longitude,
                        city: null, // Would need reverse geocoding service
                        state: null,
                        error: null,
                        loading: false
                    };

                    setLocation(newLocation);
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));

                } catch (error) {
                    console.error('Error processing location', error);
                    setLocation(prev => ({ ...prev, loading: false, error: 'Failed to process location' }));
                }
            },
            async (error) => {
                console.warn('Geolocation permission denied or error', error);

                // Fallback to IP-based location
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    if (!response.ok) throw new Error('IP location failed');

                    const data = await response.json();
                    const newLocation = {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        city: data.city,
                        state: data.region,
                        error: null,
                        loading: false
                    };

                    setLocation(newLocation);
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
                } catch (fallbackError) {
                    console.error('IP fallback failed', fallbackError);
                    setLocation(prev => ({
                        ...prev,
                        loading: false,
                        error: 'Location access denied and fallback failed'
                    }));
                }
            },
            { timeout: 10000, maximumAge: 86400000 } // Accept cached position for 24h
        );
    };

    return { ...location, requestLocation };
}
