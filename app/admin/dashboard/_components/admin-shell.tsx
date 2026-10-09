import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { getDashboardForRole } from "@/lib/get-dashboard-for-role"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "./app-sidebar"

/**
 * Session gate + shell for the admin dashboard.
 *
 * Reads request data (`headers()` → session), so under `cacheComponents`
 * it must render inside a `<Suspense>` boundary (see `layout.tsx`) —
 * the fallback streams statically while this resolves per request.
 * Redirects issued here also resolve at request time.
 */
export async function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({
    headers: requestHeaders,
  })

  if (!session) {
    redirect("/login")
  }

  const adminUser = session.user as typeof session.user & {
    isActive?: boolean | null
  }
  if (adminUser.isActive === false) {
    await auth.api.signOut({ headers: requestHeaders }).catch(() => null)
    redirect("/login?error=user-inactive")
  }

  if (session.user.role !== "superAdmin") {
    redirect(getDashboardForRole(session.user.role) ?? "/login")
  }

  const user = {
    name:
      session.user.displayUsername ??
      session.user.username ??
      session.user.name ??
      "",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "",
    role: session.user.role ?? "",
  }

  return (
    <>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            {/* <BreadCrump /> */}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </>
  )
}
