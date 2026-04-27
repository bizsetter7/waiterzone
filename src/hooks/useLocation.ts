'use client';

import { useState, useEffect, useCallback } from 'react';

interface LocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}

/**
 * useLocation Hook
 * 브라우저 Geolocation API를 사용하여 이용자의 현재 위치를 감지합니다.
 */
export const useLocation = () => {
    const [state, setState] = useState<LocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, error: 'Geolocation not supported', loading: false }));
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setState({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                error: null,
                loading: false
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            setState(prev => ({ ...prev, error: error.message, loading: false }));
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    }, []);

    /**
     * 하버사인(Haversine) 공식을 이용한 두 지점 간 거리 계산 (km 단위)
     */
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    return { ...state, calculateDistance };
};
