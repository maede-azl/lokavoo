// storage.js
// لایه‌ی انتزاعی ذخیره‌ی فایل — پیش‌فرض همون دیسک محلی سرور است (مثل قبل)،
// ولی وقتی متغیر محیطی STORAGE_DRIVER=s3 تنظیم بشه، همه‌ی آپلودها (آواتار،
// تصاویر کسب‌وکار) به‌جای دیسک سرور مستقیم روی یک باکت S3 (یا سرویس سازگار
// با S3 مثل Liara Object Storage / ArvanCloud) ذخیره می‌شن.
//
// چرا این مهمه: وقتی روی دیسک سرور ذخیره می‌کنید، با هر دیپلوی جدید یا اسکیل
// کردن سرور (چند اینستنس)، فایل‌های آپلودی از دست می‌رن. با S3 این مشکل
// نیست چون فایل‌ها جدا از سرور اپلیکیشن نگه‌داری می‌شن.
//
// برای فعال کردن S3، این متغیرها رو در .env تنظیم کنید:
//   STORAGE_DRIVER=s3
//   AWS_S3_BUCKET=...
//   AWS_S3_REGION=...
//   AWS_ACCESS_KEY_ID=...
//   AWS_SECRET_ACCESS_KEY=...
//   AWS_S3_PUBLIC_URL=... (اختیاری — اگر با CDN/دامنه‌ی اختصاصی سرو می‌کنید)
// اگر این متغیر تنظیم نشه، دقیقاً مثل قبل روی دیسک سرور ذخیره می‌شه —
// هیچ رفتار فعلی تغییر نمی‌کند مگر اینکه صراحتاً S3 را فعال کنید.

const path = require('path');
const fs = require('fs');
const multer = require('multer');

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';

function randomFilename(originalname, prefix = '') {
  const ext = path.extname(originalname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${prefix}${prefix ? '-' : ''}${unique}${ext}`;
}

/**
 * یک multer storage engine برمی‌گرداند — یا دیسک محلی، یا S3،
 * بسته به STORAGE_DRIVER.
 * @param {string} subfolder - مثلاً "avatars" یا "businesses"
 * @param {(req: any, file: any) => string} filenameFn - تابع نام‌گذاری فایل (اختیاری)
 */
function createStorage(subfolder, filenameFn) {
  const makeFilename = filenameFn || ((req, file) => randomFilename(file.originalname));

  if (STORAGE_DRIVER === 's3') {
    // ===== حالت S3 =====
    // فقط وقتی واقعاً انتخاب شده لود می‌شه تا کسانی که S3 استفاده نمی‌کنن
    // مجبور به نصب/پیکربندی چیزی نباشن.
    const { S3Client } = require('@aws-sdk/client-s3');
    const multerS3 = require('multer-s3');

    const s3 = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // برای سرویس‌های سازگار با S3 (مثل لیارا/آروان) که endpoint اختصاصی دارن
      ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT, forcePathStyle: true } : {}),
    });

    return multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        cb(null, `${subfolder}/${makeFilename(req, file)}`);
      },
    });
  }

  // ===== حالت پیش‌فرض: دیسک محلی سرور (رفتار فعلی، بدون تغییر) =====
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', subfolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, makeFilename(req, file)),
  });
}

/**
 * از روی فایل آپلودشده (req.file یا یکی از عناصر req.files)، URL نهایی و
 * قابل‌نمایش برای فرانت رو می‌سازه. توی حالت local همون مسیر نسبی قبلی
 * (/uploads/...) رو برمی‌گردونه، توی حالت S3 لینک کامل فایل روی باکت رو.
 * @param {string} subfolder
 * @param {any} file - شیء file که multer به req.file/req.files اضافه می‌کند
 */
function getFileUrl(subfolder, file) {
  if (STORAGE_DRIVER === 's3') {
    if (process.env.AWS_S3_PUBLIC_URL) {
      return `${process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')}/${subfolder}/${path.basename(file.key)}`;
    }
    // multer-s3 خودش یک لینک عمومی مستقیم روی file.location می‌گذارد
    return file.location;
  }

  return `/uploads/${subfolder}/${file.filename}`;
}

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل تصویری مجاز است'), false);
  }
};

module.exports = {
  STORAGE_DRIVER,
  createStorage,
  getFileUrl,
  imageFileFilter,
};
