import { LEGAL_DOCUMENTS } from '../../legal/legalDocuments';

export const metadata = { title: 'Политика использования cookies — UniPlay Kids' };

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Политика использования cookies
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Версия {LEGAL_DOCUMENTS.cookiePolicy.version} · Дата обновления: {LEGAL_DOCUMENTS.cookiePolicy.updatedAt}
        </p>

        <Section title="1. Что такое cookies">
          <p>
            Cookies — это небольшие текстовые файлы, которые сохраняются в браузере при посещении сайта.
            Они позволяют сайту «запомнить» ваши действия и настройки, чтобы не вводить их повторно.
          </p>
        </Section>

        <Section title="2. Какие cookies мы используем">
          <table className="w-full text-sm border-collapse border border-gray-200 mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 p-2 text-left">Категория</th>
                <th className="border border-gray-200 p-2 text-left">Название / Ключ</th>
                <th className="border border-gray-200 p-2 text-left">Назначение</th>
                <th className="border border-gray-200 p-2 text-left">Срок</th>
                <th className="border border-gray-200 p-2 text-left">Обязательность</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                ['Необходимые', 'authToken (localStorage)', 'Авторизация пользователя', 'Сессия / до выхода', 'Обязательный'],
                ['Необходимые', 'authUser (localStorage)', 'Хранение данных сессии', 'Сессия / до выхода', 'Обязательный'],
                ['Необходимые', 'cookie_consent_v* (localStorage)', 'Хранение выбора cookie-настроек', '12 месяцев', 'Обязательный'],
                ['Аналитические', 'Яндекс.Метрика (_ym_*, _ym_uid)', 'Анализ посещаемости и поведения', '1 год', 'По согласию'],
                ['Маркетинговые', '—', 'В настоящее время не используются', '—', 'По согласию'],
              ].map((row, i) => (
                <tr key={i} className={row[4] === 'Обязательный' ? '' : 'bg-yellow-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-200 p-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            * Аналитические cookies Яндекс.Метрики загружаются <strong>только после получения явного согласия</strong> пользователя через cookie banner.
          </p>
        </Section>

        <Section title="3. Сторонние сервисы, получающие cookie-данные">
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Google Fonts</strong> — загрузка шрифтов. При запросе к серверам Google может передаваться IP-адрес и User-Agent. Персональные данные пользователя не передаются.
            </li>
            <li>
              <strong>Яндекс.Метрика</strong> (при наличии согласия) — аналитика посещаемости. Данные хранятся на серверах Яндекса в России.
            </li>
          </ul>
          <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
            Иностранные аналитические сервисы (Google Analytics, Facebook Pixel и др.) на платформе не используются.
          </p>
        </Section>

        <Section title="4. Категории cookies и управление согласием">
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">🔒 Необходимые cookies</div>
                  <div className="text-xs text-gray-600 mt-1">Обеспечивают авторизацию и базовые функции сайта. Без них сайт работать не будет.</div>
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded flex-shrink-0">Всегда активны</span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-800">📊 Аналитические cookies</div>
              <div className="text-xs text-gray-600 mt-1">Помогают понять, как пользователи взаимодействуют с сайтом. Активируются только после вашего согласия.</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-800">📢 Маркетинговые cookies</div>
              <div className="text-xs text-gray-600 mt-1">В настоящее время не используются. При введении будет запрошено отдельное согласие.</div>
            </div>
          </div>
        </Section>

        <Section title="5. Как изменить настройки cookies">
          <ul className="space-y-1 list-disc pl-5">
            <li>Нажмите кнопку <strong>«Настройки cookies»</strong> в нижней части сайта.</li>
            <li>Измените предпочтения в браузере: Настройки → Конфиденциальность → Cookies.</li>
            <li>Используйте режим приватного просмотра для сессий без сохранения cookies.</li>
          </ul>
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            Отключение необходимых cookies приведёт к невозможности авторизации на платформе.
          </p>
        </Section>

        <Section title="6. Хранение данных о согласии">
          <p>
            Ваш выбор настроек cookies сохраняется в localStorage браузера с указанием даты, времени и версии настоящей Политики. При изменении версии Политики согласие будет запрошено повторно.
          </p>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
          <p><strong>Контакт:</strong> [email для обращений по персональным данным]</p>
          <p><strong>Версия документа:</strong> {LEGAL_DOCUMENTS.cookiePolicy.version}</p>
          <p><strong>Дата обновления:</strong> {LEGAL_DOCUMENTS.cookiePolicy.updatedAt}</p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
