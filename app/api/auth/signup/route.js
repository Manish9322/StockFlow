import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import User from "@/models/user.model";
import { generateToken, createAuthResponse } from "@/lib/auth-helpers";

/**
 * POST /api/auth/signup - Register a new user
 */
export async function POST(request) {
  try {
    await _db();

    const body = await request.json();
    const { email, password, name, company } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      company: company?.trim() || "",
      role: "user",
      status: "active",
    });

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Return user data without password
    const userData = user.toSafeObject();

    return createAuthResponse(
      {
        success: true,
        message: "User registered successfully",
        data: {
          user: userData,
          token,
        },
      },
      token,
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register user",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
