import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anton Cx",
  description: "Medical benefit drug policy intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={lato.variable}
    >
      <body className="bg-[#F7F8FC] text-[#0D1C3A] antialiased" style={{ fontFamily: "var(--font-lato), Lato, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
