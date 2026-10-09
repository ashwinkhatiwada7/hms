import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardForRole } from "@/lib/get-dashboard-for-role";

/**
 * Session check for the login page. Reads request data, so it renders
 * inside a `<Suspense>` boundary (see `page.tsx`) — the redirect
 * resolves at request time for already-logged-in users.
 */
export default async function LoginGate() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const dashboard = session ? getDashboardForRole(session.user.role) : null;
  if (dashboard) redirect(dashboard);

  return null;
}
