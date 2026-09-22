import { NextResponse } from "next/server";
import { EvidenceGatewayError } from "./evidence-gateway";

export function evidenceRouteError(error: unknown) {
  if (error instanceof EvidenceGatewayError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "CONSOLE_INTERNAL_ERROR",
        message: "The Evidence Console server could not complete the read request."
      }
    },
    { status: 500 }
  );
}
