import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20">
      <div className="weather-card-glass p-8 sm:p-10 lg:p-12 text-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="relative mb-6 sm:mb-8">
            <Loader2 className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white animate-spin mx-auto" />
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          <h3 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 drop-shadow-sm">
            Fetching Weather Data
          </h3>
          
          <p className="text-white/90 text-base sm:text-lg font-medium mb-2">
            Getting the latest forecast from NOAA
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <span>Real-time data processing</span>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};