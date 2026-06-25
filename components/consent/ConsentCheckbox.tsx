'use client';
import { useState } from 'react';
import { LEGAL_DOCUMENTS } from '../../legal/legalDocuments';

interface Props {
  consentType?: string;
  documentVersion?: string;
  required?: boolean;
  sourceForm: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  showError?: boolean;
}

export default function ConsentCheckbox({
  consentType = 'personal_data',
  documentVersion = LEGAL_DOCUMENTS.personalDataConsent.version,
  required = true,
  sourceForm,
  checked,
  onChange,
  showError = false,
}: Props) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          required={required}
          className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0 cursor-pointer"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          Я даю согласие на обработку персональных данных в соответствии с{' '}
          <a
            href={LEGAL_DOCUMENTS.personalDataConsent.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline font-medium"
            onClick={e => e.stopPropagation()}
          >
            Согласием на обработку персональных данных
          </a>{' '}
          и{' '}
          <a
            href={LEGAL_DOCUMENTS.privacyPolicy.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline font-medium"
            onClick={e => e.stopPropagation()}
          >
            Политикой обработки персональных данных
          </a>
          .
        </span>
      </label>
      {showError && !checked && (
        <p className="text-red-500 text-xs ml-7">
          Для отправки формы нужно дать согласие на обработку персональных данных.
        </p>
      )}
    </div>
  );
}
