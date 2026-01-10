"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { adminLogin } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await adminLogin(email, password)
      router.push("/admin/dashboard")
    } catch (err) {
      setError("Admin login failed. Please check your credentials.")
      console.error("[v0] Admin login error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Admin credentials: stockflowadmin@gmail.com / StockFlowAdmin@2025

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Sign in to Stock Flow Admin Panel</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Admin Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Admin Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In as Admin"}
            </Button>
          </form>

          <div className="pt-4 border-t border-border space-y-2">
            {/* <p className="text-xs text-muted-foreground text-center">
              Admin credentials: stockflowadmin@gmail.com / StockFlowAdmin@2025
            </p> */}
            <p className="text-sm text-center text-muted-foreground">
              Not an admin?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                User Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
