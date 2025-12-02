"use client"

import type React from "react"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { generateSKU } from "@/lib/sku-generator"
import { logEvent } from "@/lib/event-logger"

function AddProductContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    supplierContact: "",
    purchaseDate: "",
    expiryDate: "",
    minStockAlert: "",
    barcode: "",
  })

  const [images, setImages] = useState<File[]>([])
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true)

  const categories = ["Electronics", "Accessories", "Cables", "Storage", "Displays", "Other"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
    if (autoGenerateSKU) {
      setFormData((prev) => ({ ...prev, sku: generateSKU(value) }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Product form submitted:", { ...formData, images: images.length })

    if (user) {
      logEvent("product.created", `Created product: ${formData.name} (SKU: ${formData.sku})`, user.id, user.name, {
        productName: formData.name,
        sku: formData.sku,
        category: formData.category,
      })
    }

    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("product.add_title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t("product.add_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="bg-card border border-border rounded-lg p-4 md:p-8 space-y-6 md:space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t("product.basic_info")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.name")} *</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Laptop Computer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.sku")} *</label>
                  <div className="flex gap-2">
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="e.g., LAP-001"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (formData.category) {
                          setFormData((prev) => ({ ...prev, sku: generateSKU(formData.category) }))
                          setAutoGenerateSKU(true)
                        }
                      }}
                      variant="outline"
                      className="bg-transparent"
                    >
                      {t("product.auto_generate_sku")}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">{t("product.description")}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description and details..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.category")} *</label>
                  <Select value={formData.category} onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.barcode")}</label>
                  <Input
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="e.g., 123456789"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Stock & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.quantity")} *</label>
                  <Input
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("product.min_stock_alert")} *
                  </label>
                  <Input
                    name="minStockAlert"
                    type="number"
                    value={formData.minStockAlert}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.cost_price")} *</label>
                  <Input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("product.selling_price")} *
                  </label>
                  <Input
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Supplier & Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.supplier")} *</label>
                  <Input
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    placeholder="e.g., TechSupply Co."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("product.supplier_contact")}
                  </label>
                  <Input
                    name="supplierContact"
                    value={formData.supplierContact}
                    onChange={handleChange}
                    placeholder="email or phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.purchase_date")}</label>
                  <Input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t("product.expiry_date")}</label>
                  <Input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{t("product.images")}</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                <label className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">Click to upload</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF up to 5MB</p>
                {images.length > 0 && <p className="text-xs text-foreground mt-2">{images.length} image(s) selected</p>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
              <Button type="submit" className="flex-1 sm:flex-none">
                {t("product.save")}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
                className="flex-1 sm:flex-none bg-transparent"
              >
                {t("product.cancel")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default function AddProduct() {
  return (
    <ProtectedRoute>
      <AddProductContent />
    </ProtectedRoute>
  )
}
