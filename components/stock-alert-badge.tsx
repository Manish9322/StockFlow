"use client"

import { checkStockAlerts, type StockAlertConfig } from "@/lib/stock-alerts"
import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react"

interface StockAlertBadgeProps {
  quantity: number
  config?: StockAlertConfig
  compact?: boolean
}

export function StockAlertBadge({ quantity, config, compact = false }: StockAlertBadgeProps) {
  const alerts = checkStockAlerts(quantity, config)

  if (alerts.length === 0) return null

  const highestSeverity = alerts.reduce((highest, alert) => {
    const severityOrder = { info: 1, warning: 2, critical: 3 }
    return severityOrder[alert.severity] > severityOrder[highest.severity] ? alert : highest
  })

  const iconMap = {
    info: <AlertCircle size={14} />,
    warning: <AlertTriangle size={14} />,
    critical: <AlertOctagon size={14} />,
  }

  const styleMap = {
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    warning: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    critical: "bg-red-50 text-red-700 border border-red-200",
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${styleMap[highestSeverity.severity]}`}
      >
        {iconMap[highestSeverity.severity]}
        <span>{highestSeverity.message}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`flex items-start gap-2 p-2 rounded-md text-sm ${styleMap[alert.severity]}`}>
          {iconMap[alert.severity]}
          <div>
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
