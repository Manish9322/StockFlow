/**
 * API utility functions for making authenticated requests
 * Automatically includes Authorization header with JWT token
 */

/**
 * Get the stored authentication token based on the current route
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  
  // Check if we're on an admin route
  const isAdminRoute = window.location.pathname.startsWith("/admin")
  
  // Return the appropriate token
  if (isAdminRoute) {
    return localStorage.getItem("adminToken")
  }
  
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

  // Add user role header for authorization
  if (typeof window !== "undefined") {
    const isAdminRoute = window.location.pathname.startsWith("/admin")
    if (isAdminRoute) {
      const adminUser = localStorage.getItem("adminUser")
      if (adminUser) {
        try {
          const user = JSON.parse(adminUser)
          headers["X-User-Role"] = user.role || "user"
        } catch (e) {
          headers["X-User-Role"] = "user"
        }
      }
    } else {
      const user = localStorage.getItem("user")
      if (user) {
        try {
          const userData = JSON.parse(user)
          headers["X-User-Role"] = userData.role || "user"
        } catch (e) {
          headers["X-User-Role"] = "user"
        }
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // If unauthorized, redirect to appropriate login page
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      const isAdminRoute = window.location.pathname.startsWith("/admin")
      
      if (isAdminRoute) {
        localStorage.removeItem("adminUser")
        localStorage.removeItem("adminToken")
        window.location.href = "/admin/login"
      } else {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
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
