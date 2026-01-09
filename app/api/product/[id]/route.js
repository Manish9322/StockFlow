import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Product from "@/models/product.model";
import Movement from "@/models/movement.model";
import PriceHistory from "@/models/priceHistory.model";
import User from "@/models/user.model";
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
    
    // Validate required fields
    if (!body.category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category is required",
        },
        { status: 400 }
      );
    }
    
    if (!body.unitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type is required",
        },
        { status: 400 }
      );
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
    
    // Fetch user information for logging
    let userInfo = { name: "User", email: "" };
    try {
      const user = await User.findById(userId);
      if (user) {
        userInfo = { name: user.name, email: user.email };
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }

    // Log movement
    try {
      const changeDescription = changes.length > 0 ? ` (${changes.join(", ")})` : "";
      const movementData = {
        eventType: "product.updated",
        eventTitle: "Product Updated",
        description: `Updated product: ${updatedProduct.name}${changeDescription}`,
        userId: userId,
        userName: userInfo.name,
        userEmail: userInfo.email,
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
      };
      
      console.log("Creating movement with data:", JSON.stringify(movementData, null, 2));
      const movement = await Movement.create(movementData);
      console.log("Movement created successfully:", movement._id);

      // Log price changes to PriceHistory
      if (oldProduct.costPrice !== updatedProduct.costPrice) {
        await PriceHistory.create({
          productId: updatedProduct._id,
          userId: userId,
          priceType: "costPrice",
          oldPrice: oldProduct.costPrice,
          newPrice: updatedProduct.costPrice,
          reason: body.priceChangeReason || "Product update",
          changedBy: {
            userId: userId,
            userName: userInfo.name,
            userEmail: userInfo.email,
          },
        });
      }

      if (oldProduct.sellingPrice !== updatedProduct.sellingPrice) {
        await PriceHistory.create({
          productId: updatedProduct._id,
          userId: userId,
          priceType: "sellingPrice",
          oldPrice: oldProduct.sellingPrice,
          newPrice: updatedProduct.sellingPrice,
          reason: body.priceChangeReason || "Product update",
          changedBy: {
            userId: userId,
            userName: userInfo.name,
            userEmail: userInfo.email,
          },
        });
      }
    } catch (logError) {
      console.error("Error logging movement:", logError);
      console.error("Error details:", logError.message, logError.stack);
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
