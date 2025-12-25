"use client"

import { useState, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetProductsQuery } from "@/lib/utils/services/api"
import { 
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

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
  lowStockThreshold: number
  userId: {
    _id: string
    name: string
    email: string
    company?: string
  }
}

function AdminProductsContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockStatus, setStockStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: productsData, isLoading, refetch } = useGetProductsQuery({})
  const products: Product[] = productsData?.data || []

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))
  }, [products])

  // Filter and paginate products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || product.category?.name === categoryFilter
      
      const matchesStockStatus = (() => {
        const threshold = product.lowStockThreshold || product.minStockAlert || 10
        switch (stockStatus) {
          case "low": return product.quantity < threshold
          case "instock": return product.quantity >= threshold
          case "outofstock": return product.quantity === 0
          default: return true
        }
      })()
      
      return matchesSearch && matchesCategory && matchesStockStatus
    })
  }, [products, searchTerm, categoryFilter, stockStatus])

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, rowsPerPage])

  const getStockBadge = (product: Product) => {
    const threshold = product.lowStockThreshold || product.minStockAlert || 10
    if (product.quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (product.quantity < threshold) {
      return <Badge variant="secondary">Low Stock</Badge>
    }
    return <Badge variant="outline">In Stock</Badge>
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const threshold = 10
    return {
      total: products.length,
      lowStock: products.filter(p => p.quantity < (p.lowStockThreshold || p.minStockAlert || threshold)).length,
      outOfStock: products.filter(p => p.quantity === 0).length,
      inStock: products.filter(p => p.quantity >= (p.lowStockThreshold || p.minStockAlert || threshold)).length,
    }
  }, [products])

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">All Products</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage products across all users
          </p>
        </div>

        {/* Statistics Cards */}
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
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Total Products</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">In Stock</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{stats.inStock}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Low Stock</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{stats.lowStock}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Out of Stock</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{stats.outOfStock}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filter Products</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Stock Status</label>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="instock">In Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="outofstock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Products List ({filteredProducts.length})</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>User/Owner</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-md">{product.sku}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{product.userId?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{product.userId?.email || "-"}</p>
                          {product.userId?.company && (
                            <p className="text-xs text-muted-foreground">{product.userId.company}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{product.quantity}</TableCell>
                      <TableCell>{product.unitType?.abbreviation || "-"}</TableCell>
                      <TableCell>${product.costPrice.toFixed(2)}</TableCell>
                      <TableCell>${product.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      <TableCell>{getStockBadge(product)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <Select value={String(rowsPerPage)} onValueChange={(value) => {
                  setRowsPerPage(Number(value))
                  setCurrentPage(1) // Reset to first page when changing rows per page
                }}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {paginatedProducts.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filteredProducts.length)} of ${filteredProducts.length}` : `0 of ${filteredProducts.length}`}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        // Show all pages if total pages is 5 or less
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // Show first 5 pages if current page is near the beginning
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages if current page is near the end
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Show 2 before and 2 after current page
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isLoading}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default function AdminProducts() {
  return (
    <AdminRoute>
      <AdminProductsContent />
    </AdminRoute>
  )
}
