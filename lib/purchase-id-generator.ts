// Generate a unique 12-character purchase ID
// Format: PUR + 9 random alphanumeric characters

export function generatePurchaseId(): string {
  const prefix = "PUR"
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomPart = ""
  
  // Generate 9 random characters to make total 12 characters (PUR + 9)
  for (let i = 0; i < 9; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${prefix}${randomPart}`
}
