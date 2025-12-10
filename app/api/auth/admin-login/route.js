import { NextResponse } from "next/server";
import { generateToken, createAuthResponse } from "@/lib/auth-helpers";

/**
 * POST /api/auth/admin-login - Authenticate admin with static credentials
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // Static admin credentials (development/demo purposes)
    const ADMIN_EMAIL = "stockflowadmin@gmail.com";
    const ADMIN_PASSWORD = "StockFlowAdmin@2025";

    if (email.toLowerCase().trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate token for static admin
      const adminId = "admin-static-id";
      const token = generateToken(adminId, ADMIN_EMAIL);

      // Create static admin user object
      const adminUser = {
        _id: adminId,
        id: adminId,
        email: ADMIN_EMAIL,
        name: "Stock Flow Admin",
        company: "Stock Flow",
        role: "admin",
        status: "active",
      };

      return createAuthResponse(
        {
          success: true,
          message: "Admin login successful",
          data: {
            user: adminUser,
            token,
          },
        },
        token,
        200
      );
    }

    // Invalid admin credentials
    return NextResponse.json(
      { success: false, error: "Invalid admin credentials" },
      { status: 401 }
    );

  } catch (error) {
    console.error("[v0] Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Admin login failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
