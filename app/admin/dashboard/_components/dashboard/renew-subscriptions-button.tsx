"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { renewSubscriptionsAction } from "../../actions/renew-subscriptions";

/**
 * Manual trigger for the yearly rollover. The daily cron
 * (`POST /api/renewSubscriptions`) does this automatically — this button
 * is for on-demand renewal and testing.
 */
export function RenewSubscriptionsButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await renewSubscriptionsAction({});
      if (response.success) {
        toast.success(response.message ?? "Renewal complete");
        router.refresh();
      } else {
        toast.error(response.message ?? "Renewal failed");
      }
    } catch {
      toast.error("Renewal failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isLoading}
      onClick={handleClick}
      title="Close due terms and open next-year terms now (cron does this daily)"
    >
      {isLoading ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 size-4" />
      )}
      Run renewal
    </Button>
  );
}
