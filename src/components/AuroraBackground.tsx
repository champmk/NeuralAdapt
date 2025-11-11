"use client";

import dynamic from "next/dynamic";

const Aurora = dynamic(() => import("@/components/Aurora"), { ssr: false });

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Aurora colorStops={["#3A29FF", "#FF94B4", "#FF3232"]} blend={0.5} amplitude={1.0} speed={0.5} />
    </div>
  );
}
