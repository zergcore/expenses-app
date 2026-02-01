import { NextResponse } from "next/server";
import { backfillExpenseRates } from "@/actions/backfill-expenses";

/**
 * API route to trigger expense backfill.
 * POST /api/backfill-expenses
 */
export async function POST() {
  try {
    const result = await backfillExpenseRates();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
