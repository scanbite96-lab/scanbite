import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScanBite — Multi-Tenant QR Menu & Digital Ordering SaaS",
  description: "Next-gen QR code digital menu and table ordering platform for restaurants, cafes, and bars.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
