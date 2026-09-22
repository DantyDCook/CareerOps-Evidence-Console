import { NextRequest, NextResponse } from "next/server";
import { getEvidenceItem } from "@/lib/server/evidence-gateway";
import { evidenceRouteError } from "@/lib/server/route-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ objectId: string }> }
) {
  if (request.nextUrl.searchParams.size > 0) {
    return NextResponse.json(
      { error: { code: "ENGINE_REQUEST_FAILED", message: "Unsupported query parameter." } },
      { status: 422 }
    );
  }

  try {
    const { objectId } = await context.params;
    return NextResponse.json(await getEvidenceItem(objectId));
  } catch (error) {
    return evidenceRouteError(error);
  }
}
