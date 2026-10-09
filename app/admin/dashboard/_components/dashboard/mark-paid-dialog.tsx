"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandCoins } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BillingRow } from "@/types/billing-types";
import { markSubscriptionPaidAction } from "../../actions/mark-subscription-paid";

const METHODS = [
  "cash",
  "esewa",
  "bank_transfer",
  "cheque",
  "khalti",
  "other",
] as const;

type MarkPaidDialogProps = {
  row: BillingRow;
};

export function MarkPaidDialog({ row }: MarkPaidDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(row.dueAmount);
  const [method, setMethod] = useState<string>("cash");

  const due = Number(row.dueAmount);

  async function handleSubmit() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await markSubscriptionPaidAction({
        subscriptionId: row.subscriptionId,
        amount: amount.trim(),
        method: method as (typeof METHODS)[number],
      });
      if (response.success) {
        toast.success(response.message ?? "Payment recorded");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(response.message ?? "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setAmount(row.dueAmount);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <HandCoins className="mr-1.5 size-4" />
          Collect
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {row.hostelName} · {row.planName} — Rs. {row.priceAtSignup}/yr.
          Outstanding: Rs. {row.dueAmount}.
        </DialogDescription>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="billing-amount">Amount (Rs.)</Label>
            <Input
              id="billing-amount"
              inputMode="decimal"
              value={amount}
              max={row.dueAmount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={row.dueAmount}
            />
            <p className="text-xs text-muted-foreground">
              Partial payments allowed — remaining balance stays in “Due”.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              isLoading || !(Number(amount) > 0) || Number(amount) > due
            }
            onClick={handleSubmit}
          >
            {isLoading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Record Rs. {amount || "0"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
