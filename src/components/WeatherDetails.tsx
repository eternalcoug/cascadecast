import React from 'react';
import { Calendar, Thermometer, Wind, Eye, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Period {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

interface WeatherDetailsProps {
  periods: Period[];
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ periods }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left mb-3 sm:mb-4 lg:mb-6 hover:text-gray-600 transition-colors duration-200 touch-manipulation"
      >
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Detailed Weather Information
        </h3>
        <div className="flex items-center gap-1 text-gray-500">
          <span className="text-xs sm:text-sm font-medium">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-in slide-in-from-top-2 duration-300">
          {periods.map((period) => (
            <div key={period.number} className="border-b border-gray-200 last:border-b-0 pb-3 sm:pb-4 lg:pb-6 last:pb-0">
              <div className="flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4">
                {/* Period Header */}
                <div className="lg:w-48 flex-shrink-0">
                  <h4 className="font-bold text-sm sm:text-base lg:text-lg text-gray-800 mb-1 sm:mb-2">{period.name}</h4>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{formatDate(period.startTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Weather Stats */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                  <div className="bg-blue-50 rounded-lg p-2 sm:p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <span className="font-semibold text-gray-700 text-xs sm:text-sm lg:text-base">Temperature</span>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">
                      {period.temperature}°{period.temperatureUnit}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-2 sm:p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      <span className="font-semibold text-gray-700 text-xs sm:text-sm lg:text-base">Wind</span>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-green-700">
                      {period.windSpeed}
                    </p>
                    <p className="text-xs text-green-600">{period.windDirection}</p>
                  </div>
                </div>
              </div>
              
              {/* Detailed Forecast */}
              <div className="mt-2 sm:mt-3 lg:mt-4 bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4">
                <h5 className="font-semibold text-gray-700 mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base">Detailed Forecast</h5>
                <p className="text-gray-600 leading-relaxed text-xs sm:text-sm lg:text-base">{period.detailedForecast}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};