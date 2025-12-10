"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  company?: string
  role?: string
  status?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  adminUser: User | null
  adminToken: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, company?: string) => Promise<void>
  logout: () => void
  adminLogout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load regular user session
      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("token")
      
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)
        } catch (error) {
          console.error("Failed to parse stored user:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      }

      // Load admin session
      const storedAdminUser = localStorage.getItem("adminUser")
      const storedAdminToken = localStorage.getItem("adminToken")
      
      if (storedAdminUser && storedAdminToken) {
        try {
          setAdminUser(JSON.parse(storedAdminUser))
          setAdminToken(storedAdminToken)
        } catch (error) {
          console.error("Failed to parse stored admin user:", error)
          localStorage.removeItem("adminUser")
          localStorage.removeItem("adminToken")
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      const userData: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.name,
        company: data.data.user.company,
        role: data.data.user.role,
        status: data.data.user.status,
      }

      const authToken = data.data.token

      setUser(userData)
      setToken(authToken)

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", authToken)
      }

      console.log("User logged in:", userData)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Admin login failed")
      }

      const userData: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.name,
        company: data.data.user.company,
        role: data.data.user.role,
        status: data.data.user.status,
      }

      const authToken = data.data.token

      setAdminUser(userData)
      setAdminToken(authToken)

      if (typeof window !== "undefined") {
        localStorage.setItem("adminUser", JSON.stringify(userData))
        localStorage.setItem("adminToken", authToken)
      }

      console.log("Admin logged in:", userData)
    } catch (error) {
      console.error("Admin login error:", error)
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string, company?: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, company }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      const userData: User = {
        id: data.data.user._id,
        email: data.data.user.email,
        name: data.data.user.name,
        company: data.data.user.company,
        role: data.data.user.role,
        status: data.data.user.status,
      }

      const authToken = data.data.token

      setUser(userData)
      setToken(authToken)

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("token", authToken)
      }

      console.log("User signed up:", userData)
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = () => {
    // Call logout API (optional, for logging purposes)
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }).catch(err => console.error("Logout API error:", err))
    }

    setUser(null)
    setToken(null)
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
      localStorage.removeItem("token")
    }
    
    console.log("User logged out")
  }

  const adminLogout = () => {
    // Call logout API (optional, for logging purposes)
    if (adminToken) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      }).catch(err => console.error("Admin logout API error:", err))
    }

    setAdminUser(null)
    setAdminToken(null)
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminUser")
      localStorage.removeItem("adminToken")
    }
    
    console.log("Admin logged out")
  }

  return (
    <AuthContext.Provider value={{ user, token, adminUser, adminToken, loading, login, adminLogin, signup, logout, adminLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    // Provide a fallback during SSR or when context is not available
    if (typeof window === "undefined") {
      return {
        user: null,
        token: null,
        adminUser: null,
        adminToken: null,
        loading: true,
        login: async () => {},
        adminLogin: async () => {},
        signup: async () => {},
        logout: () => {},
        adminLogout: () => {},
      }
    }
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

