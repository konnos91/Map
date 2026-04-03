import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Gauge,
  FileText,
  MapPin,
  Satellite,
  RefreshCcw,
} from "lucide-react";
import { TOTAL_DATASET_POINTS } from "@/lib/map-constants";
import { runHealthChecks } from "@/lib/map-utils";
import {
  useAppDispatch,
  useAppSelector,
  setMapboxToken,
  setMapMode,
} from "@/lib/store";

const SidebarPanel = ({ onResetView }: { onResetView: () => void }) => {
  const dispatch = useAppDispatch();
  const mapMode = useAppSelector((s) => s.map.mapMode);
  const mapboxToken = useAppSelector((s) => s.map.mapboxToken);
  const selectedDoc = useAppSelector((s) => s.map.selectedDoc);
  const mapError = useAppSelector((s) => s.map.mapError);
  const visiblePointsCount = useAppSelector((s) => s.map.visiblePointsCount);
  const approxVisiblePopulation = useAppSelector(
    (s) => s.map.approxVisiblePopulation
  );

  const healthChecks = runHealthChecks();

  const applySatellite = () => {
    if (mapboxToken.trim()) dispatch(setMapMode("satellite"));
  };
  const applyDefault = () => {
    dispatch(setMapMode("default"));
  };

  return (
    <Card className="rounded-3xl border-slate-800 bg-slate-900/90 shadow-2xl">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="rounded-full bg-slate-800 text-slate-100 hover:bg-slate-800">
              More reliable preview
            </Badge>
            <Badge className="rounded-full bg-blue-950 text-blue-200 hover:bg-blue-950">
              Same renderer for map + points
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Stable drag with integrated points
          </h1>
          <p className="text-sm leading-6 text-slate-300">
            The map and points now use the same Leaflet rendering pipeline. That
            removes the split overlay sync issues that were making the previous
            preview unreliable.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Globe className="h-4 w-4" /> Basemap
            </div>
            <div className="mt-2 text-sm font-medium">
              {mapMode === "satellite" ? "Mapbox Satellite" : "OpenStreetMap"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Gauge className="h-4 w-4" /> Approx FPS
            </div>
            <div className="mt-2 text-2xl font-semibold" id="fps-display">
              60
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <FileText className="h-4 w-4" /> Visible points drawn
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {visiblePointsCount.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/70 p-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <MapPin className="h-4 w-4" /> Selected
            </div>
            <div className="mt-2 text-sm font-medium text-slate-100 truncate">
              {selectedDoc ? selectedDoc.title : "None"}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-800/70 p-4 col-span-2">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <FileText className="h-4 w-4" /> Estimated visible population
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {approxVisiblePopulation.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Total dataset target: {TOTAL_DATASET_POINTS.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-200">Basemap mode</div>
          <Input
            value={mapboxToken}
            onChange={(e) => dispatch(setMapboxToken(e.target.value))}
            placeholder="Optional: paste your Mapbox public token (pk...)"
            className="rounded-2xl border-slate-800 bg-slate-950"
          />
          <div className="flex gap-2">
            <Button
              className="rounded-2xl"
              variant="secondary"
              onClick={applyDefault}
            >
              <Globe className="mr-2 h-4 w-4" /> Use default map
            </Button>
            <Button
              className="rounded-2xl"
              onClick={applySatellite}
              disabled={!mapboxToken.trim()}
            >
              <Satellite className="mr-2 h-4 w-4" /> Use satellite
            </Button>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            The preview defaults to a stable street basemap. Satellite mode only
            changes tile URLs, while point rendering stays in the same map
            engine.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            className="rounded-2xl"
            variant="secondary"
            onClick={onResetView}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset view
          </Button>
        </div>

        {mapError ? (
          <div className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            Map error: {mapError}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300 leading-6">
          This preview is intentionally capped. For a real 5M-point product,
          keep the same principle: stable basemap, tile-windowed data, and one
          rendering pipeline instead of a fragile split overlay.
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
          <div className="mb-3 font-medium text-slate-100">Built-in checks</div>
          <div className="space-y-2">
            {healthChecks.map((test) => (
              <div
                key={test.name}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/70 px-3 py-2"
              >
                <span>{test.name}</span>
                <Badge
                  className={
                    test.passed
                      ? "bg-emerald-900 text-emerald-200 hover:bg-emerald-900"
                      : "bg-red-900 text-red-200 hover:bg-red-900"
                  }
                >
                  {test.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default SidebarPanel;
