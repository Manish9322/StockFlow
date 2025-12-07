import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Product from "@/models/product.model";

// GET - Fetch single product by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    const product = await Product.findById(id)
      .populate("category", "name description")
      .populate("unitType", "name abbreviation");
    
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update product by ID
export async function PUT(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    const body = await request.json();
    
    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }
    
    // If SKU is being updated, check for duplicates
    if (body.sku && body.sku !== existingProduct.sku) {
      const duplicateProduct = await Product.findOne({
        _id: { $ne: id },
        sku: { $regex: new RegExp(`^${body.sku}$`, 'i') }
      });
      
      if (duplicateProduct) {
        return NextResponse.json(
          {
            success: false,
            error: "Another product with this SKU already exists",
          },
          { status: 409 }
        );
      }
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...body,
        sku: body.sku?.trim().toUpperCase(),
      },
      { new: true, runValidators: true }
    )
      .populate("category", "name")
      .populate("unitType", "name abbreviation");
    
    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
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
        error: "Failed to update product",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete product by ID
export async function DELETE(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }
    
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
