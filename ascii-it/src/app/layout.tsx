import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ascii-it",
  description: "just ascii it. convert an image to ascii art.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
