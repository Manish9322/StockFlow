"use client"

import { useState, useEffect, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getEventLogs, initializeSampleEvents, type EventType } from "@/lib/event-logger"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Eye, Activity, Users, FileText, TrendingUp, Trash2 } from "lucide-react"
import { toast } from "sonner"

function MovementHistoryContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | "all">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      // Initialize with sample events on first load
      initializeSampleEvents()
      const allEvents = getEventLogs()
      setEvents(allEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast.error("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  // Filter events based on search query and advanced filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (e) =>
          e.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.userName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.eventType === eventTypeFilter)
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(dateTo + "T23:59:59"))
    }

    return filtered
  }, [events, searchQuery, eventTypeFilter, dateFrom, dateTo])

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

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
    { value: "stock.changed", label: "Stock Changed" },
    { value: "purchase.created", label: "Purchase Created" },
    { value: "settings.changed", label: "Settings Changed" },
    { value: "auth.login", label: "Login" },
    { value: "auth.logout", label: "Logout" },
  ]

  const getEventColor = (eventType: EventType) => {
    const colors: Record<string, string> = {
      "product.created": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "product.updated": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
      "product.deleted": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "stock.changed": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      "purchase.created": "bg-primary/10 text-primary",
      "settings.changed": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "auth.login": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      "auth.logout": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    }
    return colors[eventType] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }

  const handleExportCSV = (format: "csv" | "excel" | "pdf") => {
    if (format === "csv") {
      const csv = [
        ["Timestamp", "User", "Event", "Description"].join(","),
        ...filteredEvents.map((e) =>
          [new Date(e.timestamp).toLocaleString(), e.userName, e.eventTitle, `"${e.description}"`].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `movement-history-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("CSV exported successfully")
    } else {
      toast.info(`${format.toUpperCase()} export coming soon!`)
    }
  }

  const openViewModal = (event: any) => {
    setSelectedEvent(event)
    setShowViewModal(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEventToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (eventToDelete) {
      setEvents(events.filter(e => e.id !== eventToDelete))
      toast.success("Event deleted successfully")
      setShowDeleteModal(false)
      setEventToDelete(null)
    }
  }

  // Get unique users
  const uniqueUsers = Array.from(new Set(events.map(e => e.userName))).length

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("history.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and track all important events and changes in your inventory system with detailed logs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Events</p>
                <p className="text-3xl font-bold text-foreground">{events.length}</p>
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
                  {events.filter(e => e.eventType.startsWith("product.")).length}
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
                  {events.filter(e => e.eventType === "stock.changed").length}
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
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No events found matching your search." : "No events yet."}
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
                      {paginatedEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm">
                            {new Date(event.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">{event.userName}</TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(event.eventType)}`}
                            >
                              {event.eventTitle}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-md">
                            <div className="truncate">{event.description}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                onClick={() => openViewModal(event)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteEvent(event.id)}
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
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    of {filteredEvents.length} events
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
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Timestamp</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">User</label>
                  <p className="text-sm text-foreground">{selectedEvent.userName}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Event Type</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventColor(selectedEvent.eventType)}`}
                >
                  {selectedEvent.eventTitle}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <p className="text-sm text-foreground">{selectedEvent.description}</p>
              </div>
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Additional Details</label>
                  <div className="border border-border rounded-md p-3 bg-muted/30">
                    <pre className="text-xs text-foreground overflow-x-auto">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
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
                  setSelectedEvent(null)
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
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Event</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this event from the history? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setEventToDelete(null)
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

export default function MovementHistory() {
  return (
    <ProtectedRoute>
      <MovementHistoryContent />
    </ProtectedRoute>
  )
}
