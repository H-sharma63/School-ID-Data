import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import Toast from "@/components/Toast";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Satoshi is not on Google Fonts. Fall back to a local Satoshi install if present,
// otherwise use Inter Tight for display as well (defined via CSS variable fallback).
const satoshi = localFont({
  variable: "--font-satoshi",
  display: "swap",
  // Optional: drop a Satoshi Variable file at /public/fonts/Satoshi-Variable.woff2
  // and uncomment the lines below. Otherwise the CSS falls back to Inter Tight.
  src: [
    {
      path: "../../public/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
  ],
  fallback: ["Inter Tight", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "School ID Extractor",
  description: "Read handwritten enrollment forms, review rosters, export to Excel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrainsMono.variable} ${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
     </head>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toast />
        </SessionProvider>
     </body>
   </html>
  );
}
