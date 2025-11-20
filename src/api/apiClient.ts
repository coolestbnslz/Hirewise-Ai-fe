const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Handle FormData which shouldn't have Content-Type header set manually
    if (options.body instanceof FormData) {
        delete (headers as any)['Content-Type'];
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || response.statusText);
    }

    return response.json();
}
