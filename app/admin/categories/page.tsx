"use client"

import { useState, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  useGetCategoriesQuery, 
  useAddCategoryMutation, 
  useUpdateCategoryMutation, 
  useDeleteCategoryMutation 
} from "@/lib/utils/services/api"
import { toast } from "sonner"
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Category {
  _id: string
  name: string
  description: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

function AdminCategoriesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: categoriesData, isLoading, refetch } = useGetCategoriesQuery({})
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  const categories: Category[] = categoriesData?.data || []

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [categories, searchTerm])
  
  // Pagination logic
  const totalCategoriesCount = filteredCategories.length
  const totalPages = Math.ceil(totalCategoriesCount / rowsPerPage)
  
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filteredCategories.slice(startIndex, endIndex)
  }, [filteredCategories, currentPage, rowsPerPage])

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      await addCategory(formData).unwrap()
      toast.success("Category added successfully")
      setShowAddModal(false)
      setFormData({ name: "", description: "" })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to add category")
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedCategory || !formData.name.trim()) return

    try {
      await updateCategory({
        id: selectedCategory._id,
        ...formData,
      }).unwrap()
      toast.success("Category updated successfully")
      setShowEditModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to update category")
    }
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return

    try {
      await deleteCategory(selectedCategory._id).unwrap()
      toast.success("Category deleted successfully")
      setShowDeleteModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to delete category")
    }
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Categories</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage product categories and their associated products across the inventory system.
          </p>
        </div>

        {/* Statistics Card */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-32 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-4">
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Total Categories</p>
            <p className="text-2xl md:text-2xl font-semibold text-foreground">{totalCategoriesCount}</p>
          </div>
        )}

        {/* Search and Add */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Manage Categories</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => {
                setFormData({ name: "", description: "" })
                setShowAddModal(true)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search Categories</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Categories List ({totalCategoriesCount})</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading categories...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.createdAt
                          ? formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.updatedAt
                          ? formatDistanceToNow(new Date(category.updatedAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <Select value={String(rowsPerPage)} onValueChange={(value: string) => {
                  setRowsPerPage(Number(value))
                  setCurrentPage(1) // Reset to first page when changing rows per page
                }}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {paginatedCategories.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalCategoriesCount)} of ${totalCategoriesCount}` : `0 of ${totalCategoriesCount}`}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        // Show all pages if total pages is 5 or less
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // Show first 5 pages if current page is near the beginning
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages if current page is near the end
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Show 2 before and 2 after current page
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isLoading}
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new product category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm font-medium">{selectedCategory?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedCategory?.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

export default function AdminCategories() {
  return (
    <AdminRoute>
      <AdminCategoriesContent />
    </AdminRoute>
  )
}
