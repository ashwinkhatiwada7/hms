import { Building2 } from "lucide-react"
import { Suspense } from "react"
import OrgProfile from "./_components/org-profile"

export default function SettingsProfilePage() {
  return (
    <div>
      <Suspense fallback={<p className="text-sm">Loading profile…</p>}>
        <OrgProfile />
      </Suspense>
    </div>
  )
}
