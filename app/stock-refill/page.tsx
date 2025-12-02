"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sampleProducts } from "@/lib/sample-data"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

function throttle(func: (...args: any[]) => void, delay: number) {
  let lastCall = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

export default function StockRefill() {
  const router = useRouter()
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantityToAdd, setQuantityToAdd] = useState("")
  const [notes, setNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return sampleProducts
    return sampleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery])

  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearchQuery(value)
    }, 300),
    [],
  )

  const handleSearchThrottle = useCallback(
    throttle((value: string) => {
      handleSearchChange(value)
    }, 300),
    [handleSearchChange],
  )

  const selectedProduct = sampleProducts.find((p) => p.id === selectedProductId)
  const updatedQuantity = selectedProduct ? selectedProduct.quantity + (Number.parseInt(quantityToAdd) || 0) : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      productId: selectedProductId,
      quantityAdded: quantityToAdd,
      notes,
    })
    setSelectedProductId("")
    setQuantityToAdd("")
    setNotes("")
    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Stock Refill</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Add inventory stock to your products when restocking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="bg-card border border-border rounded-lg p-4 md:p-8 space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Product</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-3 py-2 text-left border border-border rounded-md bg-background text-foreground hover:bg-muted transition-colors flex justify-between items-center"
                >
                  <span className="text-sm">
                    {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : "Choose a product"}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      onChange={(e) => handleSearchThrottle(e.target.value)}
                      className="m-2 border-border text-sm"
                    />
                    <div className="divide-y divide-border">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p.id)
                            setShowDropdown(false)
                            setSearchQuery("")
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-semibold text-foreground">{p.category}</p>
                            <p className="text-xs text-muted-foreground">Stock: {p.quantity}</p>
                          </div>
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="px-4 py-3 text-center text-sm text-muted-foreground">No products found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-muted rounded-lg border border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-3 uppercase font-semibold">Product Details</p>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground text-sm md:text-base">{selectedProduct.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Category: {selectedProduct.category}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3 uppercase font-semibold">Stock Information</p>
                  <div className="space-y-2">
                    <p className="text-xs md:text-sm">
                      Current Stock: <span className="font-semibold text-foreground">{selectedProduct.quantity}</span>
                    </p>
                    <p className="text-xs md:text-sm">
                      Updated Stock: <span className="font-semibold text-foreground">{updatedQuantity}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Quantity to Add</label>
              <Input
                type="number"
                min="1"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this refill..."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
              <Button type="submit" className="flex-1 sm:flex-none">
                Confirm Refill
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
                className="flex-1 sm:flex-none bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
