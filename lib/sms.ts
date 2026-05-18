export type SmsResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function sendVerificationCode(
  phone: string,
  code: string
): Promise<SmsResult> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE;

  if (!apiKey) {
    return {
      success: false,
      error: "متغیر محیطی KAVENEGAR_API_KEY تنظیم نشده است.",
    };
  }

  if (!template) {
    return {
      success: false,
      error: "متغیر محیطی KAVENEGAR_TEMPLATE تنظیم نشده است.",
    };
  }

  const url = new URL(
    `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`
  );
  url.searchParams.set("receptor", phone);
  url.searchParams.set("token", code);
  url.searchParams.set("template", template);

  try {
    const response = await fetch(url.toString(), { method: "GET" });
    const data = (await response.json()) as {
      return?: { status?: number; message?: string };
    };

    const status = data.return?.status;
    const message = data.return?.message ?? "پاسخ نامعتبر از کاوه‌نگار";

    if (response.ok && status === 200) {
      return { success: true, message };
    }

    return {
      success: false,
      error: `کاوه‌نگار [${status ?? response.status}]: ${message}`,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در ارتباط با کاوه‌نگار";
    return { success: false, error: message };
  }
}
