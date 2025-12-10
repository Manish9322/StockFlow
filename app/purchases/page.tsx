"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Eye, Pencil, Trash2, ShoppingCart, DollarSign, Package, TrendingUp, FileText, Building2 } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface PurchaseItem {
  product: any
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Purchase {
  _id: string
  purchaseId: string
  date: string
  items: PurchaseItem[]
  subtotal?: number
  taxDetails?: {
    gst: number
    platformFee: number
    otherTaxes: Array<{
      name: string
      rate: number
      type: string
      amount: number
    }>
    totalTax: number
  }
  totalAmount: number
  status: string
  supplier: string
  paymentMethod: string
  notes?: string
}

function PurchasesContent() {
  const { t } = useLanguage()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Fetch purchases on mount
  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch("/api/purchase", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      
      if (data.success) {
        setPurchases(data.data)
      } else {
        toast.error("Failed to fetch purchases")
      }
    } catch (error) {
      console.error("Error fetching purchases:", error)
      toast.error("Failed to fetch purchases")
    } finally {
      setLoading(false)
    }
  }

  // Filter purchases based on search query and advanced filters
  const filteredPurchases = useMemo(() => {
    let filtered = purchases
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.purchaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          purchase.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          purchase.status.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(purchase => purchase.status.toLowerCase() === statusFilter.toLowerCase())
    }
    
    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(purchase => new Date(purchase.date).toISOString().split('T')[0] >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(purchase => new Date(purchase.date).toISOString().split('T')[0] <= dateTo)
    }
    
    return filtered
  }, [searchQuery, purchases, statusFilter, dateFrom, dateTo])

  // Pagination calculations
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, dateFrom, dateTo])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  const handleExportCSV = (format: "csv" | "excel" | "pdf") => {
    let content = ""

    if (format === "csv") {
      // CSV header
      const headers = ["Purchase ID", "Date", "Products", "Total Items", "Amount (₹)", "Status", "Supplier", "Payment Method"]
      
      // CSV rows
      const rows = purchases.map((p) => {
        const productsStr = p.items.map(item => `${item.productName} (${item.quantity})`).join("; ")
        const totalItems = p.items.reduce((sum, item) => sum + item.quantity, 0)
        return [
          p.purchaseId,
          new Date(p.date).toLocaleDateString(),
          `"${productsStr}"`,
          totalItems,
          p.totalAmount,
          p.status,
          p.supplier,
          p.paymentMethod
        ].join(",")
      })
      
      content = [headers.join(","), ...rows].join("\n")

      const blob = new Blob([content], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `purchases-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("CSV exported successfully")
    } else {
      toast.info(`${format.toUpperCase()} export coming soon!`)
    }
  }

  const openViewModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  const openEditModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setEditFormData({
      date: new Date(purchase.date).toISOString().split('T')[0],
      status: purchase.status,
      supplier: purchase.supplier,
      paymentMethod: purchase.paymentMethod,
      notes: purchase.notes || "",
    })
    setShowEditModal(true)
  }

  const handleUpdatePurchase = async () => {
    if (!selectedPurchase) return
    
    try {
      const response = await fetch(`/api/purchase/${selectedPurchase._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success("Purchase updated successfully")
        fetchPurchases()
        setShowEditModal(false)
        setSelectedPurchase(null)
      } else {
        toast.error(data.error || "Failed to update purchase")
      }
    } catch (error) {
      console.error("Error updating purchase:", error)
      toast.error("Failed to update purchase")
    }
  }

  const handleDeletePurchase = (id: string) => {
    setPurchaseToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (purchaseToDelete) {
      try {
        const response = await fetch(`/api/purchase/${purchaseToDelete}`, {
          method: "DELETE",
        })
        
        const data = await response.json()
        
        if (data.success) {
          toast.success("Purchase deleted successfully")
          fetchPurchases()
        } else {
          toast.error(data.error || "Failed to delete purchase")
        }
      } catch (error) {
        console.error("Error deleting purchase:", error)
        toast.error("Failed to delete purchase")
      } finally {
        setShowDeleteModal(false)
        setPurchaseToDelete(null)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-primary/10 text-primary"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const openInvoiceModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowInvoiceModal(true)
  }

  const handleDownloadInvoice = async () => {
    if (!selectedPurchase || !invoiceRef.current) {
      toast.error("Please select a purchase first")
      return
    }

    setIsDownloading(true)
    const loadingToastId = toast.loading("Generating PDF...")

    try {
      // Wait for modal content to be fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300))

      const invoiceElement = invoiceRef.current

      if (!invoiceElement) {
        throw new Error("Invoice element not found")
      }

      // Temporarily make the modal content visible for capture
      const originalDisplay = invoiceElement.style.display
      invoiceElement.style.display = 'block'

      // Suppress console warnings from html2canvas
      const originalWarn = console.warn
      const originalError = console.error
      console.warn = () => {}
      console.error = (...args) => {
        // Only suppress color parsing errors
        const msg = args[0]
        if (typeof msg === 'string' && msg.includes('color')) return
        originalError.apply(console, args)
      }

      // Convert HTML to canvas with optimized settings
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: invoiceElement.scrollWidth,
        height: invoiceElement.scrollHeight,
        windowWidth: invoiceElement.scrollWidth,
        windowHeight: invoiceElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        ignoreElements: (element) => {
          // Ignore elements that might cause color parsing issues
          return element.classList?.contains('dark') || false
        },
        onclone: (clonedDoc) => {
          // Remove any problematic CSS variables or color functions
          const clonedElement = clonedDoc.querySelector('[ref]') || clonedDoc.body
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.colorScheme = 'light'
          }
        }
      })

      // Restore console methods
      console.warn = originalWarn
      console.error = originalError

      // Restore original display
      invoiceElement.style.display = originalDisplay

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Failed to create canvas from invoice")
      }

      // Get canvas dimensions
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height

      // Calculate PDF dimensions (A4: 210mm x 297mm)
      const pdfWidth = 210
      const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth

      // Create PDF instance
      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      })

      // Convert canvas to image data
      const imgData = canvas.toDataURL("image/png", 1.0)

      // Add image to PDF with proper dimensions
      if (pdfHeight > 297) {
        // If content is longer than one page, fit to width
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      } else {
        // Fit content on single page
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      }

      // Generate filename with purchase ID
      const filename = `purchase-invoice-${selectedPurchase.purchaseId}.pdf`

      // Save the PDF
      pdf.save(filename)

      toast.dismiss(loadingToastId)
      toast.success("Invoice downloaded successfully!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss(loadingToastId)
      
      if (error instanceof Error) {
        toast.error(`Failed to generate PDF: ${error.message}`)
      } else {
        toast.error("Failed to generate PDF. Please try again.")
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("purchases.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View all purchase orders with detailed history, filtering options, and export capabilities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Purchases</p>
                <p className="text-3xl font-bold text-foreground">{purchases.length}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</p>
                <p className="text-3xl font-bold text-foreground">
                  ₹{purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Items</p>
                <p className="text-3xl font-bold text-foreground">
                  {purchases.reduce((sum, p) => sum + p.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Purchased</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-foreground">
                  {purchases.filter(p => p.status.toLowerCase() === "completed").length}
                </p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="h-11 w-11 rounded-md from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
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
                placeholder="Search purchases..."
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
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
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
                    setStatusFilter("all")
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

          {/* Purchases Table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading purchases...</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No purchases found matching your search." : "No purchases yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Purchase ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Date</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Products</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Supplier</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-foreground">Total Items</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-foreground">Amount</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedPurchases.map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{purchase.purchaseId}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(purchase.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="max-w-[200px]">
                            {purchase.items.length === 1 ? (
                              <span className="font-medium">{purchase.items[0].productName}</span>
                            ) : (
                              <span className="text-muted-foreground">{purchase.items.length} items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{purchase.supplier}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">₹{purchase.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}
                          >
                            {purchase.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(purchase)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => openInvoiceModal(purchase)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="View Invoice"
                            >
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => openEditModal(purchase)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeletePurchase(purchase._id)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-muted-foreground">
                  entries (Showing {startIndex + 1}-{Math.min(endIndex, filteredPurchases.length)} of {filteredPurchases.length})
                </span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3"
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first page, last page, current page, and pages around current
                      if (page === 1 || page === totalPages) return true
                      if (page >= currentPage - 1 && page <= currentPage + 1) return true
                      return false
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1]
                      const showEllipsis = prevPage && page - prevPage > 1
                      
                      return (
                        <div key={page} className="flex gap-1">
                          {showEllipsis && (
                            <span className="px-3 py-1.5 text-sm text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="px-3 min-w-10"
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3"
                >
                  Last
                </Button>
              </div>
            </div>
          </>
          )}
        </div>
      </div>

      {/* View Purchase Modal */}
      {showViewModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">Purchase Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Purchase ID</label>
                <p className="text-sm text-foreground font-medium">{selectedPurchase.purchaseId}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                  <p className="text-sm text-foreground">{new Date(selectedPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPurchase.status)}`}
                  >
                    {selectedPurchase.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Products</label>
                <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productSku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground">Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">₹{item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Supplier</label>
                <p className="text-sm text-foreground">{selectedPurchase.supplier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Total Items</label>
                <p className="text-sm text-foreground">{selectedPurchase.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
              
              {/* Price Breakdown */}
              <div className="border border-border rounded-md p-3 bg-muted/30 space-y-2">
                <h3 className="text-sm font-semibold text-foreground mb-2">Price Breakdown</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">₹{(selectedPurchase.subtotal || selectedPurchase.totalAmount).toFixed(2)}</span>
                  </div>
                  
                  {selectedPurchase.taxDetails?.gst && selectedPurchase.taxDetails.gst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST:</span>
                      <span className="font-medium">₹{selectedPurchase.taxDetails.gst.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {selectedPurchase.taxDetails?.platformFee && selectedPurchase.taxDetails.platformFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee:</span>
                      <span className="font-medium">₹{selectedPurchase.taxDetails.platformFee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {selectedPurchase.taxDetails?.otherTaxes && selectedPurchase.taxDetails.otherTaxes.length > 0 && (
                    <>
                      {selectedPurchase.taxDetails.otherTaxes.map((tax, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{tax.name}:</span>
                          <span className="font-medium">₹{tax.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {selectedPurchase.taxDetails?.totalTax && selectedPurchase.taxDetails.totalTax > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground font-medium">Total Tax:</span>
                      <span className="font-medium">₹{selectedPurchase.taxDetails.totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="font-semibold text-foreground">Grand Total:</span>
                    <span className="font-bold text-primary">₹{selectedPurchase.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Payment Method</label>
                <p className="text-sm text-foreground">{selectedPurchase.paymentMethod}</p>
              </div>
              {selectedPurchase.notes && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                  <p className="text-sm text-foreground">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedPurchase(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(selectedPurchase)
                }}
                className="flex-1"
              >
                Edit Purchase
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {showEditModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-3xl w-full">
            <h2 className="text-lg font-semibold text-foreground mb-6">Edit Purchase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Purchase ID</label>
                <Input value={selectedPurchase.purchaseId} disabled className="bg-muted" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <Input
                  type="date"
                  value={editFormData.date || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Supplier</label>
                <Input
                  value={editFormData.supplier || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                <select
                  value={editFormData.paymentMethod || "Cash"}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={editFormData.status || "Completed"}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                <textarea
                  value={editFormData.notes || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Add notes..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Products (Read-only)</label>
                <div className="border border-border rounded-md p-3 bg-muted/30 space-y-2">
                  {selectedPurchase.items.map((item, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      {item.productName} - Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)} = ₹{item.subtotal.toFixed(2)}
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border font-medium text-foreground">
                    Total: ₹{selectedPurchase.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedPurchase(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePurchase}
                className="flex-1"
              >
                Update Purchase
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Purchase</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this purchase record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setPurchaseToDelete(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} className="flex-1">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-white text-black p-4 sm:p-6 overflow-y-auto">
              <div ref={invoiceRef}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 className="h-8 w-8" style={{ color: '#000' }}/>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Stock-Flow</h1>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#555' }}>
                    <p style={{ margin: 0 }}>Inventory Management</p>
                    <p style={{ margin: 0 }}>Stock-Flow System</p>
                  </div>
                </div>

                {/* Payment Receipt Title and Details */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Purchase Invoice</h2>
                  <table style={{ width: '100%', fontSize: '0.9rem' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Supplier:</td>
                        <td style={{ padding: '0.5rem' }}>{selectedPurchase.supplier}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Invoice Date:</td>
                        <td style={{ padding: '0.5rem' }}>{new Date(selectedPurchase.date).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Payment Method:</td>
                        <td style={{ padding: '0.5rem' }}>{selectedPurchase.paymentMethod}</td>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Time:</td>
                        <td style={{ padding: '0.5rem' }}>{new Date(selectedPurchase.date).toLocaleTimeString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.5rem', fontWeight: '600' }}>Invoice Number:</td>
                        <td colSpan={3} style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{selectedPurchase.purchaseId}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Purchase Details</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #eee' }}>Product</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #eee' }}>Qty</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Unit Price</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.items.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '0.75rem', border: '1px solid #eee' }}>
                            <div>
                              <div style={{ fontWeight: '500' }}>{item.productName}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>SKU: {item.productSku}</div>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #eee' }}>{item.quantity}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{item.unitPrice.toLocaleString()}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{item.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Subtotal</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{(selectedPurchase.subtotal || selectedPurchase.totalAmount).toLocaleString()}</td>
                      </tr>
                      {selectedPurchase.taxDetails?.gst && selectedPurchase.taxDetails.gst > 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>GST</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{selectedPurchase.taxDetails.gst.toFixed(2)}</td>
                        </tr>
                      )}
                      {selectedPurchase.taxDetails?.platformFee && selectedPurchase.taxDetails.platformFee > 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Platform Fee</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{selectedPurchase.taxDetails.platformFee.toFixed(2)}</td>
                        </tr>
                      )}
                      {selectedPurchase.taxDetails?.otherTaxes && selectedPurchase.taxDetails.otherTaxes.length > 0 && (
                        <>
                          {selectedPurchase.taxDetails.otherTaxes.map((tax, index) => (
                            <tr key={index}>
                              <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>{tax.name}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{tax.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                      {selectedPurchase.taxDetails?.totalTax && selectedPurchase.taxDetails.totalTax > 0 && (
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Total Tax</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{selectedPurchase.taxDetails.totalTax.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ fontWeight: 'bold', backgroundColor: '#f9fafb' }}>
                        <td colSpan={3} style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>Total Amount</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #eee' }}>₹{selectedPurchase.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Notes Section */}
                {selectedPurchase.notes && (
                  <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #eee', borderRadius: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Notes:</h3>
                    <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>{selectedPurchase.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '2px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#555' }}>
                    <p style={{ margin: 0 }}>Thank you for your purchase!</p>
                    <p style={{ margin: 0 }}>This is a computer-generated invoice and does not require a signature.</p>
                  </div>
                  <div style={{ border: '3px solid #22c55e', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '0.25rem', transform: 'rotate(-10deg)', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    PAID
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-4 border-t px-4 sm:px-6 pb-4 flex gap-3">
              <Button
                onClick={() => {
                  setShowInvoiceModal(false)
                  setSelectedPurchase(null)
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Generating PDF..." : "Print / Download"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default function Purchases() {
  return (
    <ProtectedRoute>
      <PurchasesContent />
    </ProtectedRoute>
  )
}
