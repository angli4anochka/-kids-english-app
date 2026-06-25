export const LEGAL_DOCUMENTS = {
  privacyPolicy: {
    version: '1.0.0',
    url: '/privacy-policy',
    updatedAt: '2026-06-25',
  },
  personalDataConsent: {
    version: '1.0.0',
    url: '/personal-data-consent',
    updatedAt: '2026-06-25',
  },
  cookiePolicy: {
    version: '1.0.0',
    url: '/cookie-policy',
    updatedAt: '2026-06-25',
  },
  terms: {
    version: '1.0.0',
    url: '/terms',
    updatedAt: '2026-06-25',
  },
} as const;

export type ConsentType =
  | 'personal_data'
  | 'cookies_necessary'
  | 'cookies_analytics'
  | 'cookies_marketing'
  | 'marketing_emails'
  | 'public_profile';
