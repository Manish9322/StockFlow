"use client"

import type React from "react"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sampleProducts } from "@/lib/sample-data"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter()
  const product = sampleProducts.find((p) => p.id === params.id)

  const [formData, setFormData] = useState(
    product || {
      name: "",
      sku: "",
      category: "",
      quantity: "",
      costPrice: "",
      sellingPrice: "",
      supplier: "",
    },
  )

  const categories = ["Electronics", "Accessories", "Cables", "Storage", "Displays"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    router.push(`/product/${product?.id}`)
  }

  const handleCancel = () => {
    router.push(`/product/${product?.id}`)
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-8">
        <Link href={`/product/${product.id}`} className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ChevronLeft size={18} />
          Back to Product
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Product</h1>
          <p className="text-muted-foreground">Update product information</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SKU</label>
                <Input name="sku" value={formData.sku} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
                <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cost Price ($)</label>
                <Input
                  name="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Selling Price ($)</label>
                <Input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Supplier Name</label>
              <Input name="supplier" value={formData.supplier} onChange={handleChange} required />
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button type="submit">Save Changes</Button>
              <Button variant="outline" onClick={handleCancel} type="button">
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
