"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Plus, RefreshCw, BarChart3, Settings, ShoppingCart, History } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface SidebarProps {
  isOpen: boolean
  onNavigate?: () => void
}

export default function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/add-product", label: t("nav.add_product"), icon: Plus },
    { href: "/stock-refill", label: t("nav.stock_refill"), icon: RefreshCw },
    { href: "/purchase", label: t("nav.purchase"), icon: ShoppingCart },
    { href: "/purchases", label: t("nav.purchases"), icon: ShoppingCart },
    { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { href: "/movement-history", label: t("nav.movement_history"), icon: History },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ]

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-0"
      } bg-background border-r border-border transition-all duration-300 ease-in-out overflow-hidden flex flex-col h-screen`}
    >
      <div className="h-16 border-b border-border flex items-center px-6 flex-shrink-0">
        <h1 className="text-lg font-semibold text-foreground whitespace-nowrap">Inventory</h1>
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
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
        <p>© 2025 Inventory</p>
      </div>
    </aside>
  )
}
