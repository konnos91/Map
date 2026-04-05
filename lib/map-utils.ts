import {
  type DocProperties,
  type WorldPoint,
  SAMPLE_WORLD_POINTS,
} from "./map-constants";

const CATEGORIES = [
  "AIS Feed",
  "Port Report",
  "Safety Notice",
  "Weather Event",
  "Route Snapshot",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function seeded(a: number, b: number, c: number) {
  const x = Math.sin(a * 127.1 + b * 311.7 + c * 17.13) * 437598.5453123;
  return x - Math.floor(x);
}

export function pickFrom(values: string[], seedValue: number) {
  return values[Math.floor(seedValue * values.length)] || values[0];
}

export function buildMapboxSatelliteUrl(token: string) {
  return `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?access_token=${token}`;
}

export function makeDocProperties(
  i: number,
  lng: number,
  lat: number,
  approxCount: number
): DocProperties {
  const kindSeed = seeded(lng, lat, i + 1);
  const prioritySeed = seeded(lng + 11, lat + 7, i + 2);
  const freshnessSeed = seeded(lng + 17, lat + 13, i + 3);
  const scoreSeed = seeded(lng + 19, lat + 23, i + 4);

  return {
    id: `doc-${i}`,
    title: `${pickFrom(CATEGORIES, kindSeed)} ${i + 1}`,
    category: pickFrom(CATEGORIES, kindSeed),
    priority: pickFrom(PRIORITIES, prioritySeed),
    freshness: `${Math.floor(1 + freshnessSeed * 72)}h ago`,
    qualityScore: Math.round(70 + scoreSeed * 29),
    coordinates: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
    description:
      "Stable preview point rendered by the same map engine as the basemap. In production, replace this sample dataset with vector tiles or server-windowed point data.",
    approxTileCount: approxCount.toLocaleString(),
    lng,
    lat,
  };
}

export function buildWorldSample(count: number): WorldPoint[] {
  const points = new Array<WorldPoint>(count);
  for (let i = 0; i < count; i++) {
    // Generate static coordinates based purely on the index `i`.
    // These will never change.
    points[i] = {
      lng: -180 + seeded(i, 5, 11) * 360,
      lat: -70 + seeded(i, 13, 29) * 140,
      hot: seeded(i, 21, 37),
      idx: i,
    };
  }
  return points;
}

export function getMaxVisibleMarkers(zoom: number) {
  if (zoom < 3) return 5000;
  if (zoom < 5) return 10000;
  if (zoom < 7) return 25000;
  if (zoom < 9) return 50000;
  return 100000;
}

export function getApproxVisiblePopulation(zoom: number) {
  if (zoom < 3) return 5000;
  if (zoom < 5) return 10000;
  if (zoom < 7) return 25000;
  if (zoom < 9) return 50000;
  return 100000;
}

export function getMarkerRadius() {
  return 4;
}

export function getMarkerColor(hot: number) {
  if (hot > 0.86) return "#f8fafc";
  return "#2563eb";
}

export function scheduleWorldPointsBuild(
  onReady: (points: WorldPoint[]) => void
) {
  const run = () => onReady(buildWorldSample(SAMPLE_WORLD_POINTS));
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(run, { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }
  const t = setTimeout(run, 0);
  return () => clearTimeout(t);
}

export function runHealthChecks() {
  const results = [];

  const sample = buildWorldSample(10);
  results.push({
    name: "world sample creates requested number of points",
    passed: sample.length === 10,
  });

  const props = makeDocProperties(1, 10, 20, 120000);
  results.push({
    name: "makeDocProperties returns required display fields",
    passed: Boolean(
      props.id &&
      props.title &&
      props.category &&
      props.priority &&
      props.coordinates
    ),
  });

  const url = buildMapboxSatelliteUrl("pk.test-token");
  results.push({
    name: "buildMapboxSatelliteUrl embeds token",
    passed: url.includes("pk.test-token"),
  });

  results.push({
    name: "sample size is large enough to guarantee visible points at world zoom",
    passed: SAMPLE_WORLD_POINTS >= 10000,
  });

  results.push({
    name: "visible marker cap stays bounded at low zoom",
    passed: getMaxVisibleMarkers(2) <= 100000,
  });

  results.push({
    name: "marker radius stays in stable preview range",
    passed: getMarkerRadius() === 4,
  });

  return results;
}
