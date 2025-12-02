export interface Product {
  id: string
  name: string
  sku: string
  quantity: number
  category: string
  costPrice: number
  sellingPrice: number
  supplier: string
  lastUpdated: string
}

export const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Laptop Computer",
    sku: "ELEC-241126-0001",
    quantity: 15,
    category: "Electronics",
    costPrice: 600,
    sellingPrice: 899,
    supplier: "TechSupply Co.",
    lastUpdated: "2024-11-25",
  },
  {
    id: "2",
    name: "Wireless Mouse",
    sku: "ACCS-241126-0001",
    quantity: 47,
    category: "Accessories",
    costPrice: 12,
    sellingPrice: 24.99,
    supplier: "PeripheralInc",
    lastUpdated: "2024-11-24",
  },
  {
    id: "3",
    name: "USB-C Cable",
    sku: "CABL-241126-0001",
    quantity: 3,
    category: "Cables",
    costPrice: 2,
    sellingPrice: 5.99,
    supplier: "CableMax",
    lastUpdated: "2024-11-22",
  },
  {
    id: "4",
    name: "Mechanical Keyboard",
    sku: "ACCS-241126-0002",
    quantity: 28,
    category: "Accessories",
    costPrice: 75,
    sellingPrice: 149.99,
    supplier: "KeyTech",
    lastUpdated: "2024-11-26",
  },
  {
    id: "5",
    name: "External SSD 1TB",
    sku: "STOR-241126-0001",
    quantity: 9,
    category: "Storage",
    costPrice: 80,
    sellingPrice: 129.99,
    supplier: "StoragePro",
    lastUpdated: "2024-11-23",
  },
  {
    id: "6",
    name: 'Monitor 27"',
    sku: "DISP-241126-0001",
    quantity: 12,
    category: "Displays",
    costPrice: 180,
    sellingPrice: 299.99,
    supplier: "DisplayWorld",
    lastUpdated: "2024-11-26",
  },
]

export interface StockHistory {
  id: string
  productId: string
  action: "added" | "removed" | "initial"
  quantity: number
  date: string
  notes?: string
}

export const sampleStockHistory: StockHistory[] = [
  { id: "1", productId: "1", action: "added", quantity: 5, date: "2024-11-25", notes: "Restocking order" },
  { id: "2", productId: "1", action: "removed", quantity: 2, date: "2024-11-23", notes: "Sales" },
  { id: "3", productId: "1", action: "initial", quantity: 12, date: "2024-11-01" },
]
