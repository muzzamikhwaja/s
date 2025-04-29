import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Import GeistSans from correct package
import { GeistMono } from 'geist/font/mono'; // Import GeistMono from correct package
import './globals.css';
import { Toaster } from "@/components/ui/toaster" // Import Toaster

// No need to re-initialize if imported directly
// const geistSans = GeistSans({ ... }); // This is incorrect when importing directly
// const geistMono = GeistMono({ ... }); // This is incorrect when importing directly

export const metadata: Metadata = {
  title: 'LeadFlow AI', // Update title
  description: 'AI agent for lead nurturing', // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Use the font variables directly from the imported objects */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster component */}
      </body>
    </html>
  );
}
