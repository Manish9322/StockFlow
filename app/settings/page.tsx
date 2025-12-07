"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useGetCategoriesQuery, useAddCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useGetUnitTypesQuery, useAddUnitTypeMutation, useUpdateUnitTypeMutation, useDeleteUnitTypeMutation } from "@/lib/utils/services/api"
import { toast } from "sonner"
import { Eye, Pencil, Trash2, Plus } from "lucide-react"

interface Category {
  _id: string
  name: string
  description: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

interface UnitType {
  _id: string
  name: string
  abbreviation: string
  description: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

function SettingsContent() {
  const { user, logout } = useAuth()
  const router = useRouter()

  // RTK Query hooks
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery({})
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  const { data: unitTypesData, isLoading: unitTypesLoading, error: unitTypesError } = useGetUnitTypesQuery({})
  const [addUnitType, { isLoading: isAddingUnit }] = useAddUnitTypeMutation()
  const [updateUnitType, { isLoading: isUpdatingUnit }] = useUpdateUnitTypeMutation()
  const [deleteUnitType, { isLoading: isDeletingUnit }] = useDeleteUnitTypeMutation()

  const [activeTab, setActiveTab] = useState("profile")

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // UnitType modal states
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [showEditUnitModal, setShowEditUnitModal] = useState(false)
  const [showViewUnitModal, setShowViewUnitModal] = useState(false)
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null)

  // Delete confirmation modal states
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [showDeleteUnitTypeModal, setShowDeleteUnitTypeModal] = useState(false)
  const [unitTypeToDelete, setUnitTypeToDelete] = useState<string | null>(null)

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "",
  })

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    currency: "INR",
    timezone: "UTC",
    darkMode: false,
    emailNotifications: true,
    weeklyReports: true,
  })

  // Get categories from API response
  const categories = categoriesData?.data || []
  const unitTypes = unitTypesData?.data || []

  // Debug logging
  if (unitTypesError) {
    console.error("Unit Types Error:", unitTypesError)
  }
  if (unitTypesData) {
    console.log("Unit Types Data:", unitTypesData)
  }

  const [formData, setFormData] = useState({ name: "", description: "", status: "active" })
  const [unitFormData, setUnitFormData] = useState({ name: "", abbreviation: "", description: "", status: "active" })
  const [categorySearch, setCategorySearch] = useState("")
  const [unitTypeSearch, setUnitTypeSearch] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories
    return categories.filter(
      (cat: Category) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.description?.toLowerCase().includes(categorySearch.toLowerCase()),
    )
  }, [categorySearch, categories])

  const filteredUnitTypes = useMemo(() => {
    if (!unitTypeSearch.trim()) return unitTypes
    return unitTypes.filter(
      (unit: UnitType) =>
        unit.name.toLowerCase().includes(unitTypeSearch.toLowerCase()) ||
        unit.abbreviation?.toLowerCase().includes(unitTypeSearch.toLowerCase()) ||
        unit.description?.toLowerCase().includes(unitTypeSearch.toLowerCase()),
    )
  }, [unitTypeSearch, unitTypes])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPassword((prev) => ({ ...prev, [name]: value }))
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveProfile = () => {
    console.log("[v0] Profile updated:", profile)
  }

  const handleChangePassword = () => {
    if (password.new !== password.confirm) {
      alert("Passwords do not match")
      return
    }
    console.log("[v0] Password changed")
    setPassword({ current: "", new: "", confirm: "" })
  }

  const handleSaveSettings = () => {
    console.log("[v0] Settings saved:", settings)
  }

  const handleAddCategory = async () => {
    if (formData.name.trim()) {
      try {
        await addCategory({
          name: formData.name,
          description: formData.description,
          status: formData.status,
        }).unwrap()
        
        toast.success("Category added successfully")
        setFormData({ name: "", description: "", status: "active" })
        setShowAddModal(false)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to add category")
      }
    }
  }

  const handleUpdateCategory = async () => {
    if (selectedCategory && formData.name.trim()) {
      try {
        await updateCategory({
          id: selectedCategory._id,
          name: formData.name,
          description: formData.description,
          status: formData.status,
        }).unwrap()
        
        toast.success("Category updated successfully")
        setFormData({ name: "", description: "", status: "active" })
        setShowEditModal(false)
        setSelectedCategory(null)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to update category")
      }
    }
  }

  const handleRemoveCategory = (id: string) => {
    setCategoryToDelete(id)
    setShowDeleteCategoryModal(true)
  }

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete).unwrap()
        toast.success("Category deleted successfully")
        setShowDeleteCategoryModal(false)
        setCategoryToDelete(null)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to delete category")
      }
    }
  }

  const openAddModal = () => {
    setFormData({ name: "", description: "", status: "active" })
    setShowAddModal(true)
  }

  const openEditModal = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      status: category.status || "active",
    })
    setShowEditModal(true)
  }

  const openViewModal = (category: Category) => {
    setSelectedCategory(category)
    setShowViewModal(true)
  }

  // UnitType handlers
  const handleAddUnitType = async () => {
    if (unitFormData.name.trim() && unitFormData.abbreviation.trim()) {
      try {
        await addUnitType({
          name: unitFormData.name,
          abbreviation: unitFormData.abbreviation,
          description: unitFormData.description,
          status: unitFormData.status,
        }).unwrap()
        
        toast.success("Unit type added successfully")
        setUnitFormData({ name: "", abbreviation: "", description: "", status: "active" })
        setShowAddUnitModal(false)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to add unit type")
      }
    }
  }

  const handleUpdateUnitType = async () => {
    if (selectedUnitType && unitFormData.name.trim() && unitFormData.abbreviation.trim()) {
      try {
        await updateUnitType({
          id: selectedUnitType._id,
          name: unitFormData.name,
          abbreviation: unitFormData.abbreviation,
          description: unitFormData.description,
          status: unitFormData.status,
        }).unwrap()
        
        toast.success("Unit type updated successfully")
        setUnitFormData({ name: "", abbreviation: "", description: "", status: "active" })
        setShowEditUnitModal(false)
        setSelectedUnitType(null)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to update unit type")
      }
    }
  }

  const handleRemoveUnitType = (id: string) => {
    setUnitTypeToDelete(id)
    setShowDeleteUnitTypeModal(true)
  }

  const confirmDeleteUnitType = async () => {
    if (unitTypeToDelete) {
      try {
        await deleteUnitType(unitTypeToDelete).unwrap()
        toast.success("Unit type deleted successfully")
        setShowDeleteUnitTypeModal(false)
        setUnitTypeToDelete(null)
      } catch (error: any) {
        toast.error(error?.data?.error || "Failed to delete unit type")
      }
    }
  }

  const openAddUnitModal = () => {
    setUnitFormData({ name: "", abbreviation: "", description: "", status: "active" })
    setShowAddUnitModal(true)
  }

  const openEditUnitModal = (unitType: UnitType) => {
    setSelectedUnitType(unitType)
    setUnitFormData({
      name: unitType.name,
      abbreviation: unitType.abbreviation,
      description: unitType.description || "",
      status: unitType.status || "active",
    })
    setShowEditUnitModal(true)
  }

  const openViewUnitModal = (unitType: UnitType) => {
    setSelectedUnitType(unitType)
    setShowViewUnitModal(true)
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    router.push("/login")
    setShowLogoutModal(false)
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-1 sticky top-20 h-fit">
              {[
                { id: "profile", label: "Profile" },
                { id: "password", label: "Change Password" },
                { id: "preferences", label: "Preferences" },
                { id: "categories", label: "Categories" },
                { id: "unit-types", label: "Unit Types" },
                { id: "account", label: "Account" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                      <Input name="name" value={profile.name} onChange={handleProfileChange} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                      <Input
                        name="company"
                        value={profile.company}
                        onChange={handleProfileChange}
                        placeholder="Your Company"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} className="mt-6">
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                      <Input
                        type="password"
                        name="current"
                        value={password.current}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                      <Input
                        type="password"
                        name="new"
                        value={password.new}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                      <Input
                        type="password"
                        name="confirm"
                        value={password.confirm}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} className="mt-6">
                    Update Password
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">App Preferences</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleSettingChange("currency", e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option>INR</option>
                          <option>USD</option>
                          <option>EUR</option>
                          <option>GBP</option>
                          <option>CAD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange("timezone", e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option>UTC</option>
                          <option>EST</option>
                          <option>CST</option>
                          <option>PST</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Low Stock Alert Threshold
                      </label>
                      <Input
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => handleSettingChange("lowStockThreshold", Number.parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Units below this will trigger alerts</p>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Dark Mode</p>
                          <p className="text-xs text-muted-foreground">Use dark monochrome theme</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={(e) => handleSettingChange("darkMode", e.target.checked)}
                          className="w-4 h-4 rounded border border-border"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive alerts for low stock</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange("emailNotifications", e.target.checked)}
                          className="w-4 h-4 rounded border border-border"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Weekly Reports</p>
                          <p className="text-xs text-muted-foreground">Get weekly inventory summary</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.weeklyReports}
                          onChange={(e) => handleSettingChange("weeklyReports", e.target.checked)}
                          className="w-4 h-4 rounded border border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} className="mt-6">
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "categories" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Product Categories</h2>
                    <p className="text-sm text-muted-foreground">Manage your product categories</p>
                  </div>
                  <Button onClick={openAddModal} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {/* Categories Table */}
                {categoriesLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    Loading categories...
                  </div>
                ) : categoriesError ? (
                  <div className="text-center text-sm text-destructive py-12">
                    Failed to load categories. Please try again.
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground mb-4">No categories yet.</p>
                    <Button onClick={openAddModal} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Category
                    </Button>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Name</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Description</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredCategories.map((cat: Category) => (
                            <tr key={cat._id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 text-sm text-foreground font-medium">{cat.name}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {cat.description || "No description"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    cat.status === "active"
                                      ? " bg-primary/10 text-primary rounded"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {cat.status || "active"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openViewModal(cat)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(cat)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveCategory(cat._id)}
                                    disabled={isDeleting}
                                    className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
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
                )}
              </div>
            )}

            {activeTab === "unit-types" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Unit Types</h2>
                    <p className="text-sm text-muted-foreground">Manage measurement unit types</p>
                  </div>
                  <Button onClick={openAddUnitModal} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Unit Type
                  </Button>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Search unit types..."
                    value={unitTypeSearch}
                    onChange={(e) => setUnitTypeSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {/* Unit Types Table */}
                {unitTypesLoading ? (
                  <div className="text-center text-sm text-muted-foreground py-12">
                    Loading unit types...
                  </div>
                ) : unitTypesError ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-sm text-destructive">Failed to load unit types.</p>
                    <p className="text-xs text-muted-foreground">
                      {JSON.stringify(unitTypesError)}
                    </p>
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline" 
                      size="sm"
                    >
                      Reload Page
                    </Button>
                  </div>
                ) : unitTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground mb-4">No unit types yet.</p>
                    <Button onClick={openAddUnitModal} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Unit Type
                    </Button>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Name</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Abbreviation</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Description</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground">Status</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredUnitTypes.map((unit: UnitType) => (
                            <tr key={unit._id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 text-sm text-foreground font-medium">{unit.name}</td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  {unit.abbreviation}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {unit.description || "No description"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    unit.status === "active"
                                      ? " bg-primary/10 text-primary rounded"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {unit.status || "active"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openViewUnitModal(unit)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => openEditUnitModal(unit)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveUnitType(unit._id)}
                                    disabled={isDeletingUnit}
                                    className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
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
                )}
              </div>
            )}

            {activeTab === "account" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
                  <p className="text-sm text-muted-foreground mb-4">Manage your account settings</p>

                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded border border-border">
                      <p className="text-sm font-medium text-foreground">Logged in as</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>

                    <Button variant="outline" onClick={handleLogout} className="bg-transparent">
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  disabled={isAdding}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isAdding}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                disabled={isAdding}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isAdding || !formData.name.trim()} className="flex-1">
                {isAdding ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  disabled={isUpdating}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isUpdating}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedCategory(null)
                }}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={isUpdating || !formData.name.trim()}
                className="flex-1"
              >
                {isUpdating ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Category Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Category Name</label>
                <p className="text-sm text-foreground font-medium">{selectedCategory.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <p className="text-sm text-foreground">{selectedCategory.description || "No description provided"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedCategory.status === "active"
                      ? " bg-primary/10 text-primary rounded"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {selectedCategory.status || "active"}
                </span>
              </div>
              {selectedCategory.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Created At</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedCategory.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedCategory.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Last Updated</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedCategory.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedCategory(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(selectedCategory)
                }}
                className="flex-1"
              >
                Edit Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Type Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add New Unit Type</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Unit Name *</label>
                <Input
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="e.g., Kilogram, Liter, Piece"
                  disabled={isAddingUnit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Abbreviation *</label>
                <Input
                  value={unitFormData.abbreviation}
                  onChange={(e) => setUnitFormData({ ...unitFormData, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="e.g., KG, L, PCS"
                  disabled={isAddingUnit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={unitFormData.description}
                  onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                  placeholder="Enter unit type description"
                  disabled={isAddingUnit}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={unitFormData.status}
                  onChange={(e) => setUnitFormData({ ...unitFormData, status: e.target.value })}
                  disabled={isAddingUnit}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddUnitModal(false)}
                disabled={isAddingUnit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddUnitType} 
                disabled={isAddingUnit || !unitFormData.name.trim() || !unitFormData.abbreviation.trim()} 
                className="flex-1"
              >
                {isAddingUnit ? "Adding..." : "Add Unit Type"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Type Modal */}
      {showEditUnitModal && selectedUnitType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit Unit Type</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Unit Name *</label>
                <Input
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="e.g., Kilogram, Liter, Piece"
                  disabled={isUpdatingUnit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Abbreviation *</label>
                <Input
                  value={unitFormData.abbreviation}
                  onChange={(e) => setUnitFormData({ ...unitFormData, abbreviation: e.target.value.toUpperCase() })}
                  placeholder="e.g., KG, L, PCS"
                  disabled={isUpdatingUnit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={unitFormData.description}
                  onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                  placeholder="Enter unit type description"
                  disabled={isUpdatingUnit}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={unitFormData.status}
                  onChange={(e) => setUnitFormData({ ...unitFormData, status: e.target.value })}
                  disabled={isUpdatingUnit}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditUnitModal(false)
                  setSelectedUnitType(null)
                }}
                disabled={isUpdatingUnit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUnitType}
                disabled={isUpdatingUnit || !unitFormData.name.trim() || !unitFormData.abbreviation.trim()}
                className="flex-1"
              >
                {isUpdatingUnit ? "Updating..." : "Update Unit Type"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Unit Type Modal */}
      {showViewUnitModal && selectedUnitType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">Unit Type Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Unit Name</label>
                <p className="text-sm text-foreground font-medium">{selectedUnitType.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Abbreviation</label>
                <span className="inline-flex px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {selectedUnitType.abbreviation}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                <p className="text-sm text-foreground">{selectedUnitType.description || "No description provided"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedUnitType.status === "active"
                      ? " bg-primary/10 text-primary rounded"
                      : " bg-primary/10 text-primary rounded"
                  }`}
                >
                  {selectedUnitType.status || "active"}
                </span>
              </div>
              {selectedUnitType.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Created At</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedUnitType.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
              {selectedUnitType.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Last Updated</label>
                  <p className="text-sm text-foreground">
                    {new Date(selectedUnitType.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewUnitModal(false)
                  setSelectedUnitType(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewUnitModal(false)
                  openEditUnitModal(selectedUnitType)
                }}
                className="flex-1"
              >
                Edit Unit Type
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Category</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteCategoryModal(false)
                  setCategoryToDelete(null)
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Unit Type Confirmation Modal */}
      {showDeleteUnitTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Unit Type</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this unit type? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteUnitTypeModal(false)
                  setUnitTypeToDelete(null)
                }}
                disabled={isDeletingUnit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUnitType}
                disabled={isDeletingUnit}
                className="flex-1"
              >
                {isDeletingUnit ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Logout</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to logout from your account?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 rounded-md bg-foreground text-background hover:bg-muted-foreground transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
