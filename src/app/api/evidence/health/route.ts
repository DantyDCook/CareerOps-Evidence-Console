import { NextRequest, NextResponse } from "next/server";
import { getEvidenceHealth } from "@/lib/server/evidence-gateway";
import { evidenceRouteError } from "@/lib/server/route-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.size > 0) {
    return NextResponse.json(
      { error: { code: "ENGINE_REQUEST_FAILED", message: "Unsupported query parameter." } },
      { status: 422 }
    );
  }

  try {
    return NextResponse.json(await getEvidenceHealth());
  } catch (error) {
    return evidenceRouteError(error);
  }
}
