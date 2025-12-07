"use client"

import { useState, useEffect, useRef } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { logEvent } from "@/lib/event-logger"
import { Download, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface Product {
  _id: string
  name: string
  sku: string
  costPrice: number
  quantity: number
  supplier: string
}

interface CartItem {
  id: string
  product: Product
  quantity: number
}

function PurchaseContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [supplier, setSupplier] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/product")
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
      } else {
        toast.error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const product = selectedProduct ? products.find((p) => p._id === selectedProduct) : null
  const currentItemTotal =
    quantity && product ? (Number.parseInt(quantity) * product.costPrice).toFixed(2) : "0.00"

  const cartTotal = cartItems
    .reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0)
    .toFixed(2)

  // Get unique suppliers from cart items
  const cartSuppliers = Array.from(
    new Set(cartItems.map((item) => item.product.supplier).filter(Boolean))
  )

  const handleAddToCart = () => {
    if (!selectedProduct || !quantity) {
      toast.error("Please fill all required fields")
      return
    }

    // Check if the product already exists in the cart (by product ID)
    const existingItemIndex = cartItems.findIndex(
      (item) => item.product._id === selectedProduct
    )

    if (existingItemIndex !== -1) {
      // Product already exists, update the quantity
      const updatedCartItems = [...cartItems]
      updatedCartItems[existingItemIndex].quantity += Number.parseInt(quantity)
      setCartItems(updatedCartItems)
      toast.success(`Updated ${product!.name} quantity in cart`)
    } else {
      // New product, add to cart
      const newItem: CartItem = {
        id: `${selectedProduct}-${Date.now()}`,
        product: product!,
        quantity: Number.parseInt(quantity),
      }
      setCartItems([...cartItems, newItem])
      toast.success(`Added ${product!.name} to cart`)
    }

    // Reset form
    setSelectedProduct("")
    setQuantity("")
  }

  const handleRemoveFromCart = (itemId: string) => {
    const removedItem = cartItems.find((item) => item.id === itemId)
    setCartItems(cartItems.filter((item) => item.id !== itemId))
    if (removedItem) {
      toast.success(`Removed ${removedItem.product.name} from cart`)
    }
  }

  const handleMakePurchase = async () => {
    if (cartItems.length === 0) {
      toast.error("Please add at least one product to the cart")
      return
    }

    try {
      const purchaseData = {
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        totalAmount: parseFloat(cartTotal),
        status: "Completed",
        supplier: supplier || "N/A",
        paymentMethod: paymentMethod,
        notes: notes,
      }

      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Purchase created successfully!")
        
        // Log the purchase event
        if (user) {
          const itemsDescription = cartItems.map((item) => `${item.product.name} x${item.quantity}`).join(", ")
          logEvent(
            "purchase.created",
            `Created purchase for: ${itemsDescription} - Total: ₹${cartTotal}`,
            user.id,
            user.name,
            { purchaseId: data.data.purchaseId, totalAmount: cartTotal },
          )
        }

        // Reset form
        setCartItems([])
        setNotes("")
        setSupplier("")
        setPaymentMethod("Cash")
        
        // Refresh products to get updated quantities
        fetchProducts()
      } else {
        toast.error(data.error || "Failed to create purchase")
      }
    } catch (error) {
      console.error("Error creating purchase:", error)
      toast.error("Failed to create purchase")
    }
  }

  const handleGenerateInvoice = async () => {
    if (cartItems.length === 0) {
      toast.error("Please add at least one product to the cart")
      return
    }

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: cartItems,
      supplier: supplier || "N/A",
      paymentMethod: paymentMethod,
      notes: notes,
      subtotal: cartTotal,
      tax: (parseFloat(cartTotal) * 0).toFixed(2), // 0% tax for now
      total: cartTotal,
    }

    setGeneratedInvoice(invoice)
    setShowInvoiceModal(true)
  }

  const handleDownloadInvoice = async () => {
    if (!generatedInvoice || !invoiceRef.current) {
      toast.error("Please generate an invoice first")
      return
    }

    try {
      setIsDownloading(true)
      toast.loading("Generating PDF...")

      // Wait a bit for the modal to fully render
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Get the invoice element
      const invoiceElement = invoiceRef.current

      // Convert HTML to canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add image to PDF
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Save PDF
      pdf.save(`purchase-invoice-${generatedInvoice.invoiceNumber}.pdf`)

      toast.dismiss()
      toast.success("Invoice downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss()
      toast.error("Failed to generate PDF")
    } finally {
      setIsDownloading(false)
    }
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
                  <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={loading}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loading ? "Loading products..." : "Select a product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
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
                {cartSuppliers.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">Suppliers:</span>
                    <div className="flex flex-wrap gap-1">
                      {cartSuppliers.map((supplier, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        >
                          {supplier}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-base font-medium text-foreground">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">₹{cartTotal}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                  onClick={handleMakePurchase}
                  disabled={cartItems.length === 0}
                  className="w-full"
                >
                  Make Purchase
                </Button>
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={cartItems.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  Generate Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && generatedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div ref={invoiceRef}>
              {/* Invoice Header */}
              <div className="bg-primary text-primary-foreground px-8 py-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold">PURCHASE INVOICE</h1>
                    <p className="text-sm opacity-90 mt-1">Stock-Flow Inventory System</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Invoice #</p>
                    <p className="text-lg font-bold">{generatedInvoice.invoiceNumber}</p>
                  </div>
                </div>
              </div>

            {/* Invoice Body */}
            <div className="px-8 py-6">
              {/* Date and Info Section */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Invoice Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Date:</span> {generatedInvoice.date}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Time:</span> {generatedInvoice.time}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Payment Method:</span> {generatedInvoice.paymentMethod}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Supplier Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Supplier:</span> {generatedInvoice.supplier}
                    </p>
                    {cartSuppliers.length > 1 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Product Suppliers:</p>
                        <div className="flex flex-wrap gap-1">
                          {cartSuppliers.map((supplier, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                            >
                              {supplier}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Items</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase">Supplier</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {generatedInvoice.items.map((item: CartItem, index: number) => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm text-foreground">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-foreground">{item.product.name}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.product.sku}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.product.supplier}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-foreground">
                            ₹{item.product.costPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                            ₹{(item.quantity * item.product.costPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">₹{generatedInvoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%):</span>
                    <span className="font-medium">₹{generatedInvoice.tax}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-lg font-bold text-foreground">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">₹{generatedInvoice.total}</span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {generatedInvoice.notes && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Notes</h3>
                  <p className="text-sm text-foreground">{generatedInvoice.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-border pt-6 mt-6">
                <p className="text-xs text-center text-muted-foreground">
                  This is a computer-generated invoice and does not require a signature.
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Generated on {new Date().toLocaleString()}
                </p>
              </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-muted px-8 py-4 flex gap-3">
              <Button
                onClick={() => setShowInvoiceModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {isDownloading ? "Generating PDF..." : "Download Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}
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
