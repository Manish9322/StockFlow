"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { useLanguage } from "@/lib/language-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

// Sample purchase history data
const samplePurchases = [
  {
    id: "PUR-001",
    date: "2024-11-26",
    product: "Laptop Computer",
    quantity: 5,
    amount: 4495,
    status: "Completed",
  },
  {
    id: "PUR-002",
    date: "2024-11-25",
    product: "Wireless Mouse",
    quantity: 20,
    amount: 249.8,
    status: "Completed",
  },
  {
    id: "PUR-003",
    date: "2024-11-24",
    product: "USB-C Cable",
    quantity: 50,
    amount: 99.5,
    status: "Pending",
  },
]

function PurchasesContent() {
  const { t } = useLanguage()
  const [purchases] = useState(samplePurchases)

  const handleExportCSV = (format: "csv" | "excel" | "pdf") => {
    let content = ""

    if (format === "csv") {
      content = [
        ["Purchase ID", "Date", "Product", "Quantity", "Amount (₹)", "Status"].join(","),
        ...purchases.map((p) => [p.id, p.date, p.product, p.quantity, p.amount, p.status].join(",")),
      ].join("\n")

      const blob = new Blob([content], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `purchases-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      alert(`${format.toUpperCase()} export coming soon!`)
    }
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("purchases.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View all purchase orders with detailed history, filtering options, and export capabilities
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            onClick={() => handleExportCSV("csv")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download size={14} />
            {t("purchases.export_csv")}
          </Button>
          <Button
            onClick={() => handleExportCSV("excel")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download size={14} />
            {t("purchases.export_excel")}
          </Button>
          <Button
            onClick={() => handleExportCSV("pdf")}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <Download size={14} />
            {t("purchases.export_pdf")}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">{t("purchases.date")}</TableHead>
                  <TableHead className="text-xs md:text-sm">{t("purchases.product")}</TableHead>
                  <TableHead className="text-xs md:text-sm text-right">{t("purchases.quantity")}</TableHead>
                  <TableHead className="text-xs md:text-sm text-right">{t("purchases.amount")}</TableHead>
                  <TableHead className="text-xs md:text-sm">{t("purchases.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="text-xs md:text-sm font-mono">{purchase.date}</TableCell>
                    <TableCell className="text-xs md:text-sm">{purchase.product}</TableCell>
                    <TableCell className="text-xs md:text-sm text-right">{purchase.quantity}</TableCell>
                    <TableCell className="text-xs md:text-sm text-right">₹{purchase.amount}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          purchase.status === "Completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
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
