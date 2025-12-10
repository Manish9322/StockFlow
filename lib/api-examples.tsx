/**
 * Example: How to use the authenticated API client in your components
 * 
 * This file demonstrates the proper way to make authenticated API calls
 * in your Stock-Flow application.
 */

import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

// ============================================
// EXAMPLE 1: Fetch Products (GET)
// ============================================
async function fetchProducts() {
  try {
    const response = await api.get("/api/product");
    const data = await response.json();
    
    if (data.success) {
      console.log("Products:", data.data);
      return data.data;
    } else {
      console.error("Error:", data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

// ============================================
// EXAMPLE 2: Create Product (POST)
// ============================================
async function createProduct(productData) {
  try {
    const response = await api.post("/api/product", productData);
    const data = await response.json();
    
    if (data.success) {
      console.log("Product created:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
}

// ============================================
// EXAMPLE 3: Update Product (PUT)
// ============================================
async function updateProduct(productId, updates) {
  try {
    const response = await api.put(`/api/product/${productId}`, updates);
    const data = await response.json();
    
    if (data.success) {
      console.log("Product updated:", data.data);
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
}

// ============================================
// EXAMPLE 4: Delete Product (DELETE)
// ============================================
async function deleteProduct(productId) {
  try {
    const response = await api.delete(`/api/product/${productId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log("Product deleted");
      return true;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
}

// ============================================
// EXAMPLE 5: Using in a React Component
// ============================================
export function ProductList() {
  const { user, token } = useAuth();
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!user || !token) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    loadProducts();
  }, [user, token]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(formData) {
    try {
      const newProduct = await createProduct(formData);
      setProducts([newProduct, ...products]);
      alert("Product created successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDeleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
      alert("Product deleted successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Products ({products.length})</h1>
      {/* Your product list UI here */}
    </div>
  );
}

// ============================================
// EXAMPLE 6: Fetch User Settings
// ============================================
async function fetchSettings() {
  try {
    const response = await api.get("/api/settings");
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    throw error;
  }
}

// ============================================
// EXAMPLE 7: Update User Settings
// ============================================
async function updateSettings(settings) {
  try {
    const response = await api.post("/api/settings", settings);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw error;
  }
}

// ============================================
// IMPORTANT NOTES:
// ============================================
/**
 * 1. The api client automatically includes the JWT token in the Authorization header
 * 2. If the token is invalid or expired, you'll get a 401 response and be redirected to login
 * 3. Always check data.success before using the response
 * 4. All API routes now require authentication except /api/auth/login and /api/auth/signup
 * 5. User data is automatically filtered by userId - users only see their own data
 */

export {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchSettings,
  updateSettings,
};
