"use client"

import { useState, useEffect, useMemo } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  useGetStatisticsQuery,
  useGetAllUsersQuery,
  useGetMovementsQuery,
  useGetCategoriesQuery,
  useGetUnitTypesQuery,
  useGetProductsQuery,
} from "@/lib/utils/services/api"
import { 
  AlertCircle,
  RefreshCw,
  Package,
  FolderTree,
  Ruler,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

function AdminDashboardContent() {
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetStatisticsQuery(undefined)
  const { data: usersData } = useGetAllUsersQuery({ status: "all", role: "all" })
  const { data: movementsData } = useGetMovementsQuery({})
  const { data: categoriesData } = useGetCategoriesQuery({})
  const { data: unitTypesData } = useGetUnitTypesQuery({})
  const { data: productsData } = useGetProductsQuery({})

  const statistics = statsData?.statistics || null
  const recentUsers = usersData?.users?.slice(0, 5) || []
  const movements = movementsData?.data || []
  const categories = categoriesData?.data || []
  const unitTypes = unitTypesData?.data || []
  const products = productsData?.data || []

  // Prepare data for User Activity Line Graph (last 30 days)
  const userActivityData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })

    return last30Days.map(date => {
      const count = movements.filter((m: any) => {
        const movementDate = new Date(m.createdAt).toISOString().split('T')[0]
        return movementDate === date
      }).length
      const d = new Date(date)
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        activities: count
      }
    })
  }, [movements])

  // Prepare data for Category/Unit Type Bar Chart
  const categoryUnitData = useMemo(() => {
    // Count products per category
    const categoryCount = categories.map((cat: any) => {
      const count = products.filter((p: any) => p.category?._id === cat._id).length
      return { name: cat.name, count, type: 'Category' }
    }).slice(0, 5) // Top 5 categories

    // Count products per unit type
    const unitTypeCount = unitTypes.map((unit: any) => {
      const count = products.filter((p: any) => p.unitType?._id === unit._id).length
      return { name: unit.abbreviation, count, type: 'Unit' }
    }).slice(0, 5) // Top 5 unit types

    return [...categoryCount, ...unitTypeCount]
  }, [categories, unitTypes, products])

  const statCards = [
    {
      title: "Total Users",
      value: statistics?.users?.total || 0,
      subtitle: `${statistics?.users?.active || 0} active`,
    },
    {
      title: "Admin Users",
      value: statistics?.users?.admins || 0,
      subtitle: "System administrators",
    },
    {
      title: "Total Products",
      value: statistics?.products?.total || 0,
      subtitle: `${statistics?.products?.lowStock || 0} low stock`,
    },
    {
      title: "System Activity",
      value: statistics?.activity?.recentActivity || 0,
      subtitle: "Last 30 days",
    },
  ]

  const quickStats = [
    {
      label: "Categories",
      value: statistics?.system?.categories || 0,
      icon: FolderTree,
      link: "/admin/categories",
    },
    {
      label: "Unit Types",
      value: statistics?.system?.unitTypes || 0,
      icon: Ruler,
      link: "/admin/unit-types",
    },
    {
      label: "Movements",
      value: statistics?.system?.movements || 0,
      icon: TrendingUp,
      link: "/admin/activities",
    },
    {
      label: "Purchases",
      value: statistics?.system?.purchases || 0,
      icon: Package,
      link: "/admin/activities",
    },
  ]

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            System overview and statistics
          </p>
        </div>

        {/* Main Statistics Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 md:p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.title} className="bg-card border border-border rounded-lg p-4 md:p-6">
                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">{stat.title}</p>
                <p className="text-2xl md:text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </div>
            ))}
          </div>
        )}

        {/* System Resources */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">System Resources</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.label} href={stat.link}>
                  <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity Line Graph */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">User Activity Trend</h3>
              <p className="text-xs text-muted-foreground mt-1">Activities over the last 30 days</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activities" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category & Unit Type Bar Chart */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">Categories & Unit Types Usage</h3>
              <p className="text-xs text-muted-foreground mt-1">Top 5 categories and unit types by product count</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryUnitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Product Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Users and Activity */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Users</h3>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentUsers.map((user: any) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "outline"} className="ml-2">
                      {user.role}
                    </Badge>
                  </div>
                ))}
                {recentUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users found
                  </p>
                )}
              </div>
            </div>

            {/* Activity Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Activity Overview</h3>
                <Link href="/admin/activities">
                  <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                </Link>
              </div>
              {statistics?.activity?.movementsByType ? (
                <div className="space-y-3">
                  {Object.entries(statistics.activity.movementsByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground capitalize">{type}</span>
                      <span className="text-lg font-semibold text-foreground">{String(count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity data
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {statistics?.products?.lowStock > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">Low Stock Alert</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {statistics.products.lowStock} products are running low on stock. 
                  <Link href="/admin/products" className="ml-1 underline hover:text-foreground">
                    View products
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  )
}
