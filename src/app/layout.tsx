import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScanBite — Multi-Tenant QR Menu & Digital Ordering SaaS",
  description: "Next-gen QR code digital menu and table ordering platform for restaurants, cafes, and bars.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth bg-slate-950 overscroll-x-none">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-orange-500 selection:text-white overflow-x-hidden w-full max-w-full overscroll-x-none">
        {children}
      </body>
    </html>
  );
}
