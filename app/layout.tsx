import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookingOS",
    template: "%s | BookingOS",
  },
  description:
    "BookingOS — نظام إدارة الحجوزات أونلاين لأصحاب الأنشطة والخدمات.",
  applicationName: "BookingOS",
  keywords: [
    "BookingOS",
    "الحجوزات",
    "إدارة الحجوزات",
    "حجز أونلاين",
  ],
  authors: [{ name: "Mohamed Rabie" }],
  creator: "Mohamed Rabie",
  openGraph: {
    title: "BookingOS 🚀",
    description:
      "نظام إدارة الحجوزات أونلاين — نظّم نشاطك واستقبل حجوزاتك بسهولة.",
    url: "https://booking-os-nu.vercel.app",
    siteName: "BookingOS",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BookingOS 🚀",
    description:
      "نظام إدارة الحجوزات أونلاين لأصحاب الأنشطة والخدمات.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}