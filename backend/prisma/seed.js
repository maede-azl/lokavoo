// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = require('../src/config/db');

async function main() {
  console.log('🌱 شروع seed کردن دیتابیس...');

  const categories = [
    { name: 'رستوران و کافه', key_name: 'restaurant-cafe', icon: '🍽️', color_1: '#FF7A45', color_2: '#FFC24B' },
    { name: 'هتل و اقامتگاه', key_name: 'hotel', icon: '🏨', color_1: '#2547E8', color_2: '#5271FF' },
    { name: 'پزشک، درمانگاه و بیمارستان', key_name: 'medical', icon: '🏥', color_1: '#16A34A', color_2: '#5EEAD4' },
    { name: 'داروخانه', key_name: 'pharmacy', icon: '💊', color_1: '#8B5CF6', color_2: '#EC4899' },
    { name: 'آرایشگاه و سالن زیبایی', key_name: 'beauty', icon: '💇', color_1: '#EC4899', color_2: '#F472B6' },
    { name: 'مراکز ماساژ و اسپا', key_name: 'spa', icon: '💆', color_1: '#F59E0B', color_2: '#FBBF24' },
    { name: 'باشگاه ورزشی', key_name: 'gym', icon: '🏋️', color_1: '#06B6D4', color_2: '#22D3EE' },
    { name: 'آموزشگاه و کلاس آموزشی', key_name: 'education', icon: '📚', color_1: '#EF4444', color_2: '#F87171' },
    { name: 'سوپرمارکت و فروشگاه مواد غذایی', key_name: 'supermarket', icon: '🛒', color_1: '#64748B', color_2: '#94A3B8' },
    { name: 'پوشاک و کیف و کفش', key_name: 'clothing', icon: '👕', color_1: '#0EA5E9', color_2: '#38BDF8' },
    { name: 'طلا، جواهر و اکسسوری', key_name: 'jewelry', icon: '💍', color_1: '#D946EF', color_2: '#E879F9' },
    { name: 'موبایل و لوازم دیجیتال', key_name: 'mobile', icon: '📱', color_1: '#22C55E', color_2: '#4ADE80' },
    { name: 'خدمات کامپیوتر و فناوری', key_name: 'computer', icon: '💻', color_1: '#F97316', color_2: '#FB923C' },
    { name: 'نمایشگاه خودرو', key_name: 'car-showroom', icon: '🚗', color_1: '#6366F1', color_2: '#818CF8' },
    { name: 'تعمیرگاه خودرو', key_name: 'car-repair', icon: '🔧', color_1: '#14B8A6', color_2: '#2DD4BF' },
    { name: 'خدمات خودرو (کارواش، تعویض روغن و...)', key_name: 'car-services', icon: '🛢️', color_1: '#FF7A45', color_2: '#FFC24B' },
    { name: 'بانک و خدمات مالی', key_name: 'bank', icon: '🏦', color_1: '#2547E8', color_2: '#5271FF' },
    { name: 'املاک', key_name: 'real-estate', icon: '🏠', color_1: '#16A34A', color_2: '#5EEAD4' },
    { name: 'وکیل و مشاور حقوقی', key_name: 'legal', icon: '⚖️', color_1: '#8B5CF6', color_2: '#A78BFA' },
    { name: 'عکاسی و آتلیه', key_name: 'photography', icon: '📷', color_1: '#EC4899', color_2: '#F472B6' },
    { name: 'تالار و تشریفات', key_name: 'ceremony', icon: '🎉', color_1: '#F59E0B', color_2: '#FBBF24' },
    { name: 'گل‌فروشی', key_name: 'florist', icon: '💐', color_1: '#06B6D4', color_2: '#22D3EE' },
    { name: 'کادو و صنایع دستی', key_name: 'handmade', icon: '🎁', color_1: '#EF4444', color_2: '#F87171' },
    { name: 'خدمات حیوانات خانگی', key_name: 'pets', icon: '🐾', color_1: '#64748B', color_2: '#94A3B8' },
    { name: 'خدمات فنی و تعمیرات', key_name: 'repair', icon: '🛠️', color_1: '#0EA5E9', color_2: '#38BDF8' },
    { name: 'خدمات نظافت', key_name: 'cleaning', icon: '🧹', color_1: '#D946EF', color_2: '#E879F9' },
    { name: 'حمل‌ونقل و باربری', key_name: 'transport', icon: '🚚', color_1: '#22C55E', color_2: '#4ADE80' },
    { name: 'آژانس مسافرتی', key_name: 'travel', icon: '✈️', color_1: '#F97316', color_2: '#FB923C' },
    { name: 'اماکن مذهبی', key_name: 'religious', icon: '🕌', color_1: '#6366F1', color_2: '#818CF8' },
    { name: 'مراکز فرهنگی و هنری', key_name: 'culture', icon: '🎨', color_1: '#14B8A6', color_2: '#2DD4BF' },
    { name: 'سینما و تفریح', key_name: 'entertainment', icon: '🎬', color_1: '#FF7A45', color_2: '#FFC24B' },
    { name: 'جاذبه‌های گردشگری', key_name: 'tourism', icon: '🗺️', color_1: '#2547E8', color_2: '#5271FF' },
    { name: 'خدمات چاپ و تبلیغات', key_name: 'printing', icon: '🖨️', color_1: '#16A34A', color_2: '#5EEAD4' },
    { name: 'تولیدی و کارخانه', key_name: 'factory', icon: '🏭', color_1: '#8B5CF6', color_2: '#A78BFA' },
    { name: 'سایر', key_name: 'other', icon: '📦', color_1: '#64748B', color_2: '#94A3B8' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { key_name: category.key_name },
      update: {
        name: category.name,
        icon: category.icon,
        color_1: category.color_1,
        color_2: category.color_2,
      },
      create: category,
    });
  }

  console.log(`✅ ${categories.length} دسته‌بندی ایجاد/به‌روزرسانی شدند`);

    console.log(`✅ ${categories.length} دسته‌بندی ایجاد/به‌روزرسانی شدند`);

  // ========== Seed Subscription Plans ==========
  const plans = [
    // پایه - رایگان
    {
      key: "basic",
      name: "استارک پایه",
      billing_cycle: "monthly",
      price: 0,
      duration_days: 30,
      max_images: 20,
      search_priority: 0,
      can_pin: false,
      show_in_suggested: false,
      can_advertise: false,
      ad_priority: 0,
      view_stats: false,
      click_stats: false,
      support_level: "normal",
      click_discount: 0,
    },
    {
      key: "basic",
      name: "استارک پایه",
      billing_cycle: "yearly",
      price: 0,
      duration_days: 365,
      max_images: 20,
      search_priority: 0,
      can_pin: false,
      show_in_suggested: false,
      can_advertise: false,
      ad_priority: 0,
      view_stats: false,
      click_stats: false,
      support_level: "normal",
      click_discount: 0,
    },
    // حرفه‌ای
    {
      key: "pro",
      name: "حرفه‌ای",
      billing_cycle: "monthly",
      price: 399000,
      duration_days: 30,
      max_images: 40,
      search_priority: 10,
      can_pin: false,
      show_in_suggested: false,
      can_advertise: true,
      ad_priority: 5,
      view_stats: true,
      click_stats: true,
      support_level: "priority",
      click_discount: 20,
    },
    {
      key: "pro",
      name: "حرفه‌ای",
      billing_cycle: "yearly",
      price: 3990000,
      duration_days: 365,
      max_images: 40,
      search_priority: 10,
      can_pin: false,
      show_in_suggested: false,
      can_advertise: true,
      ad_priority: 5,
      view_stats: true,
      click_stats: true,
      support_level: "priority",
      click_discount: 20,
    },
    // حرفه‌ای پلاس
    {
      key: "pro_plus",
      name: "حرفه‌ای پلاس",
      billing_cycle: "monthly",
      price: 699000,
      duration_days: 30,
      max_images: 100,
      search_priority: 20,
      can_pin: true,
      show_in_suggested: true,
      can_advertise: true,
      ad_priority: 10,
      view_stats: true,
      click_stats: true,
      support_level: "vip",
      click_discount: 40,
    },
    {
      key: "pro_plus",
      name: "حرفه‌ای پلاس",
      billing_cycle: "yearly",
      price: 6990000,
      duration_days: 365,
      max_images: 100,
      search_priority: 20,
      can_pin: true,
      show_in_suggested: true,
      can_advertise: true,
      ad_priority: 10,
      view_stats: true,
      click_stats: true,
      support_level: "vip",
      click_discount: 40,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: {
        key_billing_cycle: {
          key: plan.key,
          billing_cycle: plan.billing_cycle,
        },
      },
      update: plan,
      create: plan,
    });
  }

  console.log(`✅ ${plans.length} پلن اشتراک ایجاد/به‌روزرسانی شدند`);

  // کاربر تست
  const testUser = await prisma.user.upsert({
    where: { phone: '09123456789' },
    update: {},
    create: {
      phone: '09123456789',
      name: 'کاربر تست',
      role: 'user',
    },
  });

  console.log('✅ کاربر تست ایجاد شد:', testUser.phone);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });