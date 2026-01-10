"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/main-layout"
import { AdminRoute } from "@/components/admin-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  useGetTaxConfigQuery, 
  useUpdateTaxConfigMutation 
} from "@/lib/utils/services/api"
import { toast } from "sonner"
import { 
  Plus, 
  Trash2, 
  Edit,
  Loader2,
  RefreshCw,
} from "lucide-react"

function AdminTaxManagementContent() {
  const [userId, setUserId] = useState("admin")
  const { data: taxConfigData, isLoading, refetch } = useGetTaxConfigQuery(userId, {
    skip: !userId,
  })
  const [updateTaxConfig, { isLoading: isUpdating }] = useUpdateTaxConfigMutation()

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
  const [editingOtherTax, setEditingOtherTax] = useState<number | null>(null)
  const [otherTaxForm, setOtherTaxForm] = useState({
    name: "",
    rate: 0,
    type: "percentage" as "percentage" | "fixed",
    description: "",
  })

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

  const handleSaveTaxConfig = async () => {
    try {
      await updateTaxConfig({
        userId,
        ...taxConfig,
        changedBy: "admin",
        changedByEmail: "stockflowadmin@gmail.com",
        changeDescription: "Tax configuration updated by admin",
      }).unwrap()

      toast.success("Tax configuration saved successfully")
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to save tax configuration")
      console.error("Tax config save error:", error)
    }
  }

  const handleAddOtherTax = () => {
    if (!otherTaxForm.name.trim() || otherTaxForm.rate < 0) {
      toast.error("Please provide valid tax name and rate")
      return
    }

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
    toast.success("Tax added. Don't forget to save!")
  }

  const handleUpdateOtherTax = () => {
    if (editingOtherTax === null) return

    if (!otherTaxForm.name.trim() || otherTaxForm.rate < 0) {
      toast.error("Please provide valid tax name and rate")
      return
    }

    setTaxConfig((prev) => ({
      ...prev,
      otherTaxes: prev.otherTaxes.map((tax, i) =>
        i === editingOtherTax
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
    setShowAddOtherTaxModal(false)
    toast.success("Tax updated. Don't forget to save!")
  }

  const handleRemoveOtherTax = (index: number) => {
    setTaxConfig((prev) => ({
      ...prev,
      otherTaxes: prev.otherTaxes.filter((_, i) => i !== index),
    }))
    toast.success("Tax removed. Don't forget to save!")
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

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Tax Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Configure global tax settings for all users and manage other taxes separately here
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* GST Configuration */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">GST (Goods and Services Tax)</h3>
                  <p className="text-xs text-muted-foreground">Configure GST settings for all users</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-foreground">Enable</Label>
                  <input
                    type="checkbox"
                    checked={taxConfig.gst.enabled}
                    onChange={(e) =>
                      setTaxConfig((prev) => ({
                        ...prev,
                        gst: { ...prev.gst, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded border border-border cursor-pointer"
                  />
                </div>
              </div>

              {taxConfig.gst.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">GST Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxConfig.gst.rate}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          gst: { ...prev.gst, rate: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">Tax Type</Label>
                    <select
                      value={taxConfig.gst.type}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          gst: { ...prev.gst, type: e.target.value as "inclusive" | "exclusive" },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="exclusive">Exclusive (Added to subtotal)</option>
                      <option value="inclusive">Inclusive (Included in price)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-foreground mb-2">Description</Label>
                    <Input
                      type="text"
                      value={taxConfig.gst.description}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          gst: { ...prev.gst, description: e.target.value },
                        }))
                      }
                      placeholder="Enter GST description"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Platform Fee Configuration */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Platform Fee</h3>
                  <p className="text-xs text-muted-foreground">Configure platform transaction fees</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-foreground">Enable</Label>
                  <input
                    type="checkbox"
                    checked={taxConfig.platformFee.enabled}
                    onChange={(e) =>
                      setTaxConfig((prev) => ({
                        ...prev,
                        platformFee: { ...prev.platformFee, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded border border-border cursor-pointer"
                  />
                </div>
              </div>

              {taxConfig.platformFee.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">Fee Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxConfig.platformFee.rate}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          platformFee: { ...prev.platformFee, rate: parseFloat(e.target.value) || 0 },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">Fee Type</Label>
                    <select
                      value={taxConfig.platformFee.type}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          platformFee: { ...prev.platformFee, type: e.target.value as "percentage" | "fixed" },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (USD)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-foreground mb-2">Description</Label>
                    <Input
                      type="text"
                      value={taxConfig.platformFee.description}
                      onChange={(e) =>
                        setTaxConfig((prev) => ({
                          ...prev,
                          platformFee: { ...prev.platformFee, description: e.target.value },
                        }))
                      }
                      placeholder="Enter platform fee description"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Other Taxes */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Other Taxes</h3>
                  <p className="text-xs text-muted-foreground">Add custom tax types</p>
                </div>
                <Button onClick={openAddOtherTaxModal} size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Tax
                </Button>
              </div>

              {taxConfig.otherTaxes.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {taxConfig.otherTaxes.map((tax, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={tax.enabled}
                          onChange={() => handleToggleOtherTax(index)}
                          className="w-4 h-4 rounded border border-border cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{tax.name}</p>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                              {tax.rate}
                              {tax.type === "percentage" ? "%" : " USD"}
                            </span>
                          </div>
                          {tax.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{tax.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditOtherTaxModal(tax, index)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleRemoveOtherTax(index)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom taxes configured yet. Click "Add Tax" to create one.
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveTaxConfig} disabled={isUpdating} size="lg">
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Tax Configuration"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Other Tax Modal */}
      {showAddOtherTaxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editingOtherTax !== null ? "Edit Tax" : "Add New Tax"}
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Tax Name *</Label>
                <Input
                  value={otherTaxForm.name}
                  onChange={(e) => setOtherTaxForm({ ...otherTaxForm, name: e.target.value })}
                  placeholder="e.g., VAT, Sales Tax, Customs Duty"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Tax Rate *</Label>
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
                <Label className="block text-sm font-medium text-foreground mb-2">Tax Type</Label>
                <select
                  value={otherTaxForm.type}
                  onChange={(e) =>
                    setOtherTaxForm({ ...otherTaxForm, type: e.target.value as "percentage" | "fixed" })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (USD)</option>
                </select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Description</Label>
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
    </MainLayout>
  )
}

export default function AdminTaxManagement() {
  return (
    <AdminRoute>
      <AdminTaxManagementContent />
    </AdminRoute>
  )
}
