import { sendVerificationCode } from "../../../lib/sms";

const IRAN_MOBILE_REGEX = /^09\d{9}$/;

function generateVerificationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };

    if (!body.phone || typeof body.phone !== "string") {
      return Response.json(
        { success: false, error: "شماره موبایل ارسال نشده است." },
        { status: 400 }
      );
    }

    const phone = body.phone.trim();

    if (!IRAN_MOBILE_REGEX.test(phone)) {
      return Response.json(
        {
          success: false,
          error:
            "شماره موبایل نامعتبر است. باید با 09 شروع شود و در مجموع ۱۱ رقم باشد.",
        },
        { status: 400 }
      );
    }

    const code = generateVerificationCode();
    const result = await sendVerificationCode(phone, code);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 502 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در پردازش درخواست";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
