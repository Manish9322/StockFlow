"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantityToAdd, setQuantityToAdd] = useState("")
  const [notes, setNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch("/api/product", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch products",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery, products])

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

  const selectedProduct = products.find((p: any) => p._id === selectedProductId)
  const updatedQuantity = selectedProduct ? selectedProduct.quantity + (Number.parseInt(quantityToAdd) || 0) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProductId || !quantityToAdd) {
      toast({
        title: "Validation Error",
        description: "Please select a product and enter quantity",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const quantityInt = Number.parseInt(quantityToAdd)
      
      if (quantityInt <= 0) {
        toast({
          title: "Validation Error",
          description: "Quantity must be greater than 0",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/product/${selectedProductId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...selectedProduct,
          quantity: updatedQuantity,
          category: selectedProduct.category._id || selectedProduct.category,
          unitType: selectedProduct.unitType._id || selectedProduct.unitType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully added ${quantityInt} units to ${selectedProduct?.name}`,
        })
        router.push("/")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update stock",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto overflow-x-hidden">
                    <div className="p-2">
                      <Input
                        type="text"
                        placeholder="Search products..."
                        onChange={(e) => handleSearchThrottle(e.target.value)}
                        className="border-border text-sm"
                      />
                    </div>
                    <div className="divide-y divide-border">
                      {filteredProducts.map((p: any) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(p._id)
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
                            <p className="text-xs font-semibold text-foreground">{p.category?.name || 'N/A'}</p>
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
                    <p className="text-xs md:text-sm text-muted-foreground">Category: {selectedProduct.category?.name || 'N/A'}</p>
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
              <Button type="submit" className="flex-1 sm:flex-none" disabled={submitting}>
                {submitting ? "Updating..." : "Confirm Refill"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
                className="flex-1 sm:flex-none bg-transparent"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
        )}
      </div>
    </MainLayout>
  )
}
