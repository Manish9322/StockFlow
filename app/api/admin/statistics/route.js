import { NextResponse } from "next/server";
import connectDB from "@/lib/utils/db";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import UnitType from "@/models/unitType.model";
import Movement from "@/models/movement.model";
import Purchase from "@/models/purchase.model";
import { verifyAuth } from "@/lib/auth-helpers";

// GET - Fetch system statistics (admin only)
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

    // Gather statistics
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalUnitTypes,
      totalMovements,
      totalPurchases,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ role: "admin" }),
      Product.countDocuments(),
      Product.countDocuments({
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      }),
      Category.countDocuments(),
      UnitType.countDocuments(),
      Movement.countDocuments(),
      Purchase.countDocuments(),
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Get movement statistics by type
    const movementsByType = await Movement.aggregate([
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get user activity over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Movement.countDocuments({
      timestamp: { $gte: thirtyDaysAgo },
    });

    const recentLogins = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo },
    });

    return NextResponse.json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          recentLogins,
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
        },
        system: {
          categories: totalCategories,
          unitTypes: totalUnitTypes,
          movements: totalMovements,
          purchases: totalPurchases,
        },
        activity: {
          recentActivity,
          movementsByType: movementsByType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
