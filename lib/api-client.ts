/**
 * API utility functions for making authenticated requests
 * Automatically includes Authorization header with JWT token
 */

/**
 * Get the stored authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

/**
 * Make an authenticated API request
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If unauthorized, redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
  }

  return response
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: async (url: string) => {
    return fetchWithAuth(url, { method: "GET" })
  },

  post: async (url: string, data?: any) => {
    return fetchWithAuth(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put: async (url: string, data?: any) => {
    return fetchWithAuth(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete: async (url: string) => {
    return fetchWithAuth(url, { method: "DELETE" })
  },
}
