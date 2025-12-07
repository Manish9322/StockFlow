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
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomPart = ""
  
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${prefix}${randomPart}`
}

export function formatSKUForDisplay(sku: string): string {
  // Format SKU nicely: CATG-YYMMDD-0001 -> CATG-YY-MM-DD-0001
  return sku
}
