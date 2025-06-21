
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g., 'text-purple-400'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-indigo-400' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} ${color} border-t-transparent border-solid`} />
  );
};

export default LoadingSpinner;
