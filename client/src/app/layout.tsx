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
  metadataBase: new URL(process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  title: "NeuronDash - AI Data Analytics Sandbox",
  description: "Interactive data analysis, bento dashboards, cleaning, and diagnostics in seconds.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" }
    ]
  },
  openGraph: {
    title: "NeuronDash",
    description: "AI Data Analytics Sandbox",
    images: [
      {
        url: "/icon-mark-512.png",
        width: 512,
        height: 512,
        alt: "NeuronDash Logo Mark"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: "NeuronDash",
    description: "AI Data Analytics Sandbox",
    images: ["/icon-mark-512.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
