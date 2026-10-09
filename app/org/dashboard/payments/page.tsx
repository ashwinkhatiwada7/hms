import React, { Suspense } from "react"
import Payment from "./_components/payment"

export default function page({
  searchParams,
}: {
  searchParams: Promise<{
    page: string
    perPage: string
    studentId: string
  }>
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading payments…</p>}>
      <Payment searchParams={searchParams} />
    </Suspense>
  )
}
