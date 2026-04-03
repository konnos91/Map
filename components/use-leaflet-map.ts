import { useEffect, useRef } from "react";
import type { LeafletRefs } from "@/lib/map-types";
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  DEFAULT_TILE_URL,
  DEFAULT_TILE_ATTRIBUTION,
  MARKER_REFRESH_THROTTLE_MS,
} from "@/lib/map-constants";
import {
  buildMapboxSatelliteUrl,
  scheduleWorldPointsBuild,
  throttle,
} from "@/lib/map-utils";
import {
  injectLeafletStyles,
  initLeafletMap,
  renderMarkers,
  updateSelection,
  startFpsTracker,
} from "@/lib/map-leaflet";
import {
  useAppDispatch,
  useAppSelector,
  setSelectedDoc,
  setMapLoaded,
  setMapError,
  setMarkerMeta,
} from "@/lib/store";

export function useLeafletMap() {
  const dispatch = useAppDispatch();
  const selectedDoc = useAppSelector((s) => s.map.selectedDoc);
  const mapMode = useAppSelector((s) => s.map.mapMode);
  const mapboxToken = useAppSelector((s) => s.map.mapboxToken);
  const mapLoaded = useAppSelector((s) => s.map.mapLoaded);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const refs = useRef<LeafletRefs>({
    map: null,
    tileLayer: null,
    markerLayer: null,
    renderer: null,
    refreshMarkers: null,
    markerIndex: new Map(),
    worldPoints: [],
    selectedDoc: null,
    mapMode: "default",
    mapboxToken: "",
  });

  useEffect(() => {
    const isMapAlreadyInitialized = refs.current.map !== null;
    const isContainerMissing = containerRef.current === null;

    if (isContainerMissing || isMapAlreadyInitialized) return;

    injectLeafletStyles();
    const { map, tileLayer, markerLayer, renderer } = initLeafletMap(
      containerRef.current!
    );
    Object.assign(refs.current, { map, tileLayer, markerLayer, renderer });

    const refresh = () => {
      const r = refs.current;
      const isMapReadyToRender =
        r.map !== null && r.markerLayer !== null && r.renderer !== null;
      if (!isMapReadyToRender) return;

      const { meta, markerIndex } = renderMarkers(
        r.map!,
        r.markerLayer!,
        r.renderer!,
        r.worldPoints,
        r.selectedDoc?.id,
        (doc) => dispatch(setSelectedDoc(doc)),
        r.markerIndex
      );
      r.markerIndex = markerIndex;
      dispatch(
        setMarkerMeta({
          visiblePoints: meta.visiblePoints,
          approxPopulation: meta.approxVisiblePopulation,
        })
      );
    };

    const throttledRefresh = throttle(refresh, MARKER_REFRESH_THROTTLE_MS);
    refs.current.refreshMarkers = refresh;

    tileLayer.on("load", () => {
      dispatch(setMapLoaded(true));
      dispatch(setMapError(""));
      refresh();
    });
    tileLayer.on("tileerror", () => {
      dispatch(
        setMapError("Basemap tiles failed to load in this preview environment.")
      );
    });
    map.on("load", refresh);
    map.on("moveend", throttledRefresh);
    map.on("zoomend", refresh);
    map.on("resize", refresh);
    refresh();

    const stopFps = startFpsTracker();
    const cancelPointsBuild = scheduleWorldPointsBuild((points) => {
      refs.current.worldPoints = points;
      refs.current.refreshMarkers?.();
    });

    return () => {
      stopFps();
      cancelPointsBuild();
      throttledRefresh.cancel();
      map.remove();

      refs.current = {
        map: null,
        tileLayer: null,
        markerLayer: null,
        renderer: null,
        refreshMarkers: null,
        markerIndex: new Map(),
        worldPoints: [],
        selectedDoc: null,
        mapMode: "default",
        mapboxToken: "",
      };
      dispatch(setMapLoaded(false));
    };
  }, [dispatch]);

  // 2. Sync selection state
  useEffect(() => {
    const r = refs.current;
    const prevSelId = r.selectedDoc?.id;
    const nextSelId = selectedDoc?.id;
    if (prevSelId !== nextSelId) {
      r.selectedDoc = selectedDoc;
      updateSelection(r.markerIndex, prevSelId, nextSelId);
    }
  }, [selectedDoc]);

  // 3. Sync map mode
  useEffect(() => {
    const r = refs.current;
    if (
      r.tileLayer &&
      (r.mapMode !== mapMode || r.mapboxToken !== mapboxToken)
    ) {
      r.mapMode = mapMode;
      r.mapboxToken = mapboxToken;
      const isSatellite = mapMode === "satellite" && mapboxToken.trim();
      r.tileLayer.setUrl(
        isSatellite
          ? buildMapboxSatelliteUrl(mapboxToken.trim())
          : DEFAULT_TILE_URL
      );
      r.tileLayer.options.attribution = isSatellite
        ? "© Mapbox © OpenStreetMap"
        : DEFAULT_TILE_ATTRIBUTION;
    }
  }, [mapMode, mapboxToken]);

  const resetView = () => {
    refs.current.map?.setView(INITIAL_CENTER, INITIAL_ZOOM, { animate: true });
  };

  return { containerRef, mapLoaded, selectedDoc, resetView };
}
