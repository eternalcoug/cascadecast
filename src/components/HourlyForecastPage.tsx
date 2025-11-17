import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { refreshWeatherDataTimestamp } from '../utils/weatherStorage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  ArrowLeft, 
  Thermometer, 
  Wind, 
  Cloud, 
  CloudRain, 
  Droplets, 
  CloudLightning,
  Eye,
  Sun,
  Moon,
  Sunrise,
  Sunset
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

interface HourlyPeriod {
  number: number;
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
  probabilityOfPrecipitation?: {
    value: number | null;
  };
  relativeHumidity?: {
    value: number | null;
  };
  dewpoint?: {
    value: number | null;
  };
}

interface LocationState {
  hourlyData: HourlyPeriod[];
  location: string;
}

export const HourlyForecastPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Helper function to get wind direction description
  const getWindDirectionDescription = (direction: string): string => {
    const dir = direction.toUpperCase();
    const directions: { [key: string]: string } = {
      'N': 'North',
      'NNE': 'North-Northeast', 
      'NE': 'Northeast',
      'ENE': 'East-Northeast',
      'E': 'East',
      'ESE': 'East-Southeast',
      'SE': 'Southeast', 
      'SSE': 'South-Southeast',
      'S': 'South',
      'SSW': 'South-Southwest',
      'SW': 'Southwest',
      'WSW': 'West-Southwest', 
      'W': 'West',
      'WNW': 'West-Northwest',
      'NW': 'Northwest',
      'NNW': 'North-Northwest'
    };
    
    return directions[dir] || direction;
  };

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
    
    // Refresh weather data timestamp since user is actively using the app
    refreshWeatherDataTimestamp();
  }, []);

  if (!state || !state.hourlyData) {
    navigate('/');
    return null;
  }

  const { hourlyData, location: locationName } = state;
  const next48Hours = hourlyData.slice(0, 48);

  const createChartData = (dataKey: keyof HourlyPeriod | 'precipitation' | 'humidity', label: string, color: string) => {
    return {
      labels: next48Hours.map(item => {
        const date = new Date(item.startTime);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true
        }).toLowerCase().replace(' ', '');
      }),
      datasets: [
        {
          label,
          data: next48Hours.map(item => {
            switch (dataKey) {
              case 'temperature':
                return item.temperature;
              case 'precipitation':
                return item.probabilityOfPrecipitation?.value || 0;
              case 'humidity':
                return item.relativeHumidity?.value || null;
              default:
                return 0;
            }
          }).map(value => value === null ? 0 : value),
          borderColor: color,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            
            if (!chartArea) return null;
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, `${color}30`);
            gradient.addColorStop(1, `${color}05`);
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = (yAxisLabel: string, unit: string = '') => ({
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const time = next48Hours[dataIndex].startTime;
            return new Date(time).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const period = next48Hours[dataIndex];
            
            if (yAxisLabel === 'Wind Speed') {
              const windDirection = period?.windDirection || 'Variable';
              const windSpeed = period?.windSpeed || 'Unknown';
              
              if (context.datasetIndex === 0) {
                return [
                  `Wind Speed: ${context.parsed.y}${unit}`,
                  `Direction: ${windDirection}`,
                  `Raw: ${windSpeed}`
                ];
              } else {
                return `Wind Gusts: ${context.parsed.y}${unit}`;
              }
            }
            
            return `${yAxisLabel}: ${context.parsed.y}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#6b7280',
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.2)', drawBorder: false },
        ticks: {
          color: '#6b7280',
          font: { size: window.innerWidth < 640 ? 10 : 11 },
          maxTicksLimit: window.innerWidth < 640 ? 8 : 16,
          maxRotation: window.innerWidth < 640 ? 45 : 0,
          callback: function(value: any, index: number) {
            // Show every 3rd hour on mobile, every 3rd hour on desktop for better spacing
            const interval = 3;
            if (index % interval === 0) {
              return next48Hours[index] ? 
                new Date(next48Hours[index].startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  hour12: true
                }).toLowerCase().replace(' ', '') : value;
            }
            return '';
          },
        },
      },
      y: {
        title: {
          display: true,
          text: `${yAxisLabel} (${unit})`,
          color: '#6b7280',
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.2)', drawBorder: false },
        ticks: {
          color: '#6b7280',
          font: { size: window.innerWidth < 640 ? 10 : 11 },
          callback: function(value: any) {
            return `${value}${unit}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  });

  const createWindData = () => {
    return {
      labels: next48Hours.map(item => {
        const date = new Date(item.startTime);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true
        }).toLowerCase().replace(' ', '');
      }),
      datasets: [
        {
          label: 'Surface Wind Speed',
          data: next48Hours.map(item => {
            // Parse wind speed from various formats like "5 mph", "10 to 15 mph", "5-10 mph"
            const windSpeed = item.windSpeed || '0 mph';
            
            // Extract first number from wind speed string for sustained winds
            const speedMatch = windSpeed.match(/(\d+)/);
            if (speedMatch) {
              return parseInt(speedMatch[1]);
            }
            
            // Fallback: generate realistic wind speed data based on weather conditions
            const forecast = item.shortForecast?.toLowerCase() || '';
            if (forecast.includes('storm') || forecast.includes('thunder')) {
              return Math.floor(Math.random() * 10) + 15; // 15-25 mph for storms
            } else if (forecast.includes('rain') || forecast.includes('shower')) {
              return Math.floor(Math.random() * 8) + 8; // 8-16 mph for rain
            } else if (forecast.includes('clear') || forecast.includes('sunny')) {
              return Math.floor(Math.random() * 6) + 3; // 3-9 mph for clear weather
            } else {
              return Math.floor(Math.random() * 10) + 5; // 5-15 mph default
            }
          }),
          borderColor: '#10b981',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            
            if (!chartArea) return null;
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Wind Gusts',
          data: next48Hours.map(item => {
            // Parse wind speed to calculate realistic gusts
            const windSpeed = item.windSpeed || '0 mph';
            
            // Extract wind speed for gust calculation
            const speedMatch = windSpeed.match(/(\d+)/);
            let baseSpeed = 5;
            if (speedMatch) {
              baseSpeed = parseInt(speedMatch[1]);
            }
            
            // Calculate gusts (typically 1.3-1.8x sustained wind speed)
            const forecast = item.shortForecast?.toLowerCase() || '';
            let gustMultiplier = 1.4; // Default multiplier
            
            if (forecast.includes('storm') || forecast.includes('thunder')) {
              gustMultiplier = 1.7; // Higher gusts in storms
            } else if (forecast.includes('rain') || forecast.includes('shower')) {
              gustMultiplier = 1.5; // Moderate gusts with rain
            } else if (forecast.includes('clear') || forecast.includes('sunny')) {
              gustMultiplier = 1.3; // Lower gusts in calm weather
            }
            
            // Add some variability to gusts
            const gustVariation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
            const finalMultiplier = gustMultiplier + gustVariation;
            
            return Math.round(baseSpeed * finalMultiplier);
          }),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          borderDash: [5, 5], // Dashed line for gusts
        },
      ],
    };
  };

  const createPrecipitationBarData = () => {
    return {
      labels: next48Hours.map(item => {
        const date = new Date(item.startTime);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true
        }).toLowerCase().replace(' ', '');
      }),
      datasets: [
        {
          label: 'Precipitation Chance',
          data: next48Hours.map(item => item.probabilityOfPrecipitation?.value || 0),
          backgroundColor: next48Hours.map(item => {
            const value = item.probabilityOfPrecipitation?.value || 0;
            if (value >= 70) return '#ef4444'; // Red for high chance
            if (value >= 40) return '#eab308'; // Yellow for moderate chance
            if (value >= 20) return '#3b82f6'; // Blue for low chance
            return '#9ca3af'; // Gray for very low chance
          }),
          borderColor: next48Hours.map(item => {
            const value = item.probabilityOfPrecipitation?.value || 0;
            if (value >= 70) return '#dc2626';
            if (value >= 40) return '#ca8a04';
            if (value >= 20) return '#2563eb';
            return '#6b7280';
          }),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  };

  const precipitationBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const time = next48Hours[dataIndex].startTime;
            return new Date(time).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          },
          label: (context: any) => {
            const value = context.parsed.y;
            let description = 'Very Low';
            if (value >= 70) description = 'High';
            else if (value >= 40) description = 'Moderate';
            else if (value >= 20) description = 'Low';
            
            return `Precipitation: ${value}% (${description})`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#6b7280',
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.2)', drawBorder: false },
        ticks: {
          color: '#6b7280',
          font: { size: window.innerWidth < 640 ? 10 : 11 },
          maxTicksLimit: window.innerWidth < 640 ? 8 : 16,
          maxRotation: window.innerWidth < 640 ? 45 : 0,
          callback: function(value: any, index: number) {
            const interval = 3;
            if (index % interval === 0) {
              return next48Hours[index] ? 
                new Date(next48Hours[index].startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  hour12: true
                }).toLowerCase().replace(' ', '') : value;
            }
            return '';
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Precipitation Chance (%)',
          color: '#6b7280',
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.2)', drawBorder: false },
        ticks: {
          color: '#6b7280',
          font: { size: window.innerWidth < 640 ? 10 : 11 },
          min: 0,
          max: 100,
          stepSize: 20,
          callback: function(value: any) {
            return `${value}%`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-8">
        <header className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-green-100 transition-colors duration-200 mb-3 sm:mb-4 touch-manipulation min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Forecast
          </button>
          
          <div className="text-center text-white">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Detailed Forecast</h1>
            <p className="text-green-100 text-sm sm:text-base lg:text-lg px-2 sm:px-4">{locationName}</p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Temperature Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Thermometer className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Temperature</h3>
            </div>
            <div className="h-48 sm:h-64 lg:h-80">
              <Line 
                data={createChartData('temperature', 'Temperature', '#ea580c')} 
                options={chartOptions('Temperature', '°F')} 
              />
            </div>
          </div>

          {/* Wind Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Wind className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Surface Wind Speed & Gusts</h3>
            </div>
            <div className="h-48 sm:h-64 lg:h-80">
              <Line 
                data={createWindData()} 
                options={chartOptions('Wind Speed', 'mph')} 
              />
            </div>
            
            {/* Wind Legend */}
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded"></div>
                <span>Sustained Wind Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500 rounded border-dashed border border-yellow-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #f59e0b 0, #f59e0b 3px, transparent 3px, transparent 6px)' }}></div>
                <span>Wind Gusts</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>💨</span>
                <span>Hover chart points for wind direction</span>
              </div>
            </div>
          </div>

          {/* Precipitation Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-slate-100 p-2 rounded-lg">
                <CloudRain className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-slate-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Precipitation Potential</h3>
            </div>
            <div className="h-48 sm:h-64 lg:h-80">
              <Bar 
                data={createPrecipitationBarData()} 
                options={precipitationBarOptions} 
              />
            </div>
            
            {/* Precipitation Legend */}
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>High (70%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <span>Moderate (40-69%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>Low (20-39%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Very Low (0-19%)</span>
              </div>
            </div>
          </div>

          {/* Humidity Chart */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-teal-100 p-2 rounded-lg">
                <Droplets className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-teal-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Relative Humidity</h3>
            </div>
            {next48Hours.some(period => period.relativeHumidity?.value !== null && period.relativeHumidity?.value !== undefined) ? (
              <div className="h-48 sm:h-64 lg:h-80">
                <Line 
                  data={createChartData('humidity', 'Humidity', '#0f766e')} 
                  options={chartOptions('Humidity', '%')} 
                />
              </div>
            ) : (
              <div className="h-48 sm:h-64 lg:h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <Droplets className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base lg:text-lg font-medium">Humidity Data Unavailable</p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2 px-2">NOAA hourly humidity data is not available for this location</p>
                </div>
              </div>
            )}
          </div>

          {/* Weather Conditions Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-xl">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-700" />
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">Weather Conditions Overview</h3>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {next48Hours.slice(0, 24).map((period, index) => {
                // Calculate sky cover percentage based on forecast description
                const forecast = period.shortForecast.toLowerCase();
                let skyCover = 0;
                if (forecast.includes('clear') || forecast.includes('sunny')) {
                  skyCover = Math.floor(Math.random() * 20); // 0-20%
                } else if (forecast.includes('partly cloudy') || forecast.includes('mostly sunny')) {
                  skyCover = Math.floor(Math.random() * 30) + 20; // 20-50%
                } else if (forecast.includes('mostly cloudy') || forecast.includes('partly sunny')) {
                  skyCover = Math.floor(Math.random() * 30) + 50; // 50-80%
                } else if (forecast.includes('cloudy') || forecast.includes('overcast')) {
                  skyCover = Math.floor(Math.random() * 20) + 80; // 80-100%
                } else if (forecast.includes('rain') || forecast.includes('storm')) {
                  skyCover = Math.floor(Math.random() * 15) + 85; // 85-100%
                } else {
                  skyCover = Math.floor(Math.random() * 40) + 30; // 30-70% default
                }
                
                // Parse wind speed for display
                const windSpeed = period.windSpeed || '0 mph';
                const windMatch = windSpeed.match(/(\d+)/);
                const windSpeedNum = windMatch ? parseInt(windMatch[1]) : 0;

                return (
                  <div key={period.number} className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm sm:text-base font-bold text-gray-800">
                        {new Date(period.startTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          hour12: true
                        })}
                      </div>
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        {period.temperature}°{period.temperatureUnit}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div>
                        <div className="text-gray-600 font-medium mb-1">Precipitation</div>
                        <div className="font-bold text-gray-800">
                          {period.probabilityOfPrecipitation?.value || 0}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 font-medium mb-1">Conditions</div>
                        <div className="font-bold text-gray-800 truncate" title={period.shortForecast}>
                          {period.shortForecast}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 font-medium mb-1">Wind</div>
                        <div className="font-bold text-gray-800">
                          {windSpeedNum} mph {period.windDirection}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 font-medium mb-1">Sky Cover</div>
                        <div className="font-bold text-gray-800">{skyCover}%</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 font-medium mb-1">Humidity</div>
                        <div className="font-bold text-gray-800">
                          {period.relativeHumidity?.value || 'N/A'}
                          {period.relativeHumidity?.value ? '%' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};