import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatWidget from "../components/ChatWidget";
import { CartProvider } from "../context/CartContext";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Viking Labs - Premium Research Peptides",
  description: "High-purity research compounds for laboratory use only.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <Providers>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
