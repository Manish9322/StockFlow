// Supports English and Hindi with easy expansion for more languages

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Language = "en" | "hi"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Complete translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.add_product": "Add Product",
    "nav.stock_refill": "Stock Refill",
    "nav.purchase": "Purchase",
    "nav.purchases": "Purchases",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.movement_history": "Movement History",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Manage and monitor your complete inventory with real-time stock tracking",
    "dashboard.total_products": "Total Products",
    "dashboard.low_stock": "Low Stock Items",
    "dashboard.total_value": "Total Value",
    "dashboard.categories": "Categories",
    "dashboard.search": "Search by name or SKU...",
    "dashboard.category_filter": "Category",

    // Add Product
    "product.add_title": "Add Product",
    "product.add_subtitle": "Add new products to your inventory system and track them",
    "product.basic_info": "Basic Information",
    "product.name": "Product Name",
    "product.sku": "SKU",
    "product.auto_generate_sku": "Auto Generate",
    "product.description": "Description",
    "product.category": "Category",
    "product.barcode": "Barcode (Optional)",
    "product.quantity": "Quantity",
    "product.min_stock_alert": "Min Stock Alert",
    "product.cost_price": "Cost Price (₹)",
    "product.selling_price": "Selling Price (₹)",
    "product.supplier": "Supplier Name",
    "product.supplier_contact": "Supplier Contact",
    "product.purchase_date": "Purchase Date",
    "product.expiry_date": "Expiry Date",
    "product.images": "Product Images",
    "product.save": "Save Product",
    "product.cancel": "Cancel",
    "product.required": "Required field",

    // Stock Refill
    "refill.title": "Stock Refill",
    "refill.subtitle": "Select a product and add inventory to maintain adequate stock levels",
    "refill.select_product": "Select Product",
    "refill.current_stock": "Current Stock",
    "refill.quantity_to_add": "Quantity to Add",
    "refill.updated_stock": "Updated Stock",
    "refill.notes": "Notes (Optional)",
    "refill.update": "Update Stock",

    // Purchase
    "purchase.title": "Create Purchase",
    "purchase.select_product": "Select Product",
    "purchase.quantity": "Quantity",
    "purchase.unit_price": "Unit Price (₹)",
    "purchase.total_amount": "Total Amount (₹)",
    "purchase.generate_invoice": "Generate Invoice",
    "purchase.download_invoice": "Download Invoice",

    // Purchases Management
    "purchases.title": "Purchases Management",
    "purchases.list": "Purchase History",
    "purchases.date": "Date",
    "purchases.product": "Product",
    "purchases.quantity": "Quantity",
    "purchases.amount": "Amount (₹)",
    "purchases.status": "Status",
    "purchases.export_csv": "Export CSV",
    "purchases.export_excel": "Export Excel",
    "purchases.export_pdf": "Export PDF",

    // Reports
    "reports.title": "Reports",
    "reports.stock_analysis": "Stock Analysis",
    "reports.performance": "Product Performance",
    "reports.trends": "Stock Trends",

    // Settings
    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.password": "Password",
    "settings.preferences": "Preferences",
    "settings.categories": "Categories",
    "settings.language": "Language",
    "settings.dark_mode": "Dark Mode",
    "settings.notifications": "Notifications",
    "settings.stock_alerts": "Stock Alerts",

    // Movement History
    "history.title": "Movement History",
    "history.timestamp": "Timestamp",
    "history.user": "User",
    "history.action": "Action",
    "history.product_created": "Product Created",
    "history.product_updated": "Product Updated",
    "history.stock_changed": "Stock Changed",
    "history.category_updated": "Category Updated",
    "history.purchase_created": "Purchase Created",
    "history.settings_changed": "Settings Changed",
    "history.login": "Login",
    "history.logout": "Logout",

    // Common
    "common.confirm": "Confirm",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.logout": "Logout",
    "common.logout_confirm": "Are you sure you want to logout?",
  },

  hi: {
    // Navigation
    "nav.dashboard": "डैशबोर्ड",
    "nav.add_product": "उत्पाद जोड़ें",
    "nav.stock_refill": "स्टॉक रिफिल",
    "nav.purchase": "खरीद",
    "nav.purchases": "खरीदारी",
    "nav.reports": "रिपोर्ट",
    "nav.settings": "सेटिंग्स",
    "nav.movement_history": "आंदोलन का इतिहास",

    // Dashboard
    "dashboard.title": "डैशबोर्ड",
    "dashboard.subtitle": "वास्तविक समय स्टॉक ट्रैकिंग के साथ अपने संपूर्ण इन्वेंटरी प्रबंधित करें",
    "dashboard.total_products": "कुल उत्पाद",
    "dashboard.low_stock": "कम स्टॉक आइटम",
    "dashboard.total_value": "कुल मूल्य",
    "dashboard.categories": "श्रेणियां",
    "dashboard.search": "नाम या SKU द्वारा खोजें...",
    "dashboard.category_filter": "श्रेणी",

    // Add Product
    "product.add_title": "उत्पाद जोड़ें",
    "product.add_subtitle": "अपनी इन्वेंटरी सिस्टम में नए उत्पाद जोड़ें और ट्रैक करें",
    "product.basic_info": "बुनियादी जानकारी",
    "product.name": "उत्पाद का नाम",
    "product.sku": "SKU",
    "product.auto_generate_sku": "स्वचालित रूप से उत्पन्न करें",
    "product.description": "विवरण",
    "product.category": "श्रेणी",
    "product.barcode": "बारकोड (वैकल्पिक)",
    "product.quantity": "मात्रा",
    "product.min_stock_alert": "न्यूनतम स्टॉक अलर्ट",
    "product.cost_price": "लागत मूल्य (₹)",
    "product.selling_price": "विक्रय मूल्य (₹)",
    "product.supplier": "आपूर्तिकर्ता का नाम",
    "product.supplier_contact": "आपूर्तिकर्ता संपर्क",
    "product.purchase_date": "खरीद की तारीख",
    "product.expiry_date": "समाप्ति तिथि",
    "product.images": "उत्पाद छवियां",
    "product.save": "उत्पाद सहेजें",
    "product.cancel": "रद्द करें",
    "product.required": "आवश्यक क्षेत्र",

    // Stock Refill
    "refill.title": "स्टॉक रिफिल",
    "refill.subtitle": "एक उत्पाद चुनें और पर्याप्त स्टॉक बनाए रखने के लिए इन्वेंटरी जोड़ें",
    "refill.select_product": "उत्पाद चुनें",
    "refill.current_stock": "वर्तमान स्टॉक",
    "refill.quantity_to_add": "जोड़ने के लिए मात्रा",
    "refill.updated_stock": "अद्यतन स्टॉक",
    "refill.notes": "नोट्स (वैकल्पिक)",
    "refill.update": "स्टॉक अपडेट करें",

    // Purchase
    "purchase.title": "क्रय बनाएं",
    "purchase.select_product": "उत्पाद चुनें",
    "purchase.quantity": "मात्रा",
    "purchase.unit_price": "यूनिट मूल्य (₹)",
    "purchase.total_amount": "कुल राशि (₹)",
    "purchase.generate_invoice": "चालान बनाएं",
    "purchase.download_invoice": "चालान डाउनलोड करें",

    // Purchases Management
    "purchases.title": "खरीदारी प्रबंधन",
    "purchases.list": "खरीद इतिहास",
    "purchases.date": "तारीख",
    "purchases.product": "उत्पाद",
    "purchases.quantity": "मात्रा",
    "purchases.amount": "राशि (₹)",
    "purchases.status": "स्थिति",
    "purchases.export_csv": "CSV निर्यात करें",
    "purchases.export_excel": "Excel निर्यात करें",
    "purchases.export_pdf": "PDF निर्यात करें",

    // Reports
    "reports.title": "रिपोर्ट",
    "reports.stock_analysis": "स्टॉक विश्लेषण",
    "reports.performance": "उत्पाद प्रदर्शन",
    "reports.trends": "स्टॉक प्रवृत्तियां",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.profile": "प्रोफ़ाइल",
    "settings.password": "पासवर्ड",
    "settings.preferences": "वरीयताएं",
    "settings.categories": "श्रेणियां",
    "settings.language": "भाषा",
    "settings.dark_mode": "डार्क मोड",
    "settings.notifications": "सूचनाएं",
    "settings.stock_alerts": "स्टॉक अलर्ट",

    // Movement History
    "history.title": "आंदोलन का इतिहास",
    "history.timestamp": "समय मुहर",
    "history.user": "उपयोगकर्ता",
    "history.action": "कार्रवाई",
    "history.product_created": "उत्पाद बनाया गया",
    "history.product_updated": "उत्पाद अपडेट किया गया",
    "history.stock_changed": "स्टॉक परिवर्तित",
    "history.category_updated": "श्रेणी अपडेट की गई",
    "history.purchase_created": "क्रय बनाया गया",
    "history.settings_changed": "सेटिंग्स परिवर्तित",
    "history.login": "लॉगिन",
    "history.logout": "लॉगआउट",

    // Common
    "common.confirm": "पुष्टि करें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.save": "सहेजें",
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफल",
    "common.logout": "लॉगआउट",
    "common.logout_confirm": "क्या आप निश्चित रूप से लॉगआउट करना चाहते हैं?",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem("language") as Language | null
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi")) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key
  }

  if (!mounted) return <>{children}</>

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
