import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Movement from "@/models/movement.model";

// GET - Fetch all movements with optional filters
export async function GET(request) {
  try {
    await _db();
    
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("eventType");
    const userId = searchParams.get("userId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = searchParams.get("limit");
    
    // Build query
    let query = {};
    
    if (eventType && eventType !== "all") {
      query.eventType = eventType;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo + "T23:59:59");
      }
    }
    
    // Build query with optional limit
    let queryBuilder = Movement.find(query)
      .populate("relatedProduct", "name sku")
      .populate("relatedPurchase", "purchaseId")
      .populate("relatedCategory", "name")
      .sort({ createdAt: -1 });
    
    if (limit) {
      queryBuilder = queryBuilder.limit(parseInt(limit));
    }
    
    const movements = await queryBuilder;
    
    return NextResponse.json({
      success: true,
      data: movements,
      count: movements.length,
    });
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch movements",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new movement/event log
export async function POST(request) {
  try {
    await _db();
    
    const body = await request.json();
    const {
      eventType,
      eventTitle,
      description,
      userId,
      userName,
      userEmail,
      relatedProduct,
      relatedPurchase,
      relatedCategory,
      metadata,
      changes,
      ipAddress,
      userAgent,
    } = body;
    
    // Validation
    if (!eventType || !eventTitle || !description || !userId || !userName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: eventType, eventTitle, description, userId, userName",
        },
        { status: 400 }
      );
    }
    
    // Create movement
    const movement = new Movement({
      eventType,
      eventTitle,
      description,
      userId,
      userName,
      userEmail,
      relatedProduct,
      relatedPurchase,
      relatedCategory,
      metadata: metadata || {},
      changes,
      ipAddress,
      userAgent,
    });
    
    await movement.save();
    
    // Populate the response
    const populatedMovement = await Movement.findById(movement._id)
      .populate("relatedProduct", "name sku")
      .populate("relatedPurchase", "purchaseId")
      .populate("relatedCategory", "name");
    
    return NextResponse.json(
      {
        success: true,
        data: populatedMovement,
        message: "Movement logged successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating movement:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create movement",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear all movements (optional, for admin use)
export async function DELETE(request) {
  try {
    await _db();
    
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get("confirm");
    
    if (confirm !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "Please confirm deletion by adding ?confirm=true",
        },
        { status: 400 }
      );
    }
    
    const result = await Movement.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} movements`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting movements:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete movements",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
