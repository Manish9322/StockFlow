"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Plus, RefreshCw, BarChart3, Settings, ShoppingCart, History, Shield, Users, Package, FolderTree, Ruler, Activity, LogOut } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"

interface SidebarProps {
  isOpen: boolean
  onNavigate?: () => void
}

export default function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { user, adminUser, adminLogout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Determine if we're on an admin route
  const isAdminRoute = pathname.startsWith("/admin")
  const isAdmin = adminUser?.role === "admin"

  const handleAdminLogout = () => {
    adminLogout()
    router.push("/admin/login")
  }

  const confirmAdminLogout = () => {
    handleAdminLogout()
    setShowLogoutModal(false)
  }

  // Admin navigation items
  const adminNavItems = [
    { href: "/admin/dashboard", label: "Admin Dashboard", icon: Shield },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/products", label: "All Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/unit-types", label: "Unit Types", icon: Ruler },
    { href: "/admin/tax-management", label: "Tax Management", icon: BarChart3 },
    { href: "/admin/activities", label: "System Activities", icon: Activity },
    { href: "/admin/settings", label: "Admin Settings", icon: Settings },
  ]

  // Regular user navigation items
  const userNavItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/add-product", label: t("nav.add_product"), icon: Plus },
    { href: "/stock-refill", label: t("nav.stock_refill"), icon: RefreshCw },
    { href: "/purchase", label: t("nav.purchase"), icon: ShoppingCart },
    { href: "/purchases", label: t("nav.purchases"), icon: ShoppingCart },
    { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { href: "/movement-history", label: t("nav.movement_history"), icon: History },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ]

  // Show admin nav only when on admin routes AND user is admin
  // Show user nav for all other routes (including when admin is on user routes)
  const navItems = isAdminRoute && isAdmin ? adminNavItems : userNavItems
  const sidebarTitle = isAdminRoute && isAdmin ? "Admin Panel" : "Inventory"

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
      } bg-background border-r border-border transition-all duration-300 ease-in-out overflow-hidden flex flex-col h-screen`}
    >
      <div className="h-16 border-b border-border flex items-center px-6 shrink-0">
        <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">
          {sidebarTitle}
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {isAdminRoute && isAdmin && (
        <div className="p-1.5 border-t border-border">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      )}
      <div className="p-4 border-t border-border text-xs text-muted-foreground shrink-nowrap">
        <p>© 2025 {sidebarTitle}</p>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to logout from your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAdminLogout}
                className="flex-1 px-4 py-2 rounded-md bg-foreground text-background hover:bg-muted-foreground transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
