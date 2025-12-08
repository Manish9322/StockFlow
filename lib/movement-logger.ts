// Helper function to log movements/activities in the system

export type EventType =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "stock.changed"
  | "stock.refill"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "purchase.created"
  | "purchase.updated"
  | "purchase.deleted"
  | "settings.changed"
  | "auth.login"
  | "auth.logout"

interface LogMovementParams {
  eventType: EventType
  eventTitle: string
  description: string
  userId?: string
  userName?: string
  userEmail?: string
  relatedProduct?: string
  relatedPurchase?: string
  relatedCategory?: string
  metadata?: Record<string, any>
  changes?: {
    before?: any
    after?: any
  }
}

interface MovementFilters {
  eventType?: EventType | "all"
  userId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

export async function logMovement({
  eventType,
  eventTitle,
  description,
  userId = "system",
  userName = "System",
  userEmail,
  relatedProduct,
  relatedPurchase,
  relatedCategory,
  metadata = {},
  changes,
}: LogMovementParams) {
  try {
    const response = await fetch("/api/movement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        eventTitle,
        description,
        userId,
        userName,
        userEmail,
        relatedProduct,
        relatedPurchase,
        relatedCategory,
        metadata,
        changes,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      console.error("Failed to log movement:", data.error);
    }
    
    return data;
  } catch (error) {
    console.error("Error logging movement:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to fetch movements with filters
export async function fetchMovements(filters: MovementFilters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.eventType && filters.eventType !== "all") {
      params.append("eventType", filters.eventType);
    }
    
    if (filters.userId) {
      params.append("userId", filters.userId);
    }
    
    if (filters.dateFrom) {
      params.append("dateFrom", filters.dateFrom);
    }
    
    if (filters.dateTo) {
      params.append("dateTo", filters.dateTo);
    }
    
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }
    
    const url = `/api/movement${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error("Error fetching movements:", error);
    return { success: false, error: (error as Error).message, data: [] };
  }
}

// Helper function to delete a movement
export async function deleteMovement(id: string) {
  try {
    const response = await fetch(`/api/movement/${id}`, {
      method: "DELETE",
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting movement:", error);
    return { success: false, error: (error as Error).message };
  }
}
