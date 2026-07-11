'use client';
import Link from 'next/link';

export default function Footer() {
  const resetCookies = () => {
    Object.keys(localStorage).filter(k => k.startsWith('cookie_consent')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto py-2 px-2">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] leading-tight text-gray-400">
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
        <p className="text-center text-[10px] leading-tight text-gray-400 mt-1">
          © {new Date().getFullYear()} UniPlay Kids. Все права защищены.
          База данных размещена на серверах в Российской Федерации.
        </p>
        <p className="text-center text-[10px] leading-tight text-gray-400 mt-0.5">
          Оператор ПДн: Малахова Альбина Сергеевна (ИНН 312824955688), г. Москва ·{' '}
          <a href="mailto:angli4anochka@gmail.com" className="hover:underline">angli4anochka@gmail.com</a>
        </p>
      </div>
    </footer>
  );
}
