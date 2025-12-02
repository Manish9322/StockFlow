// Format: CATG-YYMMDD-XXXX (Category code, date, sequential counter)

const categoryPrefixes: Record<string, string> = {
  Electronics: "ELEC",
  Accessories: "ACCS",
  Cables: "CABL",
  Storage: "STOR",
  Displays: "DISP",
  Other: "OTHR",
}

const skuCounters: Record<string, number> = {}

export function generateSKU(category: string): string {
  const prefix = categoryPrefixes[category] || "PROD"
  const now = new Date()
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "")
  const dayKey = `${prefix}-${dateStr}`

  skuCounters[dayKey] = (skuCounters[dayKey] || 0) + 1
  const counter = String(skuCounters[dayKey]).padStart(4, "0")

  return `${prefix}-${dateStr}-${counter}`
}

export function formatSKUForDisplay(sku: string): string {
  // Format SKU nicely: CATG-YYMMDD-0001 -> CATG-YY-MM-DD-0001
  return sku
}
