import type { Metadata } from "next";
import { Inter, Noto_Serif_Ethiopic } from "next/font/google";
import { AudioProvider } from "@/components/audio/audio-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  variable: "--font-heading",
  subsets: ["ethiopic", "latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "ዝማሬ · Zimare",
  description:
    "Zimare — a chromatic tuner, Ethiopian pentatonic key detector, and mezmur companion.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${notoSerifEthiopic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
