import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Product from "@/models/product.model";

// GET - Fetch all products
export async function GET(request) {
  try {
    await _db();
    
    const products = await Product.find({})
      .populate("category", "name")
      .populate("unitType", "name abbreviation")
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request) {
  try {
    await _db();
    
    const body = await request.json();
    const {
      name,
      sku,
      description,
      category,
      unitType,
      unitSize,
      quantity,
      costPrice,
      sellingPrice,
      supplier,
      supplierContact,
      supplierRegistrationNumber,
      purchaseDate,
      expiryDate,
      minStockAlert,
      images,
      status,
    } = body;
    
    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Product name is required",
        },
        { status: 400 }
      );
    }
    
    if (!sku || sku.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "SKU is required",
        },
        { status: 400 }
      );
    }
    
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category is required",
        },
        { status: 400 }
      );
    }
    
    if (!unitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type is required",
        },
        { status: 400 }
      );
    }
    
    // Check if product with same SKU already exists
    const existingProduct = await Product.findOne({ 
      sku: { $regex: new RegExp(`^${sku}$`, 'i') }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product with this SKU already exists",
        },
        { status: 409 }
      );
    }
    
    // Create new product
    const product = await Product.create({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      description: description?.trim() || "",
      category,
      unitType,
      unitSize: parseFloat(unitSize) || 1,
      quantity: parseInt(quantity) || 0,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      supplier: supplier?.trim() || "",
      supplierContact: supplierContact?.trim() || "",
      supplierRegistrationNumber: supplierRegistrationNumber?.trim() || "",
      purchaseDate: purchaseDate || null,
      expiryDate: expiryDate || null,
      minStockAlert: parseInt(minStockAlert) || 10,
      images: images || [],
      status: status || "active",
    });
    
    // Populate the response
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name")
      .populate("unitType", "name abbreviation");
    
    return NextResponse.json(
      {
        success: true,
        data: populatedProduct,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Product with this SKU already exists",
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
