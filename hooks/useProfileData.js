// File: hooks/useProfileData.js 

import { useState, useEffect, useCallback } from 'react';
import client from '../api/client'; 
import { useAuth } from '../context/AuthContext';

const useProfileData = () => {
    const { user, token } = useAuth();
    
    // Data States
    const [orderCount, setOrderCount] = useState(0);
    const [addressCount, setAddressCount] = useState(0);
    const [cardCount, setCardCount] = useState(0); 

    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    // --- API FETCHING FUNCTIONS ---

    // Helper: Get Authorization headers
    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    // 1. Fetch Order Count (GET /orders/count)
    const fetchOrderCount = async () => {
        if (!token) return 0;
        try {
            const response = await client.get('/orders/count', getAuthHeaders());
            const count = response.data?.count || 0;
            console.log(`[ProfileHook] Orders: ${count}`);
            return count;
        } catch (error) { 
            const msg = error.response?.data?.message || error.message;
            console.warn(`[ProfileHook] Fetch Orders Failed: ${msg}`);
            return 0; // Return 0 on error to prevent crash
        }
    };

    // 2. Fetch Address Count (GET /addresses/count)
    const fetchAddressCount = async () => {
        if (!token) return 0;
        try {
            const response = await client.get('/addresses/count', getAuthHeaders());
            const count = response.data?.count || 0;
            console.log(`[ProfileHook] Addresses: ${count}`);
            return count;
        } catch (error) { 
            const msg = error.response?.data?.message || error.message;
            console.warn(`[ProfileHook] Fetch Addresses Failed: ${msg}`);
            return 0; 
        }
    };
    
    // 3. Fetch Card/Payment Methods Count (Mockup)
    const fetchCardCount = async () => {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return 2; // Hardcoded value for demo
    };

    // --- MAIN EFFECT ---

    useEffect(() => {
        let isMounted = true; // Cleanup flag to prevent state updates on unmount

        if (!user || !token) {
            console.log("[ProfileHook] No user/token found. Skipping fetch.");
            setIsLoading(false);
            return;
        }
        
        const loadAllCounts = async () => {
            console.log("[ProfileHook] Starting data fetch...");
            setIsLoading(true);
            
            // Execute all promises in parallel
            const [orders, addresses, cards] = await Promise.all([
                fetchOrderCount(),
                fetchAddressCount(),
                fetchCardCount(),
            ]);

            if (isMounted) {
                setOrderCount(orders);
                setAddressCount(addresses);
                setCardCount(cards);
                setIsLoading(false);
                console.log("[ProfileHook] All data loaded successfully.");
            }
        };

        loadAllCounts();

        // Cleanup function
        return () => { isMounted = false; };
    }, [user, token]);

    return {
        orderCount,
        addressCount,
        cardCount,
        isLoading,
    };
};

export default useProfileData;
