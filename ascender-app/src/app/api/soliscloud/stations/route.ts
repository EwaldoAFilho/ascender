import { callSolis } from "@/lib/soliscloud/client";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { withSolis } from "@/lib/soliscloud/handler";
import { extractRecords, mapStationRecord } from "@/lib/soliscloud/mappers";
import type { SolisPaged, SolisStationRecord } from "@/lib/soliscloud/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return withSolis(async (creds) => {
    const data = await callSolis<SolisPaged<SolisStationRecord>>(
      creds,
      SOLIS_ENDPOINTS.userStationList,
      { pageNo: 1, pageSize: 100 },
    );
    return extractRecords(data).map(mapStationRecord);
  });
}
