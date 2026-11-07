"use client";

import dynamic from "next/dynamic";

export type PawLocationPoint = {
  eventId: string;
  eventType: string;
  title: string;
  occurredAt: string;
  locationLabel: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

const PawLocationHistoryCanvas = dynamic(
  () => import("@/components/maps/paw-location-history-canvas").then(module => module.PawLocationHistoryCanvas),
  {
    ssr: false,
    loading: () => <div className="grid h-80 place-items-center bg-[#e7e5dc] text-sm font-semibold text-[var(--muted)]">Loading location history…</div>,
  },
);

export function PawLocationHistory({ points }: { points: PawLocationPoint[] }) {
  return <PawLocationHistoryCanvas points={points}/>;
}
