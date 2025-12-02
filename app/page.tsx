"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sampleProducts, type Product } from "@/lib/sample-data"
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

function DashboardContent() {
  const [products] = useState<Product[]>(sampleProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
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

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage and monitor your complete inventory with real-time stock tracking
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Products", value: products.length },
            { label: "Low Stock Items", value: products.filter((p) => p.quantity < 10).length },
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

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex-shrink-0"
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
            <div className="w-full md:w-48 flex-shrink-0">
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
            <Link href="/add-product" className="w-full md:w-auto flex-shrink-0">
              <Button className="w-full md:w-auto flex items-center justify-center gap-2">
                <Plus size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Product Name</TableHead>
                    <TableHead className="text-xs md:text-sm">SKU</TableHead>
                    <TableHead className="text-xs md:text-sm text-right">Qty</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Updated</TableHead>
                    <TableHead className="text-xs md:text-sm">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-xs md:text-sm max-w-[100px] md:max-w-none truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">{product.sku}</TableCell>
                      <TableCell className="text-xs md:text-sm text-right">{product.quantity}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{product.category}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden lg:table-cell">
                        {new Date(product.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/product/${product.id}`}>
                          <span className="text-xs md:text-sm text-primary hover:underline cursor-pointer">View</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of{" "}
              {filteredProducts.length} products
            </p>
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
