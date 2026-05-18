import { getFileUrl, uploadFile } from "../../../lib/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: "فایلی ارسال نشده است. فیلد باید «file» باشد." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        {
          success: false,
          error: `نوع فایل مجاز نیست (${file.type || "نامشخص"}). فقط JPEG، PNG و WebP پذیرفته می‌شود.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        {
          success: false,
          error: `حجم فایل بیش از حد مجاز است (${(file.size / (1024 * 1024)).toFixed(2)} مگابایت). حداکثر ۵ مگابایت.`,
        },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await uploadFile(buffer, uniqueName, file.type);
    const url = await getFileUrl(uniqueName);

    return Response.json({
      success: true,
      url,
      fileName: uniqueName,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "خطای ناشناخته در پردازش درخواست";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
