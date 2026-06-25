import { LEGAL_DOCUMENTS } from '../../legal/legalDocuments';

export const metadata = { title: 'Политика обработки персональных данных — UniPlay Kids' };

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Политика обработки персональных данных
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Версия {LEGAL_DOCUMENTS.privacyPolicy.version} · Дата обновления: {LEGAL_DOCUMENTS.privacyPolicy.updatedAt}
        </p>

        <Section title="1. Оператор персональных данных">
          <p>Оператором персональных данных является:</p>
          <ul className="mt-2 space-y-1">
            <li><strong>Наименование:</strong> Малахова Альбина Сергеевна</li>
            <li><strong>ИНН / ОГРНИП / ОГРН:</strong> 312824955688</li>
            <li><strong>Адрес:</strong> г. Москва</li>
            <li><strong>Email для обращений по персональным данным:</strong> angli4anochka@gmail.com</li>
          </ul>
          <p className="mt-2">
            Сайт: <strong>uniplay-kids.ru</strong>
          </p>
        </Section>

        <Section title="2. Категории пользователей и обрабатываемые данные">
          <SubSection title="2.1 Посетители сайта">
            <p>IP-адрес, данные браузера (User-Agent), дата и время посещения, cookie-файлы сессии.</p>
          </SubSection>
          <SubSection title="2.2 Учителя (преподаватели)">
            <p>Имя (отображаемое), адрес электронной почты, хэш пароля, цвет аватара, дата регистрации, информация о подписке (тариф, дата истечения). При входе через Google: имя и email из аккаунта Google.</p>
          </SubSection>
          <SubSection title="2.3 Ученики">
            <p>Имя или никнейм, логин (имя пользователя), хэш пароля, принадлежность к группе, прогресс прохождения курсов, результаты заданий, набранные баллы, дата создания аккаунта.</p>
            <p className="mt-1 text-sm text-amber-700 bg-amber-50 p-2 rounded">
              Платформа придерживается принципа минимизации данных: для учеников не собираются полное ФИО, адрес, телефон, точная дата рождения, фото, медицинские данные.
            </p>
          </SubSection>
          <SubSection title="2.4 Покупатели подписки">
            <p>Информация о тарифе, дата активации, срок действия подписки. Платёжные данные (номер карты и пр.) не хранятся на платформе — обрабатываются исключительно платёжным провайдером.</p>
          </SubSection>
        </Section>

        <Section title="3. Цели обработки персональных данных">
          <ul className="space-y-1 list-disc pl-5">
            <li>Идентификация и аутентификация пользователей на платформе.</li>
            <li>Предоставление доступа к образовательным курсам и материалам.</li>
            <li>Отслеживание образовательного прогресса учеников.</li>
            <li>Управление группами, курсами и уроками преподавателями.</li>
            <li>Оформление и управление подпиской на сервис.</li>
            <li>Направление уведомлений, связанных с работой платформы.</li>
            <li>Направление рекламных и информационных сообщений (только при наличии отдельного согласия).</li>
            <li>Обеспечение безопасности платформы, предотвращение мошенничества.</li>
            <li>Улучшение качества сервиса (при наличии согласия на аналитику).</li>
          </ul>
        </Section>

        <Section title="4. Правовые основания обработки">
          <ul className="space-y-1 list-disc pl-5">
            <li><strong>Согласие субъекта</strong> (ст. 9 Федерального закона № 152-ФЗ) — регистрация, рекламные рассылки, аналитические cookies.</li>
            <li><strong>Исполнение договора</strong> (п. 5 ч. 1 ст. 6 ФЗ-152) — предоставление доступа к платформе по оферте.</li>
            <li><strong>Законный интерес оператора</strong> — обеспечение безопасности, ведение технических логов.</li>
          </ul>
        </Section>

        <Section title="5. Сроки хранения данных">
          <table className="w-full text-sm border-collapse border border-gray-200 mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 p-2 text-left">Категория данных</th>
                <th className="border border-gray-200 p-2 text-left">Срок хранения</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Аккаунт учителя', 'До удаления аккаунта + 3 года'],
                ['Аккаунт ученика', 'До удаления группы преподавателем + 3 года'],
                ['Прогресс и результаты', 'Совместно с аккаунтом ученика'],
                ['Данные об оплате (ID транзакции)', '5 лет (требования бухучёта)'],
                ['Журналы безопасности', '1 год'],
                ['Согласия пользователей', '3 года с момента отзыва'],
                ['Технические логи', '90 дней'],
              ].map(([cat, term]) => (
                <tr key={cat}>
                  <td className="border border-gray-200 p-2">{cat}</td>
                  <td className="border border-gray-200 p-2">{term}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="6. Передача данных третьим лицам">
          <p>Оператор не продаёт и не передаёт персональные данные третьим лицам, за исключением следующих случаев:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li><strong>Платёжный провайдер</strong> — будет указан при подключении системы оплаты — имя и email покупателя для обработки платежей.</li>
            <li><strong>Провайдер хостинга</strong> — Яндекс.Облако (Россия) — для хранения данных и работы сервера.</li>
            <li><strong>Google LLC (США)</strong> — при использовании входа через Google передаются имя и email в рамках протокола OAuth 2.0. Пользователь может не использовать этот способ входа и зарегистрироваться через email/пароль.</li>
            <li>По требованию уполномоченных государственных органов в установленных законом случаях.</li>
          </ul>
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            <strong>Трансграничная передача данных:</strong> При использовании входа через Google данные (имя, email) передаются на серверы Google LLC (США) в рамках протокола OAuth 2.0. Email-рассылки в настоящее время не осуществляются. Шрифты загружаются с серверов платформы (самохостинг) — данные в Google при этом не передаются.
          </p>
        </Section>

        <Section title="7. Место хранения данных">
          <p>
            В соответствии с требованиями Федерального закона № 152-ФЗ (ст. 18.1) все персональные данные граждан Российской Федерации хранятся в базах данных, расположенных на территории Российской Федерации.
          </p>
          <p className="mt-1">
            <strong>Сервер:</strong> Яндекс.Облако, регион ru-central1 (Россия).
          </p>
        </Section>

        <Section title="8. Права пользователей">
          <p>В соответствии с законодательством РФ вы имеете право:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>получить информацию об обработке ваших персональных данных;</li>
            <li>потребовать уточнения, блокирования или уничтожения данных;</li>
            <li>отозвать согласие на обработку данных;</li>
            <li>потребовать прекращения обработки данных;</li>
            <li>получить копию данных в машиночитаемом формате;</li>
            <li>обратиться с жалобой в Роскомнадзор.</li>
          </ul>
          <p className="mt-2">
            Для реализации прав направьте запрос на: <strong>angli4anochka@gmail.com</strong>
          </p>
        </Section>

        <Section title="9. Отзыв согласия и удаление данных">
          <p>
            Вы можете отозвать согласие или запросить удаление данных через раздел{' '}
            <strong>«Настройки приватности»</strong> в личном кабинете или направив письмо на{' '}
            <strong>angli4anochka@gmail.com</strong>.
          </p>
          <p className="mt-1">
            Отзыв согласия не влияет на законность обработки, осуществлённой до отзыва. После отзыва согласия данные будут обезличены или уничтожены в течение 30 дней, за исключением данных, обработка которых требуется по закону.
          </p>
        </Section>

        <Section title="10. Меры защиты персональных данных">
          <ul className="space-y-1 list-disc pl-5">
            <li>Соединение защищено по протоколу HTTPS (TLS).</li>
            <li>Пароли хранятся исключительно в виде криптографического хэша (bcrypt).</li>
            <li>Разграничение прав доступа: ученик видит только свои данные, учитель — только свои группы.</li>
            <li>Регулярное резервное копирование базы данных.</li>
            <li>Ведение журнала действий с персональными данными.</li>
            <li>Персональные данные не записываются в открытые логи и не передаются в сторонние AI-сервисы.</li>
          </ul>
        </Section>

        <Section title="11. Cookies">
          <p>
            Подробная информация об используемых cookies содержится в{' '}
            <a href="/cookie-policy" className="text-blue-600 hover:underline">Политике использования cookies</a>.
          </p>
        </Section>

        <Section title="12. Изменения политики">
          <p>
            Оператор вправе вносить изменения в настоящую Политику. При существенных изменениях пользователи будут уведомлены через интерфейс платформы. Актуальная версия всегда доступна по адресу{' '}
            <strong>uniplay-kids.ru/privacy-policy</strong>.
          </p>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
          <p><strong>Контакты оператора:</strong> angli4anochka@gmail.com</p>
          <p><strong>Версия документа:</strong> {LEGAL_DOCUMENTS.privacyPolicy.version}</p>
          <p><strong>Дата вступления в силу:</strong> 2026-06-25</p>
          <p><strong>Дата последнего обновления:</strong> {LEGAL_DOCUMENTS.privacyPolicy.updatedAt}</p>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}
