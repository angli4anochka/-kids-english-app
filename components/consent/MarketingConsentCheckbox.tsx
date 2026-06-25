'use client';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function MarketingConsentCheckbox({ checked, onChange }: Props) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0 cursor-pointer"
      />
      <span className="text-sm text-gray-600 leading-relaxed">
        Я согласен(на) получать информационные и рекламные сообщения об обновлениях платформы,
        новых курсах и специальных предложениях. Вы можете отписаться в любое время.
      </span>
    </label>
  );
}
