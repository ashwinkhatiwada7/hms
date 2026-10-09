import React, { Suspense } from "react"
import LodgingDetail from "./_components/lodging-detail"

export default function page({
  params,
}: {
  params: Promise<{ lodgingId: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <LodgingDetail params={params} />
    </Suspense>
  )
}
