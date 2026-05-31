import type { ReactNode } from 'react';

interface TVFrameProps {
  children: ReactNode;
}

const TVFrame = ({ children }: TVFrameProps) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-2">
      {/* TV Frame */}
      <div className="relative w-full h-full">
        {/* Outer TV case */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl shadow-2xl border-4 border-red-950">
          {/* Inner bezel */}
          <div className="absolute inset-2 bg-gradient-to-br from-red-900 to-black rounded-xl shadow-inner">
            {/* Screen area */}
            <div className="absolute inset-3 bg-black rounded-lg overflow-hidden shadow-2xl">
              {/* Content */}
              <div className="w-full h-full">
                {children}
              </div>
            </div>
          </div>

          {/* Power indicator LED */}
          <div className="absolute bottom-2 right-4 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default TVFrame;
