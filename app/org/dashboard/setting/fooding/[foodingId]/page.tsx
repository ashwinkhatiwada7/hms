import { Suspense } from "react"
import FoodingDetail from "./_components/fooding-detail"

export default function page({
  params,
}: {
  params: Promise<{ foodingId: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <FoodingDetail params={params} />
    </Suspense>
  )
}
