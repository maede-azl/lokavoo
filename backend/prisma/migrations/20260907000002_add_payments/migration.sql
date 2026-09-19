-- CreateTable: تراکنش‌های پرداخت (درگاه به‌پرداخت ملت)
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "purpose" VARCHAR(30) NOT NULL,
    "plan_id" INTEGER,
    "promo_type" VARCHAR(50),
    "amount" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "order_id" VARCHAR(50) NOT NULL,
    "ref_id" VARCHAR(50),
    "sale_reference_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");
CREATE INDEX "payments_business_id_idx" ON "payments"("business_id");
CREATE INDEX "payments_status_idx" ON "payments"("status");

ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
