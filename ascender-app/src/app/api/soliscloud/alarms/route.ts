import { callSolis } from "@/lib/soliscloud/client";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { withSolis } from "@/lib/soliscloud/handler";
import { extractRecords, mapAlarmRecord } from "@/lib/soliscloud/mappers";
import type { SolisAlarmRecord, SolisPaged } from "@/lib/soliscloud/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const stationId =
    new URL(request.url).searchParams.get("stationId") ?? undefined;
  return withSolis(async (creds) => {
    const payload: Record<string, unknown> = { pageNo: 1, pageSize: 100 };
    if (stationId) payload.stationId = stationId;
    const data = await callSolis<SolisPaged<SolisAlarmRecord>>(
      creds,
      SOLIS_ENDPOINTS.alarmList,
      payload,
    );
    return extractRecords(data).map(mapAlarmRecord);
  });
}
