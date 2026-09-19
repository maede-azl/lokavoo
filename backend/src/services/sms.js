// sms.js — سرویس ارسال پیامک با ippanel (Edge API)
// مستندات: https://ippanelcom.github.io/Edge-Document/docs/send/pattern

const IPPANEL_BASE_URL = 'https://edge.ippanel.com/v1';

// شماره‌ی ایرانی رو به فرمت بین‌المللی +98 تبدیل می‌کنه (لازم برای ippanel)
function toE164(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('98')) return `+${digits}`;
  if (digits.startsWith('0')) return `+98${digits.slice(1)}`;
  return `+98${digits}`;
}

/**
 * ارسال کد تایید (OTP) از طریق پیامک الگو (pattern) ippanel.
 * برای کدهای تایید، طبق مقررات باید از پیامک الگوی تاییدشده استفاده بشه
 * (نه پیامک آزاد/تبلیغاتی).
 *
 * برمی‌گردونه: { success: boolean, error?: string }
 */
async function sendOtpSms(phone, code) {
  const apiKey = process.env.IPPANEL_API_KEY;
  const fromNumber = process.env.IPPANEL_FROM_NUMBER;
  const patternCode = process.env.IPPANEL_OTP_PATTERN_CODE;

  if (!apiKey || !fromNumber || !patternCode) {
    return {
      success: false,
      error: 'تنظیمات ippanel کامل نیست (IPPANEL_API_KEY / IPPANEL_FROM_NUMBER / IPPANEL_OTP_PATTERN_CODE)',
    };
  }

  try {
    const response = await fetch(`${IPPANEL_BASE_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        sending_type: 'pattern',
        from_number: fromNumber,
        code: patternCode,
        recipients: [toE164(phone)],
        params: {
          // نام متغیر داخل الگو باید دقیقاً با چیزی که هنگام ساخت الگو
          // در پنل ippanel تعریف شده یکی باشه (معمولاً "code")
          code: String(code),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data?.meta?.status !== true) {
      console.error('IPPANEL SEND ERROR:', data);
      return { success: false, error: data?.meta?.message || 'خطا در ارسال پیامک' };
    }

    return { success: true };
  } catch (err) {
    console.error('IPPANEL REQUEST ERROR:', err.message || err);
    return { success: false, error: 'خطا در اتصال به سرویس پیامک' };
  }
}

module.exports = { sendOtpSms, toE164 };
