// Alerts for exactly 10, below 10, and configurable last N units

export interface StockAlertLevel {
  type: "exact" | "below" | "last"
  threshold: number
  severity: "info" | "warning" | "critical"
  message: string
}

export interface StockAlertConfig {
  enableExactTen: boolean
  enableBelowTen: boolean
  enableLastNUnits: boolean
  lastNThreshold: number
}

// Default configuration
const defaultConfig: StockAlertConfig = {
  enableExactTen: true,
  enableBelowTen: true,
  enableLastNUnits: true,
  lastNThreshold: 5,
}

export function checkStockAlerts(quantity: number, config: StockAlertConfig = defaultConfig): StockAlertLevel[] {
  const alerts: StockAlertLevel[] = []

  if (config.enableExactTen && quantity === 10) {
    alerts.push({
      type: "exact",
      threshold: 10,
      severity: "info",
      message: "Stock level is exactly 10 units",
    })
  }

  if (config.enableBelowTen && quantity < 10 && quantity > 0) {
    alerts.push({
      type: "below",
      threshold: 10,
      severity: "warning",
      message: `Low stock: Only ${quantity} units remaining`,
    })
  }

  if (config.enableLastNUnits && quantity <= config.lastNThreshold && quantity > 0) {
    alerts.push({
      type: "last",
      threshold: config.lastNThreshold,
      severity: "critical",
      message: `Critical stock: Only ${quantity} units left (configured threshold: ${config.lastNThreshold})`,
    })
  }

  if (quantity === 0) {
    alerts.push({
      type: "below",
      threshold: 1,
      severity: "critical",
      message: "Out of stock - immediate action required",
    })
  }

  return alerts
}

export function getAlertBadgeColor(severity: "info" | "warning" | "critical"): string {
  switch (severity) {
    case "info":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }
}

export function getAlertIcon(severity: "info" | "warning" | "critical"): string {
  switch (severity) {
    case "info":
      return "ℹ️"
    case "warning":
      return "⚠️"
    case "critical":
      return "🚨"
  }
}
