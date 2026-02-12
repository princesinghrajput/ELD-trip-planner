import { useState } from 'react';
import client from '@/api/client';

export function useTripPlanner() {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const planTrip = async ({ current, pickup, dropoff, cycleUsed }) => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await client.post('/plan-trip/', {
                current_location: current,
                pickup_location: pickup,
                dropoff_location: dropoff,
                cycle_used_hours: parseFloat(cycleUsed),
            });

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
