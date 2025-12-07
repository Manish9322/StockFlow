import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Purchase from "@/models/purchase.model";
import Product from "@/models/product.model";

// GET - Fetch a single purchase by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    
    const purchase = await Purchase.findById(id).populate({
      path: "items.product",
      select: "name sku",
    });
    
    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchase",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update a purchase
export async function PUT(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    const body = await request.json();
    
    const purchase = await Purchase.findById(id);
    
    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ["status", "supplier", "paymentMethod", "notes", "date"];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    // Update the purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate({
      path: "items.product",
      select: "name sku",
    });
    
    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: "Purchase updated successfully",
    });
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update purchase",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a purchase
export async function DELETE(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    
    const purchase = await Purchase.findById(id);
    
    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          error: "Purchase not found",
        },
        { status: 404 }
      );
    }
    
    // Revert product quantities before deleting
    for (const item of purchase.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity -= item.quantity;
        if (product.quantity < 0) product.quantity = 0;
        await product.save();
      }
    }
    
    await Purchase.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete purchase",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
