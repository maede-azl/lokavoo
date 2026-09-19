const prisma = require('../config/db');

// اطمینان از وجود ردیف تنظیمات (در صورت نبود، پیش‌فرض می‌سازد)
async function ensureSettings() {
  let settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.siteSetting.create({ data: { id: 1 } });
  }
  return settings;
}

async function ensureFooter() {
  let footer = await prisma.footerContent.findUnique({ where: { id: 1 } });
  if (!footer) {
    footer = await prisma.footerContent.create({
      data: {
        id: 1,
        data: {
          brand: {
            description:
              'مرجع پیدا کردن کسب‌وکارهای محلی؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.',
            social: { instagram: '#', telegram: '#', x: '#' },
          },
          // محتوای صفحات اطلاعاتی که از فوتر لینک می‌شوند (درباره ما، تماس، راهنما، ...)
          // ساختار ستون‌ها و مقصد لینک‌ها در خود فرانت ثابت است؛ این‌جا فقط متن هر صفحه ذخیره می‌شود
          pages: {
            about: {
              title: 'درباره ما',
              body: 'لوکاوو مرجعی برای پیدا کردن کسب‌وکارهای محلی است؛ از نانوایی محله تا دفتر وکالت، همراه با آدرس دقیق، اطلاعات کامل و نظرات واقعی کاربران.',
            },
            contact: {
              title: 'تماس با ما',
              body: 'برای هرگونه سوال، پیشنهاد یا گزارش مشکل می‌توانید از طریق ایمیل support@lokavo.ir با تیم پشتیبانی لوکاوو در ارتباط باشید.',
            },
            guide: {
              title: 'راهنمای استفاده',
              body: 'از صفحه‌ی اصلی می‌توانید بر اساس دسته‌بندی یا جستجو، کسب‌وکارهای اطراف خود را پیدا کنید.',
            },
            faq: {
              title: 'سوالات متداول',
              body: 'برای ثبت کسب‌وکار باید ابتدا در اپ به‌عنوان فروشنده ثبت‌نام کنید، سپس از پنل فروشنده کسب‌وکار خود را اضافه کنید.',
            },
            terms: {
              title: 'قوانین و مقررات',
              body: 'استفاده از لوکاوو به معنای پذیرفتن این تعهد است که اطلاعات ثبت‌شده صحیح و متعلق به خودتان باشد.',
            },
            pricing: {
              title: 'تعرفه‌ها',
              body: 'ثبت کسب‌وکار در لوکاوو رایگان است. برای دیده‌شدن بیشتر می‌توانید از طرح‌های تبلیغاتی زیر استفاده کنید:',
            },
            'seller-guide': {
              title: 'راهنمای فروشندگان',
              body: 'پس از تایید کسب‌وکار، از پنل فروشنده می‌توانید محصولات را اضافه کنید و به پیام‌ها و نظرات مشتریان پاسخ بدهید.',
            },
          },
          bottomMade: 'ساخته شده با ❤ برای کسب‌وکارهای محلی',
        },
      },
    });
  }
  return footer;
}

// ============================================
// عمومی (بدون نیاز به لاگین) — برای فرانت
// ============================================
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json({
      success: true,
      data: {
        site_name: settings.site_name,
        registration_open: settings.registration_open,
        maintenance_mode: settings.maintenance_mode,
        banner_image_url: settings.banner_image_url,
      },
    });
  } catch (error) {
    console.error('GET PUBLIC SETTINGS ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};

exports.getPublicFooter = async (req, res) => {
  try {
    const footer = await ensureFooter();
    res.json({ success: true, data: footer.data });
  } catch (error) {
    console.error('GET PUBLIC FOOTER ERROR:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
};
