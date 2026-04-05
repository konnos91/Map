import maplibregl from "maplibre-gl";
import {
  DEFAULT_VECTOR_STYLE_URL,
  INITIAL_CENTER,
  INITIAL_ZOOM,
} from "./map-constants";
import { buildMapboxSatelliteUrl } from "./map-utils";

export function getStyle(mode: string, token: string) {
  if (mode === "satellite" && token.trim()) {
    return {
      version: 8 as const,
      sources: {
        sat: {
          type: "raster" as const,
          tiles: [buildMapboxSatelliteUrl(token.trim())],
          tileSize: 256,
          attribution: "Mapbox | OpenStreetMap",
        },
      },
      layers: [{ id: "sat", type: "raster" as const, source: "sat" }],
    };
  }
  return DEFAULT_VECTOR_STYLE_URL;
}

export function createMap(container: HTMLDivElement) {
  const map = new maplibregl.Map({
    container,
    style: DEFAULT_VECTOR_STYLE_URL,
    center: [INITIAL_CENTER[1], INITIAL_CENTER[0]],
    zoom: INITIAL_ZOOM,
    minZoom: 2,
    maxZoom: 14,
    attributionControl: false,
    dragRotate: false,
    touchPitch: false,
    pitchWithRotate: false,
    renderWorldCopies: true,
    fadeDuration: 0,
  });

  map.addControl(
    new maplibregl.NavigationControl({ showCompass: false }),
    "top-right",
  );

  return map;
}
