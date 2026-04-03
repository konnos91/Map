import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { SelectedDoc } from "@/lib/map-constants";

type MapState = {
  selectedDoc: SelectedDoc;
  mapMode: "default" | "satellite";
  mapboxToken: string;
  mapLoaded: boolean;
  mapError: string;
  visiblePointsCount: number;
  approxVisiblePopulation: number;
};

const mapSlice = createSlice({
  name: "map",
  initialState: {
    selectedDoc: null,
    mapMode: "default",
    mapboxToken: "",
    mapLoaded: false,
    mapError: "",
    visiblePointsCount: 0,
    approxVisiblePopulation: 0,
  } as MapState,
  reducers: {
    setSelectedDoc(state, action: PayloadAction<SelectedDoc>) {
      state.selectedDoc = action.payload;
    },
    clearSelectedDoc(state) {
      state.selectedDoc = null;
    },
    setMapMode(state, action: PayloadAction<MapState["mapMode"]>) {
      state.mapMode = action.payload;
    },
    setMapboxToken(state, action: PayloadAction<string>) {
      state.mapboxToken = action.payload;
    },
    setMapLoaded(state, action: PayloadAction<boolean>) {
      state.mapLoaded = action.payload;
    },
    setMapError(state, action: PayloadAction<string>) {
      state.mapError = action.payload;
    },
    setMarkerMeta(
      state,
      action: PayloadAction<{ visiblePoints: number; approxPopulation: number }>
    ) {
      state.visiblePointsCount = action.payload.visiblePoints;
      state.approxVisiblePopulation = action.payload.approxPopulation;
    },
  },
});

export const {
  setSelectedDoc,
  clearSelectedDoc,
  setMapMode,
  setMapboxToken,
  setMapLoaded,
  setMapError,
  setMarkerMeta,
} = mapSlice.actions;

export const makeStore = () =>
  configureStore({ reducer: { map: mapSlice.reducer } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
