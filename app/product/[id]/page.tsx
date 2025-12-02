"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { sampleProducts, sampleStockHistory } from "@/lib/sample-data"
import Link from "next/link"
import { ChevronLeft, ChevronDown } from "lucide-react"

export default function ProductDetail({ params }: { params: { id: string } }) {
  const product = sampleProducts.find((p) => p.id === params.id)
  const [showHistory, setShowHistory] = useState(false)

  if (!product) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <p className="text-sm md:text-base text-muted-foreground">Product not found</p>
        </div>
      </MainLayout>
    )
  }

  const productHistory = sampleStockHistory.filter((h) => h.productId === product.id)
  const marginPercentage = (((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm md:text-base">
          <ChevronLeft size={18} />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{product.name}</h1>
          <p className="text-xs md:text-base text-muted-foreground">SKU: {product.sku}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Current Stock</p>
            <p className="text-3xl md:text-4xl font-bold text-foreground">{product.quantity}</p>
            <p className="text-xs text-muted-foreground mt-2">Units</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Stock Value</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              ₹{(product.quantity * product.costPrice).toLocaleString()}
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
                <span className="font-medium text-foreground text-right">{product.category}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium text-foreground text-right">{product.supplier}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Cost Price</span>
                <span className="font-medium text-foreground text-right">₹{product.costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-medium text-foreground text-right">₹{product.sellingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-2 pt-3 border-t border-border">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground text-right">
                  {new Date(product.lastUpdated).toLocaleDateString()}
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
              <Link href={`/edit-product/${product.id}`} className="block">
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

        {productHistory.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex justify-between w-full items-center mb-4 hover:text-foreground"
            >
              <h2 className="font-semibold text-foreground text-sm md:text-base">Stock History</h2>
              <ChevronDown
                size={20}
                className={`transition-transform flex-shrink-0 ${showHistory ? "rotate-180" : ""}`}
              />
            </button>

            {showHistory && (
              <div className="space-y-2">
                {productHistory.map((history) => (
                  <div
                    key={history.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-muted rounded border border-border text-xs md:text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground capitalize">
                        {history.action} {history.quantity} units
                      </p>
                      {history.notes && <p className="text-xs text-muted-foreground">{history.notes}</p>}
                    </div>
                    <span className="text-muted-foreground flex-shrink-0">
                      {new Date(history.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
