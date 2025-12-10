"use client"

import { useState, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Package, 
  Search,
  RefreshCw,
  AlertCircle,
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
  userId: string
}

function AdminProductsContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockStatus, setStockStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage products across all users
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.inStock}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-foreground"></div>
            </div>
          </Card>
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.lowStock}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>
          <Card className="p-4 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.outOfStock}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Search Products</Label>
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
              <Label>Category</Label>
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
              <Label>Stock Status</Label>
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
        </Card>

        {/* Products Table */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                Products ({filteredProducts.length})
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
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
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
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
