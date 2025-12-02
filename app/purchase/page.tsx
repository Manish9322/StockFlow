"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sampleProducts } from "@/lib/sample-data"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { logEvent } from "@/lib/event-logger"
import { Download } from "lucide-react"

function PurchaseContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [notes, setNotes] = useState("")

  const product = selectedProduct ? sampleProducts.find((p) => p.id === selectedProduct) : null
  const totalAmount =
    quantity && unitPrice ? (Number.parseInt(quantity) * Number.parseFloat(unitPrice)).toFixed(2) : "0.00"

  const handleGenerateInvoice = () => {
    if (!selectedProduct || !quantity || !unitPrice) {
      alert("Please fill all required fields")
      return
    }

    console.log("[v0] Invoice generated:", {
      productId: selectedProduct,
      quantity,
      unitPrice,
      totalAmount,
      notes,
    })

    // Log the purchase event
    if (user) {
      logEvent(
        "purchase.created",
        `Created purchase for ${product?.name} - ${quantity} units @ ₹${unitPrice}`,
        user.id,
        user.name,
        { productId: selectedProduct, quantity, unitPrice, totalAmount },
      )
    }

    alert("Invoice generated successfully!")
    // Reset form
    setSelectedProduct("")
    setQuantity("")
    setUnitPrice("")
    setNotes("")
  }

  const handleDownloadInvoice = () => {
    const invoiceContent = `
PURCHASE INVOICE
================
Date: ${new Date().toLocaleDateString()}
Product: ${product?.name}
SKU: ${product?.sku}
Quantity: ${quantity}
Unit Price: ₹${unitPrice}
Total Amount: ₹${totalAmount}
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
            Create a new purchase order and generate downloadable invoice for your records
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("purchase.select_product")} *</label>
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
              <label className="block text-sm font-medium text-foreground mb-2">{t("purchase.unit_price")} *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("purchase.total_amount")}</label>
              <Input type="text" value={`₹${totalAmount}`} disabled className="bg-muted" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button onClick={handleGenerateInvoice} className="flex-1 sm:flex-none">
              {t("purchase.generate_invoice")}
            </Button>
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              className="flex-1 sm:flex-none bg-transparent flex items-center justify-center gap-2"
              disabled={!selectedProduct || !quantity || !unitPrice}
            >
              <Download size={16} />
              <span className="hidden sm:inline">{t("purchase.download_invoice")}</span>
              <span className="sm:hidden">Download</span>
            </Button>
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
