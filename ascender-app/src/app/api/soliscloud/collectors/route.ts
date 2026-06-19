import { callSolis } from "@/lib/soliscloud/client";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { withSolis } from "@/lib/soliscloud/handler";
import { mapCollectorRecord } from "@/lib/soliscloud/mappers";
import type { SolisCollectorData } from "@/lib/soliscloud/types";
import type { CollectorMonitor } from "@/types/soliscloud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return withSolis<CollectorMonitor>(async (creds) => {
    const data = await callSolis<SolisCollectorData>(
      creds,
      SOLIS_ENDPOINTS.collectorList,
      { pageNo: 1, pageSize: 100 },
    );
    const coletores = (data.page?.records ?? []).map(mapCollectorRecord);
    return {
      resumo: {
        total: coletores.length,
        online: coletores.filter((c) => c.state === "online").length,
        offline: coletores.filter((c) => c.state === "offline").length,
        alarme: coletores.filter((c) => c.state === "alarm").length,
      },
      coletores,
    };
  });
}
