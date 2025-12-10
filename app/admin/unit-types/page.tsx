"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Card } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  useGetUnitTypesQuery, 
  useAddUnitTypeMutation, 
  useUpdateUnitTypeMutation, 
  useDeleteUnitTypeMutation 
} from "@/lib/utils/services/api"
import { toast } from "sonner"
import { 
  Ruler, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Search,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface UnitType {
  _id: string
  name: string
  abbreviation: string
  description: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

function AdminUnitTypesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    abbreviation: "",
    description: "",
  })

  const { data: unitTypesData, isLoading, refetch } = useGetUnitTypesQuery({})
  const [addUnitType, { isLoading: isAdding }] = useAddUnitTypeMutation()
  const [updateUnitType, { isLoading: isUpdating }] = useUpdateUnitTypeMutation()
  const [deleteUnitType, { isLoading: isDeleting }] = useDeleteUnitTypeMutation()

  const unitTypes: UnitType[] = unitTypesData?.unitTypes || []

  const filteredUnitTypes = unitTypes.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error("Name and abbreviation are required")
      return
    }

    try {
      await addUnitType(formData).unwrap()
      toast.success("Unit type added successfully")
      setShowAddModal(false)
      setFormData({ name: "", abbreviation: "", description: "" })
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to add unit type")
    }
  }

  const handleEdit = (unitType: UnitType) => {
    setSelectedUnitType(unitType)
    setFormData({
      name: unitType.name,
      abbreviation: unitType.abbreviation,
      description: unitType.description || "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!selectedUnitType || !formData.name.trim() || !formData.abbreviation.trim()) return

    try {
      await updateUnitType({
        id: selectedUnitType._id,
        ...formData,
      }).unwrap()
      toast.success("Unit type updated successfully")
      setShowEditModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to update unit type")
    }
  }

  const handleDelete = (unitType: UnitType) => {
    setSelectedUnitType(unitType)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUnitType) return

    try {
      await deleteUnitType(selectedUnitType._id).unwrap()
      toast.success("Unit type deleted successfully")
      setShowDeleteModal(false)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to delete unit type")
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Unit Types</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage measurement units
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => {
              setFormData({ name: "", abbreviation: "", description: "" })
              setShowAddModal(true)
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Unit Type
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-4">
            <Ruler className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">{unitTypes.length}</p>
              <p className="text-sm text-muted-foreground">Total Unit Types</p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-4 border border-border">
          <Label>Search Unit Types</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, abbreviation, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        {/* Unit Types Table */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                Unit Types ({filteredUnitTypes.length})
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading unit types...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUnitTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No unit types found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUnitTypes.map((unitType) => (
                    <TableRow key={unitType._id}>
                      <TableCell className="font-medium">{unitType.name}</TableCell>
                      <TableCell className="font-mono font-semibold">{unitType.abbreviation}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {unitType.description || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {unitType.createdAt
                          ? formatDistanceToNow(new Date(unitType.createdAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {unitType.updatedAt
                          ? formatDistanceToNow(new Date(unitType.updatedAt), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(unitType)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unitType)}
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
        </Card>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Unit Type</DialogTitle>
            <DialogDescription>
              Create a new measurement unit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Unit name (e.g., Kilogram)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-abbreviation">Abbreviation *</Label>
              <Input
                id="add-abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                placeholder="Unit abbreviation (e.g., kg)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Unit description (optional)"
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
              Add Unit Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Unit Type</DialogTitle>
            <DialogDescription>
              Update unit type information
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
              <Label htmlFor="edit-abbreviation">Abbreviation *</Label>
              <Input
                id="edit-abbreviation"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
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
              Update Unit Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm font-medium">{selectedUnitType?.name} ({selectedUnitType?.abbreviation})</p>
              <p className="text-sm text-muted-foreground">{selectedUnitType?.description}</p>
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
              Delete Unit Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

export default function AdminUnitTypes() {
  return (
    <AdminRoute>
      <AdminUnitTypesContent />
    </AdminRoute>
  )
}
