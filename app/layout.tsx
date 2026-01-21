import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Import Inter instead of Geist
import "./global.css";  // Change from "../out.css"
;

// 2. Configure Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Churn Buster",
  description: "Stop customer churn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the Inter class name to the body */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}