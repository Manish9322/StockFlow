import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import UnitType from "@/models/unitType.model";

// GET - Fetch all unit types
export async function GET(request) {
  try {
    await _db();
    
    const unitTypes = await UnitType.find({}).sort({ createdAt: -1 });
    
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

// POST - Create a new unit type
export async function POST(request) {
  try {
    await _db();
    
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
    
    // Check if unit type already exists
    const existingUnitType = await UnitType.findOne({ 
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
    
    // Create new unit type
    const unitType = await UnitType.create({
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      description: description?.trim() || "",
      status: status || "active",
    });
    
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
