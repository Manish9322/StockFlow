import { NextResponse } from "next/server";
import connectDB from "@/lib/utils/db";
import PriceHistory from "@/models/priceHistory.model.js";
import Product from "@/models/product.model.js";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/product/[id]/price-history - Get price history for a product
export async function GET(request, { params }) {
  try {
    await connectDB();

    // Verify user is authenticated
    const { error, userId } = requireAuth(request);
    if (error) return error;

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const priceType = searchParams.get("priceType"); // 'costPrice' or 'sellingPrice' or null for both
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

    // Build query - handle static admin user
    const query = {
      productId: id,
    };
    if (userId !== "admin-static-id") {
      query.userId = userId;
    }

    if (priceType) {
      query.priceType = priceType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Fetch price history
    const priceHistory = await PriceHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Calculate statistics
    const stats = {
      totalChanges: priceHistory.length,
      averageChangeAmount: 0,
      largestIncrease: 0,
      largestDecrease: 0,
      currentCostPrice: product.costPrice,
      currentSellingPrice: product.sellingPrice,
    };

    if (priceHistory.length > 0) {
      const changeAmounts = priceHistory.map((h) => h.changeAmount);
      stats.averageChangeAmount =
        changeAmounts.reduce((sum, val) => sum + val, 0) / changeAmounts.length;
      stats.largestIncrease = Math.max(...changeAmounts.filter((c) => c > 0), 0);
      stats.largestDecrease = Math.min(...changeAmounts.filter((c) => c < 0), 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        productSku: product.sku,
        history: priceHistory,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
