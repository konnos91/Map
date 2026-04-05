export type DocProperties = {
  id: string;
  title: string;
  category: string;
  priority: string;
  freshness: string;
  qualityScore: number;
  coordinates: string;
  description: string;
  approxTileCount: string;
  lng: number;
  lat: number;
};

export type SelectedDoc = DocProperties | null;

export type WorldPoint = {
  lng: number;
  lat: number;
  hot: number;
  idx: number;
};

export const INITIAL_CENTER: [number, number] = [0, 0];
export const INITIAL_ZOOM = 2;
export const DEFAULT_VECTOR_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

export const TOTAL_DATASET_POINTS = 100_000;
export const SAMPLE_WORLD_POINTS = 100_000;
export const BASE_VISIBLE_MARKERS = 1000;
export const MARKER_REFRESH_THROTTLE_MS = 32;

export const DEFAULT_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors";
