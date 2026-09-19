-- CreateTable: کدهای تایید (OTP) در دیتابیس ذخیره می‌شن (نه در حافظه‌ی پروسه)
-- تا با ری‌استارت سرور یا چند اینستنس بودن سرور مشکلی پیش نیاد.
CREATE TABLE "otp_codes" (
    "id" SERIAL NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");
