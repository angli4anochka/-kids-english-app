import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  hover?: boolean;
}

const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  onClick,
  hover = false,
}: CardProps) => {
  const baseStyles = 'transition-all duration-200';

  const variantStyles = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg shadow-gray-200/50',
    flat: 'bg-white',
    bordered: 'bg-white border-2 border-gray-200',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const roundedStyles = {
    none: '',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const hoverStyles = hover
    ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
    : onClick
    ? 'cursor-pointer'
    : '';

  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${roundedStyles[rounded]}
    ${hoverStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={combinedStyles}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};

export default Card;
