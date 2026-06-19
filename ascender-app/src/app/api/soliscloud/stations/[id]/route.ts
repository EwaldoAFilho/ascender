import { callSolis } from "@/lib/soliscloud/client";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { withSolis } from "@/lib/soliscloud/handler";
import { mapStationRecord } from "@/lib/soliscloud/mappers";
import type { SolisStationRecord } from "@/lib/soliscloud/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withSolis(async (creds) => {
    const data = await callSolis<SolisStationRecord>(
      creds,
      SOLIS_ENDPOINTS.stationDetail,
      { id },
    );
    return mapStationRecord(data ?? {});
  });
}
