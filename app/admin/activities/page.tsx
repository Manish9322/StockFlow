"use client"

import { useState, useEffect, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Eye, Activity, Users, FileText, TrendingUp, Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export type EventType =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "stock.changed"
  | "stock.refill"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "purchase.created"
  | "purchase.updated"
  | "purchase.deleted"
  | "settings.changed"
  | "auth.login"
  | "auth.logout"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "unitType.created"
  | "unitType.updated"
  | "unitType.deleted"
  | "tax.created"
  | "tax.updated"
  | "tax.deleted"

interface Movement {
  _id: string
  eventType: EventType
  eventTitle: string
  description: string
  userId: string
  userName: string
  userEmail?: string
  relatedProduct?: any
  relatedPurchase?: any
  relatedCategory?: any
  metadata?: Record<string, any>
  changes?: {
    before?: any
    after?: any
  }
  createdAt: string
  updatedAt: string
}

function AdminActivitiesContent() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | "all">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await fetch("/api/movement", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Role': 'admin',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setMovements(data.data)
      } else {
        toast.error("Failed to fetch movements")
      }
    } catch (error) {
      console.error("Error fetching movements:", error)
      toast.error("Failed to fetch movements")
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on search query and advanced filters
  const filteredMovements = useMemo(() => {
    let filtered = movements

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (m) =>
          m.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.userName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((m) => m.eventType === eventTypeFilter)
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((m) => new Date(m.createdAt) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter((m) => new Date(m.createdAt) <= new Date(dateTo + "T23:59:59"))
    }

    return filtered
  }, [movements, searchQuery, eventTypeFilter, dateFrom, dateTo])

  // Pagination calculations
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovements = filteredMovements.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, eventTypeFilter, dateFrom, dateTo])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const eventTypeOptions: Array<{ value: EventType | "all"; label: string }> = [
    { value: "all", label: "All Events" },
    { value: "product.created", label: "Product Created" },
    { value: "product.updated", label: "Product Updated" },
    { value: "product.deleted", label: "Product Deleted" },
    { value: "stock.changed", label: "Stock Changed" },
    { value: "stock.refill", label: "Stock Refill" },
    { value: "category.created", label: "Category Created" },
    { value: "category.updated", label: "Category Updated" },
    { value: "category.deleted", label: "Category Deleted" },
    { value: "purchase.created", label: "Purchase Created" },
    { value: "purchase.updated", label: "Purchase Updated" },
    { value: "purchase.deleted", label: "Purchase Deleted" },
    { value: "settings.changed", label: "Settings Changed" },
    { value: "auth.login", label: "Login" },
    { value: "auth.logout", label: "Logout" },
    { value: "user.created", label: "User Created" },
    { value: "user.updated", label: "User Updated" },
    { value: "user.deleted", label: "User Deleted" },
    { value: "unitType.created", label: "Unit Type Created" },
    { value: "unitType.updated", label: "Unit Type Updated" },
    { value: "unitType.deleted", label: "Unit Type Deleted" },
    { value: "tax.created", label: "Tax Created" },
    { value: "tax.updated", label: "Tax Updated" },
    { value: "tax.deleted", label: "Tax Deleted" },
  ]

  const getEventColor = (eventType: EventType) => {
    // Uniform gray badge for all event types
    return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
  }

  const handleExportCSV = (format: "csv" | "excel" | "pdf") => {
    if (format === "csv") {
      const csv = [
        ["Timestamp", "User", "Event", "Description"].join(","),
        ...filteredMovements.map((m) =>
          [new Date(m.createdAt).toLocaleString(), m.userName, m.eventTitle, `"${m.description}"`].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `system-activities-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("CSV exported successfully")
    } else {
      toast.info(`${format.toUpperCase()} export coming soon!`)
    }
  }

  const openViewModal = (movement: Movement) => {
    setSelectedMovement(movement)
    setShowViewModal(true)
  }

  const handleDeleteMovement = (id: string) => {
    setMovementToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (movementToDelete) {
      try {
        const token = localStorage.getItem('adminToken')
        const response = await fetch(`/api/movement/${movementToDelete}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-User-Role': 'admin',
          },
        })
        const data = await response.json()
        
        if (data.success) {
          setMovements(movements.filter(m => m._id !== movementToDelete))
          toast.success("Movement deleted successfully")
        } else {
          toast.error("Failed to delete movement")
        }
      } catch (error) {
        console.error("Error deleting movement:", error)
        toast.error("Failed to delete movement")
      } finally {
        setShowDeleteModal(false)
        setMovementToDelete(null)
      }
    }
  }

  // Get unique users
  const uniqueUsers = Array.from(new Set(movements.map(m => m.userName))).length

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">System Activities</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and track all important events and changes across all users in the inventory system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4 mb-4">
          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Events</p>
                <p className="text-3xl font-bold text-foreground">{movements.length}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Users</p>
                <p className="text-3xl font-bold text-foreground">{uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Contributors</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <Users className="h-5 w-5 text-foreground dark:text-foreground" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product Events</p>
                <p className="text-3xl font-bold text-foreground">
                  {movements.filter(m => m.eventType.startsWith("product.")).length}
                </p>
                <p className="text-xs text-muted-foreground">Activities</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <FileText className="h-5 w-5 text-primary dark:text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock Changes</p>
                <p className="text-3xl font-bold text-foreground">
                  {movements.filter(m => m.eventType === "stock.changed" || m.eventType === "stock.refill").length}
                </p>
                <p className="text-xs text-muted-foreground">Adjustments</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <TrendingUp className="h-5 w-5 text-primary dark:text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Header with Search and Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {showFilters ? "Hide Filters" : "Advanced Filters"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={fetchMovements}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={() => handleExportCSV("csv")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                onClick={() => handleExportCSV("excel")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                Excel
              </Button>
              <Button
                onClick={() => handleExportCSV("pdf")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Event Type</label>
                  <Select value={eventTypeFilter} onValueChange={(val) => setEventTypeFilter(val as EventType | "all")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    setEventTypeFilter("all")
                    setDateFrom("")
                    setDateTo("")
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Events Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading system activities...</p>
              </div>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No activities found matching your search." : "No activities yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMovements.map((movement) => (
                        <TableRow key={movement._id}>
                          <TableCell className="text-sm">
                            {new Date(movement.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">{movement.userName}</p>
                              {movement.userEmail && (
                                <p className="text-xs text-muted-foreground">{movement.userEmail}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(movement.eventType)}`}
                            >
                              {movement.eventTitle}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-md">
                            <div className="truncate">{movement.description}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                onClick={() => openViewModal(movement)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteMovement(movement._id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                title="Delete event"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => handleItemsPerPageChange(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    of {filteredMovements.length} events
                  </span>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="bg-transparent"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-transparent"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxButtons = 5
                      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                      let endPage = Math.min(totalPages, startPage + maxButtons - 1)
                      
                      if (endPage - startPage + 1 < maxButtons) {
                        startPage = Math.max(1, endPage - maxButtons + 1)
                      }
                      
                      return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            currentPage === page
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground hover:bg-border"
                          }`}
                        >
                          {page}
                        </button>
                      ))
                    })()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-transparent"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="bg-transparent"
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Event Modal */}
      {showViewModal && selectedMovement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">Activity Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Timestamp</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedMovement.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">User</label>
                  <p className="text-sm text-foreground">{selectedMovement.userName}</p>
                  {selectedMovement.userEmail && (
                    <p className="text-xs text-muted-foreground">{selectedMovement.userEmail}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Event Type</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(selectedMovement.eventType)}`}
                >
                  {selectedMovement.eventTitle}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <p className="text-sm text-foreground">{selectedMovement.description}</p>
              </div>
              
              {/* Related entities */}
              {selectedMovement.relatedProduct && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Related Product</label>
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <p className="text-sm text-foreground font-medium">{selectedMovement.relatedProduct.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {selectedMovement.relatedProduct.sku}</p>
                  </div>
                </div>
              )}
              
              {selectedMovement.relatedPurchase && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Related Purchase</label>
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <p className="text-sm text-foreground font-medium">
                      Purchase ID: {selectedMovement.relatedPurchase.purchaseId}
                    </p>
                  </div>
                </div>
              )}
              
              {selectedMovement.relatedCategory && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Related Category</label>
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <p className="text-sm text-foreground font-medium">{selectedMovement.relatedCategory.name}</p>
                  </div>
                </div>
              )}
              
              {/* Changes */}
              {selectedMovement.changes && (selectedMovement.changes.before || selectedMovement.changes.after) && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Changes</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedMovement.changes.before && (
                      <div className="border border-border rounded-md p-3 bg-red-50 dark:bg-red-900/10">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Before</p>
                        <pre className="text-xs text-foreground overflow-x-auto">
                          {JSON.stringify(selectedMovement.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedMovement.changes.after && (
                      <div className="border border-border rounded-md p-3 bg-green-50 dark:bg-green-900/10">
                        <p className="text-xs font-medium text-muted-foreground mb-2">After</p>
                        <pre className="text-xs text-foreground overflow-x-auto">
                          {JSON.stringify(selectedMovement.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedMovement.metadata && Object.keys(selectedMovement.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Additional Details</label>
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <pre className="text-xs text-foreground overflow-x-auto">
                      {JSON.stringify(selectedMovement.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedMovement(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Activity</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this activity from the system history? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setMovementToDelete(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete} 
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default function AdminActivities() {
  return (
    <AdminRoute>
      <AdminActivitiesContent />
    </AdminRoute>
  )
}
