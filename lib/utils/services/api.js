import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Custom base query that includes authentication token
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers) => {
    if (typeof window !== 'undefined') {
      // Check if we're on an admin route
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      // Get the appropriate token
      const token = isAdminRoute 
        ? localStorage.getItem('adminToken') 
        : localStorage.getItem('token');
      
      // If we have a token, add it to the headers
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Add user role header for authorization
      if (isAdminRoute) {
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          try {
            const user = JSON.parse(adminUser);
            headers.set('X-User-Role', user.role || 'user');
          } catch (e) {
            headers.set('X-User-Role', 'user');
          }
        }
      } else {
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            headers.set('X-User-Role', userData.role || 'user');
          } catch (e) {
            headers.set('X-User-Role', 'user');
          }
        }
      }
    }
    
    return headers;
  },
});

// Wrapper to handle 401 responses
const baseQueryWithReauth = async (args, api, extraOptions) => {
  const result = await baseQueryWithAuth(args, api, extraOptions);
  
  // If we get a 401 Unauthorized response, clear auth and redirect to login
  if (result.error && result.error.status === 401) {
    if (typeof window !== 'undefined') {
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  }
  
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Category", "UnitType", "Product", "Purchase", "Movement", "Settings", "Currency", "Tax", "User", "Statistics"],
  endpoints: (builder) => ({
    // Category endpoints
    getCategories: builder.query({
      query: () => "/category",
      providesTags: ["Category"],
    }),
    getCategoryById: builder.query({
      query: (id) => `/category/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),
    addCategory: builder.mutation({
      query: (category) => ({
        url: "/category",
        method: "POST",
        body: category,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...category }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body: category,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
    
    // UnitType endpoints
    getUnitTypes: builder.query({
      query: () => "/unit-type",
      providesTags: ["UnitType"],
    }),
    getUnitTypeById: builder.query({
      query: (id) => `/unit-type/${id}`,
      providesTags: (result, error, id) => [{ type: "UnitType", id }],
    }),
    addUnitType: builder.mutation({
      query: (unitType) => ({
        url: "/unit-type",
        method: "POST",
        body: unitType,
      }),
      invalidatesTags: ["UnitType"],
    }),
    updateUnitType: builder.mutation({
      query: ({ id, ...unitType }) => ({
        url: `/unit-type/${id}`,
        method: "PUT",
        body: unitType,
      }),
      invalidatesTags: ["UnitType"],
    }),
    deleteUnitType: builder.mutation({
      query: (id) => ({
        url: `/unit-type/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UnitType"],
    }),
    
    // Product endpoints
    getProducts: builder.query({
      query: (params = {}) => {
        const url = new URL('/product', 'http://localhost');
        if (params.search) {
          url.searchParams.append('search', params.search);
        }
        return {
          url: url.pathname + url.search,
          method: 'GET'
        };
      },
      providesTags: ["Product"],
    }),
    
    // Category endpoints
    getCategories: builder.query({
      query: (params = {}) => {
        const url = new URL('/category', 'http://localhost');
        if (params.search) {
          url.searchParams.append('search', params.search);
        }
        return {
          url: url.pathname + url.search,
          method: 'GET'
        };
      },
      providesTags: ["Category"],
    }),
    
    // Unit Type endpoints
    getUnitTypes: builder.query({
      query: (params = {}) => {
        const url = new URL('/unit-type', 'http://localhost');
        if (params.search) {
          url.searchParams.append('search', params.search);
        }
        return {
          url: url.pathname + url.search,
          method: 'GET'
        };
      },
      providesTags: ["UnitType"],
    }),
    
    // Tax endpoints
    getTaxConfig: builder.query({
      query: (params = {}) => {
        const url = new URL('/tax', 'http://localhost');
        if (params.search) {
          url.searchParams.append('search', params.search);
        }
        return {
          url: url.pathname + url.search,
          method: 'GET'
        };
      },
      providesTags: ["Tax"],
    }),
    
    // Admin User Management endpoints (already supports search)
    getAllUsers: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== "all") {
          params.append("status", filters.status);
        }
        if (filters.role && filters.role !== "all") {
          params.append("role", filters.role);
        }
        if (filters.search) {
          params.append("search", filters.search);
        }
        
        return `/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
      },
      providesTags: ["User"],
    }),
    getProductById: builder.query({
      query: (id) => `/product/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),
    addProduct: builder.mutation({
      query: (product) => ({
        url: "/product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...product }) => ({
        url: `/product/${id}`,
        method: "PUT",
        body: product,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
    
    // Purchase endpoints (placeholder for future implementation)
    getPurchases: builder.query({
      query: () => "/purchase",
      providesTags: ["Purchase"],
    }),
    
    // Movement endpoints
    getMovements: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.eventType && filters.eventType !== "all") {
          params.append("eventType", filters.eventType);
        }
        if (filters.userId) params.append("userId", filters.userId);
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.append("dateTo", filters.dateTo);
        if (filters.limit) params.append("limit", filters.limit.toString());
        
        return `/movement${params.toString() ? `?${params.toString()}` : ""}`;
      },
      providesTags: ["Movement"],
    }),
    getMovementById: builder.query({
      query: (id) => `/movement/${id}`,
      providesTags: (result, error, id) => [{ type: "Movement", id }],
    }),
    addMovement: builder.mutation({
      query: (movement) => ({
        url: "/movement",
        method: "POST",
        body: movement,
      }),
      invalidatesTags: ["Movement"],
    }),
    deleteMovement: builder.mutation({
      query: (id) => ({
        url: `/movement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Movement"],
    }),
    
    // User Settings endpoints
    getUserSettings: builder.query({
      query: (userId) => `/settings?userId=${userId}`,
      providesTags: ["Settings"],
    }),
    updateUserSettings: builder.mutation({
      query: ({ userId, profile, preferences }) => ({
        url: "/settings",
        method: "POST",
        body: { userId, profile, preferences },
      }),
      invalidatesTags: ["Settings"],
    }),
    
    // Currency exchange rates endpoint
    getCurrencyRates: builder.query({
      query: (base = "USD") => `/currency?base=${base}`,
      providesTags: ["Currency"],
    }),
    
    // Tax configuration endpoints
    getTaxConfig: builder.query({
      query: (userId) => `/tax?userId=${userId}`,
      providesTags: ["Tax"],
    }),
    updateTaxConfig: builder.mutation({
      query: ({ userId, gst, platformFee, otherTaxes, changedBy, changedByEmail, changeDescription }) => ({
        url: "/tax",
        method: "POST",
        body: { userId, gst, platformFee, otherTaxes, changedBy, changedByEmail, changeDescription },
      }),
      invalidatesTags: ["Tax"],
    }),
    deleteTaxConfig: builder.mutation({
      query: (userId) => ({
        url: `/tax?userId=${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tax"],
    }),
    
    // Admin User Management endpoints
    getAllUsers: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== "all") {
          params.append("status", filters.status);
        }
        if (filters.role && filters.role !== "all") {
          params.append("role", filters.role);
        }
        if (filters.search) {
          params.append("search", filters.search);
        }
        
        return `/admin/users${params.toString() ? `?${params.toString()}` : ""}`;
      },
      providesTags: ["User"],
    }),
    updateUser: builder.mutation({
      query: ({ userId, role, status, name, email, company }) => ({
        url: "/admin/users",
        method: "PUT",
        body: { userId, role, status, name, email, company },
      }),
      invalidatesTags: ["User", "Statistics"],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/users?userId=${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Statistics"],
    }),
    
    // Admin Statistics endpoint
    getStatistics: builder.query({
      query: () => "/admin/statistics",
      providesTags: ["Statistics"],
    }),
    
    // Auth endpoints
    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: "/auth/change-password",
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetUnitTypesQuery,
  useGetUnitTypeByIdQuery,
  useAddUnitTypeMutation,
  useUpdateUnitTypeMutation,
  useDeleteUnitTypeMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetPurchasesQuery,
  useGetMovementsQuery,
  useGetMovementByIdQuery,
  useAddMovementMutation,
  useDeleteMovementMutation,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useGetCurrencyRatesQuery,
  useGetTaxConfigQuery,
  useUpdateTaxConfigMutation,
  useDeleteTaxConfigMutation,
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetStatisticsQuery,
  useChangePasswordMutation,
} = api;
