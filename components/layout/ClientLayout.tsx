'use client';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('./Footer'), { ssr: false });
const CookieConsentBanner = dynamic(() => import('../consent/CookieConsentBanner'), { ssr: false });

export default function ClientLayout() {
  return (
    <>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
