import { NextResponse } from "next/server";
import dbConnect from "@/lib/utils/db";
import TaxConfig from "@/models/tax.model";

// GET: Get tax configuration for a user
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    let taxConfig = await TaxConfig.findOne({ userId });

    // If no config exists, create a default one
    if (!taxConfig) {
      taxConfig = await TaxConfig.create({
        userId,
        gst: {
          enabled: false,
          rate: 18,
          type: "exclusive",
          description: "Goods and Services Tax",
        },
        platformFee: {
          enabled: false,
          rate: 0,
          type: "percentage",
          description: "Platform transaction fee",
        },
        otherTaxes: [],
        changeHistory: [],
        status: "active",
      });
    }

    return NextResponse.json({
      success: true,
      data: taxConfig,
    });
  } catch (error) {
    console.error("Error fetching tax configuration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tax configuration" },
      { status: 500 }
    );
  }
}

// POST: Create or update tax configuration
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, gst, platformFee, otherTaxes, changedBy, changedByEmail, changeDescription } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    let taxConfig = await TaxConfig.findOne({ userId });

    if (!taxConfig) {
      // Create new tax configuration
      taxConfig = await TaxConfig.create({
        userId,
        gst: gst || {
          enabled: false,
          rate: 18,
          type: "exclusive",
        },
        platformFee: platformFee || {
          enabled: false,
          rate: 0,
          type: "percentage",
        },
        otherTaxes: otherTaxes || [],
        changeHistory: [
          {
            changedBy: changedBy || userId,
            changedByEmail,
            changeDate: new Date(),
            changes: { action: "created", data: { gst, platformFee, otherTaxes } },
            description: changeDescription || "Initial tax configuration created",
          },
        ],
        status: "active",
      });
    } else {
      // Update existing configuration and track changes
      const oldConfig = {
        gst: taxConfig.gst,
        platformFee: taxConfig.platformFee,
        otherTaxes: taxConfig.otherTaxes,
      };

      // Update fields
      if (gst !== undefined) taxConfig.gst = gst;
      if (platformFee !== undefined) taxConfig.platformFee = platformFee;
      if (otherTaxes !== undefined) taxConfig.otherTaxes = otherTaxes;

      // Add to change history
      taxConfig.changeHistory.push({
        changedBy: changedBy || userId,
        changedByEmail,
        changeDate: new Date(),
        changes: {
          before: oldConfig,
          after: { gst, platformFee, otherTaxes },
        },
        description: changeDescription || "Tax configuration updated",
      });

      await taxConfig.save();
    }

    return NextResponse.json({
      success: true,
      data: taxConfig,
      message: "Tax configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating tax configuration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update tax configuration" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a tax configuration (soft delete by setting status to inactive)
export async function DELETE(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const taxConfig = await TaxConfig.findOneAndUpdate(
      { userId },
      { status: "inactive" },
      { new: true }
    );

    if (!taxConfig) {
      return NextResponse.json(
        { success: false, error: "Tax configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tax configuration deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting tax configuration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete tax configuration" },
      { status: 500 }
    );
  }
}
