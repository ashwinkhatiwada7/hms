import { Suspense } from "react";
import Employee from "./_components/employee";

export default async function Page({
  params,
}: {
  params: Promise<{ payeeType: string; payeeId: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm">Loading employee…</p>}>
      <Employee params={params} />
    </Suspense>
  );
}
