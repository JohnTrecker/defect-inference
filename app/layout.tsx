import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defect Detection",
  description: "ISCO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className='antialiased'>
        <main>
          {children}
        </main>
        <footer className="bg-gray-100 py-6 text-center">
          <p>© {new Date().getFullYear()} ISCO. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
