const express = require("express");
const router = express.Router();

const NESHAN_SERVICE_KEY = process.env.NESHAN_SERVICE_KEY;
const NESHAN_SEARCH_KEY = process.env.NESHAN_SEARCH_KEY;

// جستجوی مکان / اتوکامپلیت آدرس
router.get("/search", async (req, res) => {
  const { term, lat, lng } = req.query;

  if (!term || !lat || !lng) {
    return res.status(400).json({ message: "پارامترهای term، lat و lng الزامی هستند" });
  }

  if (!NESHAN_SEARCH_KEY) {
    return res.status(500).json({ message: "کلید Neshan تنظیم نشده است" });
  }

  try {
    const url = `https://api.neshan.org/v1/search?term=${encodeURIComponent(term)}&lat=${lat}&lng=${lng}`;

    const response = await fetch(url, { 
      headers: { "Api-Key": NESHAN_SEARCH_KEY } 
    });

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Neshan search error:", err);
    res.status(500).json({ message: "خطا در سرویس جستجوی نشان" });
  }
});

// تبدیل مختصات به آدرس (Reverse Geocoding)
router.get("/reverse", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "پارامترهای lat و lng الزامی هستند" });
  }

  if (!NESHAN_SERVICE_KEY) {
    return res.status(500).json({ message: "کلید Neshan تنظیم نشده است" });
  }

  try {
    const url = `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`;
    const response = await fetch(url, { headers: { "Api-Key": NESHAN_SERVICE_KEY } });
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error('[NESHAN REVERSE] Error:', err.message || err);
    res.status(500).json({ message: "خطا در سرویس آدرس‌یابی نشان" });
  }
});

module.exports = router;