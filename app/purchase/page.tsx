"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sampleProducts, type Product } from "@/lib/sample-data"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { logEvent } from "@/lib/event-logger"
import { Download, Plus, Trash2 } from "lucide-react"

interface CartItem {
  id: string
  product: Product
  quantity: number
}

function PurchaseContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const product = selectedProduct ? sampleProducts.find((p) => p.id === selectedProduct) : null
  const currentItemTotal =
    quantity && product ? (Number.parseInt(quantity) * product.costPrice).toFixed(2) : "0.00"

  const cartTotal = cartItems
    .reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0)
    .toFixed(2)

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity) {
      alert("Please fill all required fields")
      return
    }

    const newItem: CartItem = {
      id: `${selectedProduct}-${Date.now()}`,
      product: product!,
      quantity: Number.parseInt(quantity),
    }

    setCartItems([...cartItems, newItem])
    // Reset form
    setSelectedProduct("")
    setQuantity("")
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId))
  }

  const handleGenerateInvoice = () => {
    if (cartItems.length === 0) {
      alert("Please add at least one product to the cart")
      return
    }

    console.log("[v0] Invoice generated:", {
      items: cartItems,
      totalAmount: cartTotal,
      notes,
    })

    // Log the purchase event
    if (user) {
      const itemsDescription = cartItems.map((item) => `${item.product.name} x${item.quantity}`).join(", ")
      logEvent(
        "purchase.created",
        `Created purchase for: ${itemsDescription} - Total: ₹${cartTotal}`,
        user.id,
        user.name,
        { items: cartItems, totalAmount: cartTotal },
      )
    }

    alert("Invoice generated successfully!")
    // Reset form
    setCartItems([])
    setNotes("")
  }

  const handleDownloadInvoice = () => {
    if (cartItems.length === 0) {
      alert("Please add at least one product to the cart")
      return
    }

    let invoiceContent = `
PURCHASE INVOICE
================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

ITEMS:
------`

    cartItems.forEach((item, index) => {
      invoiceContent += `
${index + 1}. ${item.product.name}
   SKU: ${item.product.sku}
   Quantity: ${item.quantity}
   Unit Price: ₹${item.product.costPrice.toFixed(2)}
   Subtotal: ₹${(item.quantity * item.product.costPrice).toFixed(2)}`
    })

    invoiceContent += `

==============================
TOTAL AMOUNT: ₹${cartTotal}
==============================
Notes: ${notes || "N/A"}
    `.trim()

    const blob = new Blob([invoiceContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `purchase-${Date.now()}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("purchase.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Add multiple products to your cart and generate downloadable invoice for your records
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Product Section */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Add Products</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("purchase.select_product")} *
                  </label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("purchase.quantity")} *</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subtotal</label>
                  <Input type="text" value={`₹${currentItemTotal}`} disabled className="bg-muted" />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Add to Cart
                  </Button>
                </div>
              </div>

              <Button onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2 md:hidden">
                <Plus size={18} />
                Add to Cart
              </Button>
            </div>

            {/* Shopping Cart */}
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 mt-6">
              <h2 className="text-lg font-semibold text-foreground">Shopping Cart</h2>

              {cartItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty. Add products to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.product.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(item.quantity * item.product.costPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6 sticky top-20 lg:top-24 h-fit">
              <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

              <div className="space-y-3 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items in cart:</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total units:</span>
                  <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-base font-medium text-foreground">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add delivery or payment notes..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={cartItems.length === 0}
                  className="w-full"
                >
                  Generate Invoice
                </Button>
                <Button
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={cartItems.length === 0}
                >
                  <Download size={16} />
                  Download Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function Purchase() {
  return (
    <ProtectedRoute>
      <PurchaseContent />
    </ProtectedRoute>
  )
}
