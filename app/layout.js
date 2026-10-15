import "./globals.css";
import { ToastProvider } from "../components/ToastProvider";
import FloatingCartButton from "../components/FloatingCartButton";

export const metadata = {
  title: "Marketplace App",
  description: "Marketplace sederhana dengan Next.js + Supabase",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <FloatingCartButton />
        </ToastProvider>
      </body>
    </html>
  );
}