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
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, company?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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
        loading: true,
        login: async () => {},
        signup: async () => {},
        logout: () => {},
      }
    }
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

