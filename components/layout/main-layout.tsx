"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import TopBar from "./top-bar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed md:static inset-y-0 left-0 z-50 md:z-0">
        <Sidebar isOpen={sidebarOpen} onNavigate={handleSidebarClose} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
