import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Akiba Core | Real-Time Booking & Visual Schedule',
  description: 'Sistem Visual Schedule & Real-Time Booking Rental PlayStation Mobile-First',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-canvas text-slate-900 antialiased flex flex-col">
        <Providers>
          <main className="flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
