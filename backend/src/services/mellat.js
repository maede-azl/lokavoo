// mellat.js — سرویس اتصال به درگاه پرداخت اینترنتی بانک ملت (به‌پرداخت ملت)
// مستندات کلی: وب‌سرویس SOAP در آدرس زیر با ۵ متد اصلی
//   bpPayRequest / bpVerifyRequest / bpSettleRequest / bpInquiryRequest / bpReversalRequest
//
// ⚠️ برای فعال شدن این سرویس، این مقادیر باید در .env پر بشن:
//   MELLAT_TERMINAL_ID   شناسه‌ی ترمینال (عدد)
//   MELLAT_USERNAME      نام کاربری وب‌سرویس
//   MELLAT_PASSWORD      رمز عبور وب‌سرویس
//   MELLAT_CALLBACK_URL  آدرس بازگشت (باید در بک‌اند در دسترس عموم باشه، نه فرانت)
// تا وقتی این مقادیر پر نشدن، initiatePayment خطای مشخص برمی‌گردونه (نه پرداخت
// ساختگی) — چون این بخش مستقیم با پول واقعی سروکار داره.

const WSDL_ENDPOINT = 'https://bpm.shaparak.ir/pgwchannel/services/pgw?wsdl';
const START_PAY_URL = 'https://bpm.shaparak.ir/pgwchannel/startpay.mellat';

function getConfig() {
  const terminalId = process.env.MELLAT_TERMINAL_ID;
  const userName = process.env.MELLAT_USERNAME;
  const userPassword = process.env.MELLAT_PASSWORD;
  const callBackUrl = process.env.MELLAT_CALLBACK_URL;

  const missing = [];
  if (!terminalId) missing.push('MELLAT_TERMINAL_ID');
  if (!userName) missing.push('MELLAT_USERNAME');
  if (!userPassword) missing.push('MELLAT_PASSWORD');
  if (!callBackUrl) missing.push('MELLAT_CALLBACK_URL');

  return { terminalId, userName, userPassword, callBackUrl, missing };
}

// تاریخ/ساعت محلی به فرمتی که ملت می‌خواد: localDate=YYYYMMDD (شمسی)، localTime=HHMMSS
function getPersianDateTime() {
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const [y, m, d] = dateFmt.split('/');
  const localDate = `${y}${m}${d}`;

  const localTime = now.toTimeString().slice(0, 8).replace(/:/g, '');

  return { localDate, localTime };
}

function soapEnvelope(method, params) {
  const paramsXml = Object.entries(params)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="http://interfaces.core.sw.bps.com/">
  <soapenv:Body>
    <ns:${method}>
      <ns:request>${paramsXml}</ns:request>
    </ns:${method}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function callSoap(method, params) {
  const body = soapEnvelope(method, params);

  const response = await fetch(WSDL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '',
    },
    body,
  });

  const text = await response.text();
  // پاسخ ملت یک رشته با کاما جدا شده‌ست (مثلاً "0,1234567890")
  const match = text.match(/<return>([^<]*)<\/return>/i);
  return match ? match[1] : null;
}

/**
 * شروع تراکنش پرداخت — کاربر باید بعدش به startPayUrl هدایت بشه
 * برمی‌گردونه: { success, refId, startPayUrl, error }
 */
async function initiatePayment({ orderId, amountRials, description = '' }) {
  const { terminalId, userName, userPassword, callBackUrl, missing } = getConfig();

  if (missing.length > 0) {
    return {
      success: false,
      error: `درگاه پرداخت هنوز پیکربندی نشده (مقادیر ناقص: ${missing.join(', ')})`,
      code: 'GATEWAY_NOT_CONFIGURED',
    };
  }

  const { localDate, localTime } = getPersianDateTime();

  try {
    const result = await callSoap('bpPayRequest', {
      terminalId,
      userName,
      userPassword,
      orderId,
      amount: amountRials,
      localDate,
      localTime,
      additionalData: description,
      callBackUrl,
      payerId: 0,
    });

    if (!result) {
      return { success: false, error: 'پاسخی از درگاه پرداخت دریافت نشد' };
    }

    const [resCode, refId] = result.split(',');

    if (resCode !== '0') {
      return { success: false, error: `خطای درگاه پرداخت (کد ${resCode})`, resCode };
    }

    return {
      success: true,
      refId,
      startPayUrl: `${START_PAY_URL}?RefId=${refId}`,
    };
  } catch (err) {
    console.error('MELLAT bpPayRequest ERROR:', err.message || err);
    return { success: false, error: 'خطا در اتصال به درگاه پرداخت' };
  }
}

/**
 * تایید و نهایی‌کردن تراکنش بعد از بازگشت کاربر از بانک (verify سپس settle)
 */
async function verifyAndSettlePayment({ orderId, saleOrderId, saleReferenceId }) {
  const { terminalId, userName, userPassword, missing } = getConfig();

  if (missing.length > 0) {
    return { success: false, error: 'درگاه پرداخت پیکربندی نشده' };
  }

  const params = { terminalId, userName, userPassword, orderId, saleOrderId, saleReferenceId };

  try {
    const verifyResult = await callSoap('bpVerifyRequest', params);

    if (verifyResult !== '0') {
      return { success: false, error: `تایید تراکنش ناموفق بود (کد ${verifyResult})` };
    }

    const settleResult = await callSoap('bpSettleRequest', params);

    if (settleResult !== '0') {
      return { success: false, error: `واریز وجه ناموفق بود (کد ${settleResult})` };
    }

    return { success: true };
  } catch (err) {
    console.error('MELLAT verify/settle ERROR:', err.message || err);
    return { success: false, error: 'خطا در اتصال به درگاه پرداخت' };
  }
}

module.exports = { initiatePayment, verifyAndSettlePayment, getConfig };
