/**
 * Script to run the expense backfill for all expenses.
 * Run with: npx tsx scripts/run-backfill.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

import { backfillExpenseRates } from "../src/actions/backfill-expenses";

async function main() {
  console.log("Starting expense backfill (forceAll: true)...");
  console.log("This will recalculate equivalents for ALL expenses.\n");

  const result = await backfillExpenseRates(true);

  console.log("\n=== Backfill Results ===");
  console.log(`Processed: ${result.processed}`);
  console.log(`Errors: ${result.errors}`);

  if (result.errors === 0) {
    console.log("\n✅ Backfill completed successfully!");
  } else {
    console.log("\n⚠️ Backfill completed with some errors.");
  }
}

main().catch(console.error);
