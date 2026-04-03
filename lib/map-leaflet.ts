import L from "leaflet";
import {
  type DocProperties,
  type WorldPoint,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  DEFAULT_TILE_URL,
  DEFAULT_TILE_ATTRIBUTION,
  TOTAL_DATASET_POINTS,
} from "./map-constants";

const LEAFLET_OVERRIDES = `
.leaflet-container { background: #aad3df; }
.leaflet-tile-container, .leaflet-tile { background: transparent; }
`;
import {
  getMaxVisibleMarkers,
  getApproxVisiblePopulation,
  getMarkerRadius,
  getMarkerColor,
  makeDocProperties,
} from "./map-utils";

export type MapInstance = {
  map: L.Map;
  tileLayer: L.TileLayer;
  markerLayer: L.LayerGroup;
  renderer: L.Canvas;
};

export function injectLeafletStyles() {
  if (document.getElementById("leaflet-overrides")) return;
  const style = document.createElement("style");
  style.id = "leaflet-overrides";
  style.textContent = LEAFLET_OVERRIDES;
  document.head.appendChild(style);
}

export function initLeafletMap(container: HTMLDivElement): MapInstance {
  const worldBounds = L.latLngBounds([-90, -180], [90, 180]);

  const map = L.map(container, {
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
    minZoom: 2,
    maxZoom: 14,
    zoomControl: false,
    worldCopyJump: false,
    maxBounds: worldBounds,
    maxBoundsViscosity: 1.0,
    preferCanvas: true,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true,
    inertia: true,
    inertiaDeceleration: 3000,
    inertiaMaxSpeed: 1500,
    easeLinearity: 0.1,
    zoomSnap: 0.5,
    zoomDelta: 1,
    wheelDebounceTime: 40,
    wheelPxPerZoomLevel: 120,
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  const renderer = L.canvas({ padding: 0.5, tolerance: 5 });
  const markerLayer = L.layerGroup().addTo(map);
  const tileLayer = L.tileLayer(DEFAULT_TILE_URL, {
    attribution: DEFAULT_TILE_ATTRIBUTION,
    maxZoom: 14,
    tileSize: 256,
    keepBuffer: 12,
    updateWhenIdle: false,
    updateInterval: 50,
    noWrap: true,
  }).addTo(map);

  return { map, tileLayer, markerLayer, renderer };
}

export function selectVisiblePoints(map: L.Map, worldPoints: WorldPoint[]) {
  const bounds = map.getBounds().pad(0.2);
  const zoom = map.getZoom();
  const cap = getMaxVisibleMarkers();
  const south = bounds.getSouth();
  const north = bounds.getNorth();
  const west = bounds.getWest();
  const east = bounds.getEast();

  const visible: WorldPoint[] = [];

  // Iterate over the full dataset.
  // Because we always iterate from i=0 to len, the points that are found
  // are ALWAYS the exact same points for a given bounding box.
  // If you zoom in, the bounding box shrinks, so some of the first 100 points
  // might fall outside the box, allowing points further down the array to be included.
  // But the points that REMAIN in the box will never change their coordinates.
  for (let i = 0, len = worldPoints.length; i < len; i++) {
    const p = worldPoints[i];
    if (p.lat < south || p.lat > north || p.lng < west || p.lng > east)
      continue;
    visible.push(p);
    if (visible.length >= cap) break;
  }

  return {
    points: visible,
    meta: {
      visiblePoints: visible.length,
      approxVisiblePopulation: Math.min(
        TOTAL_DATASET_POINTS,
        getApproxVisiblePopulation(zoom)
      ),
    },
  };
}

const SELECTED_STYLE: L.CircleMarkerOptions = {
  color: "#facc15",
  weight: 2,
  fillColor: "#facc15",
  fillOpacity: 1,
};

function defaultStyle(hot: number): L.CircleMarkerOptions {
  return {
    color: "rgba(148, 142, 142, 0.65)",
    weight: 1,
    fillColor: getMarkerColor(hot),
    fillOpacity: 0.9,
  };
}

export type MarkerIndex = Map<string, { marker: L.CircleMarker; hot: number }>;

export function renderMarkers(
  map: L.Map,
  markerLayer: L.LayerGroup,
  renderer: L.Canvas,
  worldPoints: WorldPoint[],
  selectedDocId: string | undefined,
  onSelect: (doc: DocProperties) => void,
  prevMarkerIndex: MarkerIndex
): {
  meta: { visiblePoints: number; approxVisiblePopulation: number };
  markerIndex: MarkerIndex;
} {
  const { points, meta } = selectVisiblePoints(map, worldPoints);

  const nextIds = new Set<string>();
  for (let i = 0, len = points.length; i < len; i++) {
    nextIds.add(`doc-${points[i].idx}`);
  }

  // Remove markers that are no longer visible
  for (const [id, entry] of prevMarkerIndex) {
    if (!nextIds.has(id)) {
      markerLayer.removeLayer(entry.marker);
      prevMarkerIndex.delete(id);
    }
  }

  // Add new markers, keep existing ones
  const markerIndex: MarkerIndex = new Map();
  for (let i = 0, len = points.length; i < len; i++) {
    const point = points[i];
    const pointId = `doc-${point.idx}`;
    const existing = prevMarkerIndex.get(pointId);

    if (existing) {
      markerIndex.set(pointId, existing);
      continue;
    }

    const isSelected = selectedDocId === pointId;
    const marker = L.circleMarker([point.lat, point.lng], {
      renderer,
      radius: getMarkerRadius(),
      opacity: 1,
      bubblingMouseEvents: false,
      ...(isSelected ? SELECTED_STYLE : defaultStyle(point.hot)),
    });

    marker.on("click", () => {
      onSelect(makeDocProperties(point.idx, point.lng, point.lat, 120000));
    });

    marker.addTo(markerLayer);
    markerIndex.set(pointId, { marker, hot: point.hot });
  }

  return { meta, markerIndex };
}

export function updateSelection(
  markerIndex: MarkerIndex,
  prevId: string | undefined,
  nextId: string | undefined
) {
  if (prevId === nextId) return;
  if (prevId) {
    const prev = markerIndex.get(prevId);
    if (prev) prev.marker.setStyle(defaultStyle(prev.hot));
  }
  if (nextId) {
    const next = markerIndex.get(nextId);
    if (next) next.marker.setStyle(SELECTED_STYLE);
  }
}

export function startFpsTracker() {
  let frameCount = 0;
  let lastUpdate = performance.now();
  let rafId = 0;

  const tick = (now: number) => {
    frameCount++;
    if (now - lastUpdate >= 500) {
      const fps = Math.round((frameCount * 1000) / (now - lastUpdate));
      const el = document.getElementById("fps-display");
      if (el) el.textContent = String(fps);
      frameCount = 0;
      lastUpdate = now;
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}
