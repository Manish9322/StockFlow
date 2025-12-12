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
    
    // Fetch global categories (admin-created) or user-specific categories
    // For now, we only fetch global categories since all categories are admin-managed
    const categories = await Category.find({ isGlobal: true }).sort({ createdAt: -1 });
    
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

// POST - Create a new category (Admin only)
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
          error: "Unauthorized. Only admins can create categories.",
        },
        { status: 403 }
      );
    }
    
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
    
    // Check if category already exists (global check)
    const existingCategory = await Category.findOne({ 
      isGlobal: true,
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
    
    // Create new global category (no userId needed)
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || "",
      status: status || "active",
      isGlobal: true, // Mark as global admin-created category
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
