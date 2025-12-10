"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { adminUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!adminUser || adminUser.role !== "admin")) {
      router.push("/admin/login")
    }
  }, [adminUser, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!adminUser || adminUser.role !== "admin") {
    return null
  }

  return <>{children}</>
}
