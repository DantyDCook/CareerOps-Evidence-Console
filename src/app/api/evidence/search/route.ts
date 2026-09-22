import { NextRequest, NextResponse } from "next/server";
import { searchEvidence } from "@/lib/server/evidence-gateway";
import { evidenceRouteError } from "@/lib/server/route-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await searchEvidence(request.nextUrl.searchParams));
  } catch (error) {
    return evidenceRouteError(error);
  }
}
