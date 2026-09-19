-- AlterTable: نشان تایید‌شده (فروش جداگانه، ایده‌ی درآمدی جدید)
ALTER TABLE "businesses" ADD COLUMN     "has_verified_badge" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: پلن‌های اشتراک
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "billing_cycle" VARCHAR(20) NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL,
    "max_images" INTEGER NOT NULL DEFAULT 3,
    "search_priority" INTEGER NOT NULL DEFAULT 0,
    "can_pin" BOOLEAN NOT NULL DEFAULT false,
    "show_in_suggested" BOOLEAN NOT NULL DEFAULT false,
    "can_advertise" BOOLEAN NOT NULL DEFAULT false,
    "ad_priority" INTEGER NOT NULL DEFAULT 0,
    "view_stats" BOOLEAN NOT NULL DEFAULT false,
    "click_stats" BOOLEAN NOT NULL DEFAULT false,
    "support_level" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_key_billing_cycle_key" ON "subscription_plans"("key", "billing_cycle");

-- CreateTable: اشتراک هر کسب‌وکار
CREATE TABLE "business_subscriptions" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "payment_ref" VARCHAR(100),
    "is_auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "business_subscriptions_business_id_idx" ON "business_subscriptions"("business_id");
CREATE INDEX "business_subscriptions_status_idx" ON "business_subscriptions"("status");
CREATE INDEX "business_subscriptions_expires_at_idx" ON "business_subscriptions"("expires_at");

ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_subscriptions" ADD CONSTRAINT "business_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: پلن رایگان پیش‌فرض (وقتی هیچ اشتراکی فعال نیست)
INSERT INTO "subscription_plans"
("key","name","billing_cycle","price","duration_days","max_images","search_priority","can_pin","show_in_suggested","can_advertise","ad_priority","view_stats","click_stats","support_level","is_active")
VALUES ('free','رایگان','monthly',0,36500,3,0,false,false,false,0,true,false,'normal',true);

-- Seed: پلن‌های پولی (ماهانه)
INSERT INTO "subscription_plans"
("key","name","billing_cycle","price","duration_days","max_images","search_priority","can_pin","show_in_suggested","can_advertise","ad_priority","view_stats","click_stats","support_level","is_active")
VALUES
('start','شروع','monthly',199000,30,10,3,false,false,false,0,true,false,'normal',true),
('growth','رشد','monthly',399000,30,25,6,false,true,true,5,true,true,'priority',true),
('growth_plus','رشد پلاس','monthly',699000,30,60,10,true,true,true,10,true,true,'dedicated',true);

-- Seed: پلن‌های پولی (سالانه)
INSERT INTO "subscription_plans"
("key","name","billing_cycle","price","duration_days","max_images","search_priority","can_pin","show_in_suggested","can_advertise","ad_priority","view_stats","click_stats","support_level","is_active")
VALUES
('start','شروع','yearly',1990000,365,10,3,false,false,false,0,true,false,'normal',true),
('growth','رشد','yearly',3990000,365,25,6,false,true,true,5,true,true,'priority',true),
('growth_plus','رشد پلاس','yearly',6990000,365,60,10,true,true,true,10,true,true,'dedicated',true);
