import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Harvey | Files",
  description: "Professional Class AI for Legal Professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: '20px',
            },
          }}
        />
      </body>
    </html>
  );
}
