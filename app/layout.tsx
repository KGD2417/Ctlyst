import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, IBM_Plex_Mono } from "next/font/google";
import { ScrollProvider } from "@/lib/scroll-provider";
import { CurtainProvider } from "@/lib/curtain";
import { CustomCursor } from "@/lib/cursor";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// IBM Plex Mono is the only candidate of four with a correct ₹ at monospaced
// width — see PLAN §2 and evidence/L0-0-monotest.png. Do not swap it casually.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CTLYST — Bridging the Gap Between Ideas and Execution",
  description:
    "CTLYST connects student and early-stage founders with experienced mentors, hands-on help, and India's under-used funding schemes — in one hand-held journey.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${garamond.variable} ${plexMono.variable}`}
    >
      <body>
        <ScrollProvider>
          <CurtainProvider>
            <SiteNav />
            {children}
            <SiteFooter />
            <CustomCursor />
          </CurtainProvider>
        </ScrollProvider>
      </body>
    </html>
  );
}
