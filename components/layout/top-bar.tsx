"use client"

import { Menu, Bell, User, LogOut, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { sampleProducts } from "@/lib/sample-data"

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Input updates immediately, debounce only applies to search execution
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the actual search
    debounceTimerRef.current = setTimeout(() => {
      if (value.length > 0) {
        const results = sampleProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(value.toLowerCase()) ||
            product.sku.toLowerCase().includes(value.toLowerCase()) ||
            product.category.toLowerCase().includes(value.toLowerCase()),
        )
        setSearchResults(results.slice(0, 5))
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)
  }, [])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    router.push("/login")
    setShowDropdown(false)
    setShowLogoutModal(false)
  }

  const handleSearchResultClick = (productId: string) => {
    router.push(`/product/${productId}`)
    setSearchQuery("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <>
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-muted rounded-md transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="text-foreground" />
          </button>
          <h2 className="text-sm md:text-base font-semibold text-foreground truncate">Inventory Management</h2>
        </div>

        <div className="flex-1 max-w-md mx-2 md:mx-4">
          <div className="relative w-full" ref={searchRef}>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex-shrink-0"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSearchResultClick(product.id)}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex justify-between items-start"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="text-xs text-foreground font-semibold">{product.category}</p>
                        <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                <p className="text-sm text-muted-foreground text-center">No products found</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button className="p-2 hover:bg-muted rounded-md transition-colors relative" aria-label="Notifications">
            <Bell size={20} className="text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="User menu"
            >
              <User size={20} className="text-foreground" />
            </button>

            {showDropdown && user && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 rounded-md bg-foreground text-background hover:bg-muted-foreground transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
