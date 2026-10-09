import React, { Suspense } from "react";
import Rooms from "./_components/rooms";

export default function page() {
  return (
    <Suspense fallback={<p className="text-sm">Loading rooms…</p>}>
      <Rooms />
    </Suspense>
  );
}
