import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Purchase from "@/models/purchase.model";
import Product from "@/models/product.model";
import Movement from "@/models/movement.model";

// GET - Fetch a single purchase by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    
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
    
    const { id } = await params;
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
    
    // Log movement
    try {
      const changedFields = Object.keys(updates);
      await Movement.create({
        eventType: "purchase.updated",
        eventTitle: "Purchase Updated",
        description: `Updated purchase ${updatedPurchase.purchaseId} (${changedFields.join(", ")})`,
        userId: body.userId || "system",
        userName: body.userName || "System",
        userEmail: body.userEmail,
        relatedPurchase: updatedPurchase._id,
        metadata: {
          purchaseId: updatedPurchase.purchaseId,
          changedFields,
        },
        changes: {
          before: {
            status: purchase.status,
            supplier: purchase.supplier,
            paymentMethod: purchase.paymentMethod,
            notes: purchase.notes,
          },
          after: updates,
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }
    
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
    
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "system";
    const userName = searchParams.get("userName") || "System";
    const userEmail = searchParams.get("userEmail");
    
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
    
    // Store purchase info before deletion
    const purchaseInfo = {
      purchaseId: purchase.purchaseId,
      totalAmount: purchase.totalAmount,
      itemCount: purchase.items.length,
    };
    
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
    
    // Log movement
    try {
      await Movement.create({
        eventType: "purchase.deleted",
        eventTitle: "Purchase Deleted",
        description: `Deleted purchase ${purchaseInfo.purchaseId} with ${purchaseInfo.itemCount} items (Total: $${purchaseInfo.totalAmount})`,
        userId,
        userName,
        userEmail,
        metadata: purchaseInfo,
        changes: {
          before: purchaseInfo,
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }
    
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
