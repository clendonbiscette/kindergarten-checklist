import React from 'react';

const RATING_CONFIG = {
  EASILY_MEETING: {
    symbol: '+',
    label: 'Easily Meeting',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    lightBg: 'bg-green-100',
    lightText: 'text-green-700',
  },
  MEETING: {
    symbol: '=',
    label: 'Meeting',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    lightBg: 'bg-blue-100',
    lightText: 'text-blue-700',
  },
  NEEDS_PRACTICE: {
    symbol: 'x',
    label: 'Needs Practice',
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    lightBg: 'bg-amber-100',
    lightText: 'text-amber-700',
  },
};

const RatingBadge = ({ rating, size = 'md', variant = 'solid', showLabel = false }) => {
  const config = RATING_CONFIG[rating];

  if (!config) {
    return (
      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
        -
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const variantClasses = {
    solid: `${config.bgColor} ${config.textColor}`,
    light: `${config.lightBg} ${config.lightText}`,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-bold ${sizeClasses[size]} ${variantClasses[variant]}`}
      title={config.label}
    >
      {config.symbol}
      {showLabel && <span className="font-medium">{config.label}</span>}
    </span>
  );
};

export const RatingLegend = ({ compact = false }) => {
  return (
    <div className={`flex ${compact ? 'gap-3' : 'gap-4'} text-xs`}>
      {Object.entries(RATING_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded font-bold ${config.bgColor} ${config.textColor}`}>
            {config.symbol}
          </span>
          <span className="text-gray-600">{config.label}</span>
        </div>
      ))}
    </div>
  );
};

export default RatingBadge;
