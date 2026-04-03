"use client";

import dynamic from "next/dynamic";

const RealMapPreview = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
        <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-blue-400 animate-spin" />
        Loading map…
      </div>
    </div>
  ),
});

export default function Home() {
  return <RealMapPreview />;
}
