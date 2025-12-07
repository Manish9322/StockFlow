"use client"

import { use, useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronDown } from "lucide-react"
import { useGetProductByIdQuery } from "@/lib/utils/services/api"

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: productData, isLoading, error } = useGetProductByIdQuery(id)
  const product = productData?.data
  const [showHistory, setShowHistory] = useState(false)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm md:text-base mb-4">
            <ChevronLeft size={18} />
            Back to Dashboard
          </Link>
          <p className="text-sm md:text-base text-destructive">
            {error ? "Failed to load product details" : "Product not found"}
          </p>
        </div>
      </MainLayout>
    )
  }

  const marginPercentage = product.costPrice > 0 
    ? (((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
    : "0.0"

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm md:text-base">
          <ChevronLeft size={18} />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{product.name || "Unnamed Product"}</h1>
          <p className="text-xs md:text-base text-muted-foreground">SKU: {product.sku || "N/A"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Current Stock</p>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{product.quantity ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-2">{product.unitType?.abbreviation || product.unitType?.name || "Units"}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Stock Value</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              ₹{((product.quantity ?? 0) * (product.costPrice ?? 0)).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">At cost price</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Profit Margin</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{marginPercentage}%</p>
            <p className="text-xs text-muted-foreground mt-2">Per unit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Product Details</h2>
            <div className="space-y-3 text-xs md:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-foreground text-right">{product.category?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Unit Type</span>
                <span className="font-medium text-foreground text-right">
                  {product.unitType?.name || "N/A"}
                  {product.unitType?.abbreviation && ` (${product.unitType.abbreviation})`}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium text-foreground text-right">{product.supplier || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Min Stock Alert</span>
                <span className="font-medium text-foreground text-right">{product.minStockAlert ?? "N/A"}</span>
              </div>
              <div className="flex justify-between gap-2 pt-3 border-t border-border">
                <span className="text-muted-foreground">Cost Price</span>
                <span className="font-medium text-foreground text-right">₹{product.costPrice?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-medium text-foreground text-right">₹{product.sellingPrice?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Profit Per Unit</span>
                <span className="font-medium text-foreground text-right">
                  ₹{((product.sellingPrice ?? 0) - (product.costPrice ?? 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-3 border-t border-border">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground text-right">
                  {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground text-right">
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/stock-refill" className="block">
                <Button className="w-full">Add Stock</Button>
              </Link>
              <Link href={`/edit-product/${product._id}`} className="block">
                <Button variant="outline" className="w-full bg-transparent">
                  Edit Product
                </Button>
              </Link>
              <button className="w-full px-4 py-2 rounded-md font-medium text-sm transition-colors border border-border text-foreground hover:bg-muted">
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
