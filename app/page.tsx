"use client"

import { useState, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, ChevronLeft, ChevronRight, Filter, ArrowUpDown, X } from "lucide-react"
import Link from "next/link"
import { useGetProductsQuery } from "@/lib/utils/services/api"

type StockStatus = "all" | "low" | "instock" | "outofstock"
type SortField = "name" | "quantity" | "costPrice" | "sellingPrice" | "updatedAt"
type SortOrder = "asc" | "desc"

interface Product {
  _id: string
  name: string
  sku: string
  quantity: number
  category: {
    _id: string
    name: string
  }
  unitType: {
    _id: string
    name: string
    abbreviation: string
  }
  costPrice: number
  sellingPrice: number
  supplier: string
  minStockAlert: number
  updatedAt: string
  createdAt: string
}

function DashboardContent() {
  const { data: productsData, isLoading, error } = useGetProductsQuery({})
  const products: Product[] = productsData?.data || []
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [stockStatus, setStockStatus] = useState<StockStatus>("all")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))
  }, [products])

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category?.name === selectedCategory
      
      const matchesStockStatus = (() => {
        switch (stockStatus) {
          case "low": return product.quantity < product.minStockAlert
          case "instock": return product.quantity >= product.minStockAlert
          case "outofstock": return product.quantity === 0
          default: return true
        }
      })()
      
      const matchesPriceRange = (() => {
        const min = minPrice ? parseFloat(minPrice) : 0
        const max = maxPrice ? parseFloat(maxPrice) : Infinity
        return product.costPrice >= min && product.costPrice <= max
      })()
      
      return matchesSearch && matchesCategory && matchesStockStatus && matchesPriceRange
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "quantity":
          aValue = a.quantity
          bValue = b.quantity
          break
        case "costPrice":
          aValue = a.costPrice
          bValue = b.costPrice
          break
        case "sellingPrice":
          aValue = a.sellingPrice
          bValue = b.sellingPrice
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1)
  }

  const handleStockStatusChange = (value: StockStatus) => {
    setStockStatus(value)
    setCurrentPage(1)
  }

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setStockStatus("all")
    setMinPrice("")
    setMaxPrice("")
    setSortField("name")
    setSortOrder("asc")
    setCurrentPage(1)
  }

  const getStockStatusBadge = (product: Product) => {
    const { quantity, minStockAlert } = product
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (quantity < minStockAlert) return <Badge variant="secondary">Low Stock</Badge>
    return <Badge variant="default">In Stock</Badge>
  }

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== "all" ? selectedCategory : null,
    stockStatus !== "all" ? stockStatus : null,
    minPrice,
    maxPrice
  ].filter(Boolean).length

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and monitor your complete inventory with real-time stock tracking
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Products", value: products.length },
              { 
                label: "Low Stock Items", 
                value: products.filter((p) => p.quantity < p.minStockAlert && p.quantity > 0).length 
              },
              {
                label: "Total Value",
                value: `₹${products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0).toLocaleString()}`,
              },
              { label: "Categories", value: categories.length },
            ].map((stat, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 md:p-6">
                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">{stat.label}</p>
                <p className="text-2xl md:text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-stretch lg:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0"
                  size={18}
                />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 relative"
              >
                <Filter size={16} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Link href="/add-product" className="shrink-0">
                <Button className="flex items-center justify-center gap-2">
                  <Plus size={16} className="shrink-0" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </div>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Advanced Filters</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X size={14} className="mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Stock Status</label>
                    <Select value={stockStatus} onValueChange={handleStockStatusChange}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All Stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock</SelectItem>
                        <SelectItem value="instock">In Stock (≥10)</SelectItem>
                        <SelectItem value="low">Low Stock (&lt;10)</SelectItem>
                        <SelectItem value="outofstock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Min Price (₹)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Max Price (₹)</label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full px-4 md:px-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-sm text-destructive mb-2">Failed to load products</p>
                  <p className="text-xs text-muted-foreground">Please try refreshing the page</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-4">
                    {products.length === 0 ? "No products yet" : "No products match your filters"}
                  </p>
                  {products.length === 0 && (
                    <Link href="/add-product">
                      <Button>
                        <Plus size={16} className="mr-2" />
                        Add Your First Product
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-2 -ml-2"
                          onClick={() => handleSortChange("name")}
                        >
                          Product Name
                          <ArrowUpDown size={14} className="ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">SKU</TableHead>
                      <TableHead className="text-xs md:text-sm text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-2"
                          onClick={() => handleSortChange("quantity")}
                        >
                          Qty
                          <ArrowUpDown size={14} className="ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs md:text-sm hidden sm:table-cell">Category</TableHead>
                      <TableHead className="text-xs md:text-sm hidden lg:table-cell">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-2 -ml-2"
                          onClick={() => handleSortChange("updatedAt")}
                        >
                          Updated
                          <ArrowUpDown size={14} className="ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-xs md:text-sm">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium text-xs md:text-sm max-w-[100px] md:max-w-none truncate">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">{product.sku}</TableCell>
                        <TableCell className="text-xs md:text-sm text-right">{product.quantity}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden sm:table-cell">
                          {product.category?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStockStatusBadge(product)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/product/${product._id}`}>
                            <span className="text-xs md:text-sm text-primary hover:underline cursor-pointer">View</span>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-transparent"
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm transition-colors ${
                        currentPage === page
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground hover:bg-border"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-transparent"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
