"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetMovementsQuery } from "@/lib/utils/services/api"
import { 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Edit,
  Activity,
} from "lucide-react"
import { format } from "date-fns"

interface Movement {
  _id: string
  eventType: string
  productId: string
  productName: string
  productSKU: string
  quantityChanged: number
  previousQuantity: number
  newQuantity: number
  userId: string
  userName: string
  userEmail: string
  timestamp: string
  description?: string
}

function AdminActivitiesContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const { data: movementsData, isLoading, refetch } = useGetMovementsQuery({
    eventType: eventTypeFilter === "all" ? undefined : eventTypeFilter,
    limit: 1000,
  })

  const movements: Movement[] = movementsData?.data || []

  const filteredMovements = movements.filter(movement =>
    movement.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.productSKU?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "added":
      case "stock_refill":
        return <TrendingUp className="w-4 h-4 text-foreground" />
      case "purchase":
      case "removed":
        return <TrendingDown className="w-4 h-4 text-foreground" />
      case "updated":
        return <Edit className="w-4 h-4 text-foreground" />
      default:
        return <Activity className="w-4 h-4 text-foreground" />
    }
  }

  const getEventBadge = (eventType: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {eventType.replace("_", " ")}
      </Badge>
    )
  }

  // Calculate statistics
  const stats = {
    total: movements.length,
    added: movements.filter(m => m.eventType === "added").length,
    updated: movements.filter(m => m.eventType === "updated").length,
    removed: movements.filter(m => m.eventType === "removed").length,
    purchases: movements.filter(m => m.eventType === "purchase").length,
    refills: movements.filter(m => m.eventType === "stock_refill").length,
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">System Activities</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track all product movements and changes across the system
          </p>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                <div className="h-8 bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Total</p>
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Added</p>
              <p className="text-2xl font-semibold text-foreground">{stats.added}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Updated</p>
              <p className="text-2xl font-semibold text-foreground">{stats.updated}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Removed</p>
              <p className="text-2xl font-semibold text-foreground">{stats.removed}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Purchases</p>
              <p className="text-2xl font-semibold text-foreground">{stats.purchases}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Refills</p>
              <p className="text-2xl font-semibold text-foreground">{stats.refills}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Filter Activities</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Search Activities</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product, SKU, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Event Type</label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="added">Added</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="stock_refill">Stock Refill</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Activities List ({filteredMovements.length})</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Quantity Change</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading activities...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No activities found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMovements.map((movement) => (
                    <TableRow key={movement._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(movement.eventType)}
                          {getEventBadge(movement.eventType)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{movement.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{movement.productSKU}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{movement.userName}</p>
                          <p className="text-xs text-muted-foreground">{movement.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {movement.quantityChanged > 0 ? "+" : ""}
                        {movement.quantityChanged}
                      </TableCell>
                      <TableCell>{movement.previousQuantity}</TableCell>
                      <TableCell>{movement.newQuantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          <p>{format(new Date(movement.timestamp), "MMM dd, yyyy")}</p>
                          <p className="text-xs">{format(new Date(movement.timestamp), "HH:mm:ss")}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {movement.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
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
