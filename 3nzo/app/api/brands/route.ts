import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    const brands = await sql`
      SELECT
        brand_id,
        brand_name,
        customer_id,
        is_mcc,
        created_at
      FROM dim_brands
      ORDER BY brand_name
    `;
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name, customer_id, is_mcc } = body;

    if (!brand_name || !customer_id) {
      return NextResponse.json(
        { error: "Brand name and Customer ID are required" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if customer_id already exists
    const existing = await sql`
      SELECT brand_id FROM dim_brands WHERE customer_id = ${customer_id}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this Customer ID already exists" },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO dim_brands (brand_name, customer_id, is_mcc)
      VALUES (${brand_name}, ${customer_id}, ${is_mcc || false})
      RETURNING brand_id, brand_name, customer_id, is_mcc, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
