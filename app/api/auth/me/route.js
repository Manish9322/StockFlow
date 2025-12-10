import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import User from "@/models/user.model";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * GET /api/auth/me - Get current authenticated user
 */
export async function GET(request) {
  try {
    await _db();

    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;

    // Fetch user details
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Return user data without password
    const userData = user.toSafeObject();

    return NextResponse.json(
      {
        success: true,
        data: userData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
