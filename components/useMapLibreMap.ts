import { useEffect, useRef, useCallback } from "react";
import type { SelectedDoc, WorldPoint } from "@/lib/map-constants";
import { INITIAL_CENTER, INITIAL_ZOOM } from "@/lib/map-constants";
import {
  scheduleWorldPointsBuild,
  getApproxVisiblePopulation,
} from "@/lib/map-utils";
import { createMap, getStyle } from "@/lib/map-style";
import {
  ensureLayers,
  syncFilter,
  syncSelection,
  countRendered,
} from "@/lib/map-points";
import { startFpsTracker, throttle } from "@/lib/map-perf";
import {
  useAppDispatch,
  useAppSelector,
  setSelectedDoc,
  setMapLoaded,
  setMapError,
  setMarkerMeta,
} from "@/lib/store";

export function useMapLibreMap() {
  const dispatch = useAppDispatch();
  const selectedDoc = useAppSelector((s) => s.map.selectedDoc);
  const mapMode = useAppSelector((s) => s.map.mapMode);
  const mapboxToken = useAppSelector((s) => s.map.mapboxToken);
  const mapLoaded = useAppSelector((s) => s.map.mapLoaded);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pointsRef = useRef<WorldPoint[]>([]);
  const selectedRef = useRef<SelectedDoc>(null);
  const modeRef = useRef({ mode: "default", token: "" });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = createMap(containerRef.current);
    mapRef.current = map;
    modeRef.current = { mode: "default", token: "" };

    const loadPoints = () =>
      ensureLayers(map, pointsRef.current, (doc) =>
        dispatch(setSelectedDoc(doc))
      );

    const syncMeta = () => {
      dispatch(
        setMarkerMeta({
          visiblePoints: countRendered(map),
          approxPopulation: getApproxVisiblePopulation(map.getZoom()),
        })
      );
    };

    const throttledMeta = throttle(syncMeta, 800);

    map.on("load", () => {
      dispatch(setMapLoaded(true));
      dispatch(setMapError(""));
      loadPoints();
    });

    map.on("zoomend", () => {
      syncFilter(map);
      syncMeta();
    });

    map.on("moveend", throttledMeta);

    const stopFps = startFpsTracker();
    const cancelBuild = scheduleWorldPointsBuild((pts) => {
      pointsRef.current = pts;
      loadPoints();
    });

    return () => {
      stopFps();
      cancelBuild();
      throttledMeta.cancel();
      map.remove();
      mapRef.current = null;
      pointsRef.current = [];
      dispatch(setMapLoaded(false));
    };
  }, [dispatch]);

  // ---- sync selection highlight ----
  useEffect(() => {
    selectedRef.current = selectedDoc;
    if (mapRef.current) syncSelection(mapRef.current, selectedDoc?.id);
  }, [selectedDoc]);

  // ---- sync map mode / satellite ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (
      modeRef.current.mode === mapMode &&
      modeRef.current.token === mapboxToken
    )
      return;

    modeRef.current = { mode: mapMode, token: mapboxToken };
    map.setStyle(getStyle(mapMode, mapboxToken));

    map.once("styledata", () => {
      ensureLayers(map, pointsRef.current, (doc) =>
        dispatch(setSelectedDoc(doc))
      );
      syncSelection(map, selectedRef.current?.id);
    });
  }, [mapMode, mapboxToken, dispatch]);

  // ---- reset view ----
  const resetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: [INITIAL_CENTER[1], INITIAL_CENTER[0]],
      zoom: INITIAL_ZOOM,
      duration: 1200,
    });
  }, []);

  return { containerRef, mapLoaded, selectedDoc, resetView };
}
