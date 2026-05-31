import { useState } from 'react';
import Card from '../ui/Card';

interface ActivityTypeCardProps {
  title: string;
  preview: React.ReactNode;
  onSelect: () => void;
}

export default function ActivityTypeCard({ title, preview, onSelect }: ActivityTypeCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Card
      variant="default"
      padding="none"
      rounded="2xl"
      className="overflow-hidden hover:shadow-lg"
    >
      {/* Card Content */}
      <button
        onClick={onSelect}
        className="w-full text-left relative"
      >
        {/* Favorite Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 z-10 text-2xl hover:scale-110 transition-transform"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>

        {/* Preview Content */}
        <div className="p-6 pb-4 min-h-[200px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {preview}
        </div>

        {/* Title */}
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-800 text-center">
            {title}
          </p>
        </div>
      </button>
    </Card>
  );
}
