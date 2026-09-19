-- CreateTable
CREATE TABLE "promos" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "days" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_threads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "unread" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_messages" (
    "id" SERIAL NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "sender" VARCHAR(10) NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "site_name" VARCHAR(100) NOT NULL DEFAULT 'LOKAOO',
    "registration_open" BOOLEAN NOT NULL DEFAULT true,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "banner_image_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promos_business_id_idx" ON "promos"("business_id");
CREATE INDEX "promos_status_idx" ON "promos"("status");
CREATE UNIQUE INDEX "admin_threads_user_id_key" ON "admin_threads"("user_id");
CREATE INDEX "admin_messages_thread_id_idx" ON "admin_messages"("thread_id");

-- AddForeignKey
ALTER TABLE "promos" ADD CONSTRAINT "promos_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_threads" ADD CONSTRAINT "admin_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "admin_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default settings/footer rows
INSERT INTO "site_settings" ("id", "site_name", "registration_open", "auto_approve", "maintenance_mode", "updated_at")
VALUES (1, 'LOKAOO', true, false, false, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "footer_content" ("id", "data", "updated_at")
VALUES (1, '{"brand":{"description":"مرجع پیدا کردن کسب‌وکارهای محلی؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.","social":{"instagram":"#","telegram":"#","x":"#"}},"pages":{"about":{"title":"درباره ما","body":"لوکاوو مرجعی برای پیدا کردن کسب‌وکارهای محلی است؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران."},"contact":{"title":"تماس با ما","body":"برای هرگونه سوال، پیشنهاد یا گزارش مشکل می‌توانید از طریق ایمیل support@lokavo.ir با تیم پشتیبانی لوکاوو در ارتباط باشید."},"guide":{"title":"راهنمای استفاده","body":"از صفحه‌ی اصلی می‌توانید بر اساس دسته‌بندی یا جستجو، کسب‌وکارهای اطراف خود را پیدا کنید."},"faq":{"title":"سوالات متداول","body":"برای ثبت کسب‌وکار باید ابتدا در اپ به‌عنوان فروشنده ثبت‌نام کنید، سپس از پنل فروشنده کسب‌وکار خود را اضافه کنید."},"terms":{"title":"قوانین و مقررات","body":"استفاده از لوکاوو به معنای پذیرفتن این تعهد است که اطلاعات ثبت‌شده صحیح و متعلق به خودتان باشد."},"pricing":{"title":"تعرفه‌ها","body":"ثبت کسب‌وکار در لوکاوو رایگان است. برای دیده‌شدن بیشتر می‌توانید از طرح‌های تبلیغاتی زیر استفاده کنید:"},"seller-guide":{"title":"راهنمای فروشندگان","body":"پس از تایید کسب‌وکار، از پنل فروشنده می‌توانید محصولات را اضافه کنید و به پیام‌ها و نظرات مشتریان پاسخ بدهید."}},"bottomMade":"ساخته شده با ❤ برای کسب‌وکارهای محلی"}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
