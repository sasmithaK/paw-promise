"use client";

import { useEffect } from "react";
import { Circle, CircleMarker, LayerGroup, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { latLngBounds, type LatLngExpression } from "leaflet";
import type { PawLocationPoint } from "@/components/maps/paw-location-history";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const label = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, first => first.toUpperCase());

function FitPoints({ points }: { points: PawLocationPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 16);
      return;
    }
    map.fitBounds(latLngBounds(points.map(point => [point.latitude, point.longitude])), { padding: [28, 28], maxZoom: 16 });
  }, [map, points]);
  return null;
}

export function PawLocationHistoryCanvas({ points }: { points: PawLocationPoint[] }) {
  const centre: LatLngExpression = [points[0].latitude, points[0].longitude];
  return <div className="h-80 overflow-hidden rounded-[12px] sm:h-96" aria-label="Member-only exact paw location history">
    <MapContainer center={centre} zoom={16} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <FitPoints points={points}/>
      {points.map((point, index) => {
        const isDiscovery = point.eventType === "DISCOVERY";
        const colour = isDiscovery ? "#7b3e25" : "#d66f45";
        return <LayerGroup key={point.eventId}>
          {point.accuracyMeters && <Circle center={[point.latitude, point.longitude]} radius={point.accuracyMeters} pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.08, weight: 1 }}/>} 
          <CircleMarker center={[point.latitude, point.longitude]} radius={isDiscovery ? 9 : 7} pathOptions={{ color: "#fffaf4", fillColor: colour, fillOpacity: 1, weight: 3 }}>
            <Popup><div className="min-w-44"><p className="text-xs font-bold uppercase tracking-wide text-[#b95532]">{index + 1} · {label(point.eventType)}</p><p className="mt-1 font-bold">{point.title}</p><p className="mt-1 text-xs text-[#756b62]">{formatDate(point.occurredAt)}</p>{point.locationLabel && <p className="mt-1 text-xs text-[#756b62]">{point.locationLabel}</p>}{point.accuracyMeters && <p className="mt-1 text-xs text-[#756b62]">Device accuracy ±{point.accuracyMeters} m</p>}</div></Popup>
          </CircleMarker>
        </LayerGroup>;
      })}
    </MapContainer>
  </div>;
}
