import React from 'react';
import { Cloud, Thermometer } from 'lucide-react';
import { WeatherData } from '../App';
import { ForecastCard } from './ForecastCard';
import { WeatherDetails } from './WeatherDetails';

interface WeatherForecastProps {
  data: WeatherData;
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ data }) => {
  // Take first 7 periods for 7-day forecast
  const sevenDayForecast = data.forecast.periods.slice(0, 7);
  
  // Get hourly data for current weather summary
  const hourlyData = data.hourlyForecast?.periods || [];

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Location Header */}
      <div className="text-center text-white animate-fade-in-up">
        <div className="glass-card inline-block px-6 py-4 sm:px-8 sm:py-6">
          <h2 className="heading-secondary text-white text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3">
            7-Day Weather Forecast
          </h2>
          <div className="flex items-center justify-center gap-2 text-white/90">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <p className="text-base sm:text-lg lg:text-xl font-medium">{data.location}</p>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Current Weather Summary - Moved above Extended Forecast */}
      {hourlyData.length > 0 && (
        <div className="weather-card-glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 
                     shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] 
                     border border-white/30 hover:border-white/50 relative overflow-hidden animate-fade-in-up">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-yellow-500/20 opacity-30"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg">
                <Thermometer className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white 
                             drop-shadow-sm">
                  Current Weather Summary
                </h3>
                <p className="text-white/80 text-sm sm:text-base truncate font-medium">{data.location}</p>
              </div>
            </div>
          
            <div className="text-left space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <div className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Temp Range</div>
                  <div className="font-bold text-white text-sm sm:text-base drop-shadow-sm">
                    {Math.min(...hourlyData.map(d => d.temperature))}° - {Math.max(...hourlyData.map(d => d.temperature))}°{hourlyData[0]?.temperatureUnit || 'F'}
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <div className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Wind</div>
                  <div className="font-bold text-white text-sm sm:text-base drop-shadow-sm">
                    {hourlyData[0]?.windSpeed || 'Variable'} {hourlyData[0]?.windDirection || ''}
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <div className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Precip</div>
                  <div className="font-bold text-white text-sm sm:text-base drop-shadow-sm">
                    {hourlyData[0]?.probabilityOfPrecipitation?.value || 0}%
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <div className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Humidity</div>
                  <div className="font-bold text-white text-sm sm:text-base drop-shadow-sm">
                    {hourlyData[0]?.relativeHumidity?.value || 'N/A'}
                    {hourlyData[0]?.relativeHumidity?.value ? '%' : ''}
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30">
                  <div className="text-xs sm:text-sm text-white/80 mb-1 font-medium">Air Quality</div>
                  <div className="font-bold text-white text-sm sm:text-base drop-shadow-sm">
                    Good
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Forecast Cards */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl animate-slide-in-right">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="heading-secondary text-2xl sm:text-3xl">7-Day Weather Forecast</h3>
            <p className="text-gray-600 text-sm sm:text-base font-medium">{data.location}</p>
          </div>
        </div>
        
        {/* Single Row - All 7 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
          {sevenDayForecast.map((period) => (
            <ForecastCard key={period.number} period={period} />
          ))}
        </div>
      </div>

      {/* Detailed Weather Information */}
      <div className="animate-fade-in-up delay-200">
        <WeatherDetails periods={sevenDayForecast} />
      </div>
    </div>
  );
};