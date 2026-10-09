CREATE TYPE "public"."subscription_payment_status" AS ENUM('unpaid', 'paid', 'partial', 'waived');--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD COLUMN "payment_status" "subscription_payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD COLUMN "paid_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD COLUMN "paid_by" text;--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_paid_by_user_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "organization_subscription_index_payment_status" ON "organization_subscription" USING btree ("status","payment_status");--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_paid_amount_non_negative" CHECK ("organization_subscription"."paid_amount" >= 0);