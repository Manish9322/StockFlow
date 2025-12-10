import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Product from "@/models/product.model";
import Movement from "@/models/movement.model";
import { requireAuth } from "@/lib/auth-helpers";

// GET - Fetch single product by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const { id } = await params;
    const product = await Product.findOne({ _id: id, userId })
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
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const { id } = await params;
    const body = await request.json();
    
    // Check if product exists and belongs to user
    const existingProduct = await Product.findOne({ _id: id, userId });
    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 }
      );
    }
    
    // If SKU is being updated, check for duplicates within user's products
    if (body.sku && body.sku !== existingProduct.sku) {
      const duplicateProduct = await Product.findOne({
        userId,
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
    
    // Store old values for change tracking
    const oldProduct = {
      name: existingProduct.name,
      sku: existingProduct.sku,
      quantity: existingProduct.quantity,
      costPrice: existingProduct.costPrice,
      sellingPrice: existingProduct.sellingPrice,
    };
    
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
    
    // Detect what changed
    const changes = [];
    if (oldProduct.name !== updatedProduct.name) changes.push(`name: "${oldProduct.name}" → "${updatedProduct.name}"`);
    if (oldProduct.sku !== updatedProduct.sku) changes.push(`SKU: "${oldProduct.sku}" → "${updatedProduct.sku}"`);
    if (oldProduct.quantity !== updatedProduct.quantity) changes.push(`quantity: ${oldProduct.quantity} → ${updatedProduct.quantity}`);
    if (oldProduct.costPrice !== updatedProduct.costPrice) changes.push(`cost price: $${oldProduct.costPrice} → $${updatedProduct.costPrice}`);
    if (oldProduct.sellingPrice !== updatedProduct.sellingPrice) changes.push(`selling price: $${oldProduct.sellingPrice} → $${updatedProduct.sellingPrice}`);
    
    // Log movement
    try {
      const changeDescription = changes.length > 0 ? ` (${changes.join(", ")})` : "";
      await Movement.create({
        eventType: "product.updated",
        eventTitle: "Product Updated",
        description: `Updated product: ${updatedProduct.name}${changeDescription}`,
        userId: userId,
        userName: body.userName || "User",
        userEmail: body.userEmail,
        relatedProduct: updatedProduct._id,
        metadata: {
          sku: updatedProduct.sku,
          changedFields: changes,
        },
        changes: {
          before: oldProduct,
          after: {
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            quantity: updatedProduct.quantity,
            costPrice: updatedProduct.costPrice,
            sellingPrice: updatedProduct.sellingPrice,
          },
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }
    
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
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const { id } = await params;
    
    const product = await Product.findOne({ _id: id, userId })
      .populate("category", "name")
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
    
    // Store product info before deletion for logging
    const productInfo = {
      name: product.name,
      sku: product.sku,
      quantity: product.quantity,
      category: product.category?.name,
    };
    
    await Product.findByIdAndDelete(id);
    
    // Log movement
    try {
      await Movement.create({
        eventType: "product.deleted",
        eventTitle: "Product Deleted",
        description: `Deleted product: ${productInfo.name} (SKU: ${productInfo.sku})`,
        userId,
        userName: "User",
        userEmail: null,
        metadata: {
          productName: productInfo.name,
          sku: productInfo.sku,
          quantity: productInfo.quantity,
          category: productInfo.category,
        },
        changes: {
          before: productInfo,
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }
    
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
