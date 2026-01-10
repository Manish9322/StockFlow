"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError("Login failed. Please check your credentials.")
      console.error("[v0] Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <header className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-primary/10 p-4 rounded-full mb-4">
            <LogIn className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Stock Flow account</p>
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
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <fieldset disabled={loading} className="space-y-5">
              <legend className="sr-only">Login Credentials</legend>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="user-email" className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  id="user-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                <label htmlFor="user-password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="user-password"
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
                  "Sign In"
                )}
              </Button>
            </fieldset>
          </form>

          {/* Footer Section */}
          <footer className="px-6 pb-6 space-y-4">
            {/* Sign Up Link */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Admin Link & Demo Info */}
            <div className="pt-3 border-t border-border space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Admin user?{" "}
                <Link
                  href="/admin/login"
                  className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                >
                  Admin Login
                </Link>
              </p>
            </div>
          </footer>
        </main>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
