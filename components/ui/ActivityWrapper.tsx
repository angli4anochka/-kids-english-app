import type { ReactNode } from 'react';
import Card from './Card';

export interface ActivityWrapperProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  icon?: string;
  progress?: number; // 0-100
  onRetry?: () => void;
  className?: string;
  headerActions?: ReactNode;
}

const ActivityWrapper = ({
  children,
  isLoading = false,
  error = null,
  title,
  subtitle,
  icon,
  progress,
  onRetry,
  className = '',
  headerActions,
}: ActivityWrapperProps) => {
  // Loading state
  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" rounded="2xl" className={className}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Загрузка...</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="elevated" padding="lg" rounded="2xl" className={className}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Ошибка</h3>
          <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              🔄 Попробовать снова
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Success state with optional header
  return (
    <Card variant="elevated" padding="none" rounded="2xl" className={className}>
      {/* Header with title/subtitle/icon */}
      {(title || subtitle || icon || progress !== undefined || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {icon && <span className="text-3xl">{icon}</span>}
              <div className="flex-1">
                {title && (
                  <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
                )}
                {progress !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Прогресс</span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="ml-4 flex-shrink-0">{headerActions}</div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </Card>
  );
};

export default ActivityWrapper;
