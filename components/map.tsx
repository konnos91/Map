import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "leaflet/dist/leaflet.css";

import { useAppDispatch, clearSelectedDoc } from "@/lib/store";
import SidebarPanel from "@/components/sidebar-panel";
import { useLeafletMap } from "@/components/use-leaflet-map";

const RealMapPreview = () => {
  const dispatch = useAppDispatch();
  const { containerRef, mapLoaded, selectedDoc, resetView } = useLeafletMap();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] gap-6">
        <div>
          <SidebarPanel onResetView={resetView} />
        </div>

        <div>
          <Card className="rounded-3xl border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Interactive map</div>
                  <div className="text-xs text-slate-400">
                    Drag should stay stable, points move with the map, click a
                    point to inspect it
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {mapLoaded ? "Map loaded" : "Loading map..."}
                </div>
              </div>
              <div className="relative h-[760px] w-full">
                <div ref={containerRef} className="absolute inset-0 z-0" />
                <div
                  className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900 transition-opacity duration-700 pointer-events-none ${mapLoaded ? "opacity-0" : "opacity-100"}`}
                >
                  <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />
                  <span className="text-sm text-slate-400">Loading map…</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!selectedDoc}
        onOpenChange={(open) => !open && dispatch(clearSelectedDoc())}
      >
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg rounded-3xl">
          {selectedDoc ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="rounded-full bg-blue-950 text-blue-200 hover:bg-blue-950">
                    {selectedDoc.category}
                  </Badge>
                  <Badge className="rounded-full bg-slate-800 text-slate-100 hover:bg-slate-800">
                    {selectedDoc.priority}
                  </Badge>
                </div>
                <DialogTitle className="text-xl leading-7">
                  {selectedDoc.title}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedDoc.description}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <div className="text-slate-400">Coordinates</div>
                  <div className="mt-1 font-medium text-slate-100">
                    {selectedDoc.coordinates}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <div className="text-slate-400">Updated</div>
                  <div className="mt-1 font-medium text-slate-100">
                    {selectedDoc.freshness}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <div className="text-slate-400">Category</div>
                  <div className="mt-1 font-medium text-slate-100">
                    {selectedDoc.category}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <div className="text-slate-400">Approx tile population</div>
                  <div className="mt-1 font-medium text-slate-100">
                    {selectedDoc.approxTileCount}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealMapPreview;
