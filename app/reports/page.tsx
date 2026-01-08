"use client"

import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Calendar, Clock } from "lucide-react"
import { useState, useMemo } from "react"
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
import { useGetProductsQuery, useGetMovementsQuery } from "@/lib/utils/services/api"

interface Product {
  _id: string
  name: string
  sku: string
  quantity: number
  category: {
    _id: string
    name: string
  }
  unitType: {
    _id: string
    name: string
    abbreviation: string
  }
  costPrice: number
  sellingPrice: number
  supplier: string
  minStockAlert: number
  updatedAt: string
  createdAt: string
}

interface Movement {
  _id: string
  productId: string
  productName: string
  eventType: string
  quantityChange: number
  timestamp: string
  userId?: string
  description?: string
}

function ReportsContent() {
  const [timePeriod, setTimePeriod] = useState("30days")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({})
  const { data: movementsData, isLoading: movementsLoading } = useGetMovementsQuery({})
  
  const products: Product[] = productsData?.data || []
  const movements: Movement[] = movementsData?.data || []

  // Filter movements based on selected time period
  const filteredMovements = useMemo(() => {
    if (timePeriod === "custom" && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)
      endDate.setHours(23, 59, 59, 999) // Include the entire end day
      
      return movements.filter((m) => {
        const movementDate = new Date(m.timestamp)
        return movementDate >= startDate && movementDate <= endDate
      })
    }
    
    const daysMap = {
      "7days": 7,
      "30days": 30,
      "90days": 90,
      custom: 30,
    }
    
    const days = daysMap[timePeriod as keyof typeof daysMap] || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return movements.filter((m) => new Date(m.timestamp) >= cutoffDate)
  }, [movements, timePeriod, customStartDate, customEndDate])

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.quantity < p.minStockAlert)
  }, [products])

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0)
  }, [products])

  const totalProducts = products.length

  // Calculate movement statistics for the selected period
  const movementStats = useMemo(() => {
    const totalMovements = filteredMovements.length
    const stockIn = filteredMovements
      .filter((m) => (m.quantityChange || 0) > 0)
      .reduce((sum, m) => sum + (m.quantityChange || 0), 0)
    const stockOut = Math.abs(
      filteredMovements
        .filter((m) => (m.quantityChange || 0) < 0)
        .reduce((sum, m) => sum + (m.quantityChange || 0), 0)
    )
    
    return { totalMovements, stockIn, stockOut }
  }, [filteredMovements])

  const getChartData = () => {
    const now = new Date()
    const getDateRange = (days: number) => {
      const endDate = new Date(now)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - days)
      return { startDate, endDate }
    }

    let startDate: Date
    let endDate: Date
    let days: number

    if (timePeriod === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      const daysMap = {
        "7days": 7,
        "30days": 30,
        "90days": 90,
        custom: 30,
      }
      days = daysMap[timePeriod as keyof typeof daysMap] || 30
      const dateRange = getDateRange(days)
      startDate = dateRange.startDate
      endDate = dateRange.endDate
    }

    // Get current total stock
    const currentStock = products.reduce((sum, p) => sum + p.quantity, 0)

    // Sort all movements by date (oldest first)
    const sortedMovements = [...movements].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Calculate stock at different points in time
    const dataPoints: { date: string; stock: number }[] = []
    const pointCount = days <= 7 ? days : days <= 30 ? 8 : 10
    const interval = Math.floor(days / pointCount)

    for (let i = 0; i <= pointCount; i++) {
      const pointDate = new Date(startDate)
      pointDate.setDate(pointDate.getDate() + i * interval)
      
      const dateStr = pointDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      
      // Calculate stock at this point by working backwards from current stock
      const movementsAfterPoint = sortedMovements.filter((m) => new Date(m.timestamp) > pointDate)
      const stockAtPoint = currentStock - movementsAfterPoint.reduce((sum, m) => {
        return sum + (m.quantityChange || 0)
      }, 0)
      
      dataPoints.push({ date: dateStr, stock: Math.max(0, Math.round(stockAtPoint)) })
    }

    return dataPoints.length > 0 ? dataPoints : [{ date: "Today", stock: currentStock }]
  }

  // Data for Bar Chart (Category Stock Value)
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { value: number; count: number }>()
    
    products.forEach((p) => {
      const categoryName = p.category?.name || "Uncategorized"
      const existing = categoryMap.get(categoryName) || { value: 0, count: 0 }
      categoryMap.set(categoryName, {
        value: existing.value + p.quantity * p.costPrice,
        count: existing.count + 1,
      })
    })

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        value: Math.round(data.value),
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value) // Sort by value descending
  }, [products])

  // Data for Radar Chart (Product Performance)
  const radarData = useMemo(() => {
    return products.slice(0, 6).map((p) => {
      // Calculate velocity based on movements in the selected time period
      const productMovements = filteredMovements.filter((m) => m.productId === p._id)
      const totalMovement = Math.abs(
        productMovements.reduce((sum, m) => sum + Math.abs(m.quantityChange || 0), 0)
      )
      // Normalize velocity to 0-100 scale (assuming max 100 units moved is 100%)
      const velocity = Math.min((totalMovement / 100) * 100, 100)
      
      return {
        name: p.name.split(" ")[0],
        stock: Math.min((p.quantity / (p.minStockAlert * 5)) * 100, 100),
        margin: ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100,
        velocity: Math.round(velocity),
      }
    })
  }, [products, filteredMovements])

  // Data for Composed Chart (Stock vs Revenue Potential)
  const composedData = useMemo(() => {
    // Sort products by stock value to show top performers
    const sortedProducts = [...products]
      .sort((a, b) => (b.quantity * b.sellingPrice) - (a.quantity * a.sellingPrice))
      .slice(0, 10)
    
    return sortedProducts.map((p) => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      stock: p.quantity,
      revenue: Math.round(p.quantity * p.sellingPrice),
    }))
  }, [products])

  if (productsLoading || movementsLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Reports</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Analyze inventory trends, stock levels, and performance metrics
            </p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Analyze inventory trends, stock levels, and performance metrics
          </p>
        </div>

        <div className="mb-4 bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-card to-muted/30 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">Time Period</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Select reporting timeframe</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {[
                { value: "7days", label: "Last 7 Days", desc: "1 week" },
                { value: "30days", label: "Last 30 Days", desc: "1 month" },
                { value: "90days", label: "Last 90 Days", desc: "3 months" },
                { value: "custom", label: "Custom Range", desc: "Select dates" },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setTimePeriod(period.value)}
                  className={`group relative flex-1 min-w-[140px] px-5 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timePeriod === period.value
                      ? "bg-foreground text-background scale-[1.02]"
                      : "bg-muted/50 text-foreground border border-border hover:border-foreground/40"
                  }`}
                >
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Clock className={`w-3.5 h-3.5 ${timePeriod === period.value ? 'opacity-100' : 'opacity-60'}`} />
                      <span className="font-semibold">{period.label}</span>
                    </div>
                    <span className={`text-xs mt-1 ${timePeriod === period.value ? 'opacity-90' : 'opacity-60'}`}>
                      {period.desc}
                    </span>
                  </div>
                  {timePeriod === period.value && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-background/30"></div>
                  )}
                </button>
              ))}
            </div>            
            {/* Custom Date Range Picker */}
            {timePeriod === "custom" && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                    />
                  </div>
                </div>
                {customStartDate && customEndDate && (
                  <div className="mt-4 px-4 py-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Selected Range:</span>{" "}
                      {new Date(customStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {" "}-{" "}
                      {new Date(customEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {" "}({Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                    </p>
                  </div>
                )}
              </div>
            )}          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Products", value: totalProducts, tooltip: "Total number of products in inventory" },
            { label: "Low Stock Items", value: lowStockProducts.length, tooltip: "Products below minimum stock alert" },
            {
              label: "Inventory Value",
              value: `₹${Math.round(totalInventoryValue).toLocaleString()}`,
              tooltip: "Total value of all inventory at cost price"
            },
            {
              label: "Total Movements",
              value: movementStats.totalMovements,
              tooltip: `Stock movements in selected period`
            },
          ].map((stat, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-4 md:p-6" title={stat.tooltip}>
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Additional Movement Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div 
            className="bg-card border border-border rounded-lg p-4 md:p-6" 
            title="Total units added to inventory in selected period"
          >
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Stock In</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">
              +{movementStats.stockIn.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">units added</p>
          </div>
          <div 
            className="bg-card border border-border rounded-lg p-4 md:p-6"
            title="Total units removed from inventory in selected period"
          >
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Stock Out</p>
            <p className="text-xl md:text-2xl font-bold text-red-600">
              -{movementStats.stockOut.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">units removed</p>
          </div>
          <div 
            className="bg-card border border-border rounded-lg p-4 md:p-6"
            title="Net stock change (in - out) for selected period"
          >
            <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Net Change</p>
            <p className={`text-xl md:text-2xl font-bold ${(movementStats.stockIn - movementStats.stockOut) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(movementStats.stockIn - movementStats.stockOut) >= 0 ? '+' : ''}{(movementStats.stockIn - movementStats.stockOut).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">net units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Line Chart: Stock Trends */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Stock Levels Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: '12px'
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
                <XAxis dataKey="category" stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: '12px'
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
                <PolarAngleAxis dataKey="name" stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <PolarRadiusAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '10px' }} />
                <Radar name="Stock Level" dataKey="stock" stroke="var(--color-foreground)" />
                <Radar name="Margin %" dataKey="margin" stroke="var(--color-muted-foreground)" />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Composed Chart: Stock vs Revenue */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Stock vs Revenue Potential</h2>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={composedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="stock" fill="var(--color-muted)" />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-foreground)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 mb-4">
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
                  {lowStockProducts.length > 0 ? (
                    lowStockProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell className="font-medium text-xs md:text-sm">{product.name}</TableCell>
                        <TableCell className="text-xs md:text-sm text-right">
                          <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded font-medium">
                            {product.quantity} {product.unitType?.abbreviation || 'units'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden sm:table-cell">{product.category?.name || 'Uncategorized'}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell">
                          ₹{(product.quantity * product.costPrice).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No low stock products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Categories by Stock Value</h2>
            <div className="space-y-4">
              {categoryData.length > 0 ? (
                categoryData.map((cat) => {
                  const percentage = totalInventoryValue > 0 ? (cat.value / totalInventoryValue) * 100 : 0
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
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No category data available
                </div>
              )}
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
