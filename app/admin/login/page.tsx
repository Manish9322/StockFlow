"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react"

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
        {/* Header Section */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-full mb-4">
            <Shield className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Access the Stock Flow Admin Panel</p>
        </header>

        {/* Main Card */}
        <main className="bg-card border border-border rounded-lg shadow-sm">
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="m-6 mb-0 bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <fieldset disabled={loading} className="space-y-5">
              <legend className="sr-only">Admin Login Credentials</legend>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="admin-email" className="block text-sm font-medium text-foreground">
                  Admin Email
                </label>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stockflow.com"
                  autoComplete="email"
                  autoFocus
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  className="h-11"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="admin-password" className="block text-sm font-medium text-foreground">
                  Admin Password
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading || !email || !password}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2" aria-hidden="true">
                      ⏳
                    </span>
                    Signing in...
                  </>
                ) : (
                  "Sign In as Admin"
                )}
              </Button>
            </fieldset>
          </form>

          {/* Footer Section */}
          <footer className="px-6 pb-6 pt-4 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              Not an admin?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
              >
                User Login
              </Link>
            </p>
          </footer>
        </main>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          For security purposes, admin access is restricted and monitored.
        </p>
      </div>
    </div>
  )
}
