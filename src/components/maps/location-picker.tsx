"use client";

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

export type PickedLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

function MapClick({ onChange }: { onChange: (value: PickedLocation) => void }) {
  useMapEvents({
    click(event) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({ value, onChange }: { value: PickedLocation | null; onChange: (value: PickedLocation) => void }) {
  const centre: LatLngExpression = value ? [value.latitude, value.longitude] : [7.8731, 80.7718];
  return (
    <div className="h-52 w-full min-w-0 overflow-hidden sm:h-64" aria-label="Choose an exact restricted location">
      <MapContainer center={centre} zoom={value ? 16 : 8} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClick onChange={onChange} />
        {value && <CircleMarker center={[value.latitude, value.longitude]} radius={9} pathOptions={{ color: "#a94f2b", fillColor: "#d66f45", fillOpacity: 0.9 }} />}
      </MapContainer>
    </div>
  );
}
