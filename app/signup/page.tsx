"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      await signup(email, password, name)
      router.push("/")
    } catch (err) {
      setError("Signup failed. Please try again.")
      console.error("[v0] Signup error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = name && email && password && confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <header className="text-center mb-4">
          <div className="inline-flex items-center justify-center bg-primary/10 p-3 rounded-full mb-3">
            <UserPlus className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join Stock Flow to manage your inventory</p>
        </header>

        {/* Main Card */}
        <main className="bg-card border border-border rounded-lg shadow-sm">
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="m-5 mb-0 bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-3"
            >
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <fieldset disabled={loading} className="space-y-4">
              <legend className="sr-only">Account Registration Information</legend>

              {/* Name and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <label htmlFor="signup-name" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    autoFocus
                    required
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    className="h-11"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="signup-email" className="block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Password and Confirm Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="signup-password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                      aria-describedby="password-hint"
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
                  <p id="password-hint" className="text-xs text-muted-foreground">
                    Min. 6 characters
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      aria-required="true"
                      aria-invalid={error ? "true" : "false"}
                      className="h-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm p-0.5"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading || !isFormValid}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2" aria-hidden="true">
                      ⏳
                    </span>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </fieldset>
          </form>

          {/* Footer Section */}
          <footer className="px-5 pb-5 pt-3 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
              >
                Sign in
              </Link>
            </p>
          </footer>
        </main>

        {/* Additional Info */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          By creating an account, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
