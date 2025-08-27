import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SocialConnect",
    template: "%s | SocialConnect"
  },
  description: "A modern social media platform for connecting people, sharing moments, and building communities.",
  keywords: ["social media", "social network", "connect", "share", "community", "posts", "follow", "like", "comment"],
  authors: [{ name: "SocialConnect Team" }],
  creator: "SocialConnect",
  publisher: "SocialConnect",
  metadataBase: new URL('https://socialconnect.app'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://socialconnect.app",
    title: "SocialConnect",
    description: "A modern social media platform for connecting people, sharing moments, and building communities.",
    siteName: "SocialConnect",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SocialConnect - Connect, Share, Discover"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialConnect",
    description: "A modern social media platform for connecting people, sharing moments, and building communities.",
    images: ["/og-image.png"],
    creator: "@socialconnect"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml"
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16", 
        type: "image/png"
      }
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#667eea"
      }
    ]
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#667eea" },
    { media: "(prefers-color-scheme: dark)", color: "#4c51bf" }
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
