import { NextResponse } from "next/server";
import connectDB from "@/lib/utils/db";
import UserSettings from "@/models/userSettings.model";

// GET - Retrieve user settings
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    let settings = await UserSettings.findOne({ userId });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await UserSettings.create({
        userId,
        preferences: {
          lowStockThreshold: 10,
          currency: "USD",
          timezone: "UTC",
          darkMode: false,
          emailNotifications: true,
          weeklyReports: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

// POST/PUT - Update user settings
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, profile, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find existing settings or create new
    let settings = await UserSettings.findOne({ userId });

    if (settings) {
      // Update existing settings
      if (profile) {
        settings.profile = { ...settings.profile, ...profile };
      }
      if (preferences) {
        settings.preferences = { ...settings.preferences, ...preferences };
      }
      await settings.save();
    } else {
      // Create new settings
      settings = await UserSettings.create({
        userId,
        profile: profile || {},
        preferences: preferences || {},
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}

// PUT - Alternative update method
export async function PUT(request) {
  return POST(request);
}
