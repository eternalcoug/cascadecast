import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  suggestions?: string[];
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, suggestions }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="weather-card-glass border border-red-400/30 relative overflow-hidden">
      {/* Animated error background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 animate-pulse"></div>
      
      <div className="relative z-10">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2 bg-red-500/20 rounded-xl">
          <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-400 flex-shrink-0" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-red-200 text-lg sm:text-xl lg:text-2xl mb-3 drop-shadow-sm">
            Weather Data Unavailable
          </h3>
          <p className="text-red-100 mb-4 sm:mb-6 text-base sm:text-lg font-medium">{message}</p>
          
          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/90">
              <p className="font-bold text-white">💡 Suggestions:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-4 sm:ml-6">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/90">
              <p className="font-bold text-white">🔧 Please try:</p>
              <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-4 sm:ml-6">
                <li>Checking your zip code (5 digits, e.g., 90210)</li>
                <li>Using city, state format (e.g., "Los Angeles, CA")</li>
                <li>Ensuring you're searching within the United States</li>
                <li>Trying again in a few moments</li>
              </ul>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            className="mt-4 sm:mt-6 flex items-center gap-3 bg-gradient-to-r from-red-500 to-red-600 
                       hover:from-red-600 hover:to-red-700 text-white px-4 sm:px-6 py-3 rounded-xl 
                       transition-all duration-300 text-base sm:text-lg font-semibold touch-manipulation
                       shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};