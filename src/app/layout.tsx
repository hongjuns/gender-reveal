import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://baby.bunnyverse.app"),
  title: "젠더리빌 | Gender Reveal",
  description: "풍선을 터뜨려 아기의 성별을 확인해보세요",
  openGraph: {
    title: "젠더리빌 | Gender Reveal",
    description: "풍선을 터뜨려 아기의 성별을 확인해보세요",
    url: "/gender-reveal",
    siteName: "젠더리빌",
    images: [
      {
        url: "/img/Thumbnail.png",
        width: 1729,
        height: 910,
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="75bf0172-de3e-4676-89a2-166f3c611893"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
