import type L from "leaflet";
import type { SelectedDoc, WorldPoint } from "@/lib/map-constants";
import type { MarkerIndex } from "@/lib/map-leaflet";

export type LeafletRefs = {
  map: L.Map | null;
  tileLayer: L.TileLayer | null;
  markerLayer: L.LayerGroup | null;
  renderer: L.Canvas | null;
  refreshMarkers: (() => void) | null;
  markerIndex: MarkerIndex;
  worldPoints: WorldPoint[];
  selectedDoc: SelectedDoc;
  mapMode: string;
  mapboxToken: string;
};
