import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import UnitType from "@/models/unitType.model";
import { requireAuth } from "@/lib/auth-helpers";

// GET - Fetch single unit type by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const { id } = await params;
    const unitType = await UnitType.findById(id);
    
    if (!unitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: unitType,
    });
  } catch (error) {
    console.error("Error fetching unit type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch unit type",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update unit type by ID (Admin only)
export async function PUT(request, { params }) {
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
          error: "Unauthorized. Only admins can update unit types.",
        },
        { status: 403 }
      );
    }
    
    const { id } = await params;
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
    
    // Check if unit type exists
    const existingUnitType = await UnitType.findById(id);
    if (!existingUnitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type not found",
        },
        { status: 404 }
      );
    }
    
    // Check if another unit type with the same name or abbreviation exists (excluding current one)
    const duplicateUnitType = await UnitType.findOne({
      _id: { $ne: id },
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { abbreviation: { $regex: new RegExp(`^${abbreviation}$`, 'i') } }
      ]
    });
    
    if (duplicateUnitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Another unit type with this name or abbreviation already exists",
        },
        { status: 409 }
      );
    }
    
    // Update unit type
    const updatedUnitType = await UnitType.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
        description: description?.trim() || "",
        status: status || "active",
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedUnitType,
      message: "Unit type updated successfully",
    });
  } catch (error) {
    console.error("Error updating unit type:", error);
    
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
        error: "Failed to update unit type",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete unit type by ID (Admin only)
export async function DELETE(request, { params }) {
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
          error: "Unauthorized. Only admins can delete unit types.",
        },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    
    // Check if unit type exists
    const unitType = await UnitType.findById(id);
    if (!unitType) {
      return NextResponse.json(
        {
          success: false,
          error: "Unit type not found",
        },
        { status: 404 }
      );
    }
    
    // Delete unit type
    await UnitType.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Unit type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting unit type:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete unit type",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
