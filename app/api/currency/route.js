import { NextResponse } from "next/server";

// Free API for currency exchange rates (no API key required)
const EXCHANGE_RATE_API = "https://open.er-api.com/v6/latest/USD";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "USD";

    // Fetch real-time exchange rates
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      base: data.base_code,
      rates: data.rates,
      lastUpdated: data.time_last_update_utc,
      data: {
        base: data.base_code,
        rates: data.rates,
        lastUpdated: data.time_last_update_utc,
      },
    });
  } catch (error) {
    console.error("Currency API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch currency rates",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
