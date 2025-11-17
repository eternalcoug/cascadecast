import React from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  CloudDrizzle,
  Wind,
  Thermometer
} from 'lucide-react';

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

interface ForecastCardProps {
  period: Period;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ period }) => {
  const getWeatherIcon = (forecast: string, isDaytime: boolean) => {
    const forecastLower = forecast.toLowerCase();
    
    if (forecastLower.includes('thunder') || forecastLower.includes('storm')) {
      return <CloudLightning className="forecast-icon text-yellow-300" />;
    }
    if (forecastLower.includes('rain') || forecastLower.includes('shower')) {
      return <CloudRain className="forecast-icon text-blue-200" />;
    }
    if (forecastLower.includes('drizzle')) {
      return <CloudDrizzle className="forecast-icon text-blue-300" />;
    }
    if (forecastLower.includes('snow') || forecastLower.includes('blizzard')) {
      return <CloudSnow className="forecast-icon text-white" />;
    }
    if (forecastLower.includes('cloud') || forecastLower.includes('overcast')) {
      return <Cloud className="forecast-icon text-gray-200" />;
    }
    if (forecastLower.includes('clear') || forecastLower.includes('sunny')) {
      return <Sun className="forecast-icon text-yellow-200" />;
    }
    
    // Default based on time of day
    return isDaytime ? 
      <Sun className="forecast-icon text-yellow-200" /> : 
      <Cloud className="forecast-icon text-gray-200" />;
  };

  const getCardBackground = (forecast: string, isDaytime: boolean) => {
    const forecastLower = forecast.toLowerCase();
    
    if (forecastLower.includes('thunder') || forecastLower.includes('storm')) {
      return 'bg-gradient-to-br from-purple-800 to-gray-900';
    }
    if (forecastLower.includes('rain') || forecastLower.includes('shower') || forecastLower.includes('drizzle')) {
      return 'bg-gradient-to-br from-blue-600 to-blue-800';
    }
    if (forecastLower.includes('snow') || forecastLower.includes('blizzard')) {
      return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
    if (forecastLower.includes('cloud') || forecastLower.includes('overcast')) {
      return 'bg-gradient-to-br from-gray-500 to-gray-700';
    }
    
    // Clear/sunny weather
    return isDaytime ? 
      'bg-gradient-to-br from-yellow-400 to-orange-500' : 
      'bg-gradient-to-br from-indigo-600 to-purple-800';
  };

  // Extract day name from period name (e.g., "Monday" from "Monday Night")
  const getDayName = (name: string) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const foundDay = dayNames.find(day => name.includes(day));
    return foundDay || name.split(' ')[0];
  };

  return (
    <div className={`${getCardBackground(period.shortForecast, period.isDaytime)} text-white shadow-xl hover:shadow-2xl 
                     transition-all duration-300 hover:scale-105 desktop-hover-lift touch-manipulation 
                     rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]
                     border border-white/20 backdrop-blur-sm relative overflow-hidden group`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 text-center space-y-2 sm:space-y-3 h-full flex flex-col justify-center">
        {/* Day Name - Always visible */}
        <h4 className="font-bold text-sm sm:text-base lg:text-lg leading-tight drop-shadow-sm">
          <span className="hidden sm:inline">{period.name}</span>
          <span className="sm:hidden">{getDayName(period.name)}</span>
        </h4>
        
        {/* Weather Icon - Always visible */}
        <div className="flex justify-center items-center transform group-hover:scale-110 transition-transform duration-300">
          {getWeatherIcon(period.shortForecast, period.isDaytime)}
        </div>
        
        {/* Temperature - Always visible */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 drop-shadow-sm" />
          <span className="font-bold text-base sm:text-lg lg:text-xl drop-shadow-sm">
            {period.temperature}°{period.temperatureUnit}
          </span>
        </div>
        
        {/* Wind Info - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:flex items-center justify-center gap-1 opacity-90">
          <Wind className="h-3 w-3 drop-shadow-sm" />
          <span className="text-xs font-medium">{period.windSpeed}</span>
        </div>
        
        {/* Forecast Description - Only on large screens */}
        <p className="hidden xl:block text-xs font-medium leading-tight truncate opacity-80 drop-shadow-sm">
          {period.shortForecast}
        </p>
      </div>
    </div>
  );
};