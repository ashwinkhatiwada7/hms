import React, { Suspense } from "react"
import Invoices from "./_components/invoices"

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{
    studentId: string
    page: string
    perPage: string
  }>
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading invoices…</p>}>
      <Invoices searchParams={searchParams} />
    </Suspense>
  )
}
