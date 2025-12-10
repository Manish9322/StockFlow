"use client"

import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { 
  useGetStatisticsQuery,
  useGetCategoriesQuery,
  useGetUnitTypesQuery,
} from "@/lib/utils/services/api"
import { 
  FolderTree,
  Ruler,
  Shield,
  User,
  Mail,
  RefreshCw,
  Users,
  Package,
  Activity,
} from "lucide-react"
import Link from "next/link"

function AdminSettingsContent() {
  const { user } = useAuth()
  const { data: statsData, refetch } = useGetStatisticsQuery(undefined)
  const { data: categoriesData } = useGetCategoriesQuery({})
  const { data: unitTypesData } = useGetUnitTypesQuery({})

  const statistics = statsData?.statistics || null

  const quickLinks = [
    {
      title: "User Management",
      description: "Manage user accounts and permissions",
      icon: Users,
      href: "/admin/users",
      stat: statistics?.users?.total || 0,
      statLabel: "users",
    },
    {
      title: "Categories",
      description: "Manage product categories",
      icon: FolderTree,
      href: "/admin/categories",
      stat: categoriesData?.categories?.length || 0,
      statLabel: "categories",
    },
    {
      title: "Unit Types",
      description: "Manage measurement units",
      icon: Ruler,
      href: "/admin/unit-types",
      stat: unitTypesData?.unitTypes?.length || 0,
      statLabel: "unit types",
    },
    {
      title: "All Products",
      description: "View products across all users",
      icon: Package,
      href: "/admin/products",
      stat: statistics?.products?.total || 0,
      statLabel: "products",
    },
    {
      title: "System Activities",
      description: "Track all system movements",
      icon: Activity,
      href: "/admin/activities",
      stat: statistics?.system?.movements || 0,
      statLabel: "activities",
    },
  ]

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Admin Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            System configuration and management
          </p>
        </div>

        {/* Admin Profile */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Admin Profile</h2>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant="default" className="mt-1">Admin</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* System Configuration */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-semibold text-foreground">System Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <div className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                      <Badge variant="outline">{link.stat}</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{link.title}</h4>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {link.stat} {link.statLabel}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System Statistics */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <h2 className="text-lg font-semibold text-foreground">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Total Users</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{statistics?.users?.total || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Admins</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{statistics?.users?.admins || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Products</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{statistics?.products?.total || 0}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">Recent Activity</p>
              <p className="text-2xl md:text-2xl font-semibold text-foreground">{statistics?.activity?.recentActivity || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function AdminSettings() {
  return (
    <AdminRoute>
      <AdminSettingsContent />
    </AdminRoute>
  )
}
