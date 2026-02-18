import { useAuth } from "@clerk/nextjs";

const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useApiClient = () => {
    const { getToken, orgId } = useAuth();

    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();

        const headers: HeadersInit = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        };

        // Automatically inject Organization ID if the user is in an org context
        if (orgId) {
            (headers as any)['x-clerk-org-id'] = orgId;
        }

        const res = await fetch(`${API_Base}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            // Handle 401, 403, 402, etc.
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${res.status}`);
        }

        // Handle 204 No Content
        if (res.status === 204) {
            return {};
        }

        return res.json();
    };

    return { fetchWithAuth };
};
