import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Category from "@/models/category.model";

// GET - Fetch single category by ID
export async function GET(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch category",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update category by ID
export async function PUT(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
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
    
    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }
    
    // Check if another category with the same name exists (excluding current one)
    const duplicateCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (duplicateCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Another category with this name already exists",
        },
        { status: 409 }
      );
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        status: status || "active",
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    
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
        error: "Failed to update category",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete category by ID
export async function DELETE(request, { params }) {
  try {
    await _db();
    
    const { id } = await params;
    
    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category not found",
        },
        { status: 404 }
      );
    }
    
    // Delete category
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete category",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
