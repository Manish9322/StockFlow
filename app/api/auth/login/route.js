import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import User from "@/models/user.model";
import { generateToken, createAuthResponse } from "@/lib/auth-helpers";

/**
 * POST /api/auth/login - Authenticate user
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

    await _db();

    // Find user by email (include password field)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { 
          success: false, 
          error: `Account is ${user.status}. Please contact support.` 
        },
        { status: 403 }
      );
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Return user data without password
    const userData = user.toSafeObject();

    return createAuthResponse(
      {
        success: true,
        message: "Login successful",
        data: {
          user: userData,
          token,
        },
      },
      token,
      200
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to login",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
