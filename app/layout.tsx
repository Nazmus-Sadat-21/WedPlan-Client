import type { Metadata } from "next"
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: {
    default: "WedPlan — Plan Your Perfect Wedding Day",
    template: "%s | WedPlan",
  },
  description:
    "Discover trusted wedding venues, photographers, caterers and stylists. Compare services, request bookings and plan your big day with WedPlan.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        display.variable
      )}
    >
      <body>
      
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  )
}
