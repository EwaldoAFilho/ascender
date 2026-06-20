"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAlarms,
  fetchCollectors,
  fetchGeneration,
  fetchHistoricoFrota,
  fetchIntegrationStatus,
  fetchInverters,
  fetchStations,
  type GenerationPeriod,
} from "@/lib/api/soliscloud";

const REFRESH_INTERVAL = 5 * 60 * 1000; // dados SolisCloud atualizam a cada ~5 min

export function useStations() {
  return useQuery({
    queryKey: ["soliscloud", "stations"],
    queryFn: fetchStations,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useInverters(stationId?: string) {
  return useQuery({
    queryKey: ["soliscloud", "inverters", stationId ?? "all"],
    queryFn: () => fetchInverters(stationId),
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useAlarms(stationId?: string) {
  return useQuery({
    queryKey: ["soliscloud", "alarms", stationId ?? "all"],
    queryFn: () => fetchAlarms(stationId),
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useCollectors() {
  return useQuery({
    queryKey: ["soliscloud", "collectors"],
    queryFn: fetchCollectors,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useHistoricoFrota() {
  return useQuery({
    queryKey: ["soliscloud", "historico"],
    queryFn: fetchHistoricoFrota,
    refetchInterval: REFRESH_INTERVAL,
  });
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ["soliscloud", "status"],
    queryFn: fetchIntegrationStatus,
  });
}

export function useGeneration(
  stationId: string | undefined,
  period: GenerationPeriod,
) {
  return useQuery({
    queryKey: ["soliscloud", "generation", stationId ?? "none", period],
    queryFn: () => fetchGeneration(stationId as string, period),
    enabled: Boolean(stationId),
    refetchInterval: period === "day" ? REFRESH_INTERVAL : undefined,
  });
}
