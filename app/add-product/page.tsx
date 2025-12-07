"use client"

import type React from "react"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Upload, Plus, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { generateSKU } from "@/lib/sku-generator"
import { logEvent } from "@/lib/event-logger"
import { useGetCategoriesQuery, useAddCategoryMutation, useGetUnitTypesQuery, useAddUnitTypeMutation, useAddProductMutation } from "@/lib/utils/services/api"
import { toast } from "sonner"

function AddProductContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  // RTK Query hooks
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery({})
  const { data: unitTypesData, isLoading: unitTypesLoading } = useGetUnitTypesQuery({})
  const [addCategory, { isLoading: isAddingCategory }] = useAddCategoryMutation()
  const [addUnitType, { isLoading: isAddingUnitType }] = useAddUnitTypeMutation()
  const [addProduct, { isLoading: isAddingProduct }] = useAddProductMutation()
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    unitType: "",
    unitSize: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    supplierContact: "",
    supplierRegistrationNumber: "",
    purchaseDate: "",
    expiryDate: "",
    minStockAlert: "",
  })

  const [images, setImages] = useState<File[]>([])
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddUnitTypeOpen, setIsAddUnitTypeOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", description: "", status: "active" })
  const [newUnitType, setNewUnitType] = useState({ name: "", abbreviation: "", description: "", status: "active" })

  const categories = categoriesData?.data || []
  const unitTypes = unitTypesData?.data || []

  // Generate SKU when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find((c: any) => c._id === formData.category)
      if (selectedCategory) {
        setFormData((prev) => ({ ...prev, sku: generateSKU(selectedCategory.name) }))
      }
    }
  }, [formData.category, categories])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: string) => {
    const selectedCategory = categories.find((c: any) => c._id === value)
    setFormData((prev) => ({ 
      ...prev, 
      category: value,
      sku: selectedCategory ? generateSKU(selectedCategory.name) : ""
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files)])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        unitType: formData.unitType,
        unitSize: formData.unitSize,
        quantity: formData.quantity,
        costPrice: formData.costPrice,
        sellingPrice: formData.sellingPrice,
        supplier: formData.supplier,
        supplierContact: formData.supplierContact,
        supplierRegistrationNumber: formData.supplierRegistrationNumber,
        purchaseDate: formData.purchaseDate,
        expiryDate: formData.expiryDate,
        minStockAlert: formData.minStockAlert,
        images: [], // TODO: Implement image upload
      }
      
      await addProduct(productData).unwrap()
      
      if (user) {
        logEvent("product.created", `Created product: ${formData.name} (SKU: ${formData.sku})`, user.id, user.name, {
          productName: formData.name,
          sku: formData.sku,
          category: formData.category,
        })
      }
      
      toast.success("Product added successfully")
      router.push("/")
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to add product")
      console.error("Error adding product:", error)
    }
  }

  const handleCancel = () => {
    router.push("/")
  }

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        const result = await addCategory({
          name: newCategory.name,
          description: newCategory.description,
          status: newCategory.status,
        }).unwrap()
        
        toast.success("Category added successfully")
        setFormData((prev) => ({ 
          ...prev, 
          category: result.data._id,
          sku: generateSKU(result.data.name)
        }))
        setIsAddCategoryOpen(false)
        setNewCategory({ name: "", description: "", status: "active" })
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to add category")
      }
    }
  }

  const handleAddUnitType = async () => {
    if (newUnitType.name.trim() && newUnitType.abbreviation.trim()) {
      try {
        const result = await addUnitType({
          name: newUnitType.name,
          abbreviation: newUnitType.abbreviation,
          description: newUnitType.description,
          status: newUnitType.status,
        }).unwrap()
        
        toast.success("Unit type added successfully")
        setFormData((prev) => ({ ...prev, unitType: result.data._id }))
        setIsAddUnitTypeOpen(false)
        setNewUnitType({ name: "", abbreviation: "", description: "", status: "active" })
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to add unit type")
      }
    }
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
                  <Input
                    name="sku"
                    value={formData.sku}
                    placeholder="e.g., LAP-001"
                    required
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
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
                  <div className="flex gap-2">
                    <Select value={formData.category} onValueChange={handleCategoryChange} disabled={categoriesLoading}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="bg-transparent">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Category</DialogTitle>
                          <DialogDescription>
                            Create a new category for your products
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Category Name *</label>
                            <Input
                              value={newCategory.name}
                              onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Electronics"
                              disabled={isAddingCategory}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Category Description</label>
                            <textarea
                              value={newCategory.description}
                              onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of this category"
                              disabled={isAddingCategory}
                              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddCategoryOpen(false)} 
                            disabled={isAddingCategory}
                            className="bg-transparent"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleAddCategory}
                            disabled={isAddingCategory || !newCategory.name.trim()}
                          >
                            {isAddingCategory ? "Adding..." : "Add Category"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Unit Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Unit Type *</label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.unitType} 
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, unitType: value }))}
                      disabled={unitTypesLoading}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={unitTypesLoading ? "Loading..." : "Select unit type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {unitTypes.map((unit: any) => (
                          <SelectItem key={unit._id} value={unit._id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddUnitTypeOpen} onOpenChange={setIsAddUnitTypeOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="bg-transparent">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Unit Type</DialogTitle>
                          <DialogDescription>
                            Create a new unit type for measurements
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Unit Name *</label>
                            <Input
                              value={newUnitType.name}
                              onChange={(e) => setNewUnitType((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Kilogram, Liter, Piece"
                              disabled={isAddingUnitType}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Abbreviation *</label>
                            <Input
                              value={newUnitType.abbreviation}
                              onChange={(e) => setNewUnitType((prev) => ({ ...prev, abbreviation: e.target.value.toUpperCase() }))}
                              placeholder="e.g., KG, L, PCS"
                              disabled={isAddingUnitType}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                            <textarea
                              value={newUnitType.description}
                              onChange={(e) => setNewUnitType((prev) => ({ ...prev, description: e.target.value }))}
                              placeholder="Brief description of this unit type"
                              disabled={isAddingUnitType}
                              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAddUnitTypeOpen(false)} 
                            disabled={isAddingUnitType}
                            className="bg-transparent"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleAddUnitType}
                            disabled={isAddingUnitType || !newUnitType.name.trim() || !newUnitType.abbreviation.trim()}
                          >
                            {isAddingUnitType ? "Adding..." : "Add Unit Type"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Unit Size *</label>
                  <Input
                    name="unitSize"
                    type="number"
                    step="0.01"
                    value={formData.unitSize}
                    onChange={handleChange}
                    placeholder="e.g., 1, 500, 2.5"
                    required
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Supplier Registration Number
                  </label>
                  <Input
                    name="supplierRegistrationNumber"
                    value={formData.supplierRegistrationNumber}
                    onChange={handleChange}
                    placeholder="e.g., REG-12345"
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
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
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
              <Button type="submit" className="flex-1 sm:flex-none" disabled={isAddingProduct}>
                {isAddingProduct ? "Saving..." : t("product.save")}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
                disabled={isAddingProduct}
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
