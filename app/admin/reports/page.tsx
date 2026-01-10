"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { AdminRoute } from "@/components/admin-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  Tag, 
  Ruler, 
  Activity, 
  TrendingUp, 
  Eye, 
  Download,
  X
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { 
  useGetAllUsersQuery, 
  useGetProductsQuery, 
  useGetCategoriesQuery, 
  useGetUnitTypesQuery, 
  useGetMovementsQuery 
} from "@/lib/utils/services/api";

// Define types
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  userId: string;
  name: string;
  sku: string;
  description?: string;
  category: {
    _id: string;
    name: string;
  };
  unitType: {
    _id: string;
    name: string;
    abbreviation: string;
  };
  unitSize: number;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  supplierContact?: string;
  minStockAlert: number;
  images?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  userId?: string;
  name: string;
  description?: string;
  status: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UnitType {
  _id: string;
  userId?: string;
  name: string;
  abbreviation: string;
  description?: string;
  status: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  _id: string;
  eventType: string;
  eventTitle: string;
  description: string;
  userId: string;
  userName: string;
  userEmail?: string;
  relatedProduct?: {
    _id: string;
    name: string;
    sku: string;
  };
  relatedPurchase?: {
    _id: string;
    purchaseId: string;
  };
  relatedCategory?: {
    _id: string;
    name: string;
  };
  relatedUser?: {
    _id: string;
    name: string;
  };
  relatedUnitType?: {
    _id: string;
    name: string;
  };
  metadata?: Record<string, any>;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}



// Chart data generators
const generateUserChartData = (users: User[]): ChartDataPoint[] => {
  // Group users by month
  const groupedData: { [key: string]: number } = {};
  
  users.forEach(user => {
    const date = new Date(user.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!groupedData[month]) {
      groupedData[month] = 0;
    }
    groupedData[month]++;
  });
  
  // Convert to chart data format
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count
  }));
};

const generateProductChartData = (products: Product[]): ChartDataPoint[] => {
  // Group products by month
  const groupedData: { [key: string]: number } = {};
  
  products.forEach(product => {
    const date = new Date(product.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!groupedData[month]) {
      groupedData[month] = 0;
    }
    groupedData[month]++;
  });
  
  // Convert to chart data format
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count
  }));
};

const generateCategoryChartData = (categories: Category[]): ChartDataPoint[] => {
  // Group categories by month
  const groupedData: { [key: string]: number } = {};
  
  categories.forEach(category => {
    const date = new Date(category.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!groupedData[month]) {
      groupedData[month] = 0;
    }
    groupedData[month]++;
  });
  
  // Convert to chart data format
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count
  }));
};

const generateUnitTypeChartData = (unitTypes: UnitType[]): ChartDataPoint[] => {
  // Group unit types by month
  const groupedData: { [key: string]: number } = {};
  
  unitTypes.forEach(unitType => {
    const date = new Date(unitType.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!groupedData[month]) {
      groupedData[month] = 0;
    }
    groupedData[month]++;
  });
  
  // Convert to chart data format
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count
  }));
};

const generateActivityChartData = (activities: Activity[]): ChartDataPoint[] => {
  // Group activities by month
  const groupedData: { [key: string]: number } = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.createdAt);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!groupedData[month]) {
      groupedData[month] = 0;
    }
    groupedData[month]++;
  });
  
  // Convert to chart data format
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count
  }));
};



export default function AdminReports() {

  
  const [userChartData, setUserChartData] = useState<ChartDataPoint[]>([]);
  const [productChartData, setProductChartData] = useState<ChartDataPoint[]>([]);
  const [categoryChartData, setCategoryChartData] = useState<ChartDataPoint[]>([]);
  const [unitTypeChartData, setUnitTypeChartData] = useState<ChartDataPoint[]>([]);
  const [activityChartData, setActivityChartData] = useState<ChartDataPoint[]>([]);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery({});
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({});
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery({});
  const { data: unitTypesData, isLoading: unitTypesLoading } = useGetUnitTypesQuery({});
  const { data: movementsData, isLoading: movementsLoading } = useGetMovementsQuery({});
  
  const users = usersData?.users || [];
  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];
  const unitTypes = unitTypesData?.data || [];
  const activities = movementsData?.data || [];
  
  useEffect(() => {
    if (!usersLoading && !productsLoading && !categoriesLoading && !unitTypesLoading && !movementsLoading) {
      // Generate chart data based on fetched data
      setUserChartData(generateUserChartData(usersData?.users || []));
      setProductChartData(generateProductChartData(productsData?.data || []));
      setCategoryChartData(generateCategoryChartData(categoriesData?.data || []));
      setUnitTypeChartData(generateUnitTypeChartData(unitTypesData?.data || []));
      setActivityChartData(generateActivityChartData(movementsData?.data || []));
      
      setLoading(false);
    }
  }, [usersData, productsData, categoriesData, unitTypesData, movementsData, usersLoading, productsLoading, categoriesLoading, unitTypesLoading, movementsLoading]);

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Create CSV content
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(field => 
        typeof field === 'string' ? `"${field.replace(/"/g, '""')}"` : field
      ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderUserTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(usersData?.users || []).map((user: User) => (
          <TableRow key={user._id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderProductTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(productsData?.data || []).map((product: Product) => (
          <TableRow key={product._id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.sku}</TableCell>
            <TableCell>{product.category.name}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>${product.sellingPrice.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCategoryTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(categoriesData?.data || []).map((category: Category) => (
          <TableRow key={category._id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>{category.description}</TableCell>
            <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderUnitTypeTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Abbreviation</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(unitTypesData?.data || []).map((unitType: UnitType) => (
          <TableRow key={unitType._id}>
            <TableCell className="font-medium">{unitType.name}</TableCell>
            <TableCell>{unitType.abbreviation}</TableCell>
            <TableCell>{new Date(unitType.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderActivityTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(movementsData?.data || []).map((activity: Activity) => (
          <TableRow key={activity._id}>
            <TableCell>
              <Badge variant="outline">{activity.eventTitle}</Badge>
            </TableCell>
            <TableCell>{activity.description}</TableCell>
            <TableCell>{activity.userName}</TableCell>
            <TableCell>{new Date(activity.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (usersLoading || productsLoading || categoriesLoading || unitTypesLoading || movementsLoading) {
    return (
      <AdminRoute>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        </MainLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <MainLayout>
        <div className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              View and analyze data across your inventory system with detailed reports and charts.
            </p>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Users Growth</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#000000" activeDot={{ r: 8 }} name="Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Products Growth</h3>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#000000" activeDot={{ r: 8 }} name="Products" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Categories Growth</h3>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#000000" activeDot={{ r: 8 }} name="Categories" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Unit Types Growth</h3>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={unitTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#000000" activeDot={{ r: 8 }} name="Unit Types" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Cards Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
            <div 
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent-foreground bg-card"
              onClick={() => openModal('users')}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Users</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(usersData?.users || []).length}</div>
                <p className="text-xs text-muted-foreground">Total users in system</p>
              </div>
            </div>

            <div 
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent-foreground bg-card"
              onClick={() => openModal('products')}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Products</h3>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(productsData?.data || []).length}</div>
                <p className="text-xs text-muted-foreground">Total products in inventory</p>
              </div>
            </div>

            <div 
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent-foreground bg-card"
              onClick={() => openModal('categories')}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Categories</h3>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(categoriesData?.data || []).length}</div>
                <p className="text-xs text-muted-foreground">Total product categories</p>
              </div>
            </div>

            <div 
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent-foreground bg-card"
              onClick={() => openModal('unitTypes')}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Unit Types</h3>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(unitTypesData?.data || []).length}</div>
                <p className="text-xs text-muted-foreground">Total unit types</p>
              </div>
            </div>

            <div 
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-accent-foreground bg-card"
              onClick={() => openModal('activities')}
            >
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-foreground">Activities</h3>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(movementsData?.data || []).length}</div>
                <p className="text-xs text-muted-foreground">Total system activities</p>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <Card className="mb-4 rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(usersData?.users || [], 'users-report.csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Users CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(productsData?.data || [], 'products-report.csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Products CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(categoriesData?.data || [], 'categories-report.csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Categories CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(unitTypesData?.data || [], 'unit-types-report.csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unit Types CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportCSV(movementsData?.data || [], 'activities-report.csv')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Activities CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal for displaying tables */}
        {activeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-border p-4">
                <h2 className="text-lg font-semibold">
                  {activeModal.charAt(0).toUpperCase() + activeModal.slice(1)} Report
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-auto p-4 grow">
                {activeModal === 'users' && renderUserTable()}
                {activeModal === 'products' && renderProductTable()}
                {activeModal === 'categories' && renderCategoryTable()}
                {activeModal === 'unitTypes' && renderUnitTypeTable()}
                {activeModal === 'activities' && renderActivityTable()}
              </div>
              <div className="border-t border-border p-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (activeModal === 'users') handleExportCSV(usersData?.users || [], 'users-report.csv');
                    if (activeModal === 'products') handleExportCSV(productsData?.data || [], 'products-report.csv');
                    if (activeModal === 'categories') handleExportCSV(categoriesData?.data || [], 'categories-report.csv');
                    if (activeModal === 'unitTypes') handleExportCSV(unitTypesData?.data || [], 'unit-types-report.csv');
                    if (activeModal === 'activities') handleExportCSV(movementsData?.data || [], 'activities-report.csv');
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </AdminRoute>
  );
}