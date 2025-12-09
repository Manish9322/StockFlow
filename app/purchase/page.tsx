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
import { Download, Plus, Trash2, Building2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { useGetTaxConfigQuery } from "@/lib/utils/services/api"
import { calculateTaxes, formatTaxBreakdown } from "@/lib/utils/tax-calculator"

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
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  // Fetch tax configuration
  const { data: taxConfigData, isLoading: taxLoading } = useGetTaxConfigQuery(user?.id || "guest", {
    skip: !user?.id,
  })

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

  // Calculate subtotal
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0)

  // Calculate taxes using tax configuration
  const taxCalculation = calculateTaxes(cartSubtotal, taxConfigData?.data) as any
  const cartTotal = taxCalculation.grandTotal.toFixed(2)
  const taxBreakdown = formatTaxBreakdown(taxCalculation, "₹")

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
      // Get supplier names from cart items
      const suppliersFromCart = cartSuppliers.length > 0 ? cartSuppliers.join(", ") : "N/A"
      
      const purchaseData = {
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        subtotal: parseFloat(cartSubtotal.toFixed(2)),
        taxDetails: {
          gst: taxCalculation.gst,
          platformFee: taxCalculation.platformFee,
          otherTaxes: taxCalculation.otherTaxes,
          totalTax: taxCalculation.totalTax,
        },
        totalAmount: parseFloat(cartTotal),
        status: "Completed",
        supplier: suppliersFromCart,
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

    // Get supplier names from cart items
    const suppliersFromCart = cartSuppliers.length > 0 ? cartSuppliers.join(", ") : "N/A"

    // Generate invoice data
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: cartItems,
      supplier: suppliersFromCart,
      paymentMethod: paymentMethod,
      notes: notes,
      subtotal: cartSubtotal.toFixed(2),
      taxDetails: {
        gst: taxCalculation.gst,
        platformFee: taxCalculation.platformFee,
        otherTaxes: taxCalculation.otherTaxes,
        totalTax: taxCalculation.totalTax,
      },
      taxBreakdown: taxBreakdown,
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

      // Wait for the modal to fully render
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get the invoice element
      const invoiceElement = invoiceRef.current

      if (!invoiceElement) {
        throw new Error("Invoice element not found")
      }

      // Suppress console warnings from html2canvas
      const originalWarn = console.warn
      const originalError = console.error
      console.warn = () => {}
      console.error = (...args) => {
        // Only suppress color parsing errors
        const msg = args[0]
        if (typeof msg === 'string' && msg.includes('color')) return
        originalError.apply(console, args)
      }

      // Convert HTML to canvas with enhanced options
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: invoiceElement.scrollWidth,
        windowHeight: invoiceElement.scrollHeight,
        ignoreElements: (element) => {
          // Ignore elements that might cause color parsing issues
          return element.classList?.contains('dark') || false
        },
        onclone: (clonedDoc) => {
          // Remove any problematic CSS variables or color functions
          const clonedElement = clonedDoc.querySelector('[ref]') || clonedDoc.body
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.colorScheme = 'light'
          }
        }
      })

      // Restore console methods
      console.warn = originalWarn
      console.error = originalError

      if (!canvas) {
        throw new Error("Failed to create canvas")
      }

      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast.error(`Failed to generate PDF: ${errorMessage}`)
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
            <div className="sticky top-20 lg:top-10 z-10 space-y-6">
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
              <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
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

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                
                {taxCalculation.gst > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST:</span>
                    <span className="font-medium">₹{taxCalculation.gst.toFixed(2)}</span>
                  </div>
                )}
                
                {taxCalculation.platformFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee:</span>
                    <span className="font-medium">₹{taxCalculation.platformFee.toFixed(2)}</span>
                  </div>
                )}
                
                {taxCalculation.otherTaxes && taxCalculation.otherTaxes.length > 0 && (
                  <>
                    {taxCalculation.otherTaxes.map((tax: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tax.name}:</span>
                        <span className="font-medium">₹{tax.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                {taxCalculation.totalTax > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground font-medium">Total Tax:</span>
                    <span className="font-medium">₹{taxCalculation.totalTax.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-4 border-t border-border">
                <span className="text-base font-medium text-foreground">Grand Total:</span>
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
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-white text-black p-4 sm:p-6 overflow-y-auto">
              <div ref={invoiceRef}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 className="h-8 w-8" style={{ color: '#000' }}/>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Stock-Flow</h1>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#555' }}>
                    <p style={{ margin: 0 }}>Inventory Management</p>
                    <p style={{ margin: 0 }}>Stock-Flow System</p>
                  </div>
                </div>

                {/* Payment Receipt Title and Details */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Purchase Invoice</h2>
                  <table style={{ width: '100%', fontSize: '0.9rem' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Supplier:</td>
                        <td style={{ padding: '0.5rem' }}>{generatedInvoice.supplier}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Invoice Date:</td>
                        <td style={{ padding: '0.5rem' }}>{generatedInvoice.date}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Payment Method:</td>
                        <td style={{ padding: '0.5rem' }}>{generatedInvoice.paymentMethod}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Time:</td>
                        <td style={{ padding: '0.5rem' }}>{generatedInvoice.time}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Invoice Number:</td>
                        <td colSpan={3} style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{generatedInvoice.invoiceNumber}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Purchase Details</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #eee' }}>Product</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #eee' }}>Qty</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Unit Price</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedInvoice.items.map((item: CartItem) => (
                        <tr key={item.id}>
                          <td style={{ padding: '0.75rem', border: '1px solid #eee' }}>
                            <div>
                              <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {item.product.sku}</div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #eee' }}>{item.quantity}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{item.product.costPrice.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{(item.quantity * item.product.costPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Subtotal</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{generatedInvoice.subtotal}</td>
                      </tr>
                      {generatedInvoice.taxDetails?.gst > 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>GST</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{generatedInvoice.taxDetails.gst.toFixed(2)}</td>
                        </tr>
                      )}
                      {generatedInvoice.taxDetails?.platformFee > 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Platform Fee</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{generatedInvoice.taxDetails.platformFee.toFixed(2)}</td>
                        </tr>
                      )}
                      {generatedInvoice.taxDetails?.otherTaxes && generatedInvoice.taxDetails.otherTaxes.length > 0 && (
                        <>
                          {generatedInvoice.taxDetails.otherTaxes.map((tax: any, index: number) => (
                            <tr key={index}>
                              <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>{tax.name}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{tax.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                      {generatedInvoice.taxDetails?.totalTax > 0 && (
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Total Tax</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{generatedInvoice.taxDetails.totalTax.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                        <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Total Amount</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{generatedInvoice.total}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Notes Section */}
                {generatedInvoice.notes && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #eee', borderRadius: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Notes:</h3>
                    <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>{generatedInvoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '2px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>
                    <p style={{ margin: 0 }}>Thank you for your purchase!</p>
                    <p style={{ margin: 0 }}>This is a computer-generated invoice and does not require a signature.</p>
                  </div>
                  <div style={{ border: '3px solid #22c55e', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '0.25rem', transform: 'rotate(-10deg)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    PAID
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 border-t px-4 sm:px-6 pb-4 flex gap-3">
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
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Generating PDF..." : "Print / Download"}
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
