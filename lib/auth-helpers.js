import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// JWT secret - from environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d"; // Token expires in 1 day

/**
 * Generate JWT token for user
 */
export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract user ID from request headers
 * Checks for Authorization header with Bearer token
 */
export function getUserIdFromRequest(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    console.error("Error extracting user ID:", error);
    return null;
  }
}

/**
 * Middleware to protect API routes - require authentication
 * Returns user ID if authenticated, otherwise returns error response
 */
export function requireAuth(request) {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      ),
      userId: null
    };
  }

  return { error: null, userId };
}

/**
 * Create response with JWT token in headers
 */
export function createAuthResponse(data, token, status = 200) {
  const response = NextResponse.json(data, { status });
  
  if (token) {
    response.headers.set("Authorization", `Bearer ${token}`);
  }
  
  return response;
}

/**
 * Verify authentication and return user info
 * Handles both database users and static admin
 */
export async function verifyAuth(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "No token provided", user: null };
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return { error: "Invalid token", user: null };
    }

    // Check if this is the static admin
    if (decoded.userId === "admin-static-id" && decoded.email === "stockflowadmin@gmail.com") {
      return {
        error: null,
        user: {
          id: "admin-static-id",
          userId: "admin-static-id",
          email: "stockflowadmin@gmail.com",
          name: "Stock Flow Admin",
          role: "admin",
          status: "active",
        }
      };
    }

    // For regular database users
    return {
      error: null,
      user: {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
      }
    };
  } catch (error) {
    console.error("Error verifying auth:", error);
    return { error: "Authentication failed", user: null };
  }
}
