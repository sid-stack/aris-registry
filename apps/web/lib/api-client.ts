import { useAuth } from "@clerk/nextjs";

const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useApiClient = () => {
    const { getToken } = useAuth();

    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();

        const headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            // 'Content-Type': 'application/json', // Let the caller decide for FormData
        };

        const res = await fetch(`${API_Base}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            // Handle 401, 403, 402, etc.
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${res.status}`);
        }

        return res.json();
    };

    return { fetchWithAuth };
};
