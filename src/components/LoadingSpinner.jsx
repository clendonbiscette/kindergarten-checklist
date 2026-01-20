import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', message = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

// Skeleton components for loading states
export const SkeletonLine = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="bg-white rounded-lg shadow p-4 space-y-3">
    <SkeletonLine className="h-4 w-3/4" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <SkeletonLine key={i} className="h-3 w-full" />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-gray-100 p-4 border-b">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b last:border-b-0">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <SkeletonLine key={colIndex} className="h-3 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSpinner;
