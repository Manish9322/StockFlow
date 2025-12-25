import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import UnitType from "@/models/unitType.model";
import Movement from "@/models/movement.model";
import { requireAuth } from "@/lib/auth-helpers";

// GET - Fetch all unit types
export async function GET(request) {
  try {
    await _db();
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    // Fetch global unit types (admin-created)
    // For now, we only fetch global unit types since all unit types are admin-managed
    const unitTypes = await UnitType.find({ isGlobal: true }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: unitTypes,
      count: unitTypes.length,
    });
  } catch (error) {
    console.error("Error fetching unit types:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch unit types",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new unit type (Admin only)
export async function POST(request) {
  try {
    await _db();
    
    // Verify user is authenticated and is admin
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    // Get user role from request headers
    const role = request.headers.get("X-User-Role");
    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Only admins can create unit types.",
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, abbreviation, description, status } = body;
    
    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type name is required",
        },
        { status: 400 }
      );
    }
    
    if (!abbreviation || abbreviation.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Unit abbreviation is required",
        },
        { status: 400 }
      );
    }
    
    // Check if unit type already exists (global check)
    const existingUnitType = await UnitType.findOne({ 
      isGlobal: true,
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { abbreviation: { $regex: new RegExp(`^${abbreviation}$`, 'i') } }
      ]
    });
    
    if (existingUnitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type with this name or abbreviation already exists",
        },
        { status: 409 }
      );
    }
    
    // Create new global unit type (no userId needed)
    const unitType = await UnitType.create({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      description: description?.trim() || "",
      status: status || "active",
      isGlobal: true, // Mark as global admin-created unit type
    });
    
    // Log movement
    try {
      await Movement.create({
        eventType: "unitType.created",
        eventTitle: "Unit Type Created",
        description: `Created new unit type: ${unitType.name} (${unitType.abbreviation})`,
        userId: userId,
        userName: "Admin",
        relatedUnitType: unitType._id,
        metadata: {
          name: unitType.name,
          abbreviation: unitType.abbreviation,
          description: unitType.description,
        },
        changes: {
          after: {
            name: unitType.name,
            abbreviation: unitType.abbreviation,
            description: unitType.description,
            status: unitType.status,
          },
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }
    
    return NextResponse.json(
      {
        success: true,
        data: unitType,
        message: "Unit type created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating unit type:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type with this name or abbreviation already exists",
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create unit type",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
