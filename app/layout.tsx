import type { Metadata } from "next";
import { Space_Grotesk, Bebas_Neue } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', weight: ['300','400','500','600','700'] });
const bebasNeue    = Bebas_Neue({ subsets: ['latin'], variable: '--font-display', weight: '400' });

export const metadata: Metadata = {
  title: "ZenSports Admin",
  description: "Centro de operaciones ZenSports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${bebasNeue.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
