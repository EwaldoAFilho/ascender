import { callSolis } from "@/lib/soliscloud/client";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { withSolis } from "@/lib/soliscloud/handler";
import {
  extractRecords,
  mapStationDay,
  mapStationMonth,
  mapStationYear,
  type GenerationPoint,
} from "@/lib/soliscloud/mappers";
import type { SolisPaged, SolisSeriesRecord } from "@/lib/soliscloud/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "day";
  const date = url.searchParams.get("date") ?? undefined;

  return withSolis(async (creds) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    let points: GenerationPoint[];
    let unit: "kW" | "kWh";

    if (period === "month") {
      const data = await callSolis<SolisPaged<SolisSeriesRecord>>(
        creds,
        SOLIS_ENDPOINTS.stationMonth,
        { id, month: date ?? `${yyyy}-${mm}`, money: "BRL" },
      );
      points = mapStationMonth(extractRecords(data));
      unit = "kWh";
    } else if (period === "year") {
      const data = await callSolis<SolisPaged<SolisSeriesRecord>>(
        creds,
        SOLIS_ENDPOINTS.stationYear,
        { id, year: date ?? `${yyyy}`, money: "BRL" },
      );
      points = mapStationYear(extractRecords(data));
      unit = "kWh";
    } else {
      const data = await callSolis<SolisPaged<SolisSeriesRecord>>(
        creds,
        SOLIS_ENDPOINTS.stationDay,
        { id, time: date ?? `${yyyy}-${mm}-${dd}`, timeZone: -3, money: "BRL" },
      );
      points = mapStationDay(extractRecords(data));
      unit = "kW";
    }

    const totalKwh =
      unit === "kWh" ? points.reduce((s, p) => s + p.value, 0) : null;
    const totalMoney = points.some((p) => p.money != null)
      ? points.reduce((s, p) => s + (p.money ?? 0), 0)
      : null;
    const peakKw =
      unit === "kW" ? points.reduce((m, p) => Math.max(m, p.value), 0) : null;

    return { period, unit, points, totalKwh, totalMoney, peakKw };
  });
}
