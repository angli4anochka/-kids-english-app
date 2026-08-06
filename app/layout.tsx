import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ClientLayout from "../components/layout/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kids English App",
  description: "English learning platform for kids",
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
      <head>
        <link rel="dns-prefetch" href="https://storage.yandexcloud.net" />
        <link rel="preconnect" href="https://storage.yandexcloud.net" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <ClientLayout />
        </Providers>
      </body>
    </html>
  );
}
