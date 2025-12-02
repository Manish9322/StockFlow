"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import MainLayout from "@/components/layout/main-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

function throttle(func: (...args: any[]) => void, delay: number) {
  let lastCall = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

interface Category {
  id: string
  name: string
  description: string
}

function SettingsContent() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("profile")

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

  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Electronics", description: "Electronic devices and gadgets" },
    { id: "2", name: "Accessories", description: "Peripheral accessories and add-ons" },
    { id: "3", name: "Cables", description: "Various types of cables and connectors" },
    { id: "4", name: "Storage", description: "Storage devices and solutions" },
    { id: "5", name: "Displays", description: "Monitor and display equipment" },
  ])

  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        cat.description.toLowerCase().includes(categorySearch.toLowerCase()),
    )
  }, [categorySearch, categories])

  const handleCategorySearchChange = useCallback(
    debounce((value: string) => {
      setCategorySearch(value)
    }, 300),
    [],
  )

  const handleCategorySearchThrottle = useCallback(
    throttle((value: string) => {
      handleCategorySearchChange(value)
    }, 300),
    [handleCategorySearchChange],
  )

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

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      setCategories([
        ...categories,
        {
          id: Date.now().toString(),
          name: newCategory.name,
          description: newCategory.description,
        },
      ])
      setNewCategory({ name: "", description: "" })
    }
  }

  const handleRemoveCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
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
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Product Categories</h2>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Category Name</label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="Enter category name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                        <textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          placeholder="Enter category description"
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          rows={2}
                        />
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                        Add Category
                      </Button>
                    </div>

                    <div className="border-t border-border pt-4">
                      <label className="block text-sm font-medium text-foreground mb-2">Search Categories</label>
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search categories..."
                          onChange={(e) => handleCategorySearchThrottle(e.target.value)}
                          onClick={() => setShowCategoryDropdown(true)}
                          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />

                        {showCategoryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((cat) => (
                                <div key={cat.id} className="px-4 py-3 border-b border-border last:border-b-0">
                                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                                No categories found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground mb-3">All Categories</p>
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-start justify-between p-3 border border-border rounded bg-muted"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">{cat.description}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveCategory(cat.id)}
                            className="text-xs text-destructive hover:underline ml-2 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
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
      </div>

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
