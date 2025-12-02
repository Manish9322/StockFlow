// Logs product changes, stock updates, purchases, settings changes, auth events

export type EventType =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "stock.changed"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "purchase.created"
  | "settings.changed"
  | "auth.login"
  | "auth.logout"

export interface EventLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  eventType: EventType
  eventTitle: string
  description: string
  details?: Record<string, any>
}

const eventTitles: Record<EventType, string> = {
  "product.created": "Product Created",
  "product.updated": "Product Updated",
  "product.deleted": "Product Deleted",
  "stock.changed": "Stock Changed",
  "category.created": "Category Created",
  "category.updated": "Category Updated",
  "category.deleted": "Category Deleted",
  "purchase.created": "Purchase Created",
  "settings.changed": "Settings Changed",
  "auth.login": "Login",
  "auth.logout": "Logout",
}

// In-memory storage for demo, replace with database
let eventLogs: EventLog[] = []

export function logEvent(
  eventType: EventType,
  description: string,
  userId: string,
  userName: string,
  details?: Record<string, any>,
): EventLog {
  const event: EventLog = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    eventType,
    eventTitle: eventTitles[eventType],
    description,
    details,
  }

  eventLogs.unshift(event) // Add to beginning for newest first
  return event
}

export function getEventLogs(filters?: {
  eventType?: EventType
  userId?: string
  dateFrom?: string
  dateTo?: string
}): EventLog[] {
  let filtered = [...eventLogs]

  if (filters?.eventType) {
    filtered = filtered.filter((e) => e.eventType === filters.eventType)
  }

  if (filters?.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId)
  }

  if (filters?.dateFrom) {
    filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(filters.dateFrom!))
  }

  if (filters?.dateTo) {
    filtered = filtered.filter((e) => new Date(e.timestamp) <= new Date(filters.dateTo!))
  }

  return filtered
}

export function clearEventLogs(): void {
  eventLogs = []
}

// Initialize with sample events for demo
export function initializeSampleEvents(): void {
  eventLogs = [
    {
      id: "evt_1",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: "user_123",
      userName: "John Doe",
      eventType: "product.created",
      eventTitle: "Product Created",
      description: "Added new product: Laptop Computer",
      details: { productName: "Laptop Computer", sku: "LAP-001" },
    },
    {
      id: "evt_2",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      userId: "user_123",
      userName: "John Doe",
      eventType: "stock.changed",
      eventTitle: "Stock Changed",
      description: "Updated stock for Wireless Mouse: +10 units (47 → 57)",
      details: { productName: "Wireless Mouse", quantityChange: 10 },
    },
    {
      id: "evt_3",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      userId: "user_124",
      userName: "Jane Smith",
      eventType: "purchase.created",
      eventTitle: "Purchase Created",
      description: "Created purchase invoice #PUR-2024-001 for 5 units",
      details: { purchaseId: "PUR-2024-001", amount: 4495 },
    },
    {
      id: "evt_4",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      userId: "user_123",
      userName: "John Doe",
      eventType: "settings.changed",
      eventTitle: "Settings Changed",
      description: "Updated notification preferences",
      details: { setting: "notifications", oldValue: false, newValue: true },
    },
  ]
}
