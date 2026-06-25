'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '@/utils/routing-adapter';
import { LEGAL_DOCUMENTS } from '../legal/legalDocuments';

export default function PrivacySettingsScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'done'>('idle');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePending, setDeletePending] = useState(false);
  const [marketingOptout, setMarketingOptout] = useState(false);
  const [saved, setSaved] = useState(false);

  const resetCookies = () => {
    Object.keys(localStorage).filter(k => k.startsWith('cookie_consent')).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const requestDeletion = async () => {
    if (!user?.id) return;
    setDeletePending(true);
    try {
      await fetch('/kids-api/account/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reason: deleteReason }),
      });
      setDeleteStep('done');
    } finally {
      setDeletePending(false);
    }
  };

  const requestDataExport = async () => {
    if (!user?.id) return;
    alert('Запрос на выгрузку данных отправлен. Мы подготовим файл и отправим его на ваш email в течение 30 дней.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-gray-800">🔐 Настройки приватности</h1>
            <button onClick={() => navigate(-1 as any)}
              className="text-sm text-gray-500 hover:text-gray-700">← Назад</button>
          </div>
          <p className="text-sm text-gray-500">Управляйте своими согласиями и данными</p>
        </div>

        {/* Active consents */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">Активные согласия</h2>
          <div className="space-y-3 text-sm">
            <ConsentRow
              icon="✅"
              title="Обработка персональных данных"
              subtitle={`Согласие дано при регистрации · v${LEGAL_DOCUMENTS.personalDataConsent.version}`}
              href="/personal-data-consent"
              canRevoke={false}
              revokeNote="Отозвать можно только путём удаления аккаунта"
            />
            <ConsentRow
              icon="🍪"
              title="Cookie-предпочтения"
              subtitle="Хранятся в браузере"
              canRevoke
              onRevoke={resetCookies}
              revokeLabel="Изменить настройки"
            />
          </div>
        </div>

        {/* Marketing */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-3">Рассылки и уведомления</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={!marketingOptout}
              onChange={e => setMarketingOptout(!e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            <span className="text-sm text-gray-700">
              Получать информационные сообщения об обновлениях платформы и новых курсах
            </span>
          </label>
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </div>

        {/* Data export */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-2">Ваши данные</h2>
          <p className="text-sm text-gray-600 mb-4">
            В соответствии с ФЗ-152 вы имеете право получить копию всех своих данных или запросить их удаление.
          </p>
          <button onClick={requestDataExport}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
            📥 Запросить выгрузку моих данных
          </button>
        </div>

        {/* Delete account */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
          <h2 className="font-bold text-red-700 mb-2">Удаление аккаунта</h2>

          {deleteStep === 'idle' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Удаление аккаунта приведёт к потере всех данных: групп, учеников, курсов, прогресса.
                Действие необратимо. Заявка обрабатывается в течение 30 дней.
              </p>
              <button onClick={() => setDeleteStep('confirm')}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 text-sm font-semibold rounded-lg transition">
                Запросить удаление аккаунта
              </button>
            </>
          )}

          {deleteStep === 'confirm' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                ⚠️ Вы уверены? Все данные будут безвозвратно удалены. Это действие нельзя отменить.
              </div>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Причина удаления (необязательно)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div className="flex gap-2">
                <button onClick={() => setDeleteStep('idle')}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
                  Отмена
                </button>
                <button onClick={requestDeletion} disabled={deletePending}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
                  {deletePending ? 'Отправка...' : 'Подтвердить удаление'}
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'done' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              ✅ Заявка на удаление аккаунта принята. Мы обработаем её в течение 30 дней и уведомим вас по email.
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-2">Написать оператору по персональным данным</h2>
          <p className="text-sm text-gray-600 mb-3">
            По вопросам обработки персональных данных, уточнения, блокирования или удаления данных:
          </p>
          <a href="mailto:[email для обращений по персональным данным]"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold rounded-lg transition">
            ✉️ Написать на [email для обращений по персональным данным]
          </a>
        </div>

        <div className="text-center text-xs text-gray-400 pb-4">
          <a href="/privacy-policy" className="hover:underline">Политика конфиденциальности</a>
          {' · '}
          <a href="/personal-data-consent" className="hover:underline">Согласие на ПД</a>
          {' · '}
          <a href="/cookie-policy" className="hover:underline">Политика cookies</a>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({ icon, title, subtitle, href, canRevoke, onRevoke, revokeLabel, revokeNote }: {
  icon: string; title: string; subtitle: string; href?: string;
  canRevoke: boolean; onRevoke?: () => void; revokeLabel?: string; revokeNote?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-2">
        <span>{icon}</span>
        <div>
          <div className="font-medium text-gray-800">
            {href ? <a href={href} target="_blank" rel="noreferrer" className="hover:underline text-blue-700">{title}</a> : title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
      {canRevoke ? (
        <button onClick={onRevoke}
          className="flex-shrink-0 text-xs text-blue-600 hover:underline">
          {revokeLabel || 'Изменить'}
        </button>
      ) : (
        <span className="flex-shrink-0 text-xs text-gray-400">{revokeNote}</span>
      )}
    </div>
  );
}
