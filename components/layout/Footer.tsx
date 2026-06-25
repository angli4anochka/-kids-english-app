'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getCookiePreferences } from '../consent/CookieConsentBanner';

export default function Footer() {
  const [showCookieReset, setShowCookieReset] = useState(false);

  const resetCookies = () => {
    Object.keys(localStorage).filter(k => k.startsWith('cookie_consent')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/privacy-policy" className="hover:text-blue-600 hover:underline transition">
            Политика обработки персональных данных
          </Link>
          <span className="hidden sm:inline text-gray-300">·</span>
          <Link href="/personal-data-consent" className="hover:text-blue-600 hover:underline transition">
            Согласие на обработку персональных данных
          </Link>
          <span className="hidden sm:inline text-gray-300">·</span>
          <Link href="/cookie-policy" className="hover:text-blue-600 hover:underline transition">
            Политика cookies
          </Link>
          <span className="hidden sm:inline text-gray-300">·</span>
          <Link href="/terms" className="hover:text-blue-600 hover:underline transition">
            Пользовательское соглашение
          </Link>
          <span className="hidden sm:inline text-gray-300">·</span>
          <button
            onClick={resetCookies}
            className="hover:text-blue-600 hover:underline transition"
          >
            Настройки cookies
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          © {new Date().getFullYear()} UniPlay Kids. Все права защищены.
          База данных размещена на серверах в Российской Федерации.
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          Оператор ПДн: Малахова Альбина Сергеевна (ИНН 312824955688), г. Москва ·{' '}
          <a href="mailto:angli4anochka@gmail.com" className="hover:underline">angli4anochka@gmail.com</a>
        </p>
      </div>
    </footer>
  );
}
