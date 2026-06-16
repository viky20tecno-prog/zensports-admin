import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', weight: ['300','400','500','600','700'] });

export const metadata: Metadata = {
  title: "ZenSports Admin",
  description: "Centro de operaciones ZenSports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
