import { NextResponse } from "next/server";
import dbConnect from "@/lib/utils/db";
import TaxConfig from "@/models/tax.model";
import Movement from "@/models/movement.model";
import { requireAuth } from "@/lib/auth-helpers";

// GET: Get tax configuration for a user
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // For regular users, fetch global tax config (admin-created)
    // For admin, also fetch global config
    let taxConfig = await TaxConfig.findOne({ isGlobal: true });

    // If no global config exists, create a default one
    if (!taxConfig) {
      taxConfig = await TaxConfig.create({
        isGlobal: true,
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

// POST: Create or update tax configuration (Admin only)
export async function POST(request) {
  try {
    await dbConnect();

    // Verify user is authenticated and is admin
    const { error, userId: authUserId } = requireAuth(request);
    if (error) return error;
    
    // Get user role from request headers
    const role = request.headers.get("X-User-Role");
    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Only admins can modify tax configurations.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, gst, platformFee, otherTaxes, changedBy, changedByEmail, changeDescription } = body;

    // Admin updates the global tax configuration
    let taxConfig = await TaxConfig.findOne({ isGlobal: true });

    if (!taxConfig) {
      // Create new global tax configuration
      taxConfig = await TaxConfig.create({
        isGlobal: true,
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
            changedBy: changedBy || "admin",
            changedByEmail,
            changeDate: new Date(),
            changes: { action: "created", data: { gst, platformFee, otherTaxes } },
            description: changeDescription || "Initial tax configuration created",
          },
        ],
        status: "active",
      });
      
      // Log movement for creation
      try {
        await Movement.create({
          eventType: "tax.created",
          eventTitle: "Tax Configuration Created",
          description: changeDescription || "Created initial tax configuration",
          userId: authUserId,
          userName: changedBy || "Admin",
          userEmail: changedByEmail,
          metadata: {
            gst: taxConfig.gst,
            platformFee: taxConfig.platformFee,
            otherTaxes: taxConfig.otherTaxes,
          },
          changes: {
            after: {
              gst: taxConfig.gst,
              platformFee: taxConfig.platformFee,
              otherTaxes: taxConfig.otherTaxes,
            },
          },
        });
      } catch (logError) {
        console.error("Error logging movement:", logError);
      }
    } else {
      // Update existing global configuration and track changes
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
        changedBy: changedBy || "admin",
        changedByEmail,
        changeDate: new Date(),
        changes: {
          before: oldConfig,
          after: { gst, platformFee, otherTaxes },
        },
        description: changeDescription || "Tax configuration updated",
      });

      await taxConfig.save();
      
      // Log movement for update
      try {
        await Movement.create({
          eventType: "tax.updated",
          eventTitle: "Tax Configuration Updated",
          description: changeDescription || "Updated tax configuration",
          userId: authUserId,
          userName: changedBy || "Admin",
          userEmail: changedByEmail,
          metadata: {
            gst: taxConfig.gst,
            platformFee: taxConfig.platformFee,
            otherTaxes: taxConfig.otherTaxes,
          },
          changes: {
            before: oldConfig,
            after: {
              gst: taxConfig.gst,
              platformFee: taxConfig.platformFee,
              otherTaxes: taxConfig.otherTaxes,
            },
          },
        });
      } catch (logError) {
        console.error("Error logging movement:", logError);
      }
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

// DELETE: Delete a tax configuration (Admin only, soft delete by setting status to inactive)
export async function DELETE(request) {
  try {
    await dbConnect();

    // Verify user is authenticated and is admin
    const { error, userId: authUserId } = requireAuth(request);
    if (error) return error;
    
    // Get user role from request headers
    const role = request.headers.get("X-User-Role");
    if (role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Only admins can delete tax configurations.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Delete/deactivate the global tax configuration
    const taxConfig = await TaxConfig.findOneAndUpdate(
      { isGlobal: true },
      { status: "inactive" },
      { new: true }
    );

    if (!taxConfig) {
      return NextResponse.json(
        { success: false, error: "Tax configuration not found" },
        { status: 404 }
      );
    }

    // Log movement for deletion
    try {
      await Movement.create({
        eventType: "tax.deleted",
        eventTitle: "Tax Configuration Deactivated",
        description: "Deactivated tax configuration",
        userId: authUserId,
        userName: "Admin",
        metadata: {
          previousStatus: "active",
          newStatus: "inactive",
        },
      });
    } catch (logError) {
      console.error("Error logging movement:", logError);
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
