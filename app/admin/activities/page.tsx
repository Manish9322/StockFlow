"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Card } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetMovementsQuery } from "@/lib/utils/services/api"
import { 
  Activity, 
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Package,
  Edit,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Activities</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all product movements and changes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Added</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.added}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Updated</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.updated}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Removed</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.removed}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Purchases</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.purchases}</p>
          </Card>
          <Card className="p-4 border border-border">
            <p className="text-sm text-muted-foreground">Refills</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.refills}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Search Activities</Label>
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
              <Label>Event Type</Label>
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
        </Card>

        {/* Activities Table */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                Activities ({filteredMovements.length})
              </h3>
            </div>
          </div>
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
            <div className="p-4 border-t border-border flex items-center justify-between">
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
        </Card>
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
