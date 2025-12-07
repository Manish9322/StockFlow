import { NextResponse } from "next/server";
import _db from "@/lib/utils/db";
import Purchase from "@/models/purchase.model";
import Product from "@/models/product.model";

// GET - Fetch all purchases
export async function GET(request) {
  try {
    await _db();
    
    const purchases = await Purchase.find({})
      .populate({
        path: "items.product",
        select: "name sku",
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: purchases,
      count: purchases.length,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch purchases",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new purchase
export async function POST(request) {
  try {
    await _db();
    
    const body = await request.json();
    const {
      items,
      totalAmount,
      status,
      supplier,
      paymentMethod,
      notes,
    } = body;
    
    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one item is required",
        },
        { status: 400 }
      );
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Total amount must be greater than 0",
        },
        { status: 400 }
      );
    }
    
    // Validate and prepare items
    const preparedItems = [];
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid item data",
          },
          { status: 400 }
        );
      }
      
      // Fetch product details
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product not found: ${item.product}`,
          },
          { status: 404 }
        );
      }
      
      const subtotal = item.quantity * product.costPrice;
      
      preparedItems.push({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: product.costPrice,
        subtotal: subtotal,
      });
      
      // Update product quantity
      product.quantity += item.quantity;
      await product.save();
    }
    
    // Create purchase
    const purchase = new Purchase({
      items: preparedItems,
      totalAmount,
      status: status || "Completed",
      supplier: supplier || "N/A",
      paymentMethod: paymentMethod || "Cash",
      notes: notes || "",
    });
    
    await purchase.save();
    
    // Populate the response
    const populatedPurchase = await Purchase.findById(purchase._id).populate({
      path: "items.product",
      select: "name sku",
    });
    
    return NextResponse.json(
      {
        success: true,
        data: populatedPurchase,
        message: "Purchase created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create purchase",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
