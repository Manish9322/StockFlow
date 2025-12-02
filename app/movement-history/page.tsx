"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getEventLogs, initializeSampleEvents, type EventType } from "@/lib/event-logger"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"

function MovementHistoryContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | "all">("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Initialize with sample events on first load
    initializeSampleEvents()
    const allEvents = getEventLogs()
    setEvents(allEvents)
    setFilteredEvents(allEvents)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = [...events]

    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.userName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.eventType === eventTypeFilter)
    }

    if (dateFromFilter) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(dateFromFilter))
    }

    if (dateToFilter) {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(dateToFilter + "T23:59:59"))
    }

    setFilteredEvents(filtered)
    setCurrentPage(1)
  }, [events, searchQuery, eventTypeFilter, dateFromFilter, dateToFilter])

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

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
      "product.created": "bg-blue-50 text-blue-700",
      "product.updated": "bg-cyan-50 text-cyan-700",
      "product.deleted": "bg-red-50 text-red-700",
      "stock.changed": "bg-yellow-50 text-yellow-700",
      "purchase.created": "bg-green-50 text-green-700",
      "settings.changed": "bg-purple-50 text-purple-700",
      "auth.login": "bg-gray-50 text-gray-700",
      "auth.logout": "bg-gray-50 text-gray-700",
    }
    return colors[eventType] || "bg-gray-50 text-gray-700"
  }

  const handleExportCSV = () => {
    const csv = [
      ["Timestamp", "User", "Event", "Description"].join(","),
      ...filteredEvents.map((e) =>
        [new Date(e.timestamp).toLocaleString(), e.userName, e.eventTitle, e.description].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `movement-history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("history.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and track all important events and changes in your inventory system with detailed logs
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex-shrink-0"
                />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
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
              <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">To Date</label>
              <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
            </div>

            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Timestamp</TableHead>
                  <TableHead className="text-xs md:text-sm">User</TableHead>
                  <TableHead className="text-xs md:text-sm">Event Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs md:text-sm font-mono">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{event.userName}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventColor(event.eventType)}`}
                      >
                        {event.eventTitle}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm max-w-xs truncate">{event.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEvents.length)} of{" "}
              {filteredEvents.length} events
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-transparent"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      currentPage === page
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground hover:bg-border"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-transparent"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
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
