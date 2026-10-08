interface LessonFlagProps {
  number: number;
  x: number; // процент от ширины
  y: number; // процент от высоты
  status: 'locked' | 'available' | 'completed';
  onClick: () => void;
}

const LessonFlag = ({ number, x, y, status, onClick }: LessonFlagProps) => {
  const isClickable = status === 'available' || status === 'completed';
  const flagColor = status === 'completed' ? '#22C55E' : '#FCD34D'; // Зеленый для завершенных
  const strokeColor = status === 'completed' ? '#16A34A' : '#F59E0B';
  const textColor = status === 'locked' ? '#9CA3AF' : '#78350F';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple rapid clicks
    if (!isClickable) {
      return;
    }

    // Disable the button temporarily to prevent multiple clicks
    const button = e.currentTarget;
    button.disabled = true;

    if (onClick) {
      onClick();
    }

    // Re-enable after a short delay
    setTimeout(() => {
      button.disabled = false;
    }, 500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable}
      className={`absolute transform -translate-x-1/2 -translate-y-full ${
        isClickable ? 'cursor-pointer group' : 'cursor-not-allowed opacity-50'
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      {/* Флаговый шест */}
      <div className="relative flex flex-col items-center">
        {/* Флаг */}
        <div className={`relative bg-yellow-400 rounded-sm shadow-lg transform ${
          isClickable ? 'group-hover:scale-110' : ''
        } transition-transform`}>
          <svg width="60" height="50" viewBox="0 0 60 50" className="drop-shadow-md">
            {/* Треугольный флаг */}
            <path
              d="M 5 5 L 55 25 L 5 45 Z"
              fill={flagColor}
              stroke={strokeColor}
              strokeWidth="2"
            />
          </svg>
          {/* Номер на флаге */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ml-[-8px]`} style={{ color: textColor }}>
              {number}
            </span>
          </div>
          {/* Галочка для завершенных */}
          {status === 'completed' && (
            <div className="absolute -top-2 -right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              <span className="text-green-600 text-lg">✓</span>
            </div>
          )}
        </div>
        {/* Шест */}
        <div className="w-1 h-6 bg-amber-800 rounded-full"></div>
      </div>

      {/* Анимация при наведении */}
      {isClickable && (
        <div className={`absolute inset-0 rounded-full group-hover:animate-ping opacity-0 group-hover:opacity-20 ${
          status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'
        }`}></div>
      )}
    </button>
  );
};

export default LessonFlag;
