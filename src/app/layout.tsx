import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SupabaseProvider } from "@/providers/supabase";

const PressStart2P = localFont({
  src: "./fonts/PressStart2P-Regular.ttf",
  variable: "--font-PressStart2P",
  weight: "100 900",
});
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "AEIOU - Quiz Game",
  description: "Quiz of the day app by o7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
            <head>
        <link rel="icon" href="favicon.ico" />
      </head>
      <body
        className={`${PressStart2P.variable} antialiased`}
      >
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
