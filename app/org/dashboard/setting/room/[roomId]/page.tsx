import React, { Suspense } from "react";
import RoomDetail from "./_components/room-detail";

export default function page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <RoomDetail params={params} />
    </Suspense>
  );
}
