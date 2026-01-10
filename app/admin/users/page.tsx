"use client"

import { useState, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { 
  useGetAllUsersQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
} from "@/lib/utils/services/api"
import { toast } from "sonner"
import { 
  Shield, 
  Trash2, 
  Edit, 
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface User {
  _id: string
  name: string
  email: string
  company?: string
  role: string
  status: string
  lastLogin?: string
  createdAt: string
}

function AdminUsersContent() {
  const { adminUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { 
    data: usersData, 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = useGetAllUsersQuery({ 
    status: statusFilter, 
    search: searchTerm 
  })

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    company: "",
    status: "active",
  })

  const users = usersData?.users || []
  
  // Pagination logic
  const totalUsersCount = users.length
  const totalPages = Math.ceil(totalUsersCount / rowsPerPage)
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return users.slice(startIndex, endIndex)
  }, [users, currentPage, rowsPerPage])

  // Calculate statistics
  const totalUsers = users.length
  const activeUsers = users.filter((u: User) => u.status === "active").length

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit)
    setEditForm({
      name: userToEdit.name || "",
      email: userToEdit.email || "",
      company: userToEdit.company || "",
      status: userToEdit.status || "active",
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (userToDelete: User) => {
    setSelectedUser(userToDelete)
    setShowDeleteModal(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      await updateUser({
        userId: selectedUser._id,
        name: editForm.name,
        email: editForm.email,
        company: editForm.company,
        status: editForm.status,
      }).unwrap()

      toast.success("User updated successfully")
      setShowEditModal(false)
      refetchUsers()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to update user")
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return

    try {
      await deleteUser(selectedUser._id).unwrap()
      toast.success("User deleted successfully")
      setShowDeleteModal(false)
      refetchUsers()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to delete user")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === "admin" ? "default" : "outline"}>
        {role === "admin" && <Shield className="w-3 h-3 mr-1" />}
        {role}
      </Badge>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage user accounts and permissions across the inventory system.
          </p>
        </div>

        {/* Statistics Cards */}
        {usersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Total Users</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{totalUsers}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Active Users</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{activeUsers}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filter Users</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchUsers()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-foreground mb-2">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Users List ({totalUsersCount})</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((userItem: User) => (
                    <TableRow key={userItem._id}>
                      <TableCell className="font-medium">
                        {userItem.name}
                        {userItem._id === adminUser?.id && (
                          <Badge variant="outline" className="ml-2">You</Badge>
                        )}
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>{userItem.company || "-"}</TableCell>

                      <TableCell>{getStatusBadge(userItem.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {userItem.lastLogin
                          ? formatDistanceToNow(new Date(userItem.lastLogin), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(userItem.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(userItem)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem)}
                            disabled={userItem._id === adminUser?.id}
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
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
              <Select value={String(rowsPerPage)} onValueChange={(value) => {
                setRowsPerPage(Number(value))
                setCurrentPage(1) // Reset to first page when changing rows per page
              }}>
                <SelectTrigger className="w-20 h-8">
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
                {paginatedUsers.length > 0 ? `${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalUsersCount)} of ${totalUsersCount}` : `0 of ${totalUsersCount}`}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || usersLoading}
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
                        disabled={usersLoading}
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
                  disabled={currentPage === totalPages || usersLoading}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm font-medium">{selectedUser?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
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
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

export default function AdminUsers() {
  return (
    <AdminRoute>
      <AdminUsersContent />
    </AdminRoute>
  )
}
