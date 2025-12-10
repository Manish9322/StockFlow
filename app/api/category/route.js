import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Category from "@/models/category.model";
import { requireAuth } from "@/lib/auth-helpers";

// GET - Fetch all categories
export async function GET(request) {
  try {
    await _db();
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const categories = await Category.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request) {
  try {
    await _db();
    
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;
    
    const body = await request.json();
    const { name, description, status } = body;
    
    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Category name is required",
        },
        { status: 400 }
      );
    }
    
    // Check if category already exists for this user
    const existingCategory = await Category.findOne({ 
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category with this name already exists",
        },
        { status: 409 }
      );
    }
    
    // Create new category
    const category = await Category.create({
      userId,
      name: name.trim(),
      description: description?.trim() || "",
      status: status || "active",
    });
    
    return NextResponse.json(
      {
        success: true,
        data: category,
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Category with this name already exists",
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create category",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
