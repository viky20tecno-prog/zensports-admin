import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', weight: ['300','400','500','600','700'] });
const sportEvent = localFont({
  src: [
    { path: './fonts/sportevent-display.otf', weight: '400', style: 'normal' },
    { path: './fonts/sportevent-italic.otf',  weight: '400', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ZenSports Admin",
  description: "Centro de operaciones ZenSports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${sportEvent.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
