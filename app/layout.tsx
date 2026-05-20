import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "پارس‌پک",
  description: "استقرار Next.js روی پارس‌پک",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
