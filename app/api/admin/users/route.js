import { NextResponse } from "next/server";
import connectDB from "@/lib/utils/db";
import User from "@/models/user.model";
import Movement from "@/models/movement.model";
import { verifyAuth } from "@/lib/auth-helpers";

// GET - Fetch all users (admin only)
export async function GET(request) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (authResult.error || authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    let query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// PUT - Update user (admin only)
export async function PUT(request) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (authResult.error || authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId, role, status, name, email, company } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;

    // Get the user before update for change tracking
    const userBefore = await User.findById(userId).select("-password");

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Log movement
    try {
      await Movement.create({
        eventType: "user.updated",
        eventTitle: "User Updated",
        description: `Updated user: ${updatedUser.name} (${updatedUser.email})`,
        userId: authResult.user.id,
        userName: authResult.user.name || "Admin",
        userEmail: authResult.user.email,
        relatedUser: updatedUser._id,
        metadata: {
          updatedFields: Object.keys(updateData),
        },
        changes: {
          before: {
            name: userBefore.name,
            email: userBefore.email,
            role: userBefore.role,
            status: userBefore.status,
            company: userBefore.company,
          },
          after: {
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            company: updatedUser.company,
          },
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request) {
  try {
    // Verify admin access
    const authResult = await verifyAuth(request);
    if (authResult.error || authResult.user?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Log movement
    try {
      await Movement.create({
        eventType: "user.deleted",
        eventTitle: "User Deleted",
        description: `Deleted user: ${deletedUser.name} (${deletedUser.email})`,
        userId: authResult.user.id,
        userName: authResult.user.name || "Admin",
        userEmail: authResult.user.email,
        metadata: {
          deletedUser: {
            id: deletedUser._id.toString(),
            name: deletedUser.name,
            email: deletedUser.email,
            role: deletedUser.role,
          },
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
