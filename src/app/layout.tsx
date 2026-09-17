import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibm = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Changan Tracker | Heston Automotive",
  description:
    "Live remaining days to sell each Changan vehicle — 90-day and 360-day wholesale clocks.",
  icons: {
    icon: [
      { url: "/icon.png?v=3", type: "image/png", sizes: "256x256" },
      { url: "/favicon.ico?v=3", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png?v=3" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${ibm.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
