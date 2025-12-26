"use client"

import { Menu, Bell, User, LogOut, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { useGetProductsQuery, useGetCategoriesQuery, useGetUnitTypesQuery, useGetTaxConfigQuery, useGetAllUsersQuery } from "@/lib/utils/services/api"

interface SearchResult {
  type: string;
  displayName: string;
  displayId: string;
  displayInfo: string;
  [key: string]: any;
}

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, adminUser, logout, adminLogout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  // Use the API to search for all entity types
  const isTopBarAdminRoute = pathname.startsWith("/admin");
  const isAdmin = adminUser?.role === "admin";
  
  // Only allow admin to search all entities
  const shouldSearchAllEntities = isAdmin && isTopBarAdminRoute;
  
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ search: searchQuery }, { skip: searchQuery.length < 1 })
  const allProducts = productsData?.data || []
  
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery({ search: searchQuery }, { skip: searchQuery.length < 1 || !shouldSearchAllEntities })
  const allCategories = categoriesData?.data || []
  
  const { data: unitTypesData, isLoading: unitTypesLoading } = useGetUnitTypesQuery({ search: searchQuery }, { skip: searchQuery.length < 1 || !shouldSearchAllEntities })
  const allUnitTypes = unitTypesData?.data || []
  
  const { data: taxData, isLoading: taxLoading } = useGetTaxConfigQuery({ search: searchQuery }, { skip: searchQuery.length < 1 || !shouldSearchAllEntities })
  const taxConfig = taxData?.data ? [taxData.data] : [] // Tax is a single object, convert to array for consistency
  
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery({ search: searchQuery }, { skip: searchQuery.length < 1 || !shouldSearchAllEntities })
  const allUsers = usersData?.users || []
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Determine if we're on an admin route
  const isAdminRoute = pathname.startsWith("/admin")
  const currentUser = isAdminRoute ? adminUser : user

  // Input updates immediately, debounce only applies to search execution
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the actual search
    debounceTimerRef.current = setTimeout(() => {
      if (value.length === 0) {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)
  }, [])
  
  // Combine all entity search results
  const combinedResults: SearchResult[] = [];
  
  // Add products to results
  allProducts.forEach((product: any) => {
    combinedResults.push({
      ...product,
      type: 'product',
      displayName: product.name,
      displayId: product._id,
      displayInfo: `SKU: ${product.sku}`
    });
  });
  
  // Add categories to results (only for admin)
  if (shouldSearchAllEntities) {
    allCategories.forEach((category: any) => {
      combinedResults.push({
        ...category,
        type: 'category',
        displayName: category.name,
        displayId: category._id,
        displayInfo: category.description || 'Category'
      });
    });
    
    // Add unit types to results (only for admin)
    allUnitTypes.forEach((unitType: any) => {
      combinedResults.push({
        ...unitType,
        type: 'unitType',
        displayName: unitType.name,
        displayId: unitType._id,
        displayInfo: unitType.abbreviation ? `( ${unitType.abbreviation} )` : 'Unit Type'
      });
    });
    
    // Add tax config to results (only for admin)
    taxConfig.forEach((tax: any) => {
      combinedResults.push({
        ...tax,
        type: 'tax',
        displayName: 'Tax Configuration',
        displayId: tax._id || 'global',
        displayInfo: tax.gst?.description || 'Tax Settings'
      });
    });
    
    // Add users to results (only for admin)
    allUsers.forEach((user: any) => {
      combinedResults.push({
        ...user,
        type: 'user',
        displayName: user.name,
        displayId: user._id,
        displayInfo: user.email || user.role || 'User'
      });
    });
  }
  
  // Update search results when API data changes
  useEffect(() => {
    if (searchQuery.length > 0 && !productsLoading && 
        (!shouldSearchAllEntities || 
         (!categoriesLoading && !unitTypesLoading && !taxLoading && !usersLoading))) {
      setSearchResults(combinedResults.slice(0, 5))
      setShowSearchResults(true)
    }
  }, [combinedResults, searchQuery, productsLoading, categoriesLoading, unitTypesLoading, taxLoading, usersLoading, shouldSearchAllEntities])

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
    if (isAdminRoute) {
      adminLogout()
      router.push("/admin/login")
    } else {
      logout()
      router.push("/login")
    }
    setShowDropdown(false)
    setShowLogoutModal(false)
  }

  const handleSearchResultClick = (entityType: string, entityId: string) => {
    let path = '';
    
    switch (entityType) {
      case 'product':
        path = `/product/${entityId}`;
        break;
      case 'user':
        path = `/admin/users`;
        break;
      case 'category':
        path = `/admin/categories`;
        break;
      case 'unitType':
        path = `/admin/unit-types`;
        break;
      case 'tax':
        path = `/admin/tax-management`;
        break;
      default:
        path = `/product/${entityId}`;
        break;
    }
    
    router.push(path);
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
                  {searchResults.map((result) => (
                    <button
                      key={result.displayId}
                      onClick={() => handleSearchResultClick(result.type, result.displayId)}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex justify-between items-start"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.displayName}</p>
                        <p className="text-xs text-muted-foreground">{result.displayInfo}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xs text-foreground font-semibold capitalize">{result.type}</p>
                        <p className="text-xs text-muted-foreground">ID: {result.displayId?.substring(0, 8)}...</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && !productsLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                <p className="text-sm text-muted-foreground text-center">No products found</p>
              </div>
            )}
            
            {showSearchResults && productsLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                <p className="text-sm text-muted-foreground text-center">Searching...</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button className="p-2 hover:bg-muted rounded-md transition-colors relative" aria-label="Notifications">
            <Bell size={20} className="text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
          {!isAdminRoute && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                aria-label="User menu"
              >
                <User size={20} className="text-foreground" />
              </button>

              {showDropdown && currentUser && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
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
          )}
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
