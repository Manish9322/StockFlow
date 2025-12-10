"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  useGetStatisticsQuery,
  useGetAllUsersQuery,
} from "@/lib/utils/services/api"
import { 
  Users, 
  Package, 
  Activity, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Shield,
  FolderTree,
  Ruler,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

function AdminDashboardContent() {
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useGetStatisticsQuery(undefined)
  const { data: usersData } = useGetAllUsersQuery({ status: "all", role: "all" })

  const statistics = statsData?.statistics || null
  const recentUsers = usersData?.users?.slice(0, 5) || []

  const statCards = [
    {
      title: "Total Users",
      value: statistics?.users?.total || 0,
      subtitle: `${statistics?.users?.active || 0} active`,
      icon: Users,
      color: "text-foreground",
      bgColor: "bg-muted",
      link: "/admin/users",
    },
    {
      title: "Admin Users",
      value: statistics?.users?.admins || 0,
      subtitle: "System administrators",
      icon: Shield,
      color: "text-foreground",
      bgColor: "bg-muted",
      link: "/admin/users",
    },
    {
      title: "Total Products",
      value: statistics?.products?.total || 0,
      subtitle: `${statistics?.products?.lowStock || 0} low stock`,
      icon: Package,
      color: "text-foreground",
      bgColor: "bg-muted",
      link: "/admin/products",
    },
    {
      title: "System Activity",
      value: statistics?.activity?.recentActivity || 0,
      subtitle: "Last 30 days",
      icon: Activity,
      color: "text-foreground",
      bgColor: "bg-muted",
      link: "/admin/activities",
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              System overview and statistics
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.link}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subtitle}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">System Resources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.label} href={stat.link}>
                  <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>

        {/* Recent Users and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Users</h3>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === "admin" ? "default" : "outline"}>
                    {user.role}
                  </Badge>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users found
                </p>
              )}
            </div>
          </Card>

          {/* Activity Breakdown */}
          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Activity Overview</h3>
              <Link href="/admin/activities">
                <Button variant="ghost" size="sm">View All</Button>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                No activity data
              </p>
            )}
          </Card>
        </div>

        {/* Low Stock Alert */}
        {statistics?.products?.lowStock > 0 && (
          <Card className="p-4 border border-border bg-muted">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Low Stock Alert</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {statistics.products.lowStock} products are running low on stock. 
                  <Link href="/admin/products" className="ml-1 underline">
                    View products
                  </Link>
                </p>
              </div>
            </div>
          </Card>
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
