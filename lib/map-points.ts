import maplibregl from "maplibre-gl";
import type { WorldPoint, DocProperties } from "./map-constants";
import { makeDocProperties } from "./map-utils";

const SRC = "points";
const LAYER = "points-layer";
const LAYER_SELECTED = "points-selected";
const LAYER_CLUSTERS = "clusters";
const LAYER_CLUSTER_COUNT = "cluster-count";

const CIRCLE_PAINT: maplibregl.CircleLayerSpecification["paint"] = {
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 3, 6, 4, 10, 5],
  "circle-color": ["case", [">", ["get", "hot"], 0.86], "#f8fafc", "#2563eb"],
  "circle-stroke-color": "rgba(148,142,142,0.65)",
  "circle-stroke-width": 1,
  "circle-opacity": 0.9,
};

const SELECTED_PAINT: maplibregl.CircleLayerSpecification["paint"] = {
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 6, 6, 10, 7],
  "circle-color": "#facc15",
  "circle-stroke-color": "#facc15",
  "circle-stroke-width": 2,
  "circle-opacity": 1,
};

function toGeoJSON(pts: WorldPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: pts.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      properties: { id: `doc-${p.idx}`, idx: p.idx, hot: p.hot, lng: p.lng, lat: p.lat },
    })),
  };
}

let cachedPts: WorldPoint[] | null = null;
let cachedGeoJSON: ReturnType<typeof toGeoJSON> | null = null;

function getCachedGeoJSON(pts: WorldPoint[]) {
  if (pts !== cachedPts) {
    cachedPts = pts;
    cachedGeoJSON = toGeoJSON(pts);
  }
  return cachedGeoJSON!;
}

export function ensureLayers(
  map: maplibregl.Map,
  pts: WorldPoint[],
  onSelect: (doc: DocProperties) => void,
) {
  if (!map.isStyleLoaded() || pts.length === 0) return;

  if (!map.getSource(SRC)) {
    map.addSource(SRC, {
      type: "geojson",
      data: getCachedGeoJSON(pts),
      cluster: true,
      clusterMaxZoom: 8,
      clusterRadius: 50,
    });

    map.addLayer({
      id: LAYER_CLUSTERS,
      type: "circle",
      source: SRC,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#2563eb",
          100,
          "#1d4ed8",
          1000,
          "#1e3a8a",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          15,
          100,
          20,
          1000,
          25,
        ],
        "circle-stroke-color": "rgba(148,142,142,0.65)",
        "circle-stroke-width": 1,
        "circle-opacity": 0.9,
      },
    });

    map.addLayer({
      id: LAYER_CLUSTER_COUNT,
      type: "symbol",
      source: SRC,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 11,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    map.addLayer({
      id: LAYER,
      type: "circle",
      source: SRC,
      filter: ["!", ["has", "point_count"]],
      paint: CIRCLE_PAINT,
    });

    map.addLayer({
      id: LAYER_SELECTED,
      type: "circle",
      source: SRC,
      paint: SELECTED_PAINT,
      filter: ["==", ["get", "id"], ""],
    });

    map.on("click", LAYER, (e) => {
      const p = e.features?.[0]?.properties;
      if (!p) return;
      onSelect(makeDocProperties(+p.idx, +p.lng, +p.lat, 120_000));
    });
    map.on("mouseenter", LAYER, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYER, () => {
      map.getCanvas().style.cursor = "";
    });
  } else {
    (map.getSource(SRC) as maplibregl.GeoJSONSource).setData(getCachedGeoJSON(pts));
  }
}

export function syncSelection(map: maplibregl.Map, docId: string | undefined) {
  if (!map.getLayer(LAYER_SELECTED)) return;
  map.setFilter(LAYER_SELECTED, ["==", ["get", "id"], docId ?? ""]);
}

export function countRendered(map: maplibregl.Map): number {
  if (!map.getLayer(LAYER)) return 0;
  const ids = new Set(
    map.queryRenderedFeatures(undefined, { layers: [LAYER] })
      .map((f) => f.properties?.id as string)
      .filter(Boolean),
  );
  return ids.size;
}

export { LAYER, LAYER_SELECTED, SRC };
