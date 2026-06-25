import { LEGAL_DOCUMENTS } from '../../legal/legalDocuments';

export const metadata = { title: 'Согласие на обработку персональных данных — UniPlay Kids' };

export default function PersonalDataConsentPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Согласие на обработку персональных данных
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Версия {LEGAL_DOCUMENTS.personalDataConsent.version} · Дата обновления: {LEGAL_DOCUMENTS.personalDataConsent.updatedAt}
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-sm text-blue-900 leading-relaxed">
          Настоящее согласие является отдельным документом и не объединяется с пользовательским соглашением, офертой или согласием на маркетинговую рассылку.
        </div>

        <section className="mb-7 text-sm text-gray-700 space-y-3 leading-relaxed">
          <p>
            Регистрируясь на платформе <strong>UniPlay Kids</strong> (uniplay-kids.ru), я, субъект персональных данных,
            свободно, своей волей и в своём интересе даю согласие оператору — <strong>Малахова Альбина Сергеевна</strong>{' '}
            (ИНН/ОГРНИП: 312824955688, г. Москва) — на обработку моих персональных данных
            на следующих условиях.
          </p>
        </section>

        <Section title="1. Перечень персональных данных">
          <p>Я даю согласие на обработку следующих персональных данных:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>Имя (отображаемое имя или никнейм);</li>
            <li>Адрес электронной почты;</li>
            <li>Логин (имя пользователя);</li>
            <li>Данные аккаунта Google (имя, email) при использовании входа через Google;</li>
            <li>Прогресс прохождения учебных материалов;</li>
            <li>Результаты выполнения заданий;</li>
            <li>Техническая информация: IP-адрес, User-Agent, дата и время обращений к сервису.</li>
          </ul>
        </Section>

        <Section title="2. Цели обработки персональных данных">
          <ul className="space-y-1 list-disc pl-5">
            <li>Создание и ведение учётной записи на платформе;</li>
            <li>Идентификация пользователя при входе в систему;</li>
            <li>Предоставление доступа к образовательным материалам;</li>
            <li>Отслеживание образовательного прогресса;</li>
            <li>Направление уведомлений о работе платформы;</li>
            <li>Обеспечение безопасности платформы;</li>
            <li>Оформление подписки и проведение платежей.</li>
          </ul>
        </Section>

        <Section title="3. Действия с персональными данными">
          <p>Оператор вправе совершать следующие действия с персональными данными:</p>
          <p className="mt-2 font-medium">
            сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), использование,
            передача (предоставление, доступ) платёжному провайдеру и провайдеру хостинга,
            блокирование, удаление, уничтожение.
          </p>
        </Section>

        <Section title="4. Срок действия согласия">
          <p>
            Согласие действует с момента его выражения (регистрации на платформе) и до момента его отзыва субъектом персональных данных либо до истечения 3 (трёх) лет с даты последнего использования платформы, в зависимости от того, что наступит раньше.
          </p>
        </Section>

        <Section title="5. Передача данных третьим лицам">
          <p>
            Персональные данные могут быть переданы:
          </p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li><strong>Провайдеру хостинга</strong> — Яндекс.Облако (Россия) — для хранения данных;</li>
            <li><strong>Платёжному провайдеру</strong> — будет указан при подключении оплаты — имя и email для проведения платежей;</li>
            <li><strong>Google LLC (США)</strong> — при использовании входа через Google в рамках OAuth 2.0 (имя, email). Использование этого способа входа — добровольное.</li>
            <li>Государственным органам — по основаниям, предусмотренным законодательством РФ.</li>
          </ul>
          <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            Трансграничная передача данных осуществляется только при входе через Google (Google LLC, США, OAuth 2.0). Альтернативный способ входа — email и пароль — не предполагает передачи данных за рубеж.
          </p>
        </Section>

        <Section title="6. Порядок отзыва согласия">
          <p>
            Я имею право отозвать настоящее согласие в любое время, направив письменное заявление на электронный адрес оператора:{' '}
            <strong>angli4anochka@gmail.com</strong>, или воспользовавшись разделом{' '}
            <strong>«Настройки приватности»</strong> в личном кабинете.
          </p>
          <p className="mt-1">
            Отзыв согласия не влияет на законность обработки данных, осуществлённой до момента отзыва. После отзыва данные будут уничтожены или обезличены в течение 30 дней, за исключением данных, обработка которых требуется в силу закона.
          </p>
        </Section>

        <Section title="7. Права субъекта персональных данных">
          <ul className="space-y-1 list-disc pl-5">
            <li>Получать информацию об обработке своих данных (ст. 14 ФЗ-152);</li>
            <li>Требовать уточнения, блокирования или уничтожения данных (ст. 21 ФЗ-152);</li>
            <li>Обжаловать действия оператора в Роскомнадзоре или суде.</li>
          </ul>
        </Section>

        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
          <p><strong>Оператор:</strong> Малахова Альбина Сергеевна</p>
          <p><strong>Контакт:</strong> angli4anochka@gmail.com</p>
          <p><strong>Версия согласия:</strong> {LEGAL_DOCUMENTS.personalDataConsent.version}</p>
          <p><strong>Дата обновления:</strong> {LEGAL_DOCUMENTS.personalDataConsent.updatedAt}</p>
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
