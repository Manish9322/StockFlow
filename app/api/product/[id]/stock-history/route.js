import { NextResponse } from "next/server";
import connectDB from "@/lib/utils/db";
import Movement from "@/models/movement.model.js";
import Product from "@/models/product.model.js";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/product/[id]/stock-history - Get stock movement history for a product
export async function GET(request, { params }) {
  try {
    await connectDB();

    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit")) || 100;

    // Build product query - handle static admin user
    const productQuery = { _id: id };
    if (userId !== "admin-static-id") {
      productQuery.userId = userId;
    }

    // Verify product exists and belongs to user
    const product = await Product.findOne(productQuery);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Build query for stock-related movements
    // Note: Removed userId filter since movements should already be filtered by relatedProduct
    // which belongs to the authenticated user
    const query = {
      relatedProduct: id,
      eventType: {
        $in: [
          "product.created",
          "product.updated",
          "stock.changed",
          "stock.refill",
          "purchase.created",
        ],
      },
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Fetch stock movements
    const stockMovements = await Movement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Process movements to extract stock changes
    const stockHistory = stockMovements
      .map((movement) => {
        const before = movement.changes?.before?.quantity;
        const after = movement.changes?.after?.quantity;

        if (before !== undefined && after !== undefined) {
          return {
            _id: movement._id,
            date: movement.createdAt,
            eventType: movement.eventType,
            eventTitle: movement.eventTitle,
            description: movement.description,
            quantityBefore: before,
            quantityAfter: after,
            quantityChange: after - before,
            userName: movement.userName,
            metadata: movement.metadata,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // Calculate statistics
    const stats = {
      totalMovements: stockHistory.length,
      totalStockAdded: 0,
      totalStockRemoved: 0,
      currentStock: product.quantity,
      averageStockLevel: 0,
      stockOutOccurrences: 0,
    };

    if (stockHistory.length > 0) {
      stockHistory.forEach((item) => {
        if (item.quantityChange > 0) {
          stats.totalStockAdded += item.quantityChange;
        } else {
          stats.totalStockRemoved += Math.abs(item.quantityChange);
        }
        if (item.quantityAfter === 0) {
          stats.stockOutOccurrences++;
        }
      });

      const stockLevels = stockHistory.map((h) => h.quantityAfter);
      stats.averageStockLevel =
        stockLevels.reduce((sum, val) => sum + val, 0) / stockLevels.length;
    }

    // Prepare timeline data for charts (chronological order)
    const timeline = [...stockHistory].reverse().map((item) => ({
      date: item.date,
      quantity: item.quantityAfter,
      change: item.quantityChange,
      eventType: item.eventType,
    }));

    return NextResponse.json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        productSku: product.sku,
        history: stockHistory,
        timeline,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stock history" },
      { status: 500 }
    );
  }
}
