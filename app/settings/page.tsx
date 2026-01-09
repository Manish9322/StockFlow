"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useGetCategoriesQuery, useAddCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useGetUnitTypesQuery, useAddUnitTypeMutation, useUpdateUnitTypeMutation, useDeleteUnitTypeMutation, useGetUserSettingsQuery, useUpdateUserSettingsMutation, useGetCurrencyRatesQuery, useGetTaxConfigQuery, useUpdateTaxConfigMutation, useChangePasswordMutation } from "@/lib/utils/services/api"
import { toast } from "sonner"
import { Eye, EyeOff, Pencil, Trash2, Plus, Loader2, RefreshCw } from "lucide-react"
import { logMovement } from "@/lib/movement-logger"
import { CURRENCIES, formatCurrency } from "@/lib/utils/currency"
import { TIMEZONES, getUserTimezone, formatDateWithTimezone } from "@/lib/utils/timezone"

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

  // User Settings API hooks
  const { data: userSettingsData, isLoading: settingsLoading } = useGetUserSettingsQuery(user?.id || "guest", {
    skip: !user?.id,
  })
  const [updateUserSettings, { isLoading: isUpdatingSettings }] = useUpdateUserSettingsMutation()

  // Currency rates API hook
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState("USD")
  const { data: currencyRatesData, isLoading: currencyLoading, refetch: refetchCurrencyRates } = useGetCurrencyRatesQuery(selectedBaseCurrency)

  // Tax configuration API hooks
  const { data: taxConfigData, isLoading: taxLoading } = useGetTaxConfigQuery(user?.id || "guest", {
    skip: !user?.id,
  })
  const [updateTaxConfig, { isLoading: isUpdatingTax }] = useUpdateTaxConfigMutation()

  // Password change API hook
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

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
  })

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    currency: "USD",
    timezone: "UTC",
  })

  // Tax configuration state
  const [taxConfig, setTaxConfig] = useState({
    gst: {
      enabled: false,
      rate: 18,
      type: "exclusive" as "inclusive" | "exclusive",
      description: "Goods and Services Tax",
    },
    platformFee: {
      enabled: false,
      rate: 0,
      type: "percentage" as "percentage" | "fixed",
      description: "Platform transaction fee",
    },
    otherTaxes: [] as Array<{
      _id?: string
      name: string
      enabled: boolean
      rate: number
      type: "percentage" | "fixed"
      description: string
    }>,
  })

  const [showAddOtherTaxModal, setShowAddOtherTaxModal] = useState(false)
  const [editingOtherTax, setEditingOtherTax] = useState<any>(null)
  const [otherTaxForm, setOtherTaxForm] = useState({
    name: "",
    rate: 0,
    type: "percentage" as "percentage" | "fixed",
    description: "",
  })

  // Load user settings from API when data is available
  useEffect(() => {
    if (userSettingsData?.data?.preferences) {
      setSettings({
        lowStockThreshold: userSettingsData.data.preferences.lowStockThreshold || 10,
        currency: userSettingsData.data.preferences.currency || "USD",
        timezone: userSettingsData.data.preferences.timezone || getUserTimezone(),
      })
      setSelectedBaseCurrency(userSettingsData.data.preferences.currency || "USD")
    }
  }, [userSettingsData])

  // Load profile data from API
  useEffect(() => {
    if (userSettingsData?.data?.profile) {
      setProfile({
        name: userSettingsData.data.profile.name || user?.name || "",
        email: userSettingsData.data.profile.email || user?.email || "",
      })
    }
  }, [userSettingsData, user])

  // Load tax configuration from API
  useEffect(() => {
    if (taxConfigData?.data) {
      setTaxConfig({
        gst: taxConfigData.data.gst || {
          enabled: false,
          rate: 18,
          type: "exclusive",
          description: "Goods and Services Tax",
        },
        platformFee: taxConfigData.data.platformFee || {
          enabled: false,
          rate: 0,
          type: "percentage",
          description: "Platform transaction fee",
        },
        otherTaxes: taxConfigData.data.otherTaxes || [],
      })
    }
  }, [taxConfigData])

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

  const handleSaveProfile = async () => {
    const originalProfile = {
      name: user?.name || "",
      email: user?.email || "",
    }
    
    const changedFields = []
    if (originalProfile.name !== profile.name) changedFields.push('name')
    if (originalProfile.email !== profile.email) changedFields.push('email')
    
    try {
      // Save to database
      await updateUserSettings({
        userId: user?.id || "guest",
        profile,
      }).unwrap()

      if (changedFields.length > 0) {
        await logMovement({
          eventType: "settings.changed",
          eventTitle: "Profile Updated",
          description: `Updated profile settings (${changedFields.join(', ')})`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          metadata: {
            section: "profile",
            changedFields,
          },
          changes: {
            before: originalProfile,
            after: profile,
          },
        })
      }
      
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
      console.error("Profile update error:", error)
    }
  }

  const handleChangePassword = async () => {
    // Validation
    if (!password.current.trim()) {
      toast.error("Current password is required")
      return
    }
    
    if (!password.new.trim()) {
      toast.error("New password is required")
      return
    }
    
    if (password.new.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    
    if (password.new !== password.confirm) {
      toast.error("New passwords do not match")
      return
    }
    
    if (password.current === password.new) {
      toast.error("New password must be different from current password")
      return
    }
    
    try {
      // Call the API to change password
      await changePassword({
        currentPassword: password.current,
        newPassword: password.new,
      }).unwrap()
      
      // Log the password change activity
      await logMovement({
        eventType: "settings.changed",
        eventTitle: "Password Changed",
        description: "User changed their password",
        userId: user?.id || "system",
        userName: user?.name || "System",
        userEmail: user?.email,
        metadata: {
          section: "security",
          action: "password_change",
        },
      })
      
      toast.success("Password changed successfully")
      // Clear the form
      setPassword({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      console.error("Password change error:", error)
      const errorMessage = error?.data?.error || error?.message || "Failed to change password"
      toast.error(errorMessage)
    }
  }

  const handleSaveSettings = async () => {
    const originalSettings = userSettingsData?.data?.preferences || {
      lowStockThreshold: 10,
      currency: "USD",
      timezone: "UTC",
    }
    
    const changedFields = []
    if (originalSettings.lowStockThreshold !== settings.lowStockThreshold) changedFields.push('low stock threshold')
    if (originalSettings.currency !== settings.currency) changedFields.push('currency')
    if (originalSettings.timezone !== settings.timezone) changedFields.push('timezone')
    
    try {
      // Save to database
      await updateUserSettings({
        userId: user?.id || "guest",
        preferences: settings,
      }).unwrap()

      // Update base currency if changed
      if (originalSettings.currency !== settings.currency) {
        setSelectedBaseCurrency(settings.currency)
      }

      if (changedFields.length > 0) {
        await logMovement({
          eventType: "settings.changed",
          eventTitle: "Settings Updated",
          description: `Updated application settings (${changedFields.join(', ')})`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          metadata: {
            section: "general_settings",
            changedFields,
          },
          changes: {
            before: originalSettings,
            after: settings,
          },
        })
      }
      
      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
      console.error("Settings save error:", error)
    }
  }

  const handleAddCategory = async () => {
    if (formData.name.trim()) {
      try {
        const result = await addCategory({
          name: formData.name,
          description: formData.description,
          status: formData.status,
        }).unwrap()
        
        // Log movement
        await logMovement({
          eventType: "category.created",
          eventTitle: "Category Created",
          description: `Created new category: ${formData.name}`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          relatedCategory: result.data?._id,
          metadata: {
            categoryName: formData.name,
            description: formData.description,
            status: formData.status,
          },
        })
        
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
        const changedFields = []
        if (selectedCategory.name !== formData.name) changedFields.push('name')
        if (selectedCategory.description !== formData.description) changedFields.push('description')
        if (selectedCategory.status !== formData.status) changedFields.push('status')
        
        await updateCategory({
          id: selectedCategory._id,
          name: formData.name,
          description: formData.description,
          status: formData.status,
        }).unwrap()
        
        // Log movement
        if (changedFields.length > 0) {
          await logMovement({
            eventType: "category.updated",
            eventTitle: "Category Updated",
            description: `Updated category "${formData.name}" (${changedFields.join(', ')})`,
            userId: user?.id || "system",
            userName: user?.name || "System",
            userEmail: user?.email,
            relatedCategory: selectedCategory._id,
            metadata: {
              categoryName: formData.name,
              changedFields,
            },
            changes: {
              before: {
                name: selectedCategory.name,
                description: selectedCategory.description,
                status: selectedCategory.status,
              },
              after: {
                name: formData.name,
                description: formData.description,
                status: formData.status,
              },
            },
          })
        }
        
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
        const categoryToDeleteObj = categories.find((c: Category) => c._id === categoryToDelete)
        
        await deleteCategory(categoryToDelete).unwrap()
        
        // Log movement
        if (categoryToDeleteObj) {
          await logMovement({
            eventType: "category.deleted",
            eventTitle: "Category Deleted",
            description: `Deleted category: ${categoryToDeleteObj.name}`,
            userId: user?.id || "system",
            userName: user?.name || "System",
            userEmail: user?.email,
            metadata: {
              categoryName: categoryToDeleteObj.name,
              description: categoryToDeleteObj.description,
            },
            changes: {
              before: {
                name: categoryToDeleteObj.name,
                description: categoryToDeleteObj.description,
                status: categoryToDeleteObj.status,
              },
            },
          })
        }
        
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
        const result = await addUnitType({
          name: unitFormData.name,
          abbreviation: unitFormData.abbreviation,
          description: unitFormData.description,
          status: unitFormData.status,
        }).unwrap()
        
        // Log movement
        await logMovement({
          eventType: "settings.changed",
          eventTitle: "Unit Type Created",
          description: `Created new unit type: ${unitFormData.name} (${unitFormData.abbreviation})`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          metadata: {
            section: "unit_types",
            action: "create",
            unitTypeName: unitFormData.name,
            abbreviation: unitFormData.abbreviation,
          },
        })
        
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
        const changedFields = []
        if (selectedUnitType.name !== unitFormData.name) changedFields.push('name')
        if (selectedUnitType.abbreviation !== unitFormData.abbreviation) changedFields.push('abbreviation')
        if (selectedUnitType.description !== unitFormData.description) changedFields.push('description')
        if (selectedUnitType.status !== unitFormData.status) changedFields.push('status')
        
        await updateUnitType({
          id: selectedUnitType._id,
          name: unitFormData.name,
          abbreviation: unitFormData.abbreviation,
          description: unitFormData.description,
          status: unitFormData.status,
        }).unwrap()
        
        // Log movement
        if (changedFields.length > 0) {
          await logMovement({
            eventType: "settings.changed",
            eventTitle: "Unit Type Updated",
            description: `Updated unit type "${unitFormData.name}" (${changedFields.join(', ')})`,
            userId: user?.id || "system",
            userName: user?.name || "System",
            userEmail: user?.email,
            metadata: {
              section: "unit_types",
              action: "update",
              unitTypeName: unitFormData.name,
              changedFields,
            },
            changes: {
              before: {
                name: selectedUnitType.name,
                abbreviation: selectedUnitType.abbreviation,
                description: selectedUnitType.description,
                status: selectedUnitType.status,
              },
              after: {
                name: unitFormData.name,
                abbreviation: unitFormData.abbreviation,
                description: unitFormData.description,
                status: unitFormData.status,
              },
            },
          })
        }
        
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
        const unitTypeToDeleteObj = unitTypes.find((u: UnitType) => u._id === unitTypeToDelete)
        
        await deleteUnitType(unitTypeToDelete).unwrap()
        
        // Log movement
        if (unitTypeToDeleteObj) {
          await logMovement({
            eventType: "settings.changed",
            eventTitle: "Unit Type Deleted",
            description: `Deleted unit type: ${unitTypeToDeleteObj.name} (${unitTypeToDeleteObj.abbreviation})`,
            userId: user?.id || "system",
            userName: user?.name || "System",
            userEmail: user?.email,
            metadata: {
              section: "unit_types",
              action: "delete",
              unitTypeName: unitTypeToDeleteObj.name,
              abbreviation: unitTypeToDeleteObj.abbreviation,
            },
            changes: {
              before: {
                name: unitTypeToDeleteObj.name,
                abbreviation: unitTypeToDeleteObj.abbreviation,
                description: unitTypeToDeleteObj.description,
                status: unitTypeToDeleteObj.status,
              },
            },
          })
        }
        
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

  // Tax Management Handlers
  const handleSaveTaxConfig = async () => {
    const originalTaxConfig = taxConfigData?.data || {}
    
    const changedFields = []
    if (JSON.stringify(originalTaxConfig.gst) !== JSON.stringify(taxConfig.gst)) changedFields.push('GST')
    if (JSON.stringify(originalTaxConfig.platformFee) !== JSON.stringify(taxConfig.platformFee)) changedFields.push('Platform Fee')
    if (JSON.stringify(originalTaxConfig.otherTaxes) !== JSON.stringify(taxConfig.otherTaxes)) changedFields.push('Other Taxes')
    
    try {
      await updateTaxConfig({
        userId: user?.id || "guest",
        gst: taxConfig.gst,
        platformFee: taxConfig.platformFee,
        otherTaxes: taxConfig.otherTaxes,
        changedBy: user?.id || "system",
        changedByEmail: user?.email,
        changeDescription: changedFields.length > 0 
          ? `Updated tax configuration (${changedFields.join(', ')})` 
          : "Tax configuration updated",
      }).unwrap()

      if (changedFields.length > 0) {
        await logMovement({
          eventType: "settings.changed",
          eventTitle: "Tax Configuration Updated",
          description: `Updated tax configuration (${changedFields.join(', ')})`,
          userId: user?.id || "system",
          userName: user?.name || "System",
          userEmail: user?.email,
          metadata: {
            section: "tax_management",
            changedFields,
          },
          changes: {
            before: {
              gst: originalTaxConfig.gst,
              platformFee: originalTaxConfig.platformFee,
              otherTaxes: originalTaxConfig.otherTaxes,
            },
            after: taxConfig,
          },
        })
      }

      toast.success("Tax configuration saved successfully")
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to save tax configuration")
      console.error("Tax config save error:", error)
    }
  }

  const handleAddOtherTax = () => {
    if (otherTaxForm.name.trim() && otherTaxForm.rate >= 0) {
      setTaxConfig((prev) => ({
        ...prev,
        otherTaxes: [
          ...prev.otherTaxes,
          {
            name: otherTaxForm.name,
            enabled: true,
            rate: otherTaxForm.rate,
            type: otherTaxForm.type,
            description: otherTaxForm.description,
          },
        ],
      }))
      setOtherTaxForm({
        name: "",
        rate: 0,
        type: "percentage",
        description: "",
      })
      setShowAddOtherTaxModal(false)
      toast.success("Tax added successfully. Don't forget to save changes!")
    } else {
      toast.error("Please provide tax name and rate")
    }
  }

  const handleUpdateOtherTax = () => {
    if (editingOtherTax !== null && otherTaxForm.name.trim() && otherTaxForm.rate >= 0) {
      setTaxConfig((prev) => ({
        ...prev,
        otherTaxes: prev.otherTaxes.map((tax, index) =>
          index === editingOtherTax
            ? {
                ...tax,
                name: otherTaxForm.name,
                rate: otherTaxForm.rate,
                type: otherTaxForm.type,
                description: otherTaxForm.description,
              }
            : tax
        ),
      }))
      setOtherTaxForm({
        name: "",
        rate: 0,
        type: "percentage",
        description: "",
      })
      setEditingOtherTax(null)
      toast.success("Tax updated successfully. Don't forget to save changes!")
    } else {
      toast.error("Please provide tax name and rate")
    }
  }

  const handleRemoveOtherTax = (index: number) => {
    setTaxConfig((prev) => ({
      ...prev,
      otherTaxes: prev.otherTaxes.filter((_, i) => i !== index),
    }))
    toast.success("Tax removed successfully. Don't forget to save changes!")
  }

  const handleToggleOtherTax = (index: number) => {
    setTaxConfig((prev) => ({
      ...prev,
      otherTaxes: prev.otherTaxes.map((tax, i) =>
        i === index ? { ...tax, enabled: !tax.enabled } : tax
      ),
    }))
  }

  const openAddOtherTaxModal = () => {
    setOtherTaxForm({
      name: "",
      rate: 0,
      type: "percentage",
      description: "",
    })
    setEditingOtherTax(null)
    setShowAddOtherTaxModal(true)
  }

  const openEditOtherTaxModal = (tax: any, index: number) => {
    setOtherTaxForm({
      name: tax.name,
      rate: tax.rate,
      type: tax.type,
      description: tax.description || "",
    })
    setEditingOtherTax(index)
    setShowAddOtherTaxModal(true)
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

        {settingsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 space-y-1 sticky top-20 h-fit">
              {[
                { id: "profile", label: "Profile" },
                { id: "password", label: "Change Password" },
                { id: "preferences", label: "Preferences" },
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
                      <div className="relative">
                        <Input
                          type={showPassword.current ? "text" : "password"}
                          name="current"
                          value={password.current}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword.current ? "Hide password" : "Show password"}
                        >
                          {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword.new ? "text" : "password"}
                          name="new"
                          value={password.new}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword.new ? "Hide password" : "Show password"}
                        >
                          {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword.confirm ? "text" : "password"}
                          name="confirm"
                          value={password.confirm}
                          onChange={handlePasswordChange}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword.confirm ? "Hide password" : "Show password"}
                        >
                          {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword} className="mt-6">
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                {/* Development Notice */}
                <div className="bg-black-50 dark:bg-black-900/20 border border-black-200 dark:border-black-800 rounded-lg p-4">
                  <p className="text-sm text-black-800 dark:text-black-200">
                    <strong>Note:</strong> This section is currently under development and is not functional yet.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">App Preferences</h2>
                    {currencyRatesData && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Rates updated: {new Date(currencyRatesData.lastUpdated).toLocaleString()}</span>
                        <button
                          onClick={() => refetchCurrencyRates()}
                          className="p-1 hover:bg-muted rounded"
                          title="Refresh rates"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Currency
                          {currencyLoading && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => {
                            handleSettingChange("currency", e.target.value)
                            setSelectedBaseCurrency(e.target.value)
                          }}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name} ({currency.symbol})
                            </option>
                          ))}
                        </select>
                        {currencyRatesData?.rates && settings.currency && (
                          <p className="text-xs text-muted-foreground mt-1">
                            1 {selectedBaseCurrency} = {currencyRatesData.rates[settings.currency]?.toFixed(4)} {settings.currency}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange("timezone", e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label} ({tz.offset})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Current time: {formatDateWithTimezone(new Date(), settings.timezone, "time")}
                        </p>
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
                  </div>

                  <Button onClick={handleSaveSettings} disabled={isUpdatingSettings} className="mt-6">
                    {isUpdatingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
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
        )}
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

      {/* Add/Edit Other Tax Modal */}
      {showAddOtherTaxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingOtherTax !== null ? "Edit Tax" : "Add New Tax"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tax Name *</label>
                <Input
                  value={otherTaxForm.name}
                  onChange={(e) => setOtherTaxForm({ ...otherTaxForm, name: e.target.value })}
                  placeholder="e.g., VAT, Sales Tax, Customs Duty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tax Rate *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherTaxForm.rate}
                  onChange={(e) => setOtherTaxForm({ ...otherTaxForm, rate: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter tax rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tax Type</label>
                <select
                  value={otherTaxForm.type}
                  onChange={(e) =>
                    setOtherTaxForm({ ...otherTaxForm, type: e.target.value as "percentage" | "fixed" })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ({settings.currency})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={otherTaxForm.description}
                  onChange={(e) => setOtherTaxForm({ ...otherTaxForm, description: e.target.value })}
                  placeholder="Enter tax description"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddOtherTaxModal(false)
                  setEditingOtherTax(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingOtherTax !== null ? handleUpdateOtherTax : handleAddOtherTax}
                disabled={!otherTaxForm.name.trim() || otherTaxForm.rate < 0}
                className="flex-1"
              >
                {editingOtherTax !== null ? "Update Tax" : "Add Tax"}
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
