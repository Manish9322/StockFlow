import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Movement from "@/models/movement.model";

// GET - Fetch a single movement by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    
    const movement = await Movement.findById(id)
      .populate("relatedProduct", "name sku quantity")
      .populate("relatedPurchase", "purchaseId totalAmount")
      .populate("relatedCategory", "name");
    
    if (!movement) {
      return NextResponse.json(
        {
          success: false,
          error: "Movement not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error("Error fetching movement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch movement",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update a movement (optional, for corrections)
export async function PUT(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    const body = await request.json();
    
    const movement = await Movement.findById(id);
    
    if (!movement) {
      return NextResponse.json(
        {
          success: false,
          error: "Movement not found",
        },
        { status: 404 }
      );
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ["description", "metadata", "eventTitle"];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    // Update the movement
    const updatedMovement = await Movement.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate("relatedProduct", "name sku")
      .populate("relatedPurchase", "purchaseId")
      .populate("relatedCategory", "name");
    
    return NextResponse.json({
      success: true,
      data: updatedMovement,
      message: "Movement updated successfully",
    });
  } catch (error) {
    console.error("Error updating movement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update movement",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a movement by ID
export async function DELETE(request, { params }) {
  try {
    await _db();
    
    const { id } = params;
    
    const movement = await Movement.findById(id);
    
    if (!movement) {
      return NextResponse.json(
        {
          success: false,
          error: "Movement not found",
        },
        { status: 404 }
      );
    }
    
    await Movement.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Movement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting movement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete movement",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
