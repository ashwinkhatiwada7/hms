import { Suspense } from "react"
import TuitionDetail from "./_components/tuition-detail"

export default function page({
  params,
}: {
  params: Promise<{ tuitionId: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <TuitionDetail params={params} />
    </Suspense>
  )
}
