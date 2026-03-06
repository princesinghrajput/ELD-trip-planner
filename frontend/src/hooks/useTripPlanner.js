import { useState } from 'react';
import client from '@/api/client';

export function useTripPlanner() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const planTrip = async ({ current, pickup, dropoff, cycleUsed, currentCoords, pickupCoords, dropoffCoords }) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const payload = {
                current_location: current,
                pickup_location: pickup,
                dropoff_location: dropoff,
                cycle_used_hours: parseFloat(cycleUsed),
            };
            // Include coordinates if available (avoids server-side Nominatim geocoding)
            if (currentCoords) {
                payload.current_lat = parseFloat(currentCoords.lat);
                payload.current_lng = parseFloat(currentCoords.lng);
            }
            if (pickupCoords) {
                payload.pickup_lat = parseFloat(pickupCoords.lat);
                payload.pickup_lng = parseFloat(pickupCoords.lng);
            }
            if (dropoffCoords) {
                payload.dropoff_lat = parseFloat(dropoffCoords.lat);
                payload.dropoff_lng = parseFloat(dropoffCoords.lng);
            }
            const response = await client.post('/plan-trip/', payload);

            setData(response.data);
            return response.data;
        } catch (err) {
            const message = err.response?.data?.error ||
                (err.code === 'ERR_NETWORK'
                    ? 'Network error. Please ensure the backend is running.'
                    : 'Failed to plan trip. Please try again.');

            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return { planTrip, data, isLoading, error, reset: () => setData(null) };
}
