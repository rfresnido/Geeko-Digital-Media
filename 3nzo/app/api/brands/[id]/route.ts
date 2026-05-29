import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);

    if (isNaN(brandId)) {
      return NextResponse.json(
        { error: "Invalid brand ID" },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if brand has associated data
    const hasData = await sql`
      SELECT EXISTS (
        SELECT 1 FROM dim_campaigns WHERE brand_id = ${brandId}
        UNION
        SELECT 1 FROM fact_performance WHERE brand_id = ${brandId}
      ) as has_data
    `;

    if (hasData[0]?.has_data) {
      return NextResponse.json(
        { error: "Cannot delete brand with existing campaigns or performance data. Delete associated data first." },
        { status: 409 }
      );
    }

    const result = await sql`
      DELETE FROM dim_brands
      WHERE brand_id = ${brandId}
      RETURNING brand_id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brandId = parseInt(id, 10);
    const body = await request.json();
    const { brand_name, customer_id, is_mcc } = body;

    if (isNaN(brandId)) {
      return NextResponse.json(
        { error: "Invalid brand ID" },
        { status: 400 }
      );
    }

    const sql = getDb();

    const result = await sql`
      UPDATE dim_brands
      SET
        brand_name = COALESCE(${brand_name}, brand_name),
        customer_id = COALESCE(${customer_id}, customer_id),
        is_mcc = COALESCE(${is_mcc}, is_mcc)
      WHERE brand_id = ${brandId}
      RETURNING brand_id, brand_name, customer_id, is_mcc, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}
