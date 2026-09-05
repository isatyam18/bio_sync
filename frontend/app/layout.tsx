import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BioSync — Explainable health risk assessment",
  description: "BioSync brings patient data, model-based risk assessment, and assessment history into one clean healthcare workspace.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0f3d38",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
