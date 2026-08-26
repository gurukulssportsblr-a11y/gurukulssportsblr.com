import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Gurukul's Sports ® - Premier Badminton & Sports Hub",
  description: "Bengaluru's Premier Badminton & Sports Hub with 10 international-standard BWF courts on Varthur Main Road, Whitefield. Book courts online instantly.",
  keywords: ["Badminton Bangalore", "Whitefield Sports", "Gurukul Sports", "Badminton Court Booking", "BWF Synthetic Court"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
