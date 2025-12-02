"use client"

import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sampleProducts } from "@/lib/sample-data"
import { Download } from "lucide-react"
import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

function ReportsContent() {
  const [timePeriod, setTimePeriod] = useState("30days")

  const lowStockProducts = sampleProducts.filter((p) => p.quantity < 10)
  const totalInventoryValue = sampleProducts.reduce((sum, p) => sum + p.quantity * p.costPrice, 0)
  const totalProducts = sampleProducts.length

  const getChartData = () => {
    const periods = {
      "7days": [
        { date: "Nov 23", stock: 125 },
        { date: "Nov 24", stock: 132 },
        { date: "Nov 25", stock: 145 },
        { date: "Nov 26", stock: 152 },
        { date: "Nov 29", stock: 156 },
      ],
      "30days": [
        { date: "Nov 1", stock: 145 },
        { date: "Nov 8", stock: 152 },
        { date: "Nov 15", stock: 138 },
        { date: "Nov 22", stock: 142 },
        { date: "Nov 29", stock: 156 },
      ],
      "90days": [
        { date: "Sep 1", stock: 98 },
        { date: "Sep 30", stock: 115 },
        { date: "Oct 30", stock: 142 },
        { date: "Nov 15", stock: 138 },
        { date: "Nov 29", stock: 156 },
      ],
      custom: [
        { date: "Nov 1", stock: 145 },
        { date: "Nov 8", stock: 152 },
        { date: "Nov 15", stock: 138 },
        { date: "Nov 22", stock: 142 },
        { date: "Nov 29", stock: 156 },
      ],
    }
    return periods[timePeriod as keyof typeof periods] || periods["30days"]
  }

  // Data for Bar Chart (Category Stock Value)
  const categoryData = Array.from(new Set(sampleProducts.map((p) => p.category))).map((category) => {
    const categoryProducts = sampleProducts.filter((p) => p.category === category)
    return {
      category,
      value: categoryProducts.reduce((sum, p) => sum + p.quantity * p.costPrice, 0),
      count: categoryProducts.length,
    }
  })

  // Data for Radar Chart (Product Performance)
  const radarData = sampleProducts.slice(0, 6).map((p) => ({
    name: p.name.split(" ")[0],
    stock: (p.quantity / 50) * 100,
    margin: ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100,
    velocity: Math.random() * 100,
  }))

  // Data for Composed Chart (Stock vs Revenue Potential)
  const composedData = sampleProducts.map((p) => ({
    name: p.name.split(" ")[0],
    stock: p.quantity,
    revenue: p.quantity * p.sellingPrice,
  }))

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Analyze inventory trends, stock levels, and performance metrics
          </p>
        </div>

        <div className="mb-6 p-4 bg-card border border-border rounded-lg">
          <p className="text-sm font-medium text-foreground mb-3">Time Period</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "7days", label: "Last 7 Days" },
              { value: "30days", label: "Last 30 Days" },
              { value: "90days", label: "Last 90 Days" },
              { value: "custom", label: "Custom Range" },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setTimePeriod(period.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timePeriod === period.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground border border-border hover:bg-muted/80"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: totalProducts },
            { label: "Low Stock Items", value: lowStockProducts.length },
            {
              label: "Inventory Value",
              value: `₹${totalInventoryValue.toLocaleString()}`,
            },
            {
              label: "Avg Stock Level",
              value: Math.round(sampleProducts.reduce((sum, p) => sum + p.quantity, 0) / totalProducts),
            },
          ].map((stat, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart: Stock Trends */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Stock Levels Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Line type="monotone" dataKey="stock" stroke="var(--color-foreground)" dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Category Stock Value */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Stock Value by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="category" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar dataKey="value" fill="var(--color-foreground)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Chart: Product Performance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Product Performance</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <PolarRadiusAxis stroke="var(--color-muted-foreground)" />
                <Radar name="Stock Level" dataKey="stock" stroke="var(--color-foreground)" />
                <Radar name="Margin %" dataKey="margin" stroke="var(--color-muted-foreground)" />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Composed Chart: Stock vs Revenue */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Stock vs Revenue Potential</h2>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={composedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Legend />
                <Bar dataKey="stock" fill="var(--color-muted)" />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-foreground)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold text-foreground">Low Stock Products</h2>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download size={16} />
                Export
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Product</TableHead>
                    <TableHead className="text-xs md:text-sm text-right">Current Stock</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{product.name}</TableCell>
                      <TableCell className="text-xs md:text-sm text-right">
                        <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded font-medium">
                          {product.quantity} units
                        </span>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{product.category}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden md:table-cell">
                        ₹{(product.quantity * product.costPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Categories by Stock Value</h2>
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const percentage = (cat.value / totalInventoryValue) * 100
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{cat.value.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-foreground transition-all" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  )
}
