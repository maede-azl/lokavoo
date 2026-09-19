-- AlterTable: افزودن شهر/استان ساخت‌یافته به کسب‌وکار (برای جستجوی مطمئن‌تر بر اساس شهر)
ALTER TABLE "businesses" ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "province" VARCHAR(100);

-- CreateIndex
CREATE INDEX "businesses_city_idx" ON "businesses"("city");
