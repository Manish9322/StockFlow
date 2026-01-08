"use client"

import type React from "react"

import { use, useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGetProductByIdQuery, useGetCategoriesQuery, useGetUnitTypesQuery, useUpdateProductMutation } from "@/lib/utils/services/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { logMovement } from "@/lib/movement-logger"
import { useAuth } from "@/lib/auth-context"
import { uploadMultipleImages } from "@/lib/utils/upload"

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  
  const { data: productData, isLoading: productLoading, error: productError } = useGetProductByIdQuery(id)
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery({})
  const { data: unitTypesData, isLoading: unitTypesLoading } = useGetUnitTypesQuery({})
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  
  const product = productData?.data
  const categories = categoriesData?.data || []
  const unitTypes = unitTypesData?.data || []

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
    minStockAlert: "",
    status: "active",
  })

  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        description: product.description || "",
        category: product.category?._id || "",
        unitType: product.unitType?._id || "",
        unitSize: product.unitSize?.toString() || "",
        quantity: product.quantity?.toString() || "0",
        costPrice: product.costPrice?.toString() || "",
        sellingPrice: product.sellingPrice?.toString() || "",
        supplier: product.supplier || "",
        supplierContact: product.supplierContact || "",
        supplierRegistrationNumber: product.supplierRegistrationNumber || "",
        minStockAlert: product.minStockAlert?.toString() || "10",
        status: product.status || "active",
      })
      
      // Set existing images
      setExistingImages(product.images || [])
    }
  }, [product])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.unitType) {
      toast({
        title: "Error",
        description: "Please select a unit type",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Store original values for change tracking
      const originalData = {
        name: product.name,
        sku: product.sku,
        quantity: product.quantity,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        supplier: product.supplier,
        minStockAlert: product.minStockAlert,
        status: product.status,
      }
      
      let imageUrls: string[] = [];
      
      // Upload images to Cloudinary if there are any
      if (images.length > 0) {
        try {
          imageUrls = await uploadMultipleImages(images);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload images",
            variant: "destructive",
          });
          console.error("Error uploading images:", error);
          return; // Don't proceed if image upload fails
        }
      }
      
      // Filter out images that are marked for removal
      const filteredExistingImages = existingImages.filter(img => !imagesToRemove.includes(img));
      
      // Combine remaining existing images with newly uploaded images
      const allImages = [...filteredExistingImages, ...imageUrls];
      
      const updatedData = await updateProduct({
        id,
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        unitType: formData.unitType,
        unitSize: parseFloat(formData.unitSize),
        quantity: parseInt(formData.quantity),
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        supplier: formData.supplier,
        supplierContact: formData.supplierContact,
        supplierRegistrationNumber: formData.supplierRegistrationNumber,
        minStockAlert: parseInt(formData.minStockAlert),
        status: formData.status,
        images: allImages, // Include both existing and new images
      }).unwrap()
      
      // Log movement for product update
      const changedFields = []
      if (originalData.name !== formData.name) changedFields.push('name')
      if (originalData.sku !== formData.sku) changedFields.push('SKU')
      if (originalData.quantity !== parseInt(formData.quantity)) changedFields.push('quantity')
      if (originalData.costPrice !== parseFloat(formData.costPrice)) changedFields.push('cost price')
      if (originalData.sellingPrice !== parseFloat(formData.sellingPrice)) changedFields.push('selling price')
      if (originalData.supplier !== formData.supplier) changedFields.push('supplier')
      if (originalData.minStockAlert !== parseInt(formData.minStockAlert)) changedFields.push('min stock alert')
      if (originalData.status !== formData.status) changedFields.push('status')
      if (imageUrls.length > 0) changedFields.push('images')
      
      if (changedFields.length > 0) {
        await logMovement({
          eventType: "product.updated",
          eventTitle: "Product Updated",
          description: `Updated product "${formData.name}" (${changedFields.join(', ')})`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          relatedProduct: id,
          metadata: {
            productName: formData.name,
            sku: formData.sku,
            changedFields,
          },
          changes: {
            before: originalData,
            after: {
              name: formData.name,
              sku: formData.sku,
              quantity: parseInt(formData.quantity),
              costPrice: parseFloat(formData.costPrice),
              sellingPrice: parseFloat(formData.sellingPrice),
              supplier: formData.supplier,
              minStockAlert: parseInt(formData.minStockAlert),
              status: formData.status,
            },
          },
        })
        
        // If quantity changed, log stock change separately
        if (originalData.quantity !== parseInt(formData.quantity)) {
          const quantityDiff = parseInt(formData.quantity) - originalData.quantity
          await logMovement({
            eventType: "stock.changed",
            eventTitle: "Stock Changed",
            description: `Stock ${quantityDiff > 0 ? 'increased' : 'decreased'} for "${formData.name}": ${quantityDiff > 0 ? '+' : ''}${quantityDiff} units (${originalData.quantity} → ${formData.quantity})`,
            userId: user?.id || "system",
            userName: user?.name || "System",
            userEmail: user?.email,
            relatedProduct: id,
            metadata: {
              productName: formData.name,
              sku: formData.sku,
              quantityChange: quantityDiff,
              previousQuantity: originalData.quantity,
              newQuantity: parseInt(formData.quantity),
            },
          })
        }
      }
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      
      router.push(`/product/${id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push(`/product/${id}`)
  }

  if (productLoading || categoriesLoading || unitTypesLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  if (productError || !product) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <Link href="/" className="flex items-center gap-2 text-primary hover:underline mb-6">
            <ChevronLeft size={18} />
            Back to Dashboard
          </Link>
          <p className="text-sm md:text-base text-destructive">
            {productError ? "Failed to load product" : "Product not found"}
          </p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Link href={`/product/${id}`} className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ChevronLeft size={18} />
          Back to Product
        </Link>

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Edit Product</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update product information</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full pb-8">
          <div className="bg-card border border-border rounded-lg p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Name *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SKU *</label>
                <Input name="sku" value={formData.sku} onChange={handleChange} required/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <Input name="description" value={formData.description} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Unit Type *</label>
                <Select value={formData.unitType} onValueChange={(value) => handleSelectChange("unitType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((unit: any) => (
                      <SelectItem key={unit._id} value={unit._id}>
                        {unit.name} ({unit.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Unit Size *</label>
                <Input 
                  name="unitSize" 
                  type="number" 
                  step="0.01"
                  value={formData.unitSize} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Quantity *</label>
                <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Cost Price (₹) *</label>
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
                <label className="block text-sm font-medium text-foreground mb-2">Selling Price (₹) *</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supplier Name *</label>
                <Input name="supplier" value={formData.supplier} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supplier Contact</label>
                <Input name="supplierContact" value={formData.supplierContact} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supplier Registration No.</label>
                <Input name="supplierRegistrationNumber" value={formData.supplierRegistrationNumber} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Stock Alert *</label>
                <Input
                  name="minStockAlert"
                  type="number"
                  value={formData.minStockAlert}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status *</label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Product Images</h2>
              
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Current Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img
                          src={image}
                          alt={`Existing image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Mark image for removal
                            setImagesToRemove(prev => [...prev, image]);
                            // Remove from existing images
                            setExistingImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Images to Upload */}
              {images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">New Images to Add</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`New image ${index + 1}`}
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

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={handleCancel} type="button" disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
