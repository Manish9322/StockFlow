import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * POST /api/auth/logout - Logout user
 * In JWT-based auth, logout is handled client-side by removing the token
 * This endpoint is here for consistency and future server-side session management
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;

    // In JWT-based auth, we don't need to do anything server-side
    // Client will remove the token from storage
    return NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to logout",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
