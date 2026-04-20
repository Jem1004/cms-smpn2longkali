import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getSiteSettings } from "@/lib/queries";

export const dynamic = "force-dynamic"

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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const { identity } = settings

  return {
    title: {
      default: identity.name,
      template: `%s — ${identity.shortName}`,
    },
    description: identity.description,
    icons: identity.faviconUrl
      ? {
          icon: [{ url: identity.faviconUrl }],
          shortcut: identity.faviconUrl,
          apple: identity.faviconUrl,
        }
      : {
          icon: "/icon.png",
        },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased"
        )}
      >
        {children}
      </body>
    </html>
  );
}
