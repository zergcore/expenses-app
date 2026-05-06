import { getExchangeRatesWithStatus } from "@/actions/rates";
import { sendDolarvzlaAlert } from "@/lib/alert-email";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { dolarvzlaFailed } = await getExchangeRatesWithStatus();

    if (dolarvzlaFailed) {
      // Fire-and-forget — don't let an email failure block the cron response
      sendDolarvzlaAlert().catch((e) =>
        console.error("Failed to send dolarvzla alert:", e),
      );
    }

    return NextResponse.json({ success: true, dolarvzlaFailed });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
