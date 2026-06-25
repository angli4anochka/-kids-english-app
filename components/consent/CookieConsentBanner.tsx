'use client';
import { useState, useEffect } from 'react';
import { LEGAL_DOCUMENTS } from '../../legal/legalDocuments';

const STORAGE_KEY = 'cookie_consent_v' + LEGAL_DOCUMENTS.cookiePolicy.version;

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
  policyVersion: string;
}

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePreferences(prefs: Omit<CookiePreferences, 'savedAt' | 'policyVersion' | 'necessary'>) {
  const full: CookiePreferences = {
    necessary: true,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    savedAt: new Date().toISOString(),
    policyVersion: LEGAL_DOCUMENTS.cookiePolicy.version,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  return full;
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getCookiePreferences()) setVisible(true);
  }, []);

  const acceptAll = () => {
    savePreferences({ analytics: true, marketing: true });
    setVisible(false);
  };

  const rejectOptional = () => {
    savePreferences({ analytics: false, marketing: false });
    setVisible(false);
  };

  const saveCustom = () => {
    savePreferences({ analytics, marketing });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {!showSettings ? (
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl flex-shrink-0">🍪</span>
              <div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Мы используем cookies для работы сайта, аналитики и улучшения сервиса.
                  Вы можете принять все cookies или настроить их использование.{' '}
                  <a href={LEGAL_DOCUMENTS.cookiePolicy.url} target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs">Политика cookies</a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={acceptAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                Принять все
              </button>
              <button onClick={rejectOptional}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
                Отклонить необязательные
              </button>
              <button onClick={() => setShowSettings(true)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition">
                Настроить
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className="font-bold text-gray-800 mb-4">Настройки cookies</h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Необходимые cookies</div>
                  <div className="text-xs text-gray-500">Авторизация, безопасность, работа сайта</div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">Всегда активны</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Аналитические cookies</div>
                  <div className="text-xs text-gray-500">Анализ использования сайта (Яндекс.Метрика)</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Маркетинговые cookies</div>
                  <div className="text-xs text-gray-500">Персонализация рекламы (в настоящее время не используются)</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveCustom}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                Сохранить настройки
              </button>
              <button onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-lg transition">
                Назад
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
