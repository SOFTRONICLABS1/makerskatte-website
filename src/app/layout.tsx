import './globals.css';
import './storefront.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'MakersKatte India – Precision Engraving & Custom Designs',
  description: 'Premium laser engraving for gifts, awards, and custom orders across India.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
