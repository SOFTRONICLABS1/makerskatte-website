import React from 'react';
import Footer from './Footer';
import Header from './Header';
import WhatsAppFloat from './WhatsAppFloat';

type Props = {
  announcement?: string;
  children: React.ReactNode;
};

export default function Layout({ announcement, children }: Props) {
  return (
    <div className="storefront">
      <Header />
      {children}
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
