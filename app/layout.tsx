import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', weight: ['300','400','500','600','700'] });

export const metadata: Metadata = {
  title: "ZenSports Admin",
  description: "Centro de operaciones ZenSports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={spaceGrotesk.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
      </head>
      <body className="antialiased">
        {children}
        {/* Clash Display — carga diferida para no bloquear render */}
        <Script id="clash-display" strategy="afterInteractive">{`
          (function(){
            var l=document.createElement('link');
            l.rel='stylesheet';
            l.href='https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap';
            document.head.appendChild(l);
          })();
        `}</Script>
      </body>
    </html>
  );
}
