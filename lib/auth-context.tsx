"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  company?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulated login - replace with actual API call
    const userData: User = {
      id: "user_" + Date.now(),
      email,
      name: email.split("@")[0],
    }
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    console.log("[v0] User logged in:", userData)
  }

  const signup = async (email: string, password: string, name: string) => {
    // Simulated signup - replace with actual API call
    const userData: User = {
      id: "user_" + Date.now(),
      email,
      name,
    }
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    console.log("[v0] User signed up:", userData)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    console.log("[v0] User logged out")
  }

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
