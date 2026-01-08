"use client"

import { use, useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, ChevronDown, ChevronRight, X, Image as ImageIcon } from "lucide-react"
import { useGetProductByIdQuery } from "@/lib/utils/services/api"

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: productData, isLoading, error } = useGetProductByIdQuery(id)
  const product = productData?.data
  const [showHistory, setShowHistory] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

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

        {/* Product Images Section - only show if images exist */}
        {product.images && product.images.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Product Images</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.images.map((image: string, index: number) => (
                <div key={index} className="aspect-square">
                  <Card className="overflow-hidden h-full">
                    <CardContent className="p-0 flex items-center justify-center h-full bg-muted">
                      <img 
                        src={image} 
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setSelectedImageIndex(index)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {product.images && product.images.length > 0 && selectedImageIndex !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden">
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background text-foreground hover:text-foreground transition-colors"
                aria-label="Close image preview"
              >
                <X size={20} />
              </button>
              
              {/* Navigation buttons */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev !== null ? (prev > 0 ? prev - 1 : product.images.length - 1) : 0
                    )}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 hover:bg-background text-foreground hover:text-foreground transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev !== null ? (prev < product.images.length - 1 ? prev + 1 : 0) : 0
                    )}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 hover:bg-background text-foreground hover:text-foreground transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
              
              {/* Current image with navigation */}
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedImageIndex + 1} of {product.images.length}
                  </span>
                  <span className="text-sm font-medium truncate max-w-xs">
                    {product.name} - Image {selectedImageIndex + 1}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4 bg-muted">
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                    className="max-h-[70vh] max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
