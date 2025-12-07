import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Category", "UnitType", "Product", "Purchase", "Movement"],
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
      query: () => "/product",
      providesTags: ["Product"],
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
    
    // Movement endpoints (placeholder for future implementation)
    getMovements: builder.query({
      query: () => "/movement",
      providesTags: ["Movement"],
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
} = api;
